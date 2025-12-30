const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { pool } = require('../config/database');
const { authenticate, requireSuperAdmin } = require('../middleware/authMiddleware');
const { query, queryOne, queryMany, transaction } = require('../utils/dbQuery');
const { success, notFound, databaseError, send, validationError, error: errorResponse } = require('../utils/responseHelper');
const { validateUUID, requireFields } = require('../middleware/commonMiddleware');
const logger = require('../utils/logger');

// Cache flag to track if system_settings schema is initialized
// This prevents running schema setup on every request
let systemSettingsSchemaInitialized = false;

// Allowed fields for system settings updates
const ALLOWED_SETTINGS_FIELDS = [
  // Identity & Branding
  'system_name', 'system_tagline', 'system_description',
  'logo_url', 'favicon_url', 'login_logo_url', 'email_logo_url',
  // SEO
  'meta_title', 'meta_description', 'meta_keywords',
  'og_image_url', 'og_title', 'og_description',
  'twitter_card_type', 'twitter_site', 'twitter_creator',
  // Analytics
  'google_analytics_id', 'google_tag_manager_id', 'facebook_pixel_id', 'custom_tracking_code',
  // Advertising
  'ad_network_enabled', 'ad_network_code',
  'ad_placement_header', 'ad_placement_sidebar', 'ad_placement_footer',
  // Contact & Social
  'support_email', 'support_phone', 'support_address',
  'facebook_url', 'twitter_url', 'linkedin_url', 'instagram_url', 'youtube_url',
  // Legal
  'terms_of_service_url', 'privacy_policy_url', 'cookie_policy_url',
  // System Configuration
  'maintenance_mode', 'maintenance_message',
  'default_language', 'default_timezone',
  // Email/SMTP Configuration
  'email_provider', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from', 'smtp_secure',
  'sendgrid_api_key', 'sendgrid_from',
  'mailgun_api_key', 'mailgun_domain',
  'aws_ses_region', 'aws_access_key_id', 'aws_secret_access_key',
  'resend_api_key', 'resend_from',
  // Security Settings
  'password_min_length', 'password_require_uppercase', 'password_require_lowercase',
  'password_require_numbers', 'password_require_symbols', 'password_expiry_days',
  'session_timeout_minutes', 'max_login_attempts', 'lockout_duration_minutes',
  'require_email_verification', 'enable_two_factor',
  'enable_captcha', 'captcha_site_key', 'captcha_secret_key',
  'enable_rate_limiting', 'rate_limit_requests_per_minute',
  // File Storage
  'file_storage_provider', 'file_storage_path', 'max_file_size_mb', 'allowed_file_types',
  'aws_s3_bucket', 'aws_s3_region', 'aws_s3_access_key_id', 'aws_s3_secret_access_key',
  // API Configuration
  'api_rate_limit_enabled', 'api_rate_limit_requests_per_minute', 'api_timeout_seconds',
  'enable_api_documentation',
  // Logging & Monitoring
  'log_level', 'enable_audit_logging', 'log_retention_days',
  'enable_error_tracking', 'sentry_dsn', 'enable_performance_monitoring',
  // Backup Settings
  'enable_auto_backup', 'backup_frequency_hours', 'backup_retention_days', 'backup_storage_path',
  // Docker/Environment (read-only, but can be set)
  'docker_compose_version', 'node_version', 'postgres_version',
  'redis_enabled', 'redis_host', 'redis_port'
];

/**
 * Ensure main-database tables for subscription plans & features exist.
 * This is idempotent and safe to call before plan/feature operations.
 */
async function ensureSubscriptionSchema(client) {
  // subscription_plans
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.subscription_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'usd',
      interval TEXT NOT NULL DEFAULT 'month',
      is_active BOOLEAN NOT NULL DEFAULT true,
      max_users INTEGER,
      max_agencies INTEGER,
      max_storage_gb INTEGER,
      stripe_product_id TEXT,
      stripe_price_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // plan_features
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.plan_features (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      feature_key TEXT NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // plan_feature_mappings
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.plan_feature_mappings (
      plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
      feature_id UUID NOT NULL REFERENCES public.plan_features(id) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL DEFAULT true,
      PRIMARY KEY (plan_id, feature_id)
    )
  `);
}

/**
 * Determine which department should handle a ticket based on category and priority
 * Escalates to parent departments for high-priority issues
 */
async function determineTicketDepartment(client, agencyId, category, priority) {
  try {
    // Category-based department mapping
    const categoryDepartmentMap = {
      'error': 'IT Support',
      'bug': 'IT Support',
      'technical': 'IT Support',
      'performance': 'IT Support',
      'ui': 'Design',
      'ux': 'Design',
      'feature': 'Product',
      'billing': 'Finance',
      'payment': 'Finance',
      'account': 'Customer Success',
      'general': 'Operations',
    };

    // Find department by name for the agency
    const deptName = categoryDepartmentMap[category?.toLowerCase()] || 'Operations';
    
    let deptResult = await client.query(
      `SELECT id, name, parent_department_id 
       FROM public.departments 
       WHERE agency_id = $1 AND name ILIKE $2 AND is_active = true 
       LIMIT 1`,
      [agencyId, `%${deptName}%`]
    );

    // If department not found, try to find Operations or any active department
    if (deptResult.rows.length === 0) {
      deptResult = await client.query(
        `SELECT id, name, parent_department_id 
         FROM public.departments 
         WHERE agency_id = $1 AND is_active = true 
         ORDER BY name 
         LIMIT 1`,
        [agencyId]
      );
    }

    if (deptResult.rows.length === 0) {
      return null; // No departments found
    }

    let department = deptResult.rows[0];

    // For high-priority tickets, escalate to parent department if exists
    if (priority === 'high' && department.parent_department_id) {
      const parentResult = await client.query(
        `SELECT id, name FROM public.departments WHERE id = $1 AND is_active = true`,
        [department.parent_department_id]
      );
      if (parentResult.rows.length > 0) {
        department = parentResult.rows[0];
      }
    }

    return department.name;
  } catch (error) {
    logger.error('Error determining ticket department', {
      error: error.message,
      code: error.code,
      agencyId,
      category,
      priority,
    });
    return null;
  }
}

/**
 * Ensure main-database tables for support tickets exist.
 */
async function ensureSupportTicketSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open', -- open | in_progress | resolved | closed
      priority TEXT NOT NULL DEFAULT 'medium', -- low | medium | high
      category TEXT NOT NULL DEFAULT 'general',
      user_id UUID,
      agency_id UUID,
      department TEXT,
      console_logs JSONB,
      error_details JSONB,
      browser_info JSONB,
      page_url TEXT,
      screenshot_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `);
  
  // Add new columns if they don't exist (for existing tables)
  await client.query(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'support_tickets' 
                     AND column_name = 'user_id') THEN
        ALTER TABLE public.support_tickets ADD COLUMN user_id UUID;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'support_tickets' 
                     AND column_name = 'agency_id') THEN
        ALTER TABLE public.support_tickets ADD COLUMN agency_id UUID;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'support_tickets' 
                     AND column_name = 'department') THEN
        ALTER TABLE public.support_tickets ADD COLUMN department TEXT;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'support_tickets' 
                     AND column_name = 'console_logs') THEN
        ALTER TABLE public.support_tickets ADD COLUMN console_logs JSONB;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'support_tickets' 
                     AND column_name = 'error_details') THEN
        ALTER TABLE public.support_tickets ADD COLUMN error_details JSONB;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'support_tickets' 
                     AND column_name = 'browser_info') THEN
        ALTER TABLE public.support_tickets ADD COLUMN browser_info JSONB;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'support_tickets' 
                     AND column_name = 'page_url') THEN
        ALTER TABLE public.support_tickets ADD COLUMN page_url TEXT;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' 
                     AND table_name = 'support_tickets' 
                     AND column_name = 'screenshot_url') THEN
        ALTER TABLE public.support_tickets ADD COLUMN screenshot_url TEXT;
      END IF;
    END $$;
  `);
}

/**
 * GET /api/system/agency-settings/:agencyId
 * Fetch main database agency_settings row for a given agency_id.
 * Used to prefill AgencySetup from onboarding wizard metadata.
 *
 * This endpoint requires authentication but NOT super admin privileges,
 * because it is used by regular agency admins during setup.
 */
router.get(
  '/agency-settings/:agencyId',
  authenticate,
  validateUUID('agencyId'),
  asyncHandler(async (req, res) => {
    const { agencyId } = req.params;

    try {
      // Use queryOne helper - automatic connection management, retry logic, and logging
      const settings = await queryOne(
        `SELECT 
           id,
           agency_id,
           agency_name,
           logo_url,
           primary_focus,
           enable_gst,
           modules,
           industry,
           phone,
           address_street,
           address_city,
           address_state,
           address_zip,
           address_country,
           employee_count
         FROM public.agency_settings
         WHERE agency_id = $1
         LIMIT 1`,
        [agencyId]
      );

      if (!settings) {
        return send(res, notFound('Agency settings', agencyId));
      }

      // Parse modules if it's a string
      let modules = settings.modules;
      if (typeof modules === 'string') {
        try {
          modules = JSON.parse(modules);
        } catch {
          modules = null;
        }
      }

      return send(res, success(
        { settings: { ...settings, modules } },
        'Agency settings fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching agency settings', {
        agencyId,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch agency settings'));
    }
  })
);

/**
 * GET /api/system/metrics
 * System-wide statistics for the super admin dashboard.
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     metrics: { ... },
 *     agencies: [ ... ]
 *   }
 * }
 */
/**
 * OPTIONS /api/system/metrics
 * Handle CORS preflight requests
 */
router.options('/metrics', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  res.sendStatus(204);
});

router.get(
  '/metrics',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    // Set CORS headers explicitly
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    try {
      // Agencies summary
      let agencies = [];
      try {
        agencies = await queryMany(
          `SELECT 
             id,
             name,
             domain,
             subscription_plan,
             max_users,
             is_active,
             created_at
           FROM public.agencies
           ORDER BY created_at DESC`,
          [],
          { requestId: req.requestId }
        );
      } catch (agenciesError) {
        logger.error('Error fetching agencies for system metrics', {
          error: agenciesError.message,
          code: agenciesError.code,
          requestId: req.requestId,
        });
        // Continue with empty agencies array
        agencies = [];
      }

      // Total users - aggregate from all agency databases
      // Note: profiles table exists in agency databases, not main database
      let totalUsers = 0;
      let activeUsers = 0;
      // We'll calculate this by aggregating from agency databases if needed
      // For now, return 0 to avoid errors

      // Subscription plan distribution - count all agencies by plan type
      // Map database plan names to standardized names (starter->basic, professional->pro)
      let subscriptionPlans = {
        basic: 0,
        pro: 0,
        enterprise: 0,
      };
      try {
        const planRows = await queryMany(
          `SELECT 
            subscription_plan,
            COUNT(*)::INTEGER as count
          FROM public.agencies
          WHERE subscription_plan IS NOT NULL
          GROUP BY subscription_plan`,
          [],
          { requestId: req.requestId }
        );
        
        // Map database plan names to display names
        const planMapping = {
          'basic': 'basic',
          'starter': 'basic',
          'pro': 'pro',
          'professional': 'pro',
          'enterprise': 'enterprise',
        };
        
        planRows.forEach((row) => {
          const planName = (row.subscription_plan || '').toLowerCase().trim();
          const mappedPlan = planMapping[planName] || planName;
          
          if (mappedPlan === 'basic') {
            subscriptionPlans.basic += parseInt(row.count, 10) || 0;
          } else if (mappedPlan === 'pro') {
            subscriptionPlans.pro += parseInt(row.count, 10) || 0;
          } else if (mappedPlan === 'enterprise') {
            subscriptionPlans.enterprise += parseInt(row.count, 10) || 0;
          }
        });
      } catch (error) {
        if (error.code !== '42P01') {
          logger.warn('Failed to load subscription plans for system metrics', {
            error: error.message,
            code: error.code,
            requestId: req.requestId,
          });
        }
      }

      // Simplified pricing model for MRR/ARR
      const priceMap = { basic: 29, pro: 79, enterprise: 199 };
      const mrr =
        subscriptionPlans.basic * priceMap.basic +
        subscriptionPlans.pro * priceMap.pro +
        subscriptionPlans.enterprise * priceMap.enterprise;

      // Usage stats – these tables exist in agency databases, not main database
      // Return 0 for now - these would need to be aggregated from all agency databases
      const totalProjects = 0;
      const totalInvoices = 0;
      const totalClients = 0;
      const totalAttendanceRecords = 0;

      // Per-agency statistics - these tables exist in agency databases
      // For now, return 0 counts - would need to query each agency database
      const agenciesWithStats = agencies.map((agency) => ({
        ...agency,
        user_count: 0,
        project_count: 0,
        invoice_count: 0,
      }));

      const metrics = {
        totalAgencies: agencies.length,
        activeAgencies: agencies.filter((a) => a.is_active).length,
        totalUsers,
        activeUsers,
        subscriptionPlans,
        revenueMetrics: {
          mrr,
          arr: mrr * 12,
        },
        usageStats: {
          totalProjects,
          totalInvoices,
          totalClients,
          totalAttendanceRecords,
        },
        systemHealth: {
          // Health metrics are currently synthetic; can be wired to real monitoring later
          uptime: '99.9%',
          responseTime: Math.random() * 100 + 50,
          errorRate: Math.random() * 2,
        },
      };

      return send(res, success(
        {
          metrics,
          agencies: agenciesWithStats,
        },
        'System metrics loaded successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error computing system metrics', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        requestId: req.requestId,
      });
      
      // Set CORS headers even on error
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      }
      
      return send(res, databaseError(error, 'Load system metrics'));
    }
  })
);

/**
 * GET /api/system/plans
 * List all subscription plans with their mapped features.
 */
router.get(
  '/plans',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSubscriptionSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Fetch plans using queryMany helper
      const plans = await queryMany(
        `SELECT * FROM public.subscription_plans ORDER BY price ASC, created_at DESC`
      );

      // Fetch feature mappings if plans exist
      let mappings = [];
      if (plans.length > 0) {
        const planIds = plans.map((p) => p.id);
        const placeholders = planIds.map((_, i) => `$${i + 1}`).join(',');
        mappings = await queryMany(
          `SELECT 
             pfm.plan_id,
             pfm.feature_id,
             pfm.enabled,
             pf.id,
             pf.name,
             pf.description,
             pf.feature_key
           FROM public.plan_feature_mappings pfm
           INNER JOIN public.plan_features pf ON pfm.feature_id = pf.id
           WHERE pfm.plan_id IN (${placeholders})`,
          planIds
        );
      }

      // Group mappings by plan_id
      const mappingsByPlan = mappings.reduce((acc, mapping) => {
        if (!acc[mapping.plan_id]) {
          acc[mapping.plan_id] = [];
        }
        acc[mapping.plan_id].push({
          id: mapping.id,
          name: mapping.name,
          description: mapping.description,
          feature_key: mapping.feature_key,
          enabled: mapping.enabled,
        });
        return acc;
      }, {});

      // Transform plans with features
      const transformedPlans = plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: Number(plan.price),
        currency: plan.currency,
        interval: plan.interval,
        is_active: plan.is_active,
        max_users: plan.max_users,
        max_agencies: plan.max_agencies,
        max_storage_gb: plan.max_storage_gb,
        stripe_product_id: plan.stripe_product_id,
        stripe_price_id: plan.stripe_price_id,
        features: mappingsByPlan[plan.id] || [],
      }));

      return send(res, success(
        { plans: transformedPlans },
        'Subscription plans fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching subscription plans', {
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch subscription plans'));
    }
  })
);

/**
 * GET /api/system/features
 * List active plan features.
 */
router.get(
  '/features',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSubscriptionSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Fetch features using queryMany helper
      const featuresRows = await queryMany(
        `SELECT * FROM public.plan_features WHERE is_active = $1 ORDER BY name ASC`,
        [true]
      );

      const features = featuresRows.map((feature) => ({
        id: feature.id,
        name: feature.name,
        description: feature.description || '',
        feature_key: feature.feature_key,
        enabled: false,
      }));

      return send(res, success(
        { features },
        'Features fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      // If table doesn't exist yet, return empty array instead of error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.info('Plan features table does not exist, returning empty array', {
          requestId: req.requestId,
        });
        return send(res, success(
          { features: [] },
          'Features fetched successfully (table not initialized)',
          { requestId: req.requestId }
        ));
      }

      logger.error('Error fetching features', {
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch plan features'));
    }
  })
);

/**
 * POST /api/system/plans
 * Create a new subscription plan.
 */
router.post(
  '/plans',
  authenticate,
  requireSuperAdmin,
  requireFields(['name', 'price', 'currency', 'interval']),
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      price,
      currency,
      interval,
      is_active,
      max_users,
      max_agencies,
      max_storage_gb,
      stripe_product_id,
      stripe_price_id,
      features = [],
    } = req.body || {};

    // Additional validation for price type
    if (typeof price !== 'number') {
      return send(res, validationError(
        'price must be a number',
        { price }
      ));
    }

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSubscriptionSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Insert plan first
      const insertResult = await query(
        `INSERT INTO public.subscription_plans 
           (name, description, price, currency, interval, is_active,
            max_users, max_agencies, max_storage_gb, stripe_product_id, stripe_price_id, created_at)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, true),
                 $7, $8, $9, $10, $11, NOW())
         RETURNING *`,
        [
          name,
          description || '',
          price,
          currency,
          interval,
          is_active,
          max_users,
          max_agencies,
          max_storage_gb,
          stripe_product_id || null,
          stripe_price_id || null,
        ]
      );

      const plan = insertResult.rows[0];
      if (!plan) {
        throw new Error('Failed to create plan - no row returned');
      }

      // Insert feature mappings if provided (using transaction for atomicity)
      if (Array.isArray(features) && features.length > 0) {
        const mappingQueries = features.map((feature) => ({
          sql: `INSERT INTO public.plan_feature_mappings (plan_id, feature_id, enabled)
                VALUES ($1, $2, $3)
                ON CONFLICT (plan_id, feature_id) DO UPDATE SET enabled = $3`,
          params: [plan.id, feature.id, !!feature.enabled],
        }));

        // Execute feature mappings in a transaction
        await transaction(mappingQueries);
      }

      return send(res, success(
        { plan },
        'Plan created successfully',
        { requestId: req.requestId }
      ), 201);
    } catch (error) {
      logger.error('Error creating subscription plan', {
        name,
        price,
        currency,
        interval,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Create subscription plan'));
    }
  })
);

/**
 * PUT /api/system/plans/:id
 * Update a subscription plan and its feature mappings.
 */
router.put(
  '/plans/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body || {};

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSubscriptionSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Build transaction queries
      const queries = [
        {
          sql: `UPDATE public.subscription_plans
                SET name = COALESCE($1, name),
                    description = COALESCE($2, description),
                    price = COALESCE($3, price),
                    currency = COALESCE($4, currency),
                    interval = COALESCE($5, interval),
                    is_active = COALESCE($6, is_active),
                    max_users = COALESCE($7, max_users),
                    max_agencies = COALESCE($8, max_agencies),
                    max_storage_gb = COALESCE($9, max_storage_gb),
                    stripe_product_id = COALESCE($10, stripe_product_id),
                    stripe_price_id = COALESCE($11, stripe_price_id),
                    updated_at = NOW()
                WHERE id = $12
                RETURNING *`,
          params: [
            updates.name,
            updates.description,
            updates.price,
            updates.currency,
            updates.interval,
            updates.is_active,
            updates.max_users,
            updates.max_agencies,
            updates.max_storage_gb,
            updates.stripe_product_id,
            updates.stripe_price_id,
            id,
          ],
        },
      ];

      // Add feature mapping operations if features array provided
      if (Array.isArray(updates.features)) {
        // Delete existing mappings
        queries.push({
          sql: `DELETE FROM public.plan_feature_mappings WHERE plan_id = $1`,
          params: [id],
        });

        // Insert new mappings if provided
        if (updates.features.length > 0) {
          // Build INSERT query with ON CONFLICT
          const mappingQueries = updates.features.map((feature) => ({
            sql: `INSERT INTO public.plan_feature_mappings (plan_id, feature_id, enabled)
                  VALUES ($1, $2, $3)
                  ON CONFLICT (plan_id, feature_id) DO UPDATE SET enabled = EXCLUDED.enabled`,
            params: [id, feature.id, !!feature.enabled],
          }));

          queries.push(...mappingQueries);
        }
      }

      // Execute transaction
      const results = await transaction(queries);
      const plan = results[0].rows[0];

      if (!plan) {
        return send(res, notFound('Plan', id));
      }

      return send(res, success(
        { plan },
        'Plan updated successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error updating subscription plan', {
        planId: id,
        updates: Object.keys(updates),
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Update subscription plan'));
    }
  })
);

/**
 * DELETE /api/system/plans/:id
 * Soft-deactivate a plan.
 */
router.delete(
  '/plans/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSubscriptionSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Soft delete (deactivate) plan
      const updateResult = await query(
        `UPDATE public.subscription_plans
         SET is_active = false, updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      if (updateResult.rowCount === 0) {
        return send(res, notFound('Plan', id));
      }

      return send(res, success(
        null,
        'Plan deactivated successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error deactivating subscription plan', {
        planId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Deactivate subscription plan'));
    }
  })
);

/**
 * POST /api/system/features
 * Create a new plan feature.
 */
router.post(
  '/features',
  authenticate,
  requireSuperAdmin,
  requireFields(['name', 'feature_key']),
  asyncHandler(async (req, res) => {
    const { name, description, feature_key } = req.body || {};

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSubscriptionSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Insert feature using query helper
      const insertResult = await query(
        `INSERT INTO public.plan_features
           (name, description, feature_key, is_active, created_at)
         VALUES ($1, $2, $3, true, NOW())
         RETURNING *`,
        [name, description || '', feature_key]
      );

      const feature = insertResult.rows[0];
      if (!feature) {
        throw new Error('Failed to create feature - no row returned');
      }

      return send(res, success(
        { feature },
        'Feature created successfully',
        { requestId: req.requestId }
      ), 201);
    } catch (error) {
      logger.error('Error creating plan feature', {
        name,
        feature_key,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Create plan feature'));
    }
  })
);

/**
 * PUT /api/system/features/:id
 * Update an existing feature.
 */
router.put(
  '/features/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body || {};

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSubscriptionSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Update feature (using COALESCE for partial updates)
      const updateResult = await query(
        `UPDATE public.plan_features
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             feature_key = COALESCE($3, feature_key),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [updates.name, updates.description, updates.feature_key, id]
      );

      if (updateResult.rowCount === 0) {
        return send(res, notFound('Feature', id));
      }

      return send(res, success(
        { feature: updateResult.rows[0] },
        'Feature updated successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error updating plan feature', {
        featureId: id,
        updates,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Update plan feature'));
    }
  })
);

/**
 * DELETE /api/system/features/:id
 * Deactivate or delete a feature depending on usage.
 */
router.delete(
  '/features/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSubscriptionSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Check if feature is used in any plan mappings
      const usageResult = await queryOne(
        `SELECT COUNT(*) as count FROM public.plan_feature_mappings WHERE feature_id = $1`,
        [id]
      );
      const usageCount = parseInt(usageResult?.count || '0', 10);

      if (usageCount > 0) {
        // Soft delete (deactivate) - feature is still used in plans
        const updateResult = await query(
          `UPDATE public.plan_features
           SET is_active = false, updated_at = NOW()
           WHERE id = $1`,
          [id]
        );

        if (updateResult.rowCount === 0) {
          return send(res, notFound('Feature', id));
        }

        return send(res, success(
          null,
          'Feature deactivated (it is still used in plans)',
          { requestId: req.requestId }
        ));
      }

      // Hard delete - feature is not used in any plans
      const deleteResult = await query(
        `DELETE FROM public.plan_features WHERE id = $1`,
        [id]
      );

      if (deleteResult.rowCount === 0) {
        return send(res, notFound('Feature', id));
      }

      return send(res, success(
        null,
        'Feature deleted successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error deleting plan feature', {
        featureId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Delete plan feature'));
    }
  })
);

/**
 * GET /api/system/tickets/summary
 * Support ticket stats + recent tickets for the widget.
 */
router.get(
  '/tickets/summary',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSupportTicketSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Execute all queries in parallel for better performance
      const [statsRow, todayRow, resolutionRow, recentTickets] = await Promise.all([
        queryOne(`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'open') as open,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved
          FROM public.support_tickets
        `),
        queryOne(`
          SELECT
            COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as new_today,
            COUNT(*) FILTER (WHERE resolved_at::date = CURRENT_DATE) as resolved_today
          FROM public.support_tickets
        `),
        queryOne(`
          SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) as avg_hours
          FROM public.support_tickets
          WHERE resolved_at IS NOT NULL
        `),
        queryMany(
          `SELECT
             id,
             ticket_number,
             title,
             status,
             priority,
             created_at,
             category
           FROM public.support_tickets
           ORDER BY created_at DESC
           LIMIT 20`
        ),
      ]);

      // Transform data
      const stats = {
        total: Number(statsRow?.total || 0),
        open: Number(statsRow?.open || 0),
        inProgress: Number(statsRow?.in_progress || 0),
        resolved: Number(statsRow?.resolved || 0),
        avgResolutionTime: Number(resolutionRow?.avg_hours || 0),
        newToday: Number(todayRow?.new_today || 0),
        resolvedToday: Number(todayRow?.resolved_today || 0),
      };

      return send(res, success(
        {
          stats,
          recentTickets: recentTickets || [],
        },
        'Ticket summary fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching ticket summary', {
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch ticket summary'));
    }
  })
);

/**
 * GET /api/system/tickets
 * List all support tickets with optional filtering
 */
router.get(
  '/tickets',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { status, priority, category, limit = 50, offset = 0 } = req.query;

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSupportTicketSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Build dynamic query with filters
      let sqlQuery = 'SELECT * FROM public.support_tickets WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (status) {
        sqlQuery += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (priority) {
        sqlQuery += ` AND priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      if (category) {
        sqlQuery += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      sqlQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      // Fetch tickets using queryMany helper
      const tickets = await queryMany(sqlQuery, params);

      return send(res, success(
        { tickets },
        'Tickets fetched successfully',
        { 
          requestId: req.requestId,
          pagination: {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            count: tickets.length,
          },
        }
      ));
    } catch (error) {
      logger.error('Error fetching support tickets', {
        filters: { status, priority, category },
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch support tickets'));
    }
  })
);

/**
 * POST /api/system/tickets/public
 * Create a new support ticket (accessible to all authenticated users)
 * This endpoint allows any user to create tickets with console logs and error details
 * NOTE: This route MUST be defined BEFORE /tickets/:id to avoid route conflicts
 */
router.post(
  '/tickets/public',
  authenticate,
  requireFields(['title', 'description']),
  asyncHandler(async (req, res) => {
    const { 
      title, 
      description, 
      priority = 'medium', 
      category = 'general',
      console_logs,
      error_details,
      browser_info,
      page_url,
      department
    } = req.body;

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return send(res, validationError(
        `priority must be one of: ${validPriorities.join(', ')}`,
        { priority, validPriorities }
      ));
    }

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSupportTicketSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Get user info from authenticated request
      const userId = req.user?.id || null;
      const agencyId = req.user?.agencyId || null;

      // Determine department escalation based on priority and category
      let assignedDepartment = department || null;
      if (!assignedDepartment && agencyId) {
        // Auto-assign department - need to use a client for this function
        const deptClient = await mainPool.connect();
        try {
          assignedDepartment = await determineTicketDepartment(deptClient, agencyId, category, priority);
        } finally {
          deptClient.release();
        }
      }

      // Generate unique ticket number
      const countResult = await queryOne(
        'SELECT COUNT(*) as count FROM public.support_tickets'
      );
      const count = parseInt(countResult?.count || '0', 10);
      const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;

      // Insert ticket
      const insertResult = await query(
        `INSERT INTO public.support_tickets 
         (ticket_number, title, description, status, priority, category, 
          user_id, agency_id, department, console_logs, error_details, 
          browser_info, page_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
         RETURNING *`,
        [
          ticketNumber, 
          title, 
          description, 
          'open', // Always start as open for user-created tickets
          priority, 
          category,
          userId,
          agencyId,
          assignedDepartment,
          console_logs ? JSON.stringify(console_logs) : null,
          error_details ? JSON.stringify(error_details) : null,
          browser_info ? JSON.stringify(browser_info) : null,
          page_url || null
        ]
      );

      const ticket = insertResult.rows[0];
      if (!ticket) {
        throw new Error('Failed to create ticket - no row returned');
      }

      return send(res, success(
        { ticket },
        'Ticket created successfully',
        { requestId: req.requestId }
      ), 201);
    } catch (error) {
      logger.error('Error creating public support ticket', {
        title,
        priority,
        category,
        userId,
        agencyId,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Create support ticket'));
    }
  })
);

/**
 * GET /api/system/tickets/:id
 * Get a single ticket by ID
 * NOTE: This route MUST be defined AFTER /tickets/public to avoid route conflicts
 */
router.get(
  '/tickets/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSupportTicketSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Fetch ticket using queryOne helper - automatic connection management
      const ticket = await queryOne(
        'SELECT * FROM public.support_tickets WHERE id = $1',
        [id]
      );

      if (!ticket) {
        return send(res, notFound('Support ticket', id));
      }

      return send(res, success(
        { ticket },
        'Ticket fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching support ticket', {
        ticketId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch support ticket'));
    }
  })
);

/**
 * POST /api/system/tickets
 * Create a new support ticket (super admin only - for admin panel)
 */
router.post(
  '/tickets',
  authenticate,
  requireSuperAdmin,
  requireFields(['title', 'description']),
  asyncHandler(async (req, res) => {
    const { 
      title, 
      description, 
      priority = 'medium', 
      category = 'general', 
      status = 'open',
      user_id,
      agency_id,
      department,
      console_logs,
      error_details,
      browser_info,
      page_url
    } = req.body;

    // Validate status and priority
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high'];

    if (!validStatuses.includes(status)) {
      return send(res, validationError(
        `status must be one of: ${validStatuses.join(', ')}`,
        { status, validStatuses }
      ));
    }

    if (!validPriorities.includes(priority)) {
      return send(res, validationError(
        `priority must be one of: ${validPriorities.join(', ')}`,
        { priority, validPriorities }
      ));
    }

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSupportTicketSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Generate unique ticket number
      const countResult = await queryOne(
        'SELECT COUNT(*) as count FROM public.support_tickets'
      );
      const count = parseInt(countResult?.count || '0', 10);
      const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;

      // Insert ticket
      const insertResult = await query(
        `INSERT INTO public.support_tickets 
         (ticket_number, title, description, status, priority, category, 
          user_id, agency_id, department, console_logs, error_details, 
          browser_info, page_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
         RETURNING *`,
        [
          ticketNumber, 
          title, 
          description, 
          status, 
          priority, 
          category,
          user_id || null,
          agency_id || null,
          department || null,
          console_logs ? JSON.stringify(console_logs) : null,
          error_details ? JSON.stringify(error_details) : null,
          browser_info ? JSON.stringify(browser_info) : null,
          page_url || null
        ]
      );

      const ticket = insertResult.rows[0];
      if (!ticket) {
        throw new Error('Failed to create ticket - no row returned');
      }

      return send(res, success(
        { ticket },
        'Ticket created successfully',
        { requestId: req.requestId }
      ), 201);
    } catch (error) {
      logger.error('Error creating support ticket', {
        title,
        status,
        priority,
        category,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Create support ticket'));
    }
  })
);

/**
 * PUT /api/system/tickets/:id
 * Update a support ticket
 */
router.put(
  '/tickets/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, status, priority, category } = req.body;

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return send(res, validationError(
          `status must be one of: ${validStatuses.join(', ')}`,
          { status, validStatuses }
        ));
      }
    }

    // Validate priority if provided
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return send(res, validationError(
          `priority must be one of: ${validPriorities.join(', ')}`,
          { priority, validPriorities }
        ));
      }
    }

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSupportTicketSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Build dynamic UPDATE query
      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        params.push(title);
        paramIndex++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }

      if (status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;

        // Auto-set resolved_at based on status
        if (status === 'resolved') {
          updates.push(`resolved_at = NOW()`);
        } else {
          updates.push(`resolved_at = NULL`);
        }
      }

      if (priority !== undefined) {
        updates.push(`priority = $${paramIndex}`);
        params.push(priority);
        paramIndex++;
      }

      if (category !== undefined) {
        updates.push(`category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }

      if (updates.length === 0) {
        return send(res, validationError(
          'No fields to update',
          { providedFields: Object.keys(req.body) }
        ));
      }

      updates.push(`updated_at = NOW()`);
      params.push(id);

      const sql = `
        UPDATE public.support_tickets
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await query(sql, params);

      if (result.rowCount === 0) {
        return send(res, notFound('Ticket', id));
      }

      return send(res, success(
        { ticket: result.rows[0] },
        'Ticket updated successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error updating support ticket', {
        ticketId: id,
        updates: { title, description, status, priority, category },
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Update support ticket'));
    }
  })
);

/**
 * DELETE /api/system/tickets/:id
 * Delete a support ticket
 */
router.delete(
  '/tickets/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSupportTicketSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Delete ticket
      const deleteResult = await query(
        'DELETE FROM public.support_tickets WHERE id = $1 RETURNING id',
        [id]
      );

      if (deleteResult.rowCount === 0) {
        return send(res, notFound('Ticket', id));
      }

      return send(res, success(
        null,
        'Ticket deleted successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error deleting support ticket', {
        ticketId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Delete support ticket'));
    }
  })
);

/**
 * POST /api/system/agencies/:id/export-backup
 * Export all agency database tables to CSV and create ZIP archive
 * Requires super_admin role
 * NOTE: This route MUST be defined BEFORE /agencies/:id to avoid route conflicts
 */
router.post(
  '/agencies/:id/export-backup',
  authenticate,
  requireSuperAdmin,
  validateUUID,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { exportAgencyToCSV } = require('../services/agencyExportService');

    try {
      // Get agency information
      const agency = await queryOne(
        'SELECT id, name, database_name FROM public.agencies WHERE id = $1',
        [id],
        { requestId: req.requestId }
      );

      if (!agency) {
        return send(res, notFound('Agency not found', 'AGENCY_NOT_FOUND'));
      }
      let databaseName = agency.database_name;

      // If database_name is not set, try to discover it
      if (!databaseName) {
        logger.info('Agency has no database_name, attempting discovery', {
          agencyId: id,
          agencyName: agency.name,
          requestId: req.requestId,
        });
        const { discoverAndUpdateAgencyDatabase } = require('../services/agencyDatabaseDiscovery');
        const discoveredDb = await discoverAndUpdateAgencyDatabase(id);
        
        if (discoveredDb) {
          databaseName = discoveredDb;
          logger.info('Discovered database for agency', {
            agencyId: id,
            databaseName: discoveredDb,
            requestId: req.requestId,
          });
        } else {
          return send(res, errorResponse(
            'Agency database not found. This agency may not have a database assigned.',
            'NO_DATABASE',
            { details: `Agency "${agency.name}" (${id}) does not have a database_name set and no matching database could be found.` },
            400
          ));
        }
      }

      // Verify database exists before attempting export
      try {
        const { parseDatabaseUrl } = require('../utils/poolManager');
        const { host, port, user, password } = parseDatabaseUrl();
        const { Pool } = require('pg');
        const postgresPool = new Pool({
          host,
          port,
          user,
          password,
          database: 'postgres',
        });
        const postgresClient = await postgresPool.connect();
        
        try {
          const dbCheck = await postgresClient.query(
            'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) as exists',
            [databaseName]
          );
          
          if (!dbCheck.rows[0].exists) {
            return send(res, errorResponse(
              `Database "${databaseName}" does not exist`,
              'DATABASE_NOT_EXISTS',
              { details: `The database for agency "${agency.name}" was not found. It may have been deleted.` },
              400
            ));
          }
        } finally {
          postgresClient.release();
          await postgresPool.end();
        }
      } catch (checkError) {
        logger.error('Error checking database existence for export', {
          error: checkError.message,
          code: checkError.code,
          agencyId: id,
          databaseName,
          requestId: req.requestId,
        });
        // Continue with export attempt - connection error will be caught below
      }

      // Export to ZIP
      logger.info('Exporting backup for agency', {
        agencyId: id,
        agencyName: agency.name,
        databaseName,
        requestId: req.requestId,
      });
      const zipBuffer = await exportAgencyToCSV(id, databaseName);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const safeName = agency.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `agency_backup_${safeName}_${timestamp}.zip`;

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', zipBuffer.length);

      // Send ZIP file
      res.send(zipBuffer);
      logger.info('Backup exported successfully', {
        agencyId: id,
        filename,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Error exporting agency backup', {
        error: error.message,
        code: error.code,
        agencyId: id,
        requestId: req.requestId,
      });
      return send(res, errorResponse(
        'Failed to export agency backup',
        'EXPORT_FAILED',
        { details: error.message },
        500
      ));
    }
  })
);

/**
 * DELETE /api/system/agencies/:id
 * Delete an agency completely (database and records)
 * Requires super_admin role
 * NOTE: This route MUST be defined BEFORE /agencies/:id to avoid route conflicts
 */
router.delete(
  '/agencies/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { deleteAgency, checkAgencyDeletionSafety } = require('../services/agencyDeleteService');

    try {
      // Check deletion safety (optional - for warnings)
      const safetyCheck = await checkAgencyDeletionSafety(id);

      // Delete the agency
      logger.info('Deleting agency', { agencyId: id, requestId: req.requestId });
      const result = await deleteAgency(id);

      return send(res, success(
        {
          agencyId: id,
          agencyName: result.agencyName,
          databaseName: result.databaseName,
          warnings: safetyCheck.warnings || [],
        },
        result.message,
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error deleting agency', {
        agencyId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      
      // Use custom error code for delete failures
      return send(res, errorResponse(
        error.message || 'Failed to delete agency',
        'DELETE_FAILED',
        error.message,
        500,
        { requestId: req.requestId }
      ));
    }
  })
);

/**
 * GET /api/system/agencies/:id
 * Get detailed information about a specific agency
 */
router.get(
  '/agencies/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Fetch agency using queryOne helper
      const agency = await queryOne(
        `SELECT 
           id,
           name,
           domain,
           subscription_plan,
           max_users,
           is_active,
           created_at
         FROM public.agencies
         WHERE id = $1`,
        [id]
      );

      if (!agency) {
        return send(res, notFound('Agency', id));
      }

      // Get counts in parallel (with error handling for missing tables)
      const [userCountResult, projectCountResult, invoiceCountResult] = await Promise.allSettled([
        queryOne('SELECT COUNT(*) as count FROM public.profiles WHERE agency_id = $1', [id]),
        queryOne('SELECT COUNT(*) as count FROM public.projects WHERE agency_id = $1', [id]),
        queryOne('SELECT COUNT(*) as count FROM public.invoices WHERE agency_id = $1', [id]),
      ]);

      // Extract counts, defaulting to 0 on error or missing table
      const userCount = userCountResult.status === 'fulfilled' && userCountResult.value
        ? parseInt(userCountResult.value.count || '0', 10)
        : 0;
      
      const projectCount = projectCountResult.status === 'fulfilled' && projectCountResult.value
        ? parseInt(projectCountResult.value.count || '0', 10)
        : 0;
      
      const invoiceCount = invoiceCountResult.status === 'fulfilled' && invoiceCountResult.value
        ? parseInt(invoiceCountResult.value.count || '0', 10)
        : 0;

      // Log warnings for non-table-missing errors
      if (userCountResult.status === 'rejected' && userCountResult.reason?.code !== '42P01') {
        logger.warn('Failed to count users for agency', {
          agencyId: id,
          error: userCountResult.reason?.message,
          requestId: req.requestId,
        });
      }
      if (projectCountResult.status === 'rejected' && projectCountResult.reason?.code !== '42P01') {
        logger.warn('Failed to count projects for agency', {
          agencyId: id,
          error: projectCountResult.reason?.message,
          requestId: req.requestId,
        });
      }
      if (invoiceCountResult.status === 'rejected' && invoiceCountResult.reason?.code !== '42P01') {
        logger.warn('Failed to count invoices for agency', {
          agencyId: id,
          error: invoiceCountResult.reason?.message,
          requestId: req.requestId,
        });
      }

      return send(res, success(
        {
          agency: {
            ...agency,
            user_count: userCount,
            project_count: projectCount,
            invoice_count: invoiceCount,
          },
        },
        'Agency details fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching agency details', {
        agencyId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch agency details'));
    }
  })
);

/**
 * PUT /api/system/agencies/:id
 * Update agency information (including activate/deactivate)
 */
router.put(
  '/agencies/:id',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, domain, subscription_plan, max_users, is_active } = req.body;

    try {
      // Build dynamic UPDATE query
      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }

      if (domain !== undefined) {
        updates.push(`domain = $${paramIndex}`);
        params.push(domain);
        paramIndex++;
      }

      if (subscription_plan !== undefined) {
        updates.push(`subscription_plan = $${paramIndex}`);
        params.push(subscription_plan);
        paramIndex++;
      }

      if (max_users !== undefined) {
        updates.push(`max_users = $${paramIndex}`);
        params.push(max_users);
        paramIndex++;
      }

      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(is_active);
        paramIndex++;
      }

      if (updates.length === 0) {
        return send(res, validationError(
          'No fields to update',
          { providedFields: Object.keys(req.body) }
        ));
      }

      params.push(id);

      const sql = `
        UPDATE public.agencies
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await query(sql, params);

      if (result.rowCount === 0) {
        return send(res, notFound('Agency', id));
      }

      return send(res, success(
        { agency: result.rows[0] },
        'Agency updated successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error updating agency', {
        agencyId: id,
        updates: { name, domain, subscription_plan, max_users, is_active },
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Update agency'));
    }
  })
);

/**
 * GET /api/system/agencies/:id/users
 * Get all users for a specific agency
 */
router.get(
  '/agencies/:id/users',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Verify agency exists
      const agency = await queryOne(
        'SELECT id FROM public.agencies WHERE id = $1',
        [id]
      );

      if (!agency) {
        return send(res, notFound('Agency', id));
      }

      // Get users (with error handling for missing table)
      let users = [];
      try {
        users = await queryMany(
          `SELECT 
             id,
             email,
             full_name,
             is_active,
             created_at
           FROM public.profiles
           WHERE agency_id = $1
           ORDER BY created_at DESC`,
          [id]
        );
      } catch (error) {
        // Ignore missing table errors (42P01), log others
        if (error.code !== '42P01') {
          logger.warn('Failed to fetch users for agency', {
            agencyId: id,
            error: error.message,
            code: error.code,
            requestId: req.requestId,
          });
        }
        // Return empty array if table doesn't exist
        users = [];
      }

      return send(res, success(
        { users },
        'Agency users fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching agency users', {
        agencyId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch agency users'));
    }
  })
);

/**
 * GET /api/system/agencies/:id/usage
 * Get usage statistics for a specific agency
 */
router.get(
  '/agencies/:id/usage',
  authenticate,
  requireSuperAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Verify agency exists
      const agency = await queryOne(
        'SELECT id FROM public.agencies WHERE id = $1',
        [id]
      );

      if (!agency) {
        return send(res, notFound('Agency', id));
      }

      // Execute all count queries in parallel with error handling
      const [userCountResult, projectCountResult, invoiceCountResult, clientCountResult, taskCountResult] =
        await Promise.allSettled([
          queryOne('SELECT COUNT(*) as count FROM public.profiles WHERE agency_id = $1', [id]),
          queryOne('SELECT COUNT(*) as count FROM public.projects WHERE agency_id = $1', [id]),
          queryOne('SELECT COUNT(*) as count FROM public.invoices WHERE agency_id = $1', [id]),
          queryOne('SELECT COUNT(*) as count FROM public.clients WHERE agency_id = $1', [id]),
          queryOne('SELECT COUNT(*) as count FROM public.tasks WHERE agency_id = $1', [id]),
        ]);

      // Extract counts, defaulting to 0 on error or missing table
      const extractCount = (result) => {
        if (result.status === 'fulfilled' && result.value) {
          return parseInt(result.value.count || '0', 10);
        }
        // Log warnings for non-table-missing errors
        if (result.status === 'rejected' && result.reason?.code !== '42P01') {
          logger.warn('Usage count query failed', {
            agencyId: id,
            error: result.reason?.message,
            code: result.reason?.code,
            requestId: req.requestId,
          });
        }
        return 0;
      };

      const usage = {
        users: extractCount(userCountResult),
        projects: extractCount(projectCountResult),
        invoices: extractCount(invoiceCountResult),
        clients: extractCount(clientCountResult),
        tasks: extractCount(taskCountResult),
      };

      return send(res, success(
        { usage },
        'Agency usage statistics fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching agency usage', {
        agencyId: id,
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch agency usage'));
    }
  })
);

/**
 * OPTIONS /api/system/usage/realtime
 * Handle CORS preflight requests
 */
router.options('/usage/realtime', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  res.sendStatus(204);
});

/**
 * GET /api/system/usage/realtime
 * Get real-time usage statistics from audit logs and active sessions
 */
router.get(
  '/usage/realtime',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    // Set CORS headers explicitly
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    try {
      // Get active users (users who have activity in last 15 minutes)
      let activeUsers = 0;
      let recentActions = 0;
      let totalActionsToday = 0;
      let peakHour = '00:00';

      try {
        // Check if audit_logs table exists
        const tableCheck = await queryOne(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'audit_logs'
          ) as exists
        `, [], { requestId: req.requestId });

        if (tableCheck?.exists) {
          // Active users (distinct users with activity in last 15 minutes)
          const activeUsersRow = await queryOne(`
            SELECT COUNT(DISTINCT user_id) as count
            FROM public.audit_logs
            WHERE created_at > NOW() - INTERVAL '15 minutes'
            AND user_id IS NOT NULL
          `, [], { requestId: req.requestId });
          activeUsers = parseInt(activeUsersRow?.count || '0', 10);

          // Recent actions (last 5 minutes)
          const recentActionsRow = await queryOne(`
            SELECT COUNT(*) as count
            FROM public.audit_logs
            WHERE created_at > NOW() - INTERVAL '5 minutes'
          `, [], { requestId: req.requestId });
          recentActions = parseInt(recentActionsRow?.count || '0', 10);

          // Total actions today
          const todayActionsRow = await queryOne(`
            SELECT COUNT(*) as count
            FROM public.audit_logs
            WHERE created_at::date = CURRENT_DATE
          `, [], { requestId: req.requestId });
          totalActionsToday = parseInt(todayActionsRow?.count || '0', 10);

          // Peak hour (hour with most activity today)
          const peakHourRow = await queryOne(`
            SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
            FROM public.audit_logs
            WHERE created_at::date = CURRENT_DATE
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY count DESC
            LIMIT 1
          `, [], { requestId: req.requestId });
          if (peakHourRow) {
            const hour = parseInt(peakHourRow.hour || '0', 10);
            peakHour = `${String(hour).padStart(2, '0')}:00`;
          }
        }
      } catch (error) {
        if (error.code !== '42P01') {
          logger.warn('Failed to query audit logs for real-time usage', {
            error: error.message,
            code: error.code,
            requestId: req.requestId,
          });
        }
      }

      // Active sessions (estimate based on unique user_ids in last hour)
      let activeSessions = 0;
      try {
        const sessionsRow = await queryOne(`
          SELECT COUNT(DISTINCT user_id) as count
          FROM public.audit_logs
          WHERE created_at > NOW() - INTERVAL '1 hour'
          AND user_id IS NOT NULL
        `, [], { requestId: req.requestId });
        activeSessions = parseInt(sessionsRow?.count || '0', 10);
      } catch (error) {
        if (error.code !== '42P01') {
          logger.warn('Failed to count sessions for real-time usage', {
            error: error.message,
            code: error.code,
            requestId: req.requestId,
          });
        }
      }

      // Recent activity (last 10 actions)
      let recentActivity = [];
      try {
        const activityRows = await queryMany(`
          SELECT 
            id,
            table_name as resource_type,
            action as action_type,
            created_at as timestamp,
            user_id
          FROM public.audit_logs
          WHERE user_id IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 10
        `, [], { requestId: req.requestId });
        recentActivity = activityRows.map(row => ({
          id: row.id,
          action_type: row.action_type,
          resource_type: row.resource_type,
          timestamp: row.timestamp,
          user_count: 1, // Each row represents one user action
        }));
      } catch (error) {
        if (error.code !== '42P01') {
          logger.warn('Failed to fetch recent activity for real-time usage', {
            error: error.message,
            code: error.code,
            requestId: req.requestId,
          });
        }
      }

      // Average response time (synthetic for now, can be enhanced with actual metrics)
      const avgResponseTime = 75 + Math.random() * 25; // 75-100ms range

      return send(res, success(
        {
          metrics: {
            activeUsers,
            activeSessions,
            recentActions,
            peakHour,
            totalActionsToday,
            avgResponseTime,
          },
          recentActivity,
        },
        'Real-time usage data loaded successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching real-time usage', {
        error: error.message,
        code: error.code,
        stack: error.stack,
        requestId: req.requestId,
      });
      
      // Set CORS headers even on error
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      }
      
      return send(res, databaseError(error, 'Load real-time usage data'));
    }
  })
);

/**
 * POST /api/system/agencies/repair-database-names
 * Discover and update database_name for all agencies that don't have it set
 * Requires super_admin role
 */
router.post(
  '/agencies/repair-database-names',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { discoverAndUpdateAgencyDatabase } = require('../services/agencyDatabaseDiscovery');

    try {
      // Get all agencies without database_name
      const agencies = await queryMany(
        'SELECT id, name, domain FROM public.agencies WHERE database_name IS NULL OR database_name = \'\'',
        [],
        { requestId: req.requestId }
      );
      logger.info('Found agencies without database_name', {
        count: agencies.length,
        requestId: req.requestId,
      });

      const results = [];
      for (const agency of agencies) {
        try {
          const discoveredDb = await discoverAndUpdateAgencyDatabase(agency.id);
          results.push({
            agencyId: agency.id,
            agencyName: agency.name,
            success: !!discoveredDb,
            databaseName: discoveredDb || null,
          });
        } catch (error) {
          logger.error('Error processing agency during database name repair', {
            error: error.message,
            code: error.code,
            agencyId: agency.id,
            agencyName: agency.name,
            requestId: req.requestId,
          });
          results.push({
            agencyId: agency.id,
            agencyName: agency.name,
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      return send(res, success(
        {
          total: agencies.length,
          successful: successCount,
          failed: failCount,
          results,
        },
        `Repaired ${successCount} of ${agencies.length} agencies`,
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error repairing database names', {
        error: error.message,
        code: error.code,
        stack: error.stack,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Repair database names'));
    }
  })
);

/**
 * Ensure system_settings table exists
 * Uses advisory locks and caching to prevent concurrent DDL conflicts
 */
async function ensureSystemSettingsSchema(client) {
  // Fast path: if already initialized in this process, skip
  if (systemSettingsSchemaInitialized) {
    return;
  }

  // Use PostgreSQL advisory lock to prevent concurrent schema modifications
  // Lock ID: 123456789 (arbitrary but unique number for this operation)
  const lockId = 123456789;
  
  try {
    // Try to acquire advisory lock (non-blocking)
    const lockResult = await client.query('SELECT pg_try_advisory_lock($1) as acquired', [lockId]);
    
    if (!lockResult.rows[0].acquired) {
      // Another process is already initializing, wait a bit and check cache
      // In this case, we'll just proceed - the other process will handle it
      // and we'll verify the schema exists before proceeding
      await verifySchemaExists(client);
      return;
    }

    try {
      // Double-check after acquiring lock (another process might have finished)
      if (systemSettingsSchemaInitialized) {
        await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
        return;
      }

      // Create table with all fields
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.system_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          -- Identity & Branding
          system_name TEXT NOT NULL DEFAULT 'BuildFlow ERP',
          system_tagline TEXT,
          system_description TEXT,
          logo_url TEXT,
          favicon_url TEXT,
          login_logo_url TEXT,
          email_logo_url TEXT,
          -- SEO
          meta_title TEXT,
          meta_description TEXT,
          meta_keywords TEXT,
          og_image_url TEXT,
          og_title TEXT,
          og_description TEXT,
          twitter_card_type TEXT DEFAULT 'summary_large_image',
          twitter_site TEXT,
          twitter_creator TEXT,
          -- Analytics
          google_analytics_id TEXT,
          google_tag_manager_id TEXT,
          facebook_pixel_id TEXT,
          custom_tracking_code TEXT,
          -- Advertising
          ad_network_enabled BOOLEAN DEFAULT false,
          ad_network_code TEXT,
          ad_placement_header BOOLEAN DEFAULT false,
          ad_placement_sidebar BOOLEAN DEFAULT false,
          ad_placement_footer BOOLEAN DEFAULT false,
          -- Contact & Social
          support_email TEXT,
          support_phone TEXT,
          support_address TEXT,
          facebook_url TEXT,
          twitter_url TEXT,
          linkedin_url TEXT,
          instagram_url TEXT,
          youtube_url TEXT,
          -- Legal
          terms_of_service_url TEXT,
          privacy_policy_url TEXT,
          cookie_policy_url TEXT,
          -- System Configuration
          maintenance_mode BOOLEAN DEFAULT false,
          maintenance_message TEXT,
          default_language TEXT DEFAULT 'en',
          default_timezone TEXT DEFAULT 'UTC',
          -- Email/SMTP (will be added by migration if not exists)
          email_provider TEXT DEFAULT 'smtp',
          smtp_host TEXT,
          smtp_port INTEGER DEFAULT 587,
          smtp_user TEXT,
          smtp_password TEXT,
          smtp_from TEXT,
          smtp_secure BOOLEAN DEFAULT false,
          sendgrid_api_key TEXT,
          sendgrid_from TEXT,
          mailgun_api_key TEXT,
          mailgun_domain TEXT,
          aws_ses_region TEXT,
          aws_access_key_id TEXT,
          aws_secret_access_key TEXT,
          resend_api_key TEXT,
          resend_from TEXT,
          -- Security
          password_min_length INTEGER DEFAULT 8,
          password_require_uppercase BOOLEAN DEFAULT true,
          password_require_lowercase BOOLEAN DEFAULT true,
          password_require_numbers BOOLEAN DEFAULT true,
          password_require_symbols BOOLEAN DEFAULT false,
          password_expiry_days INTEGER DEFAULT 90,
          session_timeout_minutes INTEGER DEFAULT 60,
          max_login_attempts INTEGER DEFAULT 5,
          lockout_duration_minutes INTEGER DEFAULT 30,
          require_email_verification BOOLEAN DEFAULT true,
          enable_two_factor BOOLEAN DEFAULT false,
          enable_captcha BOOLEAN DEFAULT false,
          captcha_site_key TEXT,
          captcha_secret_key TEXT,
          enable_rate_limiting BOOLEAN DEFAULT true,
          rate_limit_requests_per_minute INTEGER DEFAULT 60,
          -- File Storage
          file_storage_provider TEXT DEFAULT 'local',
          file_storage_path TEXT DEFAULT '/app/storage',
          max_file_size_mb INTEGER DEFAULT 10,
          allowed_file_types TEXT DEFAULT 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip',
          aws_s3_bucket TEXT,
          aws_s3_region TEXT,
          aws_s3_access_key_id TEXT,
          aws_s3_secret_access_key TEXT,
          -- API Configuration
          api_rate_limit_enabled BOOLEAN DEFAULT true,
          api_rate_limit_requests_per_minute INTEGER DEFAULT 100,
          api_timeout_seconds INTEGER DEFAULT 30,
          enable_api_documentation BOOLEAN DEFAULT true,
          -- Logging & Monitoring
          log_level TEXT DEFAULT 'info',
          enable_audit_logging BOOLEAN DEFAULT true,
          log_retention_days INTEGER DEFAULT 30,
          enable_error_tracking BOOLEAN DEFAULT false,
          sentry_dsn TEXT,
          enable_performance_monitoring BOOLEAN DEFAULT false,
          -- Backup
          enable_auto_backup BOOLEAN DEFAULT true,
          backup_frequency_hours INTEGER DEFAULT 24,
          backup_retention_days INTEGER DEFAULT 7,
          backup_storage_path TEXT DEFAULT '/app/backups',
          -- Docker/Environment
          docker_compose_version TEXT,
          node_version TEXT,
          postgres_version TEXT,
          redis_enabled BOOLEAN DEFAULT false,
          redis_host TEXT,
          redis_port INTEGER DEFAULT 6379,
          -- Timestamps
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          created_by UUID,
          updated_by UUID
        )
      `);

      // Add new columns if they don't exist (for existing installations)
      // This ensures backward compatibility
      const newColumns = [
    { name: 'email_provider', type: 'TEXT DEFAULT \'smtp\'' },
    { name: 'smtp_host', type: 'TEXT' },
    { name: 'smtp_port', type: 'INTEGER DEFAULT 587' },
    { name: 'smtp_user', type: 'TEXT' },
    { name: 'smtp_password', type: 'TEXT' },
    { name: 'smtp_from', type: 'TEXT' },
    { name: 'smtp_secure', type: 'BOOLEAN DEFAULT false' },
    { name: 'sendgrid_api_key', type: 'TEXT' },
    { name: 'sendgrid_from', type: 'TEXT' },
    { name: 'mailgun_api_key', type: 'TEXT' },
    { name: 'mailgun_domain', type: 'TEXT' },
    { name: 'aws_ses_region', type: 'TEXT' },
    { name: 'aws_access_key_id', type: 'TEXT' },
    { name: 'aws_secret_access_key', type: 'TEXT' },
    { name: 'resend_api_key', type: 'TEXT' },
    { name: 'resend_from', type: 'TEXT' },
    { name: 'password_min_length', type: 'INTEGER DEFAULT 8' },
    { name: 'password_require_uppercase', type: 'BOOLEAN DEFAULT true' },
    { name: 'password_require_lowercase', type: 'BOOLEAN DEFAULT true' },
    { name: 'password_require_numbers', type: 'BOOLEAN DEFAULT true' },
    { name: 'password_require_symbols', type: 'BOOLEAN DEFAULT false' },
    { name: 'password_expiry_days', type: 'INTEGER DEFAULT 90' },
    { name: 'session_timeout_minutes', type: 'INTEGER DEFAULT 60' },
    { name: 'max_login_attempts', type: 'INTEGER DEFAULT 5' },
    { name: 'lockout_duration_minutes', type: 'INTEGER DEFAULT 30' },
    { name: 'require_email_verification', type: 'BOOLEAN DEFAULT true' },
    { name: 'enable_two_factor', type: 'BOOLEAN DEFAULT false' },
    { name: 'enable_captcha', type: 'BOOLEAN DEFAULT false' },
    { name: 'captcha_site_key', type: 'TEXT' },
    { name: 'captcha_secret_key', type: 'TEXT' },
    { name: 'enable_rate_limiting', type: 'BOOLEAN DEFAULT true' },
    { name: 'rate_limit_requests_per_minute', type: 'INTEGER DEFAULT 60' },
    { name: 'file_storage_provider', type: 'TEXT DEFAULT \'local\'' },
    { name: 'file_storage_path', type: 'TEXT DEFAULT \'/app/storage\'' },
    { name: 'max_file_size_mb', type: 'INTEGER DEFAULT 10' },
    { name: 'allowed_file_types', type: 'TEXT DEFAULT \'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip\'' },
    { name: 'aws_s3_bucket', type: 'TEXT' },
    { name: 'aws_s3_region', type: 'TEXT' },
    { name: 'aws_s3_access_key_id', type: 'TEXT' },
    { name: 'aws_s3_secret_access_key', type: 'TEXT' },
    { name: 'api_rate_limit_enabled', type: 'BOOLEAN DEFAULT true' },
    { name: 'api_rate_limit_requests_per_minute', type: 'INTEGER DEFAULT 100' },
    { name: 'api_timeout_seconds', type: 'INTEGER DEFAULT 30' },
    { name: 'enable_api_documentation', type: 'BOOLEAN DEFAULT true' },
    { name: 'log_level', type: 'TEXT DEFAULT \'info\'' },
    { name: 'enable_audit_logging', type: 'BOOLEAN DEFAULT true' },
    { name: 'log_retention_days', type: 'INTEGER DEFAULT 30' },
    { name: 'enable_error_tracking', type: 'BOOLEAN DEFAULT false' },
    { name: 'sentry_dsn', type: 'TEXT' },
    { name: 'enable_performance_monitoring', type: 'BOOLEAN DEFAULT false' },
    { name: 'enable_auto_backup', type: 'BOOLEAN DEFAULT true' },
    { name: 'backup_frequency_hours', type: 'INTEGER DEFAULT 24' },
    { name: 'backup_retention_days', type: 'INTEGER DEFAULT 7' },
    { name: 'backup_storage_path', type: 'TEXT DEFAULT \'/app/backups\'' },
    { name: 'docker_compose_version', type: 'TEXT' },
    { name: 'node_version', type: 'TEXT' },
    { name: 'postgres_version', type: 'TEXT' },
    { name: 'redis_enabled', type: 'BOOLEAN DEFAULT false' },
    { name: 'redis_host', type: 'TEXT' },
    { name: 'redis_port', type: 'INTEGER DEFAULT 6379' },
      ];

      for (const column of newColumns) {
        try {
          await client.query(`
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'system_settings' 
                AND column_name = '${column.name}'
              ) THEN
                ALTER TABLE public.system_settings ADD COLUMN ${column.name} ${column.type};
              END IF;
            END $$;
          `);
        } catch (err) {
          // Column might already exist, that's okay
          logger.warn('Could not add column to system_settings (may already exist)', {
            column: column.name,
            error: err.message,
            code: err.code,
          });
        }
      }

      // Note: We'll enforce single record via application logic instead of a unique index
      // PostgreSQL doesn't support unique indexes on constant expressions

      // Drop foreign key constraints if they exist (users from agency DBs may not exist in main DB)
      try {
        await client.query(`
          ALTER TABLE public.system_settings 
          DROP CONSTRAINT IF EXISTS system_settings_created_by_fkey,
          DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey
        `);
      } catch (err) {
        // Table might not exist yet or constraints might not exist, that's okay
        logger.warn('Could not drop foreign key constraints (this is okay if table is new)', {
          error: err.message,
          code: err.code,
        });
      }

      // Create updated_at trigger function if it doesn't exist
      // Check first to avoid concurrent update conflicts
      const functionExists = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.proname = 'update_updated_at_column'
        ) as exists
      `);

      if (!functionExists.rows[0].exists) {
        try {
          await client.query(`
            CREATE FUNCTION public.update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
          `);
        } catch (err) {
          // Function might have been created by another process, that's okay
          if (!err.message.includes('already exists') && !err.message.includes('tuple concurrently updated')) {
            throw err;
          }
        }
      }

      // Check if trigger exists before creating
      const triggerExists = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = 'public'
          AND c.relname = 'system_settings'
          AND t.tgname = 'update_system_settings_updated_at'
        ) as exists
      `);

      if (!triggerExists.rows[0].exists) {
        try {
          await client.query(`
            CREATE TRIGGER update_system_settings_updated_at
                BEFORE UPDATE ON public.system_settings
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at_column()
          `);
        } catch (err) {
          // Trigger might have been created by another process, that's okay
          if (!err.message.includes('already exists') && !err.message.includes('tuple concurrently updated') && !err.message.includes('deadlock')) {
            throw err;
          }
        }
      }

      // Insert default system settings if none exist
      await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM public.system_settings LIMIT 1) THEN
                INSERT INTO public.system_settings (system_name, system_tagline, system_description, created_by, updated_by)
                VALUES ('BuildFlow ERP', 'Complete Business Management Solution', 'A comprehensive ERP system for managing your business operations', NULL, NULL);
            END IF;
        END $$;
      `);

      // Mark as initialized after successful setup
      systemSettingsSchemaInitialized = true;
    } finally {
      // Always release the advisory lock
      await client.query('SELECT pg_advisory_unlock($1)', [lockId]).catch(() => {
        // Ignore unlock errors (lock might not have been acquired)
      });
    }
  } catch (error) {
    // If we can't acquire lock or there's an error, verify schema exists
    // This handles the case where another process is doing the initialization
    if (error.code === '40P01' || error.code === 'XX000' || error.message.includes('deadlock') || error.message.includes('tuple concurrently updated')) {
      // Another process is handling it, just verify and continue
      await verifySchemaExists(client);
      return;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Verify that system_settings schema exists (used when another process is initializing)
 */
async function verifySchemaExists(client) {
  try {
    const tableExists = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
      ) as exists
    `);
    
    if (tableExists.rows[0].exists) {
      // Table exists, mark as initialized
      systemSettingsSchemaInitialized = true;
    }
  } catch (err) {
    // Ignore verification errors, will retry on next request
    logger.warn('Could not verify schema existence', {
      error: err.message,
      code: err.code,
    });
  }
}

/**
 * GET /api/system/settings
 * Get system settings (super admin only)
 */
router.get(
  '/settings',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSystemSettingsSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Fetch settings using queryOne helper
      let settings = await queryOne(
        `SELECT * FROM public.system_settings ORDER BY created_at DESC LIMIT 1`
      );

      // Create default settings if none exist
      if (!settings) {
        logger.info('No system settings found, creating defaults', {
          requestId: req.requestId,
        });
        
        // Use query helper for insert (returns the inserted row)
        const insertResult = await query(
          `INSERT INTO public.system_settings (system_name, system_tagline, system_description, created_by, updated_by)
           VALUES ('BuildFlow ERP', 'Complete Business Management Solution', 'A comprehensive ERP system for managing your business operations', NULL, NULL)
           RETURNING *`
        );
        
        settings = insertResult.rows[0];
      }

      return send(res, success(
        { settings },
        'System settings fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error fetching system settings', {
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Fetch system settings'));
    }
  })
);

/**
 * PUT /api/system/settings
 * Update system settings (super admin only)
 * 
 * Note: This endpoint works for super admins from both main database and agency databases.
 * The user ID might not exist in the main database's users table if they're from an agency database,
 * so we handle created_by/updated_by fields gracefully by checking user existence first.
 */
router.put(
  '/settings',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const updates = req.body || {};

    if (!updates || Object.keys(updates).length === 0) {
      return send(res, validationError(
        'No fields to update',
        { providedFields: Object.keys(updates) }
      ));
    }

    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSystemSettingsSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Build dynamic update query using allowed fields constant
      const allowedFields = ALLOWED_SETTINGS_FIELDS;

      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          params.push(updates[field]);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return send(res, validationError(
          'No valid fields to update',
          { 
            providedFields: Object.keys(updates),
            allowedFields: ALLOWED_SETTINGS_FIELDS 
          }
        ));
      }

      // Check if user exists in main DB before setting updated_by
      // Note: Super admins from agency databases may not exist in main DB's users table.
      // We check if the user exists in main DB before setting updated_by to avoid foreign key errors.
      if (userId) {
        try {
          const userCheck = await queryOne(
            'SELECT id FROM public.users WHERE id = $1 LIMIT 1',
            [userId]
          );
          if (userCheck) {
            // User exists in main DB, safe to set updated_by
            updateFields.push(`updated_by = $${paramIndex}`);
            params.push(userId);
            paramIndex++;
          }
          // If user doesn't exist in main DB, we skip setting updated_by (expected behavior)
        } catch (err) {
          // If users table doesn't exist or query fails, skip setting updated_by
          logger.warn('Could not verify user in main DB, skipping updated_by', {
            userId,
            error: err.message,
            requestId: req.requestId,
          });
        }
      }

      // Ensure a record exists first (insert default if needed)
      let settingsId;
      const checkResult = await queryOne(
        'SELECT id FROM public.system_settings ORDER BY created_at DESC LIMIT 1'
      );

      if (!checkResult) {
        // Insert default record first
        // Check if user exists in main DB before setting foreign keys
        let createdBy = null;
        let updatedBy = null;

        if (userId) {
          try {
            const userCheck = await queryOne(
              'SELECT id FROM public.users WHERE id = $1 LIMIT 1',
              [userId]
            );
            if (userCheck) {
              // User exists in main DB, safe to set created_by/updated_by
              createdBy = userId;
              updatedBy = userId;
            }
            // If user doesn't exist in main DB, leave created_by/updated_by as NULL (expected)
          } catch (err) {
            // If users table doesn't exist or query fails, leave as null
            logger.warn('Could not verify user in main DB for insert, leaving created_by/updated_by as null', {
              userId,
              error: err.message,
              requestId: req.requestId,
            });
          }
        }

        const insertResult = await query(
          `INSERT INTO public.system_settings (system_name, system_tagline, system_description, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            'BuildFlow ERP',
            'Complete Business Management Solution',
            'A comprehensive ERP system for managing your business operations',
            createdBy,
            updatedBy
          ]
        );
        settingsId = insertResult.rows[0].id;
      } else {
        settingsId = checkResult.id;
      }

      // Update existing settings using the id
      // Note: updated_at is set via trigger, so we don't need to include it in params
      const sql = `UPDATE public.system_settings
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`;

      const result = await query(
        sql,
        [...params, settingsId]
      );

      if (result.rowCount === 0) {
        return send(res, notFound('System settings', settingsId));
      }

      // Clear settings cache so changes take effect immediately
      const { clearSettingsCache } = require('../utils/systemSettings');
      const { clearSettingsCache: clearMaintenanceCache } = require('../middleware/maintenanceMode');
      clearSettingsCache();
      clearMaintenanceCache();

      return send(res, success(
        { settings: result.rows[0] },
        'Settings updated successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      logger.error('Error updating system settings', {
        userId,
        updatedFields: Object.keys(updates).filter(f => ALLOWED_SETTINGS_FIELDS.includes(f)),
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      return send(res, databaseError(error, 'Update system settings'));
    }
  })
);

/**
 * GET /api/system/maintenance-status
 * Get maintenance mode status (public endpoint, no auth required)
 */
router.get(
  '/maintenance-status',
  asyncHandler(async (req, res) => {
    try {
      // Ensure schema exists first (using main pool)
      const mainPool = require('../config/database').pool;
      const schemaClient = await mainPool.connect();
      try {
        await ensureSystemSettingsSchema(schemaClient);
      } finally {
        schemaClient.release();
      }

      // Fetch maintenance status using queryOne helper
      const settings = await queryOne(`
        SELECT maintenance_mode, maintenance_message
        FROM public.system_settings
        ORDER BY created_at DESC
        LIMIT 1
      `);

      // Return maintenance status (default to false if no settings)
      const maintenanceMode = settings?.maintenance_mode || false;
      const maintenanceMessage = settings?.maintenance_message || null;

      return send(res, success(
        {
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage,
        },
        'Maintenance status fetched successfully',
        { requestId: req.requestId }
      ));
    } catch (error) {
      // Fail open - assume no maintenance mode (critical for system availability)
      logger.warn('Error fetching maintenance status, failing open', {
        error: error.message,
        code: error.code,
        requestId: req.requestId,
      });
      
      return send(res, success(
        {
          maintenance_mode: false,
          maintenance_message: null,
        },
        'Maintenance status fetched successfully (default)',
        { requestId: req.requestId }
      ));
    }
  })
);

module.exports = router;




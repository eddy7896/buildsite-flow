/**
 * Agency Routes
 * Handles agency management endpoints
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/authMiddleware');
const {
  checkDomainAvailability,
  checkSetupStatus,
  getSetupProgress,
  createAgency,
  repairAgencyDatabase,
  completeAgencySetup,
} = require('../services/agencyService');
const { getAgencyPool } = require('../utils/poolManager');
const { clearMaintenanceCache } = require('../middleware/maintenanceMode');
const logger = require('../utils/logger');

/**
 * GET /api/agencies/check-domain
 * Check if domain is available
 */
router.get('/check-domain', asyncHandler(async (req, res) => {
  const { domain } = req.query;

  if (!domain || typeof domain !== 'string') {
    return res.json({ available: false, error: 'Domain is required' });
  }

  try {
    const available = await checkDomainAvailability(domain);
    res.json({
      available,
      domain: domain.toLowerCase().trim(),
    });
  } catch (error) {
    logger.error('Domain check error', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      domain,
      requestId: req.requestId,
    });
    
    // Return 200 with error flag instead of 500 to avoid CORS issues
    res.json({
      available: false,
      error: error.message || 'Error checking domain availability',
      domain: domain.toLowerCase().trim(),
    });
  }
}));

/**
 * GET /api/agencies/check-setup
 * Check agency setup status
 */
router.get('/check-setup', asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'] ||
      req.query.database ||
      null;

    if (!agencyDatabase) {
      return res.json({ setupComplete: false });
    }

    // If detailed progress is requested
    if (req.query.detailed === 'true') {
      try {
        const progress = await getSetupProgress(agencyDatabase);
        // Ensure response has all required fields
        return res.json({
          setupComplete: progress.setupComplete || false,
          progress: progress.progress || 0,
          completedSteps: Array.isArray(progress.completedSteps) ? progress.completedSteps : [],
          totalSteps: progress.totalSteps || 7,
          lastUpdated: progress.lastUpdated || null,
          agencyName: progress.agencyName || null,
        });
      } catch (progressError) {
        logger.error('Get setup progress error', {
          error: progressError.message,
          code: progressError.code,
          stack: progressError.stack,
          agencyDatabase,
          requestId: req.requestId,
        });
        // Return default structure on error
        return res.json({
          setupComplete: false,
          progress: 0,
          completedSteps: [],
          totalSteps: 7,
          lastUpdated: null,
          agencyName: null,
        });
      }
    }

    const setupComplete = await checkSetupStatus(agencyDatabase);
    res.json({ setupComplete });
  } catch (error) {
    logger.error('Check setup error', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    res.json({ setupComplete: false });
  }
}));

/**
 * GET /api/agencies/agency-settings
 * Fetch agency_settings from agency database (for prefill in AgencySetup)
 */
router.get('/agency-settings', authenticate, asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'] ||
      req.query.database ||
      null;

    if (!agencyDatabase) {
      return res.status(400).json({
        success: false,
        error: 'Agency database not specified',
        message: 'Provide database name in header: x-agency-database or in query: ?database=agency_name',
      });
    }

    const { parseDatabaseUrl } = require('../utils/poolManager');
    const { host, port, user, password } = parseDatabaseUrl();
    const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
    const { Pool: AgencyPool } = require('pg');
    const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 1 });
    const agencyClient = await agencyPool.connect();

    try {
      // Fetch agency_settings from agency database
      const result = await agencyClient.query(`
        SELECT 
          id,
          agency_name,
          logo_url,
          setup_complete,
          industry,
          phone,
          address_street,
          address_city,
          address_state,
          address_zip,
          address_country,
          employee_count,
          company_tagline,
          business_type,
          founded_year,
          description,
          legal_name,
          registration_number,
          tax_id,
          tax_id_type,
          email,
          website,
          social_linkedin,
          social_twitter,
          social_facebook,
          currency,
          fiscal_year_start,
          payment_terms,
          invoice_prefix,
          tax_rate,
          enable_gst,
          gst_number,
          bank_account_name,
          bank_account_number,
          bank_name,
          bank_routing_number,
          bank_swift_code,
          timezone,
          date_format,
          time_format,
          week_start,
          language,
          notifications_email,
          notifications_sms,
          notifications_push,
          notifications_weekly_report,
          notifications_monthly_report,
          features_enable_payroll,
          features_enable_projects,
          features_enable_crm,
          features_enable_inventory,
          features_enable_reports,
          created_at,
          updated_at
        FROM public.agency_settings
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            settings: null,
          },
          message: 'No agency settings found',
        });
      }

      const settings = result.rows[0];

      return res.json({
        success: true,
        data: {
          settings: {
            ...settings,
            // Construct address object for easier frontend consumption
            address: settings.address_street || settings.address_city || settings.address_state
              ? {
                  street: settings.address_street || '',
                  city: settings.address_city || '',
                  state: settings.address_state || '',
                  zipCode: settings.address_zip || '',
                  country: settings.address_country || '',
                }
              : null,
          },
        },
        message: 'Agency settings fetched successfully',
      });
    } finally {
      agencyClient.release();
      await agencyPool.end();
    }
  } catch (error) {
    logger.error('Error fetching agency settings from agency database', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch agency settings',
      message: 'Failed to fetch agency settings',
    });
  }
}));

/**
 * POST /api/agencies/complete-setup
 * Complete agency setup with extended settings
 */
router.post('/complete-setup', asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'] ||
      req.body.database;

    if (!agencyDatabase) {
      return res.status(400).json({ error: 'Agency database not specified' });
    }

    const result = await completeAgencySetup(agencyDatabase, req.body);

    res.json({
      success: true,
      message: 'Agency setup completed successfully',
      teamCredentials: result?.teamCredentials || [],
      teamCredentialsCsv: result?.teamCredentialsCsv || '',
    });
  } catch (error) {
    logger.error('Complete setup error', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    res.status(500).json({
      error: error.message || 'Failed to complete setup',
      detail: error.detail,
      code: error.code,
    });
  }
}));

/**
 * POST /api/agencies/create
 * Create a new agency with isolated database
 */
router.post('/create', asyncHandler(async (req, res) => {
  try {
    const {
      agencyName,
      domain,
      industry,
      companySize,
      address,
      phone,
      adminName,
      adminEmail,
      adminPassword,
      subscriptionPlan,
      // New optional fields from onboarding wizard
      primaryFocus,
      enableGST,
      modules,
      business_goals,
      page_ids,
    } = req.body;

    if (!agencyName || !domain || !adminName || !adminEmail || !adminPassword || !subscriptionPlan) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['agencyName', 'domain', 'adminName', 'adminEmail', 'adminPassword', 'subscriptionPlan'],
        message: 'Please fill in all required fields before continuing.',
      });
    }

    logger.info('Agency create request received', {
      agencyName,
      domain,
      subscriptionPlan,
      adminEmail,
      pageIdsCount: page_ids?.length || 0,
      businessGoalsCount: business_goals?.length || 0,
      origin: req.headers.origin,
      requestId: req.requestId,
    });

    const result = await createAgency({
      agencyName,
      domain,
      adminName,
      adminEmail,
      adminPassword,
      subscriptionPlan,
      phone,
      primaryFocus,
      enableGST,
      modules,
      industry,
      companySize,
      address,
      business_goals,
      page_ids,
    });

    res.json({
      success: true,
      ...result,
      message: 'Agency created successfully with separate database',
    });
  } catch (error) {
    logger.error('Agency creation failed', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyName,
      domain,
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create agency',
      detail: error.detail,
      code: error.code,
      message: 'Failed to create agency. Please try again or contact support.',
    });
  }
}));

/**
 * POST /api/agencies/repair-database
 * Repair agency database by adding missing tables
 */
router.post('/repair-database', asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'] || req.body.database;

    if (!agencyDatabase) {
      return res.status(400).json({
        error: 'Agency database name is required',
        message: 'Provide database name in header: x-agency-database or in body: { database: "agency_name" }',
      });
    }

    logger.info('Starting database repair', {
      agencyDatabase,
      requestId: req.requestId,
    });

    const result = await repairAgencyDatabase(agencyDatabase);

    res.json({
      success: true,
      message: 'Database repair completed successfully',
      ...result,
    });
  } catch (error) {
    logger.error('Database repair failed', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      agencyDatabase,
      requestId: req.requestId,
    });
    res.status(500).json({
      error: error.message || 'Failed to repair database',
      detail: error.detail,
      code: error.code,
    });
  }
}));

/**
 * GET /api/agencies/maintenance-status
 * Get current agency maintenance status
 */
router.get('/maintenance-status', authenticate, asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'] || req.query.database;

    if (!agencyDatabase) {
      return res.status(400).json({
        success: false,
        error: 'Agency database not specified',
        message: 'Provide database name in header: x-agency-database',
      });
    }

    // Check user has admin role
    const userRole = req.user?.role || req.user?.roles?.[0];
    if (userRole !== 'admin' && userRole !== 'super_admin' && !req.user?.isSystemSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only admins can check maintenance status',
      });
    }

    const agencyPool = getAgencyPool(agencyDatabase);
    const client = await agencyPool.connect();

    try {
      const result = await client.query(`
        SELECT maintenance_mode, maintenance_message
        FROM public.agency_settings
        LIMIT 1
      `);

      const maintenanceStatus = result.rows.length > 0 ? {
        maintenance_mode: result.rows[0].maintenance_mode || false,
        maintenance_message: result.rows[0].maintenance_message || null,
      } : {
        maintenance_mode: false,
        maintenance_message: null,
      };

      return res.json({
        success: true,
        data: maintenanceStatus,
        message: 'Maintenance status fetched successfully',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error fetching maintenance status', {
      error: error.message,
      code: error.code,
      requestId: req.requestId,
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch maintenance status',
      message: 'Failed to fetch maintenance status',
    });
  }
}));

/**
 * PUT /api/agencies/maintenance
 * Toggle agency maintenance mode (agency admin only)
 */
router.put('/maintenance', authenticate, asyncHandler(async (req, res) => {
  try {
    const agencyDatabase = req.headers['x-agency-database'];

    if (!agencyDatabase) {
      return res.status(400).json({
        success: false,
        error: 'Agency database not specified',
        message: 'Provide database name in header: x-agency-database',
      });
    }

    // Check user has admin role
    const userRole = req.user?.role || req.user?.roles?.[0];
    if (userRole !== 'admin' && userRole !== 'super_admin' && !req.user?.isSystemSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only admins can toggle maintenance mode',
      });
    }

    const { maintenance_mode, maintenance_message } = req.body;

    if (typeof maintenance_mode !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'maintenance_mode must be a boolean',
      });
    }

    const agencyPool = getAgencyPool(agencyDatabase);
    const client = await agencyPool.connect();

    try {
      // Update agency_settings in agency database
      await client.query(`
        UPDATE public.agency_settings
        SET 
          maintenance_mode = $1,
          maintenance_message = $2,
          updated_at = NOW()
        WHERE id = (SELECT id FROM public.agency_settings LIMIT 1)
      `, [maintenance_mode, maintenance_message || null]);

      // Clear cache
      clearMaintenanceCache(agencyDatabase);

      logger.info('Agency maintenance mode updated', {
        agencyDatabase,
        maintenance_mode,
        userId: req.user?.id,
        requestId: req.requestId,
      });

      return res.json({
        success: true,
        data: {
          maintenance_mode,
          maintenance_message: maintenance_message || null,
        },
        message: `Maintenance mode ${maintenance_mode ? 'enabled' : 'disabled'} successfully`,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error updating maintenance mode', {
      error: error.message,
      code: error.code,
      requestId: req.requestId,
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update maintenance mode',
      message: 'Failed to update maintenance mode',
    });
  }
}));

module.exports = router;

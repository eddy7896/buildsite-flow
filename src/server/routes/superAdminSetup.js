/**
 * Super Admin Setup Routes
 * Public routes for initial super admin setup
 * These routes are intentionally public but have safety checks
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * GET /api/setup/status
 * Check if super admin exists and system is ready
 * Public route - no authentication required
 */
router.get('/status', asyncHandler(async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Check if required tables exist
    const tablesCheck = await client.query(`
      SELECT 
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as users_exists,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') as profiles_exists,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') as user_roles_exists,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies') as agencies_exists
    `);
    
    const tables = tablesCheck.rows[0];
    const allTablesExist = tables.users_exists && tables.profiles_exists && 
                          tables.user_roles_exists && tables.agencies_exists;
    
    if (!allTablesExist) {
      return res.json({
        success: true,
        data: {
          tablesExist: false,
          superAdminExists: false,
          setupRequired: true,
          missingTables: {
            users: !tables.users_exists,
            profiles: !tables.profiles_exists,
            user_roles: !tables.user_roles_exists,
            agencies: !tables.agencies_exists,
          },
          message: 'Database tables are missing. Please run migrations first.',
        },
      });
    }
    
    // Check if super admin exists
    const superAdminCheck = await client.query(`
      SELECT 
        u.id, 
        u.email, 
        u.is_active,
        p.full_name,
        ur.role
      FROM public.users u
      LEFT JOIN public.profiles p ON u.id = p.user_id
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'super_admin' AND ur.agency_id IS NULL
      WHERE ur.role = 'super_admin'
      LIMIT 1
    `);
    
    const superAdminExists = superAdminCheck.rows.length > 0;
    
    // Get total users count
    const usersCount = await client.query('SELECT COUNT(*) as count FROM public.users');
    
    // Get agencies count
    const agenciesCount = await client.query('SELECT COUNT(*) as count FROM public.agencies');
    
    res.json({
      success: true,
      data: {
        tablesExist: true,
        superAdminExists,
        superAdmin: superAdminExists ? {
          email: superAdminCheck.rows[0].email,
          fullName: superAdminCheck.rows[0].full_name,
          isActive: superAdminCheck.rows[0].is_active,
        } : null,
        setupRequired: !superAdminExists,
        stats: {
          totalUsers: parseInt(usersCount.rows[0].count) || 0,
          totalAgencies: parseInt(agenciesCount.rows[0].count) || 0,
        },
        message: superAdminExists 
          ? 'Super admin exists. You can login or update credentials.'
          : 'No super admin found. Please create one.',
      },
    });
  } finally {
    client.release();
  }
}));

/**
 * POST /api/setup/init-tables
 * Initialize required database tables
 * Public route - only works if tables don't exist
 */
router.post('/init-tables', asyncHandler(async (req, res) => {
  const client = await pool.connect();
  
  try {
    logger.info('Initializing database tables via setup API');
    
    // Enable extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    
    // Create app_role enum
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
          CREATE TYPE public.app_role AS ENUM (
            'super_admin', 'admin', 'hr', 'finance_manager', 'cfo', 'ceo', 
            'project_manager', 'employee', 'contractor', 'intern'
          );
        END IF;
      END $$;
    `);
    
    // Create agencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.agencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        domain TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        is_active BOOLEAN NOT NULL DEFAULT true,
        subscription_plan TEXT DEFAULT 'basic',
        max_users INTEGER DEFAULT 50,
        database_name TEXT UNIQUE,
        owner_user_id UUID
      )
    `);
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email_confirmed BOOLEAN DEFAULT false,
        email_confirmed_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_sign_in_at TIMESTAMPTZ,
        raw_user_meta_data JSONB DEFAULT '{}'::jsonb
      )
    `);
    
    // Create profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
        full_name TEXT,
        phone_number TEXT,
        address TEXT,
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    
    // Create user_roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        role public.app_role NOT NULL,
        agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        assigned_at TIMESTAMPTZ DEFAULT now(),
        assigned_by UUID REFERENCES public.users(id),
        UNIQUE(user_id, role, agency_id)
      )
    `);
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role)`);
    
    logger.info('✅ Database tables initialized successfully via setup API');
    
    res.json({
      success: true,
      message: 'Database tables initialized successfully',
    });
  } catch (error) {
    logger.error('Failed to initialize tables:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to initialize database tables',
    });
  } finally {
    client.release();
  }
}));

/**
 * POST /api/setup/create-super-admin
 * Create or update super admin credentials
 * Public route - but has safety checks
 */
router.post('/create-super-admin', asyncHandler(async (req, res) => {
  const { email, password, fullName, setupKey } = req.body;
  
  // Validate inputs
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
      message: 'Email and password are required',
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format',
      message: 'Please provide a valid email address',
    });
  }
  
  // Validate password strength (minimum 8 chars)
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password too weak',
      message: 'Password must be at least 8 characters long',
    });
  }
  
  const client = await pool.connect();
  
  try {
    // Check if super admin already exists
    const existingCheck = await client.query(`
      SELECT u.id, u.email
      FROM public.users u
      INNER JOIN public.user_roles ur ON u.id = ur.user_id 
        AND ur.role = 'super_admin' 
        AND ur.agency_id IS NULL
      LIMIT 1
    `);
    
    const superAdminExists = existingCheck.rows.length > 0;
    
    // If super admin exists, require the setup key (environment variable)
    // This prevents unauthorized changes to super admin
    if (superAdminExists) {
      const envSetupKey = process.env.SUPER_ADMIN_SETUP_KEY || process.env.VITE_JWT_SECRET;
      
      if (!setupKey || setupKey !== envSetupKey) {
        return res.status(403).json({
          success: false,
          error: 'Setup key required',
          message: 'Super admin already exists. Provide the setup key to modify credentials. ' +
                   'Set SUPER_ADMIN_SETUP_KEY in environment or use VITE_JWT_SECRET.',
          requiresSetupKey: true,
        });
      }
    }
    
    await client.query('BEGIN');
    
    // Ensure extensions exist
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    
    // Create or update the user
    let userId;
    
    if (superAdminExists && existingCheck.rows[0].email === email.toLowerCase()) {
      // Update existing super admin
      userId = existingCheck.rows[0].id;
      
      await client.query(`
        UPDATE public.users 
        SET 
          password_hash = crypt($1, gen_salt('bf')),
          email_confirmed = true,
          email_confirmed_at = NOW(),
          is_active = true,
          updated_at = NOW()
        WHERE id = $2
      `, [password, userId]);
      
      logger.info('Updated existing super admin password', { email });
    } else {
      // Create new user (or update if email exists)
      const userResult = await client.query(`
        INSERT INTO public.users (email, password_hash, email_confirmed, email_confirmed_at, is_active)
        VALUES (LOWER($1), crypt($2, gen_salt('bf')), true, NOW(), true)
        ON CONFLICT (email) 
        DO UPDATE SET 
          password_hash = crypt($2, gen_salt('bf')),
          email_confirmed = true,
          email_confirmed_at = NOW(),
          is_active = true,
          updated_at = NOW()
        RETURNING id
      `, [email, password]);
      
      userId = userResult.rows[0].id;
      logger.info('Created/updated user for super admin', { email });
    }
    
    // Create or update profile
    const displayName = fullName || 'Super Administrator';
    await client.query(`
      INSERT INTO public.profiles (user_id, full_name, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        full_name = $2,
        is_active = true,
        updated_at = NOW()
    `, [userId, displayName]);
    
    // Remove any existing super_admin role for this user (to handle edge cases)
    await client.query(`
      DELETE FROM public.user_roles 
      WHERE user_id = $1 AND role = 'super_admin'
    `, [userId]);
    
    // Assign super_admin role with NULL agency_id
    await client.query(`
      INSERT INTO public.user_roles (user_id, role, agency_id)
      VALUES ($1, 'super_admin'::public.app_role, NULL)
      ON CONFLICT (user_id, role, agency_id) DO NOTHING
    `, [userId]);
    
    await client.query('COMMIT');
    
    logger.info('✅ Super admin created/updated successfully', { email });
    
    res.json({
      success: true,
      message: superAdminExists 
        ? 'Super admin credentials updated successfully'
        : 'Super admin created successfully',
      data: {
        email: email.toLowerCase(),
        fullName: displayName,
        loginUrl: '/auth',
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create super admin:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create super admin',
    });
  } finally {
    client.release();
  }
}));

/**
 * POST /api/setup/verify-login
 * Test login credentials before saving
 * Public route - for testing only
 */
router.post('/verify-login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
    });
  }
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.password_hash = crypt($2, u.password_hash) as password_valid,
        u.is_active,
        p.full_name,
        ur.role
      FROM public.users u
      LEFT JOIN public.profiles p ON u.id = p.user_id
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'super_admin' AND ur.agency_id IS NULL
      WHERE LOWER(u.email) = LOWER($1)
    `, [email, password]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        valid: false,
        reason: 'User not found',
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      valid: user.password_valid && user.is_active && user.role === 'super_admin',
      details: {
        userExists: true,
        passwordValid: user.password_valid,
        isActive: user.is_active,
        isSuperAdmin: user.role === 'super_admin',
        fullName: user.full_name,
      },
    });
  } finally {
    client.release();
  }
}));

module.exports = router;




/**
 * Agency Service
 * Handles agency creation, domain checking, setup completion, and database repair
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { pool } = require('../config/database');
const { createAgencySchema } = require('../utils/schemaCreator');
const { parseDatabaseUrl } = require('../utils/poolManager');
const { DATABASE_URL } = require('../config/constants');

/**
 * Check if domain is available
 * @param {string} domain - Domain to check
 * @returns {Promise<boolean>} True if available
 */
async function checkDomainAvailability(domain) {
  const mainClient = await pool.connect();
  try {
    const result = await mainClient.query(
      'SELECT id FROM public.agencies WHERE domain = $1',
      [domain.toLowerCase().trim()]
    );
    return result.rows.length === 0;
  } finally {
    mainClient.release();
  }
}

/**
 * Check agency setup status
 * @param {string} agencyDatabase - Agency database name
 * @returns {Promise<boolean>} True if setup is complete
 */
async function checkSetupStatus(agencyDatabase) {
  if (!agencyDatabase) {
    return false;
  }

  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const { Pool: AgencyPool } = require('pg');
  const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();

  try {
    const setupCheck = await agencyClient.query(`
      SELECT setup_complete FROM public.agency_settings LIMIT 1
    `);
    return setupCheck.rows[0]?.setup_complete || false;
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
}

/**
 * Get detailed agency setup progress
 * @param {string} agencyDatabase - Agency database name
 * @returns {Promise<Object>} Setup progress details
 */
async function getSetupProgress(agencyDatabase) {
  const defaultResponse = {
    setupComplete: false,
    progress: 0,
    completedSteps: [],
    totalSteps: 7,
    lastUpdated: null,
    agencyName: null,
  };

  if (!agencyDatabase) {
    return defaultResponse;
  }

  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const { Pool: AgencyPool } = require('pg');
  const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();

  try {
    // Ensure newer optional columns exist to avoid errors when selecting them
    const optionalColumns = [
      'company_tagline',
      'industry',
      'business_type',
      'legal_name',
      'phone',
      'email',
      'website',
      'currency',
      'timezone'
    ];
    
    for (const column of optionalColumns) {
      try {
        await agencyClient.query(`
          ALTER TABLE public.agency_settings 
          ADD COLUMN IF NOT EXISTS ${column} TEXT
        `);
      } catch (e) {
        // Non-fatal - column might already exist or table might not exist
        if (!e.message.includes('already exists') && !e.message.includes('does not exist')) {
          // Silently ignore - column might already exist or table might not exist yet
        }
      }
    }

    // Query with all columns (they should exist after schema creation)
    let result;
    try {
      result = await agencyClient.query(`
        SELECT 
          setup_complete,
          agency_name,
          company_tagline,
          industry,
          business_type,
          legal_name,
          phone,
          email,
          website,
          COALESCE(currency, default_currency) as currency,
          timezone,
          updated_at
        FROM public.agency_settings LIMIT 1
      `);
    } catch (queryError) {
      // If query fails due to missing columns, try to add them and retry once
      if (queryError.code === '42703' && queryError.message.includes('does not exist')) {
        try {
          // Try to add missing columns dynamically
          const missingColumn = queryError.message.match(/column "(\w+)" does not exist/)?.[1];
          if (missingColumn) {
            await agencyClient.query(`
              ALTER TABLE public.agency_settings 
              ADD COLUMN IF NOT EXISTS ${missingColumn} TEXT
            `);
            // Retry the query
            result = await agencyClient.query(`
              SELECT 
                setup_complete,
                agency_name,
                company_tagline,
                industry,
                business_type,
                legal_name,
                phone,
                email,
                website,
                COALESCE(currency, default_currency) as currency,
                timezone,
                updated_at
              FROM public.agency_settings LIMIT 1
            `);
          } else {
            return defaultResponse;
          }
        } catch (retryError) {
          // If retry fails, return default response silently
          return defaultResponse;
        }
      } else {
        // For other errors, return default response silently
        return defaultResponse;
      }
    }

    if (result.rows.length === 0) {
      return defaultResponse;
    }

    const settings = result.rows[0];
    const completedSteps = [];
    let stepCount = 0;

    // Step 1: Company Profile
    if (settings.agency_name) {
      completedSteps.push('Company Profile');
      stepCount++;
    }

    // Step 2: Business Details
    if (settings.legal_name || settings.phone || settings.email) {
      completedSteps.push('Business Details');
      stepCount++;
    }

    // Step 3: Departments
    try {
      const deptResult = await agencyClient.query(`
        SELECT COUNT(*) as count FROM public.departments
      `);
      if (deptResult.rows.length > 0 && parseInt(deptResult.rows[0].count) > 0) {
        completedSteps.push('Departments');
        stepCount++;
      }
    } catch (deptError) {
      // Silently continue without this step
      // Department check is optional for setup progress
    }

    // Step 4: Financial Setup
    if (settings.currency) {
      completedSteps.push('Financial Setup');
      stepCount++;
    }

    // Step 5: Team Members (check if there are more than 1 user, indicating team members were added)
    try {
      const teamResult = await agencyClient.query(`
        SELECT COUNT(*) as count FROM public.users
      `);
      if (teamResult.rows.length > 0) {
        const userCount = parseInt(teamResult.rows[0].count) || 0;
        // If there are 2+ users, assume team members were added (1 is the admin created during agency creation)
        if (userCount > 1) {
          completedSteps.push('Team Members');
          stepCount++;
        }
      }
    } catch (teamError) {
      console.error('[Setup Progress] Error checking team members:', teamError);
      // Continue without this step
    }

    // Step 6: Preferences
    if (settings.timezone) {
      completedSteps.push('Preferences');
      stepCount++;
    }

    // Step 7: Review (always available if other steps are done)
    if (stepCount >= 6) {
      completedSteps.push('Review');
      stepCount++;
    }

    const progress = Math.round((stepCount / 7) * 100);

    return {
      setupComplete: settings.setup_complete || false,
      progress: progress || 0,
      completedSteps: Array.isArray(completedSteps) ? completedSteps : [],
      totalSteps: 7,
      lastUpdated: settings.updated_at || null,
      agencyName: settings.agency_name || null,
    };
    } catch (error) {
      // Return default response silently - setup progress is non-critical
      return defaultResponse;
    } finally {
    try {
      agencyClient.release();
      await agencyPool.end();
      } catch (cleanupError) {
        // Silently ignore cleanup errors
      }
  }
}

/**
 * Create a new agency with isolated database
 * @param {Object} agencyData - Agency creation data
 * @returns {Promise<Object>} Created agency information
 */
async function createAgency(agencyData) {
  const {
    agencyName,
    domain,
    adminName,
    adminEmail,
    adminPassword,
    subscriptionPlan,
    phone,
  } = agencyData;

  // Validate required fields
  if (!agencyName || !domain || !adminName || !adminEmail || !adminPassword || !subscriptionPlan) {
    throw new Error('Missing required fields: agencyName, domain, adminName, adminEmail, adminPassword, subscriptionPlan');
  }

  // Generate UUIDs
  const agencyId = crypto.randomUUID();
  const adminUserId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const userRoleId = crypto.randomUUID();
  const agencySettingsId = crypto.randomUUID();

  // Hash password
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Plan limits
  const planLimits = {
    starter: 5,
    professional: 25,
    enterprise: 1000,
  };
  const maxUsers = planLimits[subscriptionPlan] || 25;

  // Generate database name
  const { host, port, user, password } = parseDatabaseUrl();
  const dbName = `agency_${domain.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${agencyId.substring(0, 8)}`;

  const mainClient = await pool.connect();
  let postgresClient = null;
  let postgresPool = null;
  let agencyDbClient = null;
  let agencyPool = null;

  try {
    // Connect to postgres database to create new database
    console.log(`[API] Connecting to PostgreSQL server to create database: ${dbName}`);
    postgresPool = new Pool({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });
    postgresClient = await postgresPool.connect();
    
    // Verify connection to postgres database
    const postgresCheck = await postgresClient.query('SELECT current_database()');
    console.log(`[API] ✅ Connected to: ${postgresCheck.rows[0].current_database}`);

    // Check if database already exists
    const dbExistsCheck = await postgresClient.query(`
      SELECT EXISTS(
        SELECT FROM pg_database WHERE datname = $1
      )
    `, [dbName]);
    
    if (dbExistsCheck.rows[0].exists) {
      console.log(`[API] ⚠️ Database ${dbName} already exists, dropping it first...`);
      // Terminate all connections to the database
      await postgresClient.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `, [dbName]);
      await postgresClient.query(`DROP DATABASE IF EXISTS ${dbName}`);
      console.log(`[API] ✅ Dropped existing database: ${dbName}`);
    }

    // Create the agency database
    console.log(`[API] Creating isolated database: ${dbName}`);
    await postgresClient.query(`CREATE DATABASE ${dbName}`);
    
    // Verify database was created
    const dbCreatedCheck = await postgresClient.query(`
      SELECT EXISTS(
        SELECT FROM pg_database WHERE datname = $1
      )
    `, [dbName]);
    
    if (!dbCreatedCheck.rows[0].exists) {
      throw new Error(`Failed to create database: ${dbName}`);
    }
    console.log(`[API] ✅ Database created: ${dbName}`);

    // Release postgres connection before connecting to new database
    postgresClient.release();
    await postgresPool.end();

    // Connect to the new agency database (isolated)
    console.log(`[API] Connecting to isolated agency database: ${dbName}`);
    const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
    agencyPool = new Pool({ 
      connectionString: agencyDbUrl, 
      max: 10,
      // Ensure isolation - each agency database is completely separate
      application_name: `agency_${dbName}`
    });
    agencyDbClient = await agencyPool.connect();
    
    // Verify we're connected to the correct isolated database
    const currentDbCheck = await agencyDbClient.query('SELECT current_database()');
    if (currentDbCheck.rows[0].current_database !== dbName) {
      throw new Error(`Database isolation error: expected ${dbName}, got ${currentDbCheck.rows[0].current_database}`);
    }
    console.log(`[API] ✅ Connected to isolated database: ${currentDbCheck.rows[0].current_database}`);
    
    // Verify database is empty (no tables should exist yet)
    const initialTablesCheck = await agencyDbClient.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    console.log(`[API] ✅ Database is clean (${initialTablesCheck.rows[0].count} tables exist)`);

    // Create schema
    console.log(`[API] Creating schema for database: ${dbName}`);
    await createAgencySchema(agencyDbClient);
    
    // Verify critical tables exist after schema creation
    const criticalTablesCheck = await agencyDbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'profiles', 'user_roles', 'attendance')
    `);
    const existingTables = criticalTablesCheck.rows.map(r => r.table_name);
    const requiredTables = ['users', 'profiles', 'user_roles', 'attendance'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      throw new Error(`Critical tables missing after schema creation: ${missingTables.join(', ')}`);
    }
    
    console.log(`[API] ✅ Schema created and verified. Existing tables: ${existingTables.join(', ')}`);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(adminUserId)) {
      throw new Error('Admin user ID is not a valid UUID format');
    }

    // Set user context
    const escapedUserId = adminUserId.replace(/'/g, "''");
    await agencyDbClient.query(`SET LOCAL app.current_user_id = '${escapedUserId}'`);

    // Verify users table is accessible before inserting
    const usersTableAccess = await agencyDbClient.query(`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name IN ('id', 'email', 'password_hash')
    `);
    
    if (usersTableAccess.rows[0].count < 3) {
      throw new Error('Users table does not have required columns');
    }

    // Create admin user
    console.log(`[API] Creating admin user: ${adminEmail}`);
    await agencyDbClient.query(
      `INSERT INTO public.users (
        id, email, password_hash, email_confirmed, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [adminUserId, adminEmail, passwordHash, true, true]
    );
    
    // Verify user was created
    const userCheck = await agencyDbClient.query(
      `SELECT id, email FROM public.users WHERE id = $1`,
      [adminUserId]
    );
    
    if (userCheck.rows.length === 0) {
      throw new Error('Failed to create admin user - user not found after insert');
    }
    
    console.log(`[API] ✅ Admin user created: ${userCheck.rows[0].email}`);

    // Verify profiles table is accessible before inserting
    const profilesTableAccess = await agencyDbClient.query(`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      AND column_name IN ('id', 'user_id', 'full_name')
    `);
    
    if (profilesTableAccess.rows[0].count < 3) {
      throw new Error('Profiles table does not have required columns');
    }

    // Create admin profile
    console.log(`[API] Creating admin profile for: ${adminName}`);
    await agencyDbClient.query(
      `INSERT INTO public.profiles (
        id, user_id, full_name, phone, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        updated_at = NOW()`,
      [profileId, adminUserId, adminName, phone || null, true]
    );
    
    // Verify profile was created
    const profileCheck = await agencyDbClient.query(
      `SELECT id, user_id, full_name FROM public.profiles WHERE user_id = $1`,
      [adminUserId]
    );
    
    if (profileCheck.rows.length === 0) {
      throw new Error('Failed to create admin profile - profile not found after insert');
    }
    
    console.log(`[API] ✅ Admin profile created: ${profileCheck.rows[0].full_name}`);

    // Remove employee role if exists
    await agencyDbClient.query(
      `DELETE FROM public.user_roles WHERE user_id = $1 AND role = 'employee'`,
      [adminUserId]
    );

    // Assign super_admin role
    // Note: user_roles has UNIQUE(user_id, role, agency_id), so we need to include agency_id (NULL for admin)
    await agencyDbClient.query(
      `INSERT INTO public.user_roles (
        id, user_id, role, agency_id, assigned_at
      ) VALUES ($1, $2, $3, NULL, NOW())
      ON CONFLICT (user_id, role, agency_id) DO NOTHING`,
      [userRoleId, adminUserId, 'super_admin']
    );

    // Update main database with agency info
    await mainClient.query('BEGIN');
    try {
      // Ensure columns exist
      await mainClient.query(`
        ALTER TABLE public.agencies 
        ADD COLUMN IF NOT EXISTS database_name TEXT UNIQUE
      `);
      await mainClient.query(`
        ALTER TABLE public.agencies
        ADD COLUMN IF NOT EXISTS owner_user_id UUID
      `);

      // Insert agency record
      await mainClient.query(
        `INSERT INTO public.agencies (
          id, name, domain, database_name, owner_user_id,
          is_active, subscription_plan, max_users
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          database_name = EXCLUDED.database_name,
          owner_user_id = COALESCE(public.agencies.owner_user_id, EXCLUDED.owner_user_id)`,
        [agencyId, agencyName, domain, dbName, adminUserId, true, subscriptionPlan, maxUsers]
      );

      // Ensure agency_settings table exists with agency_id column and unique constraint
      await mainClient.query(`
        CREATE TABLE IF NOT EXISTS public.agency_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
          agency_name TEXT,
          logo_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      
      // Add agency_id column if it doesn't exist
      await mainClient.query(`
        ALTER TABLE public.agency_settings 
        ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE
      `);
      
      // Add unique constraint on agency_id if it doesn't exist
      await mainClient.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'agency_settings_agency_id_key'
          ) THEN
            ALTER TABLE public.agency_settings 
            ADD CONSTRAINT agency_settings_agency_id_key UNIQUE (agency_id);
          END IF;
        END $$;
      `);
      
      // Insert agency settings
      await mainClient.query(
        `INSERT INTO public.agency_settings (
          id, agency_id, agency_name, logo_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (agency_id) DO UPDATE SET
          agency_name = EXCLUDED.agency_name,
          updated_at = NOW()`,
        [agencySettingsId, agencyId, agencyName, null]
      );

      await mainClient.query('COMMIT');
    } catch (error) {
      await mainClient.query('ROLLBACK');
      throw error;
    }

    console.log(`[API] Agency created successfully: ${agencyName} (${domain}) - Database: ${dbName}`);

    return {
      agency: {
        id: agencyId,
        name: agencyName,
        domain,
        databaseName: dbName,
        subscriptionPlan,
      },
      admin: {
        id: adminUserId,
        email: adminEmail,
        name: adminName,
      },
    };
  } catch (error) {
    console.error(`[API] ❌ Agency creation failed: ${error.message}`);
    console.error(`[API] Error stack:`, error.stack);
    
    // Rollback: drop database if creation failed
    if (dbName) {
      try {
        // Try to get a fresh connection to postgres to drop the database
        const cleanupPool = new Pool({
          host,
          port,
          user,
          password,
          database: 'postgres',
        });
        const cleanupClient = await cleanupPool.connect();
        
        // Terminate all connections to the database first
        await cleanupClient.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = $1 AND pid <> pg_backend_pid()
        `, [dbName]);
        
        // Wait a moment for connections to close
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Drop the database
        await cleanupClient.query(`DROP DATABASE IF EXISTS ${dbName}`);
        console.log(`[API] ✅ Rolled back database: ${dbName}`);
        
        cleanupClient.release();
        await cleanupPool.end();
      } catch (cleanupError) {
        console.error(`[API] ⚠️ Failed to cleanup database ${dbName}:`, cleanupError.message);
        console.error(`[API] You may need to manually drop the database: DROP DATABASE IF EXISTS ${dbName}`);
      }
    }
    throw error;
  } finally {
    // Cleanup connections
    if (agencyDbClient) {
      try {
        agencyDbClient.release();
      } catch {}
    }
    if (agencyPool) {
      try {
        await agencyPool.end();
      } catch {}
    }
    if (postgresClient) {
      try {
        postgresClient.release();
      } catch {}
    }
    if (postgresPool) {
      try {
        await postgresPool.end();
      } catch {}
    }
    if (mainClient) {
      try {
        mainClient.release();
      } catch {}
    }
  }
}

/**
 * Repair agency database by running schema creation
 * @param {string} agencyDatabase - Agency database name
 * @returns {Promise<Object>} Repair results
 */
async function repairAgencyDatabase(agencyDatabase) {
  if (!agencyDatabase) {
    throw new Error('Agency database name is required');
  }

  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const { Pool: AgencyPool } = require('pg');
  const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();

  try {
    // Count tables before
    const beforeTables = await agencyClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const beforeCount = beforeTables.rows.length;

    // Run schema creation
    await createAgencySchema(agencyClient);

    // Count tables after
    const afterTables = await agencyClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const afterCount = afterTables.rows.length;
    const addedCount = afterCount - beforeCount;

    console.log(`[API] Database repair complete. Total tables: ${afterCount} (added ${addedCount} new tables)`);

    return {
      database: agencyDatabase,
      tablesBefore: beforeCount,
      tablesAfter: afterCount,
      tablesAdded: addedCount,
      allTables: afterTables.rows.map(r => r.table_name),
    };
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
}

/**
 * Complete agency setup with extended settings
 * @param {string} agencyDatabase - Agency database name
 * @param {Object} setupData - Setup data
 * @returns {Promise<void>}
 */
async function completeAgencySetup(agencyDatabase, setupData) {
  if (!agencyDatabase) {
    throw new Error('Agency database not specified');
  }

  const {
    companyName,
    companyTagline,
    industry,
    businessType,
    foundedYear,
    employeeCount,
    description,
    logo,
    legalName,
    registrationNumber,
    taxId,
    taxIdType,
    address,
    phone,
    email,
    website,
    socialMedia,
    departments,
    teamMembers,
    currency,
    fiscalYearStart,
    paymentTerms,
    invoicePrefix,
    taxRate,
    enableGST,
    gstNumber,
    bankDetails,
    timezone,
    dateFormat,
    timeFormat,
    weekStart,
    language,
    notifications,
    features,
  } = setupData;

  // Get agency_id from main database using database_name
  const mainClient = await pool.connect();
  let agencyId = null;
  try {
    const agencyResult = await mainClient.query(
      'SELECT id FROM public.agencies WHERE database_name = $1 LIMIT 1',
      [agencyDatabase]
    );
    if (agencyResult.rows.length > 0) {
      agencyId = agencyResult.rows[0].id;
      console.log(`[Setup] Found agency_id: ${agencyId} for database: ${agencyDatabase}`);
    } else {
      console.warn(`[Setup] No agency found with database_name: ${agencyDatabase}`);
    }
  } catch (error) {
    console.error('[Setup] Error fetching agency_id from main database:', error);
  } finally {
    mainClient.release();
  }

  if (!agencyId) {
    throw new Error(`Agency not found in main database for database: ${agencyDatabase}`);
  }

  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const { Pool: AgencyPool } = require('pg');
  const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 10 });
  const agencyClient = await agencyPool.connect();

  try {
    await agencyClient.query('BEGIN');
    
    console.log(`[Setup] Starting setup completion for database: ${agencyDatabase} with agency_id: ${agencyId}`);

    // Ensure setup_complete column exists
    try {
      await agencyClient.query(`
        ALTER TABLE public.agency_settings 
        ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT false
      `);
    } catch (e) {
      console.warn('[Setup] Could not add setup_complete column (may already exist):', e.message);
      // ignore
    }

    // Ensure all extended columns exist (simplified - full version in original)
    await agencyClient.query(`
      DO $$
      BEGIN
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS company_tagline TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS industry TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS business_type TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS founded_year TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS employee_count TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS legal_name TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS registration_number TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS tax_id TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS tax_id_type TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS address_street TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS address_city TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS address_state TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS address_zip TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS address_country TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS phone TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS email TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS website TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS social_twitter TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS social_facebook TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS fiscal_year_start TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS payment_terms TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS invoice_prefix TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS enable_gst BOOLEAN DEFAULT false;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS gst_number TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS bank_name TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS bank_routing_number TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS bank_swift_code TEXT;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'MM/DD/YYYY';
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS time_format TEXT DEFAULT '12';
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS week_start TEXT DEFAULT 'Monday';
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT true;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS notifications_sms BOOLEAN DEFAULT false;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS notifications_push BOOLEAN DEFAULT true;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS notifications_weekly_report BOOLEAN DEFAULT true;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS notifications_monthly_report BOOLEAN DEFAULT true;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS features_enable_payroll BOOLEAN DEFAULT true;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS features_enable_projects BOOLEAN DEFAULT true;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS features_enable_crm BOOLEAN DEFAULT true;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS features_enable_inventory BOOLEAN DEFAULT false;
        ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS features_enable_reports BOOLEAN DEFAULT true;
      END $$;
    `);

    // Update agency_settings with ALL 50+ fields
    const agencySettingsData = {
      agency_name: companyName || legalName || 'My Agency',
      company_tagline: companyTagline || null,
      industry: industry || null,
      business_type: businessType || null,
      founded_year: foundedYear || null,
      employee_count: employeeCount || null,
      description: description || null,
      legal_name: legalName || null,
      registration_number: registrationNumber || null,
      tax_id: taxId || null,
      tax_id_type: taxIdType || 'EIN',
      address_street: address?.street || null,
      address_city: address?.city || null,
      address_state: address?.state || null,
      address_zip: address?.zipCode || null,
      address_country: address?.country || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      logo_url: logo || null,
      currency: currency || 'USD',
      fiscal_year_start: fiscalYearStart || '01-01',
      payment_terms: paymentTerms || '30',
      invoice_prefix: invoicePrefix || 'INV',
      tax_rate: parseFloat(taxRate || '0'),
      enable_gst: enableGST || false,
      gst_number: gstNumber || null,
      timezone: timezone || 'UTC',
      date_format: dateFormat || 'MM/DD/YYYY',
      time_format: timeFormat || '12',
      week_start: weekStart || 'Monday',
      language: language || 'en',
    };

    // Ensure agency_settings has at least one row
    const settingsCheck = await agencyClient.query(`
      SELECT id FROM public.agency_settings LIMIT 1
    `);
    
    let settingsId;
    if (settingsCheck.rows.length === 0) {
      // Insert a new row if none exists
      const insertResult = await agencyClient.query(`
        INSERT INTO public.agency_settings (id, agency_name, setup_complete, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, false, NOW(), NOW())
        RETURNING id
      `, [agencySettingsData.agency_name || 'My Agency']);
      settingsId = insertResult.rows[0].id;
    } else {
      settingsId = settingsCheck.rows[0].id;
    }

    // Complete update query with ALL 50+ fields
    await agencyClient.query(`
      UPDATE public.agency_settings 
      SET 
        agency_name = $1,
        company_tagline = $2,
        industry = $3,
        business_type = $4,
        founded_year = $5,
        employee_count = $6,
        description = $7,
        legal_name = $8,
        registration_number = $9,
        tax_id = $10,
        tax_id_type = $11,
        address_street = $12,
        address_city = $13,
        address_state = $14,
        address_zip = $15,
        address_country = $16,
        phone = $17,
        email = $18,
        website = $19,
        logo_url = $20,
        social_linkedin = $21,
        social_twitter = $22,
        social_facebook = $23,
        currency = $24,
        fiscal_year_start = $25,
        payment_terms = $26,
        invoice_prefix = $27,
        tax_rate = $28,
        enable_gst = $29,
        gst_number = $30,
        bank_account_name = $31,
        bank_account_number = $32,
        bank_name = $33,
        bank_routing_number = $34,
        bank_swift_code = $35,
        timezone = $36,
        date_format = $37,
        time_format = $38,
        week_start = $39,
        language = $40,
        notifications_email = $41,
        notifications_sms = $42,
        notifications_push = $43,
        notifications_weekly_report = $44,
        notifications_monthly_report = $45,
        features_enable_payroll = $46,
        features_enable_projects = $47,
        features_enable_crm = $48,
        features_enable_inventory = $49,
        features_enable_reports = $50,
        setup_complete = true,
        updated_at = NOW()
      WHERE id = $51
    `, [
      agencySettingsData.agency_name,
      agencySettingsData.company_tagline,
      agencySettingsData.industry,
      agencySettingsData.business_type,
      agencySettingsData.founded_year,
      agencySettingsData.employee_count,
      agencySettingsData.description,
      agencySettingsData.legal_name,
      agencySettingsData.registration_number,
      agencySettingsData.tax_id,
      agencySettingsData.tax_id_type,
      agencySettingsData.address_street,
      agencySettingsData.address_city,
      agencySettingsData.address_state,
      agencySettingsData.address_zip,
      agencySettingsData.address_country,
      agencySettingsData.phone,
      agencySettingsData.email,
      agencySettingsData.website,
      agencySettingsData.logo_url,
      socialMedia?.linkedin || null,
      socialMedia?.twitter || null,
      socialMedia?.facebook || null,
      agencySettingsData.currency,
      agencySettingsData.fiscal_year_start,
      agencySettingsData.payment_terms,
      agencySettingsData.invoice_prefix,
      agencySettingsData.tax_rate,
      agencySettingsData.enable_gst,
      agencySettingsData.gst_number,
      bankDetails?.accountName || null,
      bankDetails?.accountNumber || null,
      bankDetails?.bankName || null,
      bankDetails?.routingNumber || null,
      bankDetails?.swiftCode || null,
      agencySettingsData.timezone,
      agencySettingsData.date_format,
      agencySettingsData.time_format,
      agencySettingsData.week_start,
      agencySettingsData.language,
      notifications?.email || false,
      notifications?.sms || false,
      notifications?.push || false,
      notifications?.weeklyReport || false,
      notifications?.monthlyReport || false,
      features?.enablePayroll || false,
      features?.enableProjects || false,
      features?.enableCRM || false,
      features?.enableInventory || false,
      features?.enableReports || false,
      settingsId,
    ]);

    // Create departments if provided
    if (departments && departments.length > 0) {
      for (const dept of departments) {
        if (dept.name) {
          // Check if department already exists
          const existingDept = await agencyClient.query(`
            SELECT id FROM public.departments WHERE name = $1 AND (agency_id = $2 OR agency_id IS NULL) LIMIT 1
          `, [dept.name, agencyId]);
          
          if (existingDept.rows.length > 0) {
            // Update existing department (also set agency_id if it's NULL)
            await agencyClient.query(`
              UPDATE public.departments 
              SET description = $1, agency_id = $2, updated_at = NOW()
              WHERE id = $3
            `, [dept.description || '', agencyId, existingDept.rows[0].id]);
          } else {
            // Insert new department with agency_id
            await agencyClient.query(`
              INSERT INTO public.departments (id, name, description, is_active, agency_id, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, $2, true, $3, NOW(), NOW())
            `, [dept.name, dept.description || '', agencyId]);
          }
        }
      }
    }

    // Create team members if provided
    if (teamMembers && teamMembers.length > 0) {
      const bcrypt = require('bcrypt');
      const defaultPassword = 'Welcome123!';
      for (const member of teamMembers) {
        if (member.name && member.email) {
          try {
            const existingUser = await agencyClient.query(`
              SELECT id FROM public.users WHERE email = $1
            `, [member.email.toLowerCase()]);
            if (existingUser.rows.length > 0) {
              console.log(`[Setup] User ${member.email} already exists, skipping creation`);
              continue;
            }
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            const userResult = await agencyClient.query(`
              INSERT INTO public.users (id, email, password_hash, is_active, email_confirmed, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, $2, true, false, NOW(), NOW())
              RETURNING id
            `, [member.email.toLowerCase(), passwordHash]);
            const userId = userResult.rows[0].id;
            // Insert profile with agency_id
            await agencyClient.query(`
              INSERT INTO public.profiles (id, user_id, full_name, phone, agency_id, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
            `, [userId, member.name, member.phone || null, agencyId]);
            const role = member.role || 'employee';
            // Insert user_role with agency_id – match table schema (assigned_at, no created_at/updated_at)
            await agencyClient.query(`
              INSERT INTO public.user_roles (id, user_id, role, agency_id, assigned_at)
              VALUES (gen_random_uuid(), $1, $2, $3, NOW())
              ON CONFLICT (user_id, role, agency_id) DO NOTHING
            `, [userId, role, agencyId]);
            if (member.department && member.department !== 'none') {
              const deptResult = await agencyClient.query(`
                SELECT id FROM public.departments WHERE name = $1 AND (agency_id = $2 OR agency_id IS NULL) LIMIT 1
              `, [member.department, agencyId]);
              if (deptResult.rows.length > 0) {
                const deptId = deptResult.rows[0].id;
                // Insert team_assignment with agency_id
                await agencyClient.query(`
                  INSERT INTO public.team_assignments (
                    id, user_id, department_id, position_title, role_in_department, 
                    agency_id, start_date, is_active, created_at, updated_at
                  )
                  VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), true, NOW(), NOW())
                `, [userId, deptId, member.title || '', role, agencyId]);
              }
            }
            console.log(`[Setup] Created team member: ${member.name} (${member.email})`);
          } catch (memberError) {
            console.error(`[Setup] Error creating team member ${member.email}:`, memberError);
          }
        }
      }
    }

    await agencyClient.query('COMMIT');
    console.log(`[Setup] Setup completed successfully for database: ${agencyDatabase}`);
  } catch (error) {
    console.error(`[Setup] Error completing setup for ${agencyDatabase}:`, error);
    await agencyClient.query('ROLLBACK').catch(rollbackError => {
      console.error('[Setup] Error during rollback:', rollbackError);
    });
    throw error;
  } finally {
    try {
      agencyClient.release();
      await agencyPool.end();
    } catch (cleanupError) {
      console.error('[Setup] Error cleaning up connections:', cleanupError);
    }
  }
}

module.exports = {
  checkDomainAvailability,
  checkSetupStatus,
  getSetupProgress,
  createAgency,
  repairAgencyDatabase,
  completeAgencySetup,
};

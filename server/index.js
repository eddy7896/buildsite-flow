// Simple Express API server to connect frontend to PostgreSQL

const express = require('express');

const cors = require('cors');

const { Pool } = require('pg');



const app = express();

const PORT = process.env.PORT || 3000;



// Middleware

app.use(cors());

// Increase JSON payload limit to 50MB to accommodate base64 encoded images

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// Parse database URL from environment or use defaults

// Database: buildflow_db, Password: admin

const DATABASE_URL = process.env.DATABASE_URL || 

  process.env.VITE_DATABASE_URL ||

  'postgresql://postgres:admin@localhost:5432/buildflow_db';



console.log('Connecting to database:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));



// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Cache for per-agency database pools so we can route queries
// to fully isolated databases per agency without recreating pools
const agencyPools = new Map();

function getAgencyPool(databaseName) {
  if (!databaseName || typeof databaseName !== 'string') {
    return pool;
  }

  const normalizedName = databaseName.trim();
  if (!normalizedName) {
    return pool;
  }

  if (agencyPools.has(normalizedName)) {
    return agencyPools.get(normalizedName);
  }

  const mainDbUrl = new URL(DATABASE_URL);
  const dbHost = mainDbUrl.hostname;
  const dbPort = mainDbUrl.port || 5432;
  const dbUser = mainDbUrl.username || 'postgres';
  const dbPassword = mainDbUrl.password || 'admin';

  const agencyDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${normalizedName}`;
  const { Pool: AgencyPool } = require('pg');
  const agencyPool = new AgencyPool({
    connectionString: agencyDbUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  agencyPools.set(normalizedName, agencyPool);
  console.log(`[DB] Created new agency pool for database: ${normalizedName}`);

  return agencyPool;
}

// Test database connection

pool.on('connect', () => {

  console.log('✅ Connected to PostgreSQL database');

});



pool.on('error', (err) => {

  console.error('❌ PostgreSQL connection error:', err);

});



// Health check endpoint

app.get('/health', async (req, res) => {

  try {

    const result = await pool.query('SELECT NOW()');

    res.json({ 

      status: 'ok', 

      database: 'connected',

      timestamp: result.rows[0].now 

    });

  } catch (error) {

    res.status(500).json({ 

      status: 'error', 

      database: 'disconnected',

      error: error.message 

    });

  }

});



// File serving endpoint

app.get('/api/files/:bucket/:path(*)', async (req, res) => {

  try {

    const { bucket, path } = req.params;

    

    // Query file_storage table to get file metadata

    const fileResult = await pool.query(

      `SELECT file_path, mime_type, file_size 

       FROM public.file_storage 

       WHERE bucket_name = $1 AND file_path = $2`,

      [bucket, `${bucket}/${path}`]

    );



    if (fileResult.rows.length === 0) {

      return res.status(404).json({ error: 'File not found' });

    }



    // For now, if file exists in database but not on disk, return 404

    // In production, you would read from disk/S3 here

    res.status(404).json({ 

      error: 'File storage not fully implemented. Using base64 URLs for now.',

      note: 'Avatar images should be stored as base64 data URLs in the database'

    });

  } catch (error) {

    console.error('[API] File serving error:', error);

    res.status(500).json({ error: error.message });

  }

});



// Transaction endpoint for multiple queries
app.post('/api/database/transaction', async (req, res) => {
  try {
    const { queries = [], userId } = req.body;
    const agencyDatabase = req.headers['x-agency-database'];
    const targetPool = getAgencyPool(agencyDatabase);

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: 'Queries array is required' });
    }

    console.log('[API] Executing transaction with', queries.length, 'queries');

    const client = await targetPool.connect();
    try {
      await client.query('BEGIN');

      // Set user context if provided
      if (userId) {
        const escapedUserId = userId.replace(/'/g, "''");
        await client.query(`SET LOCAL app.current_user_id = '${escapedUserId}'`);
      }

      const results = [];

      for (const { sql, params = [] } of queries) {
        const trimmedSql = sql.trim();
        console.log('[API] Transaction query:', trimmedSql.substring(0, 100));
        const result = await client.query(trimmedSql, params);
        results.push({
          rows: result.rows,
          rowCount: result.rowCount,
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        results,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[API] Transaction error:', error);
      res.status(500).json({ 
        error: error.message,
        detail: error.detail,
        code: error.code
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[API] Transaction setup error:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
});


// Login endpoint - search all agency databases for the user and sign them in
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const mainClient = await pool.connect();

    try {
      // Get all active agencies with database names
      const agencies = await mainClient.query(`
        SELECT id, name, domain, database_name 
        FROM public.agencies 
        WHERE is_active = true AND database_name IS NOT NULL
      `);

      if (agencies.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const mainDbUrl = new URL(DATABASE_URL);
      const dbHost = mainDbUrl.hostname;
      const dbPort = mainDbUrl.port || 5432;
      const dbUser = mainDbUrl.username || 'postgres';
      const dbPassword = mainDbUrl.password || 'admin';

      const bcrypt = require('bcrypt');
      let foundUser = null;
      let foundAgency = null;
      let userProfile = null;
      let userRoles = [];

      // Search each agency database for this user
      for (const agency of agencies.rows) {
        try {
          const agencyDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${agency.database_name}`;
          const { Pool: AgencyPool } = require('pg');
          const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 1 });
          const agencyClient = await agencyPool.connect();

          try {
            const userResult = await agencyClient.query(
              'SELECT * FROM public.users WHERE email = $1 AND is_active = true',
              [email]
            );

            if (userResult.rows.length > 0) {
              const user = userResult.rows[0];

              const passwordMatch = await bcrypt.compare(password, user.password_hash);
              if (passwordMatch) {
                foundUser = user;
                foundAgency = agency;

                const profileResult = await agencyClient.query(
                  'SELECT * FROM public.profiles WHERE user_id = $1',
                  [user.id]
                );
                userProfile = profileResult.rows[0] || null;

                const rolesResult = await agencyClient.query(
                  'SELECT * FROM public.user_roles WHERE user_id = $1',
                  [user.id]
                );
                userRoles = rolesResult.rows;

                await agencyClient.query(
                  'UPDATE public.users SET last_sign_in_at = NOW() WHERE id = $1',
                  [user.id]
                );

                break;
              }
            }
          } finally {
            agencyClient.release();
            await agencyPool.end();
          }
        } catch (error) {
          console.warn(`[API] Error searching database ${agency.database_name}:`, error.message);
          continue;
        }
      }

      if (!foundUser || !foundAgency) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const tokenPayload = {
        userId: foundUser.id,
        email: foundUser.email,
        agencyId: foundAgency.id,
        agencyDatabase: foundAgency.database_name,
        exp: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
        iat: Math.floor(Date.now() / 1000),
      };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      const userResponse = {
        id: foundUser.id,
        email: foundUser.email,
        email_confirmed: foundUser.email_confirmed,
        is_active: foundUser.is_active,
        created_at: foundUser.created_at,
        updated_at: foundUser.updated_at,
        last_sign_in_at: foundUser.last_sign_in_at,
        profile: userProfile || undefined,
        roles: userRoles || [],
        agency: {
          id: foundAgency.id,
          name: foundAgency.name,
          domain: foundAgency.domain,
          databaseName: foundAgency.database_name,
        },
      };

      res.json({
        success: true,
        token,
        user: userResponse,
      });
    } finally {
      mainClient.release();
    }
  } catch (error) {
    console.error('[API] Login error:', error);
    res.status(500).json({
      error: error.message || 'Login failed',
    });
  }
});


// Database query endpoint
app.post('/api/database/query', async (req, res) => {
  try {
    const { sql, params = [], userId } = req.body;
    const agencyDatabase = req.headers['x-agency-database'];
    const targetPool = getAgencyPool(agencyDatabase);

    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    console.log('[API] Executing query:', sql.substring(0, 100));

    let result;

    // If userId is provided, set the context in a transaction
    if (userId) {
      const client = await targetPool.connect();
      try {
        await client.query('BEGIN');

        // Set the user context for audit logs
        const escapedUserId = userId.replace(/'/g, "''");
        await client.query(`SET LOCAL app.current_user_id = '${escapedUserId}'`);

        const trimmedSql = sql.trim();
        console.log('[API] Executing query with userId context:', trimmedSql.substring(0, 150));
        console.log('[API] Query params:', params);

        result = await client.query(trimmedSql, params);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('[API] Transaction error:', error);
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Execute query without transaction
      result = await targetPool.query(sql.trim(), params);
    }

    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (error) {
    console.error('[API] Query error:', error);
    res.status(500).json({ 
      error: error.message,
      detail: error.detail,
      code: error.code
    });
  }
});



// --- Helper: per-agency schema creation (simplified) ---

async function createAgencySchema(client) {

  console.log('[SQL] Creating complete agency schema...');



  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);



  await client.query(`

    DO $$ BEGIN

      CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'finance_manager', 'employee', 'super_admin', 'ceo', 'cfo');

    EXCEPTION

      WHEN duplicate_object THEN null;

    END $$;

  `);



  await client.query(`

    CREATE TABLE IF NOT EXISTS public.users (

      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

      email TEXT UNIQUE NOT NULL,

      password_hash TEXT NOT NULL,

      email_confirmed BOOLEAN DEFAULT false,

      is_active BOOLEAN DEFAULT true,

      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      last_sign_in_at TIMESTAMP WITH TIME ZONE,

      raw_user_meta_data JSONB

    );

  `);



  await client.query(`

    CREATE TABLE IF NOT EXISTS public.profiles (

      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

      user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

      full_name TEXT,

      phone TEXT,

      department TEXT,

      position TEXT,

      hire_date DATE,

      avatar_url TEXT,

      is_active BOOLEAN DEFAULT true,

      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

    );

  `);



  await client.query(`

    CREATE TABLE IF NOT EXISTS public.user_roles (

      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

      role public.app_role NOT NULL,

      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      assigned_by UUID REFERENCES public.users(id),

      UNIQUE(user_id, role)

    );

  `);



  await client.query(`

    CREATE TABLE IF NOT EXISTS public.audit_logs (

      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

      table_name TEXT NOT NULL,

      action TEXT NOT NULL,

      user_id UUID REFERENCES public.users(id),

      record_id UUID,

      old_values JSONB,

      new_values JSONB,

      ip_address INET,

      user_agent TEXT,

      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

    );

  `);



  await client.query(`

    CREATE OR REPLACE FUNCTION public.update_updated_at_column()

    RETURNS TRIGGER AS $$

    BEGIN

      NEW.updated_at = NOW();

      RETURN NEW;

    END;

    $$ LANGUAGE plpgsql;

  `);



  await client.query(`

    DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

    CREATE TRIGGER update_users_updated_at

      BEFORE UPDATE ON public.users

      FOR EACH ROW

      EXECUTE FUNCTION public.update_updated_at_column();

  `);



  await client.query(`

    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

    CREATE TRIGGER update_profiles_updated_at

      BEFORE UPDATE ON public.profiles

      FOR EACH ROW

      EXECUTE FUNCTION public.update_updated_at_column();

  `);



  await client.query(`

    CREATE OR REPLACE FUNCTION public.current_user_id()

    RETURNS UUID AS $$

    DECLARE

      user_id_text TEXT;

    BEGIN

      BEGIN

        user_id_text := current_setting('app.current_user_id', true);

      EXCEPTION WHEN OTHERS THEN

        RETURN NULL;

      END;



      IF user_id_text IS NULL OR user_id_text = '' THEN

        RETURN NULL;

      END IF;



      BEGIN

        RETURN user_id_text::UUID;

      EXCEPTION WHEN OTHERS THEN

        RETURN NULL;

      END;

    END;

    $$ LANGUAGE plpgsql STABLE;

  `);



  await client.query(`

    CREATE TABLE IF NOT EXISTS public.departments (

      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

      name TEXT UNIQUE NOT NULL,

      description TEXT,

      is_active BOOLEAN DEFAULT true,

      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

    );

  `);



  await client.query(`

    CREATE TABLE IF NOT EXISTS public.agency_settings (

      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

      agency_name TEXT,

      logo_url TEXT,

      setup_complete BOOLEAN DEFAULT false,

      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

    );

  `);



  await client.query(`

    INSERT INTO public.agency_settings (id, agency_name, setup_complete)

    VALUES (gen_random_uuid(), 'My Agency', false)

    ON CONFLICT DO NOTHING

  `);



  await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)`);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id)`);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id)`);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id)`);

  await client.query(`CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name)`);



  console.log('[SQL] Agency schema created successfully');

}



// Domain availability check endpoint

app.get('/api/agencies/check-domain', async (req, res) => {

  const mainClient = await pool.connect();

  try {

    const { domain } = req.query;



    if (!domain || typeof domain !== 'string') {

      return res.json({ available: false, error: 'Domain is required' });

    }



    const result = await mainClient.query(

      'SELECT id FROM public.agencies WHERE domain = $1',

      [domain.toLowerCase().trim()]

    );



    const available = result.rows.length === 0;



    res.json({

      available,

      domain: domain.toLowerCase().trim(),

    });

  } catch (error) {

    console.error('[API] Domain check error:', error);

    res.status(500).json({

      available: false,

      error: 'Error checking domain availability',

    });

  } finally {

    mainClient.release();

  }

});


// Check agency setup status (per-agency database)

app.get('/api/agencies/check-setup', async (req, res) => {

  try {

    const agencyDatabase = req.headers['x-agency-database'] ||

      req.query.database ||

      null;



    if (!agencyDatabase) {

      // No database specified, assume setup incomplete

      return res.json({ setupComplete: false });

    }



    const mainDbUrl = new URL(DATABASE_URL);

    const dbHost = mainDbUrl.hostname;

    const dbPort = mainDbUrl.port || 5432;

    const dbUser = mainDbUrl.username || 'postgres';

    const dbPassword = mainDbUrl.password || 'admin';



    const agencyDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${agencyDatabase}`;

    const { Pool: AgencyPool } = require('pg');

    const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 1 });

    const agencyClient = await agencyPool.connect();



    try {

      const setupCheck = await agencyClient.query(`

        SELECT setup_complete FROM public.agency_settings LIMIT 1

      `);



      const setupComplete = setupCheck.rows[0]?.setup_complete || false;



      res.json({ setupComplete });

    } finally {

      agencyClient.release();

      await agencyPool.end();

    }

  } catch (error) {

    console.error('[API] Check setup error:', error);

    res.json({ setupComplete: false });

  }

});


// Complete agency setup (called from in-app Agency Setup page)

app.post('/api/agencies/complete-setup', async (req, res) => {

  try {

    const agencyDatabase = req.headers['x-agency-database'] ||

      req.body.database;



    if (!agencyDatabase) {

      return res.status(400).json({ error: 'Agency database not specified' });

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
    } = req.body;



    const mainDbUrl = new URL(DATABASE_URL);

    const dbHost = mainDbUrl.hostname;

    const dbPort = mainDbUrl.port || 5432;

    const dbUser = mainDbUrl.username || 'postgres';

    const dbPassword = mainDbUrl.password || 'admin';



    const agencyDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${agencyDatabase}`;

    const { Pool: AgencyPool } = require('pg');

    const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 10 });

    const agencyClient = await agencyPool.connect();



    try {

      await agencyClient.query('BEGIN');



      // Ensure setup_complete column exists

      try {

        await agencyClient.query(`

          ALTER TABLE public.agency_settings 

          ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT false

        `);

      } catch (e) {

        // ignore

      }



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



      // Ensure all extended columns exist

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



      // Update agency_settings with provided data

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

          notifications_email = COALESCE($41, notifications_email),

          notifications_sms = COALESCE($42, notifications_sms),

          notifications_push = COALESCE($43, notifications_push),

          notifications_weekly_report = COALESCE($44, notifications_weekly_report),

          notifications_monthly_report = COALESCE($45, notifications_monthly_report),

          features_enable_payroll = COALESCE($46, features_enable_payroll),

          features_enable_projects = COALESCE($47, features_enable_projects),

          features_enable_crm = COALESCE($48, features_enable_crm),

          features_enable_inventory = COALESCE($49, features_enable_inventory),

          features_enable_reports = COALESCE($50, features_enable_reports),

          setup_complete = true,

          updated_at = NOW()

        WHERE id = (SELECT id FROM public.agency_settings LIMIT 1)

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
        notifications?.email,
        notifications?.sms,
        notifications?.push,
        notifications?.weeklyReport,
        notifications?.monthlyReport,
        features?.enablePayroll,
        features?.enableProjects,
        features?.enableCrm,
        features?.enableInventory,
        features?.enableReports,
      ]);



      // Create departments if provided

      if (departments && departments.length > 0) {

        for (const dept of departments) {

          if (dept.name) {

            await agencyClient.query(`

              INSERT INTO public.departments (id, name, description, is_active, created_at, updated_at)

              VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())

              ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description

            `, [dept.name, dept.description || '']);

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



              await agencyClient.query(`

                INSERT INTO public.profiles (id, user_id, full_name, phone, created_at, updated_at)

                VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())

              `, [userId, member.name, member.phone || null]);



              const role = member.role || 'employee';

              await agencyClient.query(`

                INSERT INTO public.user_roles (id, user_id, role, created_at, updated_at)

                VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())

              `, [userId, role]);



              if (member.department && member.department !== 'none') {

                const deptResult = await agencyClient.query(`

                  SELECT id FROM public.departments WHERE name = $1 LIMIT 1

                `, [member.department]);



                if (deptResult.rows.length > 0) {

                  const deptId = deptResult.rows[0].id;

                  await agencyClient.query(`

                    INSERT INTO public.team_assignments (

                      id, user_id, department_id, position_title, role_in_department, 

                      start_date, is_active, created_at, updated_at

                    )

                    VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), true, NOW(), NOW())

                  `, [userId, deptId, member.title || '', role]);

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



      res.json({
        success: true,
        message: 'Agency setup completed successfully',
      });

    } catch (error) {

      await agencyClient.query('ROLLBACK');

      throw error;

    } finally {

      agencyClient.release();

      await agencyPool.end();

    }

  } catch (error) {

    console.error('[API] Complete setup error:', error);

    res.status(500).json({
      error: error.message || 'Failed to complete setup',
    });

  }

});


// Agency creation endpoint - Creates separate database for each agency

app.post('/api/agencies/create', async (req, res) => {

  const mainClient = await pool.connect();

  let agencyDbClient = null;

  let postgresClient = null;

  let postgresPool = null;

  let agencyPool = null;



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

    } = req.body;



    if (!agencyName || !domain || !adminName || !adminEmail || !adminPassword || !subscriptionPlan) {

      return res.status(400).json({

        error: 'Missing required fields',

        required: ['agencyName', 'domain', 'adminName', 'adminEmail', 'adminPassword', 'subscriptionPlan'],

      });

    }



    const crypto = require('crypto');

    const agencyId = crypto.randomUUID();

    const adminUserId = crypto.randomUUID();

    const profileId = crypto.randomUUID();

    const userRoleId = crypto.randomUUID();

    const agencySettingsId = crypto.randomUUID();



    const bcrypt = require('bcrypt');

    const passwordHash = await bcrypt.hash(adminPassword, 10);



    const planLimits = {

      starter: 5,

      professional: 25,

      enterprise: 1000,

    };

    const maxUsers = planLimits[subscriptionPlan] || 25;



    const mainDbUrl = new URL(DATABASE_URL);

    const dbHost = mainDbUrl.hostname;

    const dbPort = mainDbUrl.port || 5432;

    const dbUser = mainDbUrl.username || 'postgres';

    const dbPassword = mainDbUrl.password || 'admin';



    const dbName = `agency_${domain.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${agencyId.substring(0, 8)}`;



    postgresPool = new Pool({

      host: dbHost,

      port: dbPort,

      user: dbUser,

      password: dbPassword,

      database: 'postgres',

    });

    postgresClient = await postgresPool.connect();



    try {

      await postgresClient.query(`CREATE DATABASE ${dbName}`);



      const agencyDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

      agencyPool = new Pool({ connectionString: agencyDbUrl, max: 10 });

      agencyDbClient = await agencyPool.connect();



      await createAgencySchema(agencyDbClient);



      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(adminUserId)) {

        throw new Error('Admin user ID is not a valid UUID format');

      }



      const escapedUserId = adminUserId.replace(/'/g, "''");

      await agencyDbClient.query(`SET LOCAL app.current_user_id = '${escapedUserId}'`);



      await agencyDbClient.query(

        `INSERT INTO public.users (

          id, email, password_hash, email_confirmed, is_active, created_at, updated_at

        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,

        [adminUserId, adminEmail, passwordHash, true, true]

      );



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



      await agencyDbClient.query(

        `DELETE FROM public.user_roles WHERE user_id = $1 AND role = 'employee'`,

        [adminUserId]

      );

      await agencyDbClient.query(

        `INSERT INTO public.user_roles (

          id, user_id, role, assigned_at

        ) VALUES ($1, $2, $3, NOW())

        ON CONFLICT (user_id, role) DO NOTHING`,

        [userRoleId, adminUserId, 'super_admin']

      );



      await mainClient.query('BEGIN');

      try {

        await mainClient.query(`

          ALTER TABLE public.agencies 

          ADD COLUMN IF NOT EXISTS database_name TEXT UNIQUE

        `);



        await mainClient.query(`

          ALTER TABLE public.agencies

          ADD COLUMN IF NOT EXISTS owner_user_id UUID

        `);



        await mainClient.query(
          `INSERT INTO public.agencies (
            id,
            name,
            domain,
            database_name,
            owner_user_id,
            is_active,
            subscription_plan,
            max_users
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            database_name = EXCLUDED.database_name,
            owner_user_id = COALESCE(public.agencies.owner_user_id, EXCLUDED.owner_user_id)`,
          [agencyId, agencyName, domain, dbName, adminUserId, true, subscriptionPlan, maxUsers]
        );



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



      res.json({

        success: true,

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

        message: 'Agency created successfully with separate database',

      });



      if (agencyDbClient) {

        try {

          agencyDbClient.release();

        } catch {}

        agencyDbClient = null;

      }

      if (agencyPool) {

        try {

          agencyPool.end();

        } catch {}

        agencyPool = null;

      }

      if (postgresClient) {

        try {

          postgresClient.release();

        } catch {}

        postgresClient = null;

      }

      if (postgresPool) {

        try {

          postgresPool.end();

        } catch {}

        postgresPool = null;

      }

    } catch (error) {

      if (postgresClient) {

        try {

          await postgresClient.query(`DROP DATABASE IF EXISTS ${dbName}`);

          console.log(`[API] Rolled back database: ${dbName}`);

        } catch (cleanupError) {

          console.error('[API] Failed to cleanup database:', cleanupError.message);

        }

      }

      throw error;

    } finally {

      if (agencyDbClient) {

        try {

          agencyDbClient.release();

        } catch {}

      }

      if (agencyPool) {

        try {

          agencyPool.end();

        } catch {}

      }

      if (postgresClient) {

        try {

          postgresClient.release();

        } catch {}

      }

      if (postgresPool) {

        try {

          postgresPool.end();

        } catch {}

      }

    }

  } catch (error) {

    console.error('[API] Agency creation failed:', error);

    if (!res.headersSent) {

      res.status(500).json({

        error: error.message || 'Failed to create agency',

        detail: error.detail,

        code: error.code,

      });

    }

  } finally {

    if (mainClient) {

      try {

        mainClient.release();

      } catch {}

    }

  }

});



// Start server

app.listen(PORT, () => {

  console.log(`🚀 Server running on http://localhost:${PORT}`);

  console.log(`📊 Database: ${DATABASE_URL.split('@')[1]}`);

});


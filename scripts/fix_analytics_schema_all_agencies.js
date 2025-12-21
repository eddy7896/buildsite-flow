/**
 * Fix Analytics Schema for All Agency Databases
 * 
 * This script applies the missing columns and tables to all existing agency databases:
 * - Adds agency_id to profiles table
 * - Adds agency_id and employee_id to leave_requests table
 * - Adds agency_id to invoices table
 * - Ensures reimbursement_requests has agency_id (should already exist)
 * - Ensures projects table has agency_id
 * - Creates missing tables: invoices, reimbursement_requests, leave_requests, projects, clients
 */

const { Pool } = require('pg');
const { parseDatabaseUrl } = require('../server/utils/poolManager');

async function fixAgencyDatabase(dbName) {
  const { host, port, user, password } = parseDatabaseUrl();
  const connectionString = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    console.log(`\n[${dbName}] Starting schema fixes...`);

    // Fix profiles table - add agency_id
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'agency_id'
        ) THEN
          ALTER TABLE public.profiles ADD COLUMN agency_id UUID;
          CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_id);
          RAISE NOTICE 'Added agency_id to profiles';
        ELSE
          RAISE NOTICE 'profiles.agency_id already exists';
        END IF;
      END $$;
    `);

    // Fix leave_requests table - add employee_id and agency_id
    await client.query(`
      DO $$ 
      BEGIN
        -- Add employee_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'leave_requests' 
          AND column_name = 'employee_id'
        ) THEN
          ALTER TABLE public.leave_requests ADD COLUMN employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
          UPDATE public.leave_requests SET employee_id = user_id WHERE employee_id IS NULL;
          CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
          RAISE NOTICE 'Added employee_id to leave_requests';
        ELSE
          RAISE NOTICE 'leave_requests.employee_id already exists';
        END IF;

        -- Add agency_id if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'leave_requests' 
          AND column_name = 'agency_id'
        ) THEN
          ALTER TABLE public.leave_requests ADD COLUMN agency_id UUID;
          CREATE INDEX IF NOT EXISTS idx_leave_requests_agency_id ON public.leave_requests(agency_id);
          CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
          RAISE NOTICE 'Added agency_id to leave_requests';
        ELSE
          RAISE NOTICE 'leave_requests.agency_id already exists';
        END IF;
      END $$;
    `);

    // Fix invoices table - add agency_id
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'invoices' 
          AND column_name = 'agency_id'
        ) THEN
          ALTER TABLE public.invoices ADD COLUMN agency_id UUID;
          CREATE INDEX IF NOT EXISTS idx_invoices_agency_id ON public.invoices(agency_id);
          CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);
          RAISE NOTICE 'Added agency_id to invoices';
        ELSE
          RAISE NOTICE 'invoices.agency_id already exists';
        END IF;
      END $$;
    `);

    // Ensure reimbursement_requests has agency_id (should already exist, but ensure it)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'reimbursement_requests' 
          AND column_name = 'agency_id'
        ) THEN
          ALTER TABLE public.reimbursement_requests ADD COLUMN agency_id UUID;
          CREATE INDEX IF NOT EXISTS idx_reimbursement_requests_agency_id ON public.reimbursement_requests(agency_id);
          CREATE INDEX IF NOT EXISTS idx_reimbursement_requests_created_at ON public.reimbursement_requests(created_at);
          RAISE NOTICE 'Added agency_id to reimbursement_requests';
        ELSE
          RAISE NOTICE 'reimbursement_requests.agency_id already exists';
        END IF;
      END $$;
    `);

    // Ensure projects table has agency_id
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'projects' 
          AND column_name = 'agency_id'
        ) THEN
          ALTER TABLE public.projects ADD COLUMN agency_id UUID;
          CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON public.projects(agency_id);
          CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
          RAISE NOTICE 'Added agency_id to projects';
        ELSE
          RAISE NOTICE 'projects.agency_id already exists';
        END IF;
      END $$;
    `);

    // Create missing tables if they don't exist
    await client.query(`
      -- Create invoices table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID,
        invoice_number TEXT UNIQUE,
        client_id UUID,
        total_amount NUMERIC(12, 2) DEFAULT 0,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
        due_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      -- Create reimbursement_requests table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.reimbursement_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID,
        employee_id UUID,
        amount NUMERIC(12, 2) NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'paid')),
        description TEXT,
        receipt_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      -- Create leave_requests table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.leave_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID,
        user_id UUID,
        employee_id UUID,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        leave_type TEXT DEFAULT 'annual' CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      -- Create projects table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'in_progress', 'on_hold', 'completed', 'cancelled')),
        client_id UUID,
        start_date DATE,
        end_date DATE,
        budget NUMERIC(12, 2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      -- Create clients table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        company_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create all indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_agency_id ON public.invoices(agency_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);
      CREATE INDEX IF NOT EXISTS idx_reimbursement_requests_agency_id ON public.reimbursement_requests(agency_id);
      CREATE INDEX IF NOT EXISTS idx_reimbursement_requests_created_at ON public.reimbursement_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_agency_id ON public.leave_requests(agency_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
      CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON public.projects(agency_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
      CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients(agency_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_id);
    `);

    console.log(`[${dbName}] ✅ Schema fixes completed successfully`);
    return true;
  } catch (error) {
    console.error(`[${dbName}] ❌ Error fixing schema:`, error.message);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const { host, port, user, password } = parseDatabaseUrl();
  const mainConnectionString = `postgresql://${user}:${password}@${host}:${port}/buildflow_db`;
  const mainPool = new Pool({ connectionString: mainConnectionString, max: 1 });
  const mainClient = await mainPool.connect();

  try {
    console.log('🔍 Finding all agency databases...');
    
    // Get all agency databases
    const result = await mainClient.query(`
      SELECT database_name 
      FROM public.agencies 
      WHERE database_name IS NOT NULL 
      ORDER BY database_name
    `);

    const agencyDatabases = result.rows.map(row => row.database_name);
    console.log(`📊 Found ${agencyDatabases.length} agency databases`);

    if (agencyDatabases.length === 0) {
      console.log('⚠️  No agency databases found. Exiting.');
      return;
    }

    console.log('\n🚀 Starting schema fixes for all agency databases...\n');

    let successCount = 0;
    let failCount = 0;

    for (const dbName of agencyDatabases) {
      const success = await fixAgencyDatabase(dbName);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`✅ Successfully fixed: ${successCount} databases`);
    console.log(`❌ Failed: ${failCount} databases`);
    console.log(`📈 Total: ${agencyDatabases.length} databases`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    mainClient.release();
    await mainPool.end();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixAgencyDatabase, main };


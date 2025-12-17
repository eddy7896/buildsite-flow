/**
 * Database Service
 * Handles database queries, transactions, and schema repair
 */

const { getAgencyPool } = require('../config/database');
const { ensureAgencySchema } = require('../utils/schemaValidator');
const { createAgencySchema } = require('../utils/schemaCreator');
const { parseDatabaseUrl } = require('../utils/poolManager');

/**
 * Execute a database query with optional user context
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} agencyDatabase - Agency database name
 * @param {string} userId - Optional user ID for audit context
 * @returns {Promise<Object>} Query result
 */
async function executeQuery(sql, params, agencyDatabase, userId) {
  // Auto-repair schema if needed
  if (agencyDatabase) {
    await ensureAgencySchema(agencyDatabase);
  }

  const targetPool = getAgencyPool(agencyDatabase);
  const trimmedSql = sql.trim();

  console.log('[API] Executing query:', trimmedSql.substring(0, 100));

  // If userId is provided, set the context in a transaction
  if (userId) {
    const client = await targetPool.connect();
    try {
      await client.query('BEGIN');

      // Set the user context for audit logs
      const escapedUserId = userId.replace(/'/g, "''");
      await client.query(`SET LOCAL app.current_user_id = '${escapedUserId}'`);

      console.log('[API] Executing query with userId context:', trimmedSql.substring(0, 150));
      console.log('[API] Query params:', params);

      const result = await client.query(trimmedSql, params);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[API] Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } else {
    // Execute query without transaction
    return await targetPool.query(trimmedSql, params);
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {Array} queries - Array of {sql, params} objects
 * @param {string} agencyDatabase - Agency database name
 * @param {string} userId - Optional user ID for audit context
 * @returns {Promise<Array>} Array of query results
 */
async function executeTransaction(queries, agencyDatabase, userId) {
  const targetPool = getAgencyPool(agencyDatabase);

  if (!Array.isArray(queries) || queries.length === 0) {
    throw new Error('Queries array is required');
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
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[API] Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Repair missing column in database
 * @param {string} agencyDatabase - Agency database name
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 */
async function repairMissingColumn(agencyDatabase, tableName, columnName) {
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const { Pool } = require('pg');
  const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();

  try {
    // Add the missing column based on table and column name
    if (tableName === 'profiles' && columnName === 'agency_id') {
      await agencyClient.query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_id UUID');
      await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_id)');
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'employee_details' && columnName === 'agency_id') {
      await agencyClient.query('ALTER TABLE public.employee_details ADD COLUMN IF NOT EXISTS agency_id UUID');
      await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_employee_details_agency_id ON public.employee_details(agency_id)');
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'employee_salary_details' && columnName === 'agency_id') {
      await agencyClient.query('ALTER TABLE public.employee_salary_details ADD COLUMN IF NOT EXISTS agency_id UUID');
      await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_employee_salary_details_agency_id ON public.employee_salary_details(agency_id)');
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'employee_salary_details' && (columnName === 'salary' || columnName === 'salary_frequency')) {
      if (columnName === 'salary') {
        await agencyClient.query('ALTER TABLE public.employee_salary_details ADD COLUMN IF NOT EXISTS salary NUMERIC(15, 2)');
        await agencyClient.query('UPDATE public.employee_salary_details SET salary = base_salary WHERE salary IS NULL AND base_salary IS NOT NULL');
      } else if (columnName === 'salary_frequency') {
        await agencyClient.query('ALTER TABLE public.employee_salary_details ADD COLUMN IF NOT EXISTS salary_frequency TEXT DEFAULT \'monthly\'');
        await agencyClient.query('UPDATE public.employee_salary_details SET salary_frequency = pay_frequency WHERE salary_frequency IS NULL AND pay_frequency IS NOT NULL');
      }
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'user_roles' && columnName === 'agency_id') {
      await agencyClient.query('ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS agency_id UUID');
      await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_user_roles_agency_id ON public.user_roles(agency_id)');
      // Update UNIQUE constraint
      await agencyClient.query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key') THEN
            ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_role_key;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_agency_id_key') THEN
            ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_agency_id_key UNIQUE(user_id, role, agency_id);
          END IF;
        END $$;
      `);
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'team_assignments' && columnName === 'agency_id') {
      await agencyClient.query('ALTER TABLE public.team_assignments ADD COLUMN IF NOT EXISTS agency_id UUID');
      await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_team_assignments_agency_id ON public.team_assignments(agency_id)');
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'jobs' && columnName === 'agency_id') {
      await agencyClient.query('ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS agency_id UUID');
      await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_jobs_agency_id ON public.jobs(agency_id)');
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'chart_of_accounts' && columnName === 'agency_id') {
      await agencyClient.query('ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS agency_id UUID');
      await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_agency_id ON public.chart_of_accounts(agency_id)');
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'journal_entries' && columnName === 'agency_id') {
      await agencyClient.query('ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS agency_id UUID');
      await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_journal_entries_agency_id ON public.journal_entries(agency_id)');
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'journal_entries' && (columnName === 'total_debit' || columnName === 'total_credit')) {
      if (columnName === 'total_debit') {
        await agencyClient.query('ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS total_debit NUMERIC(15, 2) DEFAULT 0');
      } else {
        await agencyClient.query('ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS total_credit NUMERIC(15, 2) DEFAULT 0');
      }
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
    } else if (tableName === 'journal_entry_lines' && columnName === 'line_number') {
      await agencyClient.query('ALTER TABLE public.journal_entry_lines ADD COLUMN IF NOT EXISTS line_number INTEGER');
      // Backfill line_number for existing rows where it is NULL or zero
      await agencyClient.query(`
        WITH numbered AS (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY journal_entry_id 
                   ORDER BY created_at, id
                 ) AS rn
          FROM public.journal_entry_lines
        )
        UPDATE public.journal_entry_lines jel
        SET line_number = numbered.rn
        FROM numbered
        WHERE jel.id = numbered.id
          AND (jel.line_number IS NULL OR jel.line_number = 0)
      `);
      await agencyClient.query(`
        CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal_entry_id_line_number 
        ON public.journal_entry_lines(journal_entry_id, line_number)
      `);
      console.log(`[API] ✅ Added ${columnName} column to ${tableName} table and backfilled values`);
    } else if (tableName === 'departments') {
      console.log(`[API] 🔧 Adding ${columnName} to departments table...`);
      try {
        if (columnName === 'manager_id') {
          await agencyClient.query('ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON public.departments(manager_id)');
        } else if (columnName === 'parent_department_id') {
          await agencyClient.query('ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_departments_parent_department_id ON public.departments(parent_department_id)');
        } else if (columnName === 'budget') {
          await agencyClient.query('ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS budget NUMERIC(15, 2) DEFAULT 0');
        } else if (columnName === 'agency_id') {
          // In agency-specific databases, agency_id is nullable and doesn't need foreign key
          await agencyClient.query('ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS agency_id UUID');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_departments_agency_id ON public.departments(agency_id)');
        }
        console.log(`[API] ✅ Successfully added ${columnName} column to departments table`);
      } catch (addError) {
        if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
          console.log(`[API] ℹ️ Column ${columnName} already exists in departments`);
        } else {
          console.error(`[API] ❌ Failed to add ${columnName}:`, addError.message);
          throw addError;
        }
      }
    } else if (tableName === 'clients') {
      console.log(`[API] 🔧 Adding ${columnName} to clients table...`);
      try {
        if (columnName === 'agency_id') {
          await agencyClient.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS agency_id UUID');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients(agency_id)');
        } else if (columnName === 'is_active') {
          await agencyClient.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active)');
        } else if (columnName === 'billing_city' || columnName === 'billing_state' || 
                   columnName === 'billing_postal_code' || columnName === 'billing_country') {
          // Add all billing columns at once to avoid multiple repair cycles
          console.log(`[API] Adding all billing columns to clients table...`);
          await agencyClient.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_city TEXT');
          await agencyClient.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_state TEXT');
          await agencyClient.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_postal_code TEXT');
          await agencyClient.query('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_country TEXT');
        } else {
          // Fallback: run full schema repair to pick up any new columns
          console.log(`[API] Running full schema repair for clients.${columnName}...`);
          await createAgencySchema(agencyClient);
        }
        console.log(`[API] ✅ Successfully added ${columnName} column to clients table`);
      } catch (addError) {
        if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
          console.log(`[API] ℹ️ Column ${columnName} already exists in clients`);
        } else {
          console.error(`[API] ❌ Failed to add ${columnName}:`, addError.message);
          throw addError;
        }
      }
    } else if (tableName === 'agency_settings') {
      console.log(`[API] 🔧 Adding ${columnName} to agency_settings table...`);
      try {
        if (columnName === 'domain') {
          await agencyClient.query('ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS domain TEXT');
        } else if (columnName === 'default_currency') {
          await agencyClient.query('ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS default_currency TEXT');
        } else if (columnName === 'primary_color') {
          await agencyClient.query('ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS primary_color TEXT');
        } else if (columnName === 'secondary_color') {
          await agencyClient.query('ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT');
        } else if (columnName === 'working_hours_start') {
          await agencyClient.query('ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS working_hours_start TEXT');
        } else if (columnName === 'working_hours_end') {
          await agencyClient.query('ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS working_hours_end TEXT');
        } else if (columnName === 'working_days') {
          await agencyClient.query('ALTER TABLE public.agency_settings ADD COLUMN IF NOT EXISTS working_days TEXT');
        } else {
          // Fallback: run full schema repair to pick up any new columns
          console.log(`[API] Running full schema repair for agency_settings.${columnName}...`);
          await createAgencySchema(agencyClient);
        }
        console.log(`[API] ✅ Successfully added ${columnName} column to agency_settings table`);
      } catch (addError) {
        if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
          console.log(`[API] ℹ️ Column ${columnName} already exists in agency_settings`);
        } else {
          console.error(`[API] ❌ Failed to add ${columnName}:`, addError.message);
          throw addError;
        }
      }
    } else if (tableName === 'leads') {
      // Handle leads table columns
      console.log(`[API] Adding ${columnName} column to leads table...`);
      try {
        // First, make name column nullable if it has NOT NULL constraint
        try {
          await agencyClient.query('ALTER TABLE public.leads ALTER COLUMN name DROP NOT NULL');
          console.log(`[API] ✅ Made name column nullable in leads table`);
        } catch (nameError) {
          // Ignore if column doesn't exist or doesn't have NOT NULL constraint
          if (!nameError.message.includes('does not exist') && !nameError.message.includes('constraint')) {
            console.warn(`[API] Warning: Could not make name nullable:`, nameError.message);
          }
        }

        if (columnName === 'contact_name') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_name TEXT');
        } else if (columnName === 'due_date') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS due_date DATE');
        } else if (columnName === 'follow_up_date') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS follow_up_date DATE');
        } else if (columnName === 'priority') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT \'medium\'');
        } else if (columnName === 'estimated_value') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(15, 2)');
        } else if (columnName === 'notes') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT');
        } else if (columnName === 'website') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website TEXT');
        } else if (columnName === 'job_title') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS job_title TEXT');
        } else if (columnName === 'industry') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry TEXT');
        } else if (columnName === 'location') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS location TEXT');
        } else if (columnName === 'lead_source_id') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_source_id UUID REFERENCES public.lead_sources(id)');
        } else if (columnName === 'agency_id') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS agency_id UUID');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_leads_agency_id ON public.leads(agency_id)');
        } else if (columnName === 'tags') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags TEXT[]');
        } else if (columnName === 'custom_fields') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS custom_fields JSONB');
        } else if (columnName === 'assigned_team') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_team UUID');
        } else if (columnName === 'converted_to_client_id') {
          await agencyClient.query('ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_to_client_id UUID REFERENCES public.clients(id)');
        } else {
          // For any other leads column, run full schema repair
          console.log(`[API] Running full schema repair for ${tableName}.${columnName}...`);
          await createAgencySchema(agencyClient);
        }
        console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
      } catch (addError) {
        if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
          console.log(`[API] ℹ️ Column ${columnName} already exists in ${tableName}`);
        } else {
          console.error(`[API] ❌ Failed to add ${columnName}:`, addError.message);
          throw addError;
        }
      }
    } else if (tableName === 'crm_activities') {
      // Handle crm_activities table columns
      console.log(`[API] Adding ${columnName} column to crm_activities table...`);
      try {
        if (columnName === 'due_date') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE');
        } else if (columnName === 'status') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'pending\'');
        } else if (columnName === 'client_id') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL');
        } else if (columnName === 'completed_date') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP WITH TIME ZONE');
        } else if (columnName === 'duration') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS duration INTEGER');
        } else if (columnName === 'outcome') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS outcome TEXT');
        } else if (columnName === 'location') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS location TEXT');
        } else if (columnName === 'agenda') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS agenda TEXT');
        } else if (columnName === 'attendees') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS attendees TEXT[]');
        } else if (columnName === 'attachments') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS attachments JSONB');
        } else if (columnName === 'agency_id') {
          await agencyClient.query('ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS agency_id UUID');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_crm_activities_agency_id ON public.crm_activities(agency_id)');
        } else {
          // For any other crm_activities column, run full schema repair
          console.log(`[API] Running full schema repair for ${tableName}.${columnName}...`);
          await createAgencySchema(agencyClient);
        }
        console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
      } catch (addError) {
        if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
          console.log(`[API] ℹ️ Column ${columnName} already exists in ${tableName}`);
        } else {
          console.error(`[API] ❌ Failed to add ${columnName}:`, addError.message);
          throw addError;
        }
      }
    } else if (tableName === 'lead_sources') {
      // Handle lead_sources table columns
      if (columnName === 'agency_id') {
        console.log(`[API] Adding ${columnName} column to lead_sources table...`);
        try {
          await agencyClient.query('ALTER TABLE public.lead_sources ADD COLUMN IF NOT EXISTS agency_id UUID');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_lead_sources_agency_id ON public.lead_sources(agency_id)');
          console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
        } catch (addError) {
          if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
            console.log(`[API] ℹ️ Column ${columnName} already exists in ${tableName}`);
          } else {
            console.error(`[API] ❌ Failed to add ${columnName}:`, addError.message);
            throw addError;
          }
        }
      } else {
        // For any other lead_sources column, run full schema repair
        console.log(`[API] Running full schema repair for ${tableName}.${columnName}...`);
        await createAgencySchema(agencyClient);
      }
    } else if (tableName === 'sales_pipeline') {
      // Handle sales_pipeline table columns
      if (columnName === 'agency_id') {
        console.log(`[API] Adding ${columnName} column to sales_pipeline table...`);
        try {
          await agencyClient.query('ALTER TABLE public.sales_pipeline ADD COLUMN IF NOT EXISTS agency_id UUID');
          await agencyClient.query('CREATE INDEX IF NOT EXISTS idx_sales_pipeline_agency_id ON public.sales_pipeline(agency_id)');
          console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
        } catch (addError) {
          if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
            console.log(`[API] ℹ️ Column ${columnName} already exists in ${tableName}`);
          } else {
            console.error(`[API] ❌ Failed to add ${columnName}:`, addError.message);
            throw addError;
          }
        }
      } else if (columnName === 'color') {
        console.log(`[API] Adding ${columnName} column to sales_pipeline table...`);
        try {
          await agencyClient.query('ALTER TABLE public.sales_pipeline ADD COLUMN IF NOT EXISTS color TEXT');
          console.log(`[API] ✅ Added ${columnName} column to ${tableName} table`);
        } catch (addError) {
          if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
            console.log(`[API] ℹ️ Column ${columnName} already exists in ${tableName}`);
          } else {
            console.error(`[API] ❌ Failed to add ${columnName}:`, addError.message);
            throw addError;
          }
        }
      } else {
        // For any other sales_pipeline column, run full schema repair
        console.log(`[API] Running full schema repair for ${tableName}.${columnName}...`);
        await createAgencySchema(agencyClient);
      }
    } else {
      // For any other missing column, run full schema repair
      console.log(`[API] Running full schema repair for ${tableName}.${columnName}...`);
      await createAgencySchema(agencyClient);
    }

    // Verify the column was added
    const verifyResult = await agencyClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    `, [tableName, columnName]);

    if (verifyResult.rows.length === 0) {
      throw new Error(`Column ${columnName} was not added to ${tableName} table`);
    }

    console.log(`[API] ✅ Verified ${columnName} column exists in ${tableName}`);

    // Clear cache to force re-check
    if (global.schemaCheckCache) {
      delete global.schemaCheckCache[`schema_checked_${agencyDatabase}`];
    }
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
}

module.exports = {
  executeQuery,
  executeTransaction,
  repairMissingColumn,
};

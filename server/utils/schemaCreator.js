/**
 * Schema Creator - Main Orchestrator
 * 
 * Creates complete agency database schema with 53 tables by orchestrating
 * modular schema creation functions.
 * 
 * This refactored version splits the monolithic schema creation into
 * domain-specific modules for better maintainability and safety.
 */

const { ensureSharedFunctions, ensureUpdatedAtTriggers } = require('./schema/sharedFunctions');
const { ensureAuthSchema } = require('./schema/authSchema');
const { ensureAgenciesSchema } = require('./schema/agenciesSchema');
const { ensureDepartmentsSchema } = require('./schema/departmentsSchema');
const { ensureHrSchema } = require('./schema/hrSchema');
const { ensureProjectsTasksSchema } = require('./schema/projectsTasksSchema');
const { ensureClientsFinancialSchema } = require('./schema/clientsFinancialSchema');
const { ensureCrmSchema } = require('./schema/crmSchema');
const { ensureGstSchema } = require('./schema/gstSchema');
const { ensureReimbursementSchema } = require('./schema/reimbursementSchema');
const { ensureMiscSchema } = require('./schema/miscSchema');
const { ensureIndexesAndFixes } = require('./schema/indexesAndFixes');

/**
 * Create complete agency database schema
 * 
 * This function orchestrates the creation of all tables, indexes, functions,
 * triggers, and views in the correct dependency order.
 * 
 * Execution order:
 * 1. Shared functions, types, and extensions (foundational)
 * 2. Authentication and authorization (users, profiles, roles)
 * 3. Agencies (agency_settings)
 * 4. Departments (depends on profiles)
 * 5. HR (depends on users)
 * 6. Projects and Tasks (depends on clients)
 * 7. Clients and Financial (depends on users)
 * 8. CRM (depends on users)
 * 9. GST (depends on invoices)
 * 10. Reimbursement (depends on users)
 * 11. Miscellaneous (depends on users)
 * 12. Indexes and backward compatibility fixes
 * 13. Updated_at triggers for all tables
 * 
 * @param {Object} client - PostgreSQL client connection
 */
async function createAgencySchema(client) {
  console.log('[SQL] Creating complete agency schema...');

  try {
    // Step 1: Ensure shared functions, types, and extensions
    console.log('[SQL] Step 1/13: Ensuring shared functions, types, and extensions...');
    await ensureSharedFunctions(client);
    
    // Verify critical functions exist
    const functionCheck = await client.query(`
      SELECT proname FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND proname IN ('update_updated_at_column', 'log_audit_change', 'current_user_id')
    `);
    console.log('[SQL] ✅ Shared functions verified:', functionCheck.rows.map(r => r.proname).join(', '));

    // Step 2: Authentication and authorization (foundational - must come first)
    console.log('[SQL] Step 2/13: Ensuring authentication schema...');
    await ensureAuthSchema(client);
    
    // Verify users table exists
    const usersTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    if (!usersTableCheck.rows[0].exists) {
      throw new Error('Users table was not created successfully');
    }
    console.log('[SQL] ✅ Users table verified');

    // Step 3: Agencies (foundational)
    console.log('[SQL] Step 3/13: Ensuring agencies schema...');
    await ensureAgenciesSchema(client);

    // Step 4: Departments (depends on profiles)
    console.log('[SQL] Step 4/13: Ensuring departments schema...');
    await ensureDepartmentsSchema(client);

    // Step 5: HR (depends on users)
    console.log('[SQL] Step 5/13: Ensuring HR schema...');
    await ensureHrSchema(client);
    
    // Verify attendance table exists
    const attendanceTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'attendance'
      );
    `);
    if (!attendanceTableCheck.rows[0].exists) {
      throw new Error('Attendance table was not created successfully');
    }
    console.log('[SQL] ✅ Attendance table verified');

    // Step 6: Clients and Financial (depends on users, must come before projects)
    console.log('[SQL] Step 6/13: Ensuring clients and financial schema...');
    await ensureClientsFinancialSchema(client);

    // Step 7: Projects and Tasks (depends on clients)
    console.log('[SQL] Step 7/13: Ensuring projects and tasks schema...');
    await ensureProjectsTasksSchema(client);

    // Step 8: CRM (depends on users)
    console.log('[SQL] Step 8/13: Ensuring CRM schema...');
    await ensureCrmSchema(client);

    // Step 9: GST (depends on invoices)
    console.log('[SQL] Step 9/13: Ensuring GST schema...');
    await ensureGstSchema(client);

    // Step 10: Reimbursement (depends on users)
    console.log('[SQL] Step 10/13: Ensuring reimbursement schema...');
    await ensureReimbursementSchema(client);

    // Step 11: Miscellaneous (depends on users)
    console.log('[SQL] Step 11/13: Ensuring miscellaneous schema...');
    await ensureMiscSchema(client);

    // Step 11.5: Create unified_employees view (depends on users, profiles, employee_details, user_roles)
    console.log('[SQL] Step 11.5/13: Ensuring unified_employees view...');
    const { ensureUnifiedEmployeesView } = require('./schema/sharedFunctions');
    await ensureUnifiedEmployeesView(client);
    console.log('[SQL] ✅ unified_employees view verified');

    // Step 12: Indexes and backward compatibility fixes
    console.log('[SQL] Step 12/13: Ensuring indexes and backward compatibility fixes...');
    await ensureIndexesAndFixes(client);

    // Step 13: Updated_at triggers for all tables with updated_at column
    console.log('[SQL] Step 13/13: Ensuring updated_at triggers...');
    const tablesWithUpdatedAt = [
      'chart_of_accounts', 'quotations', 'quotation_templates', 'quotation_line_items',
      'tasks', 'task_assignments', 'task_comments', 'task_time_tracking',
      'leave_types', 'leave_requests', 'payroll_periods', 'payroll',
      'employee_salary_details', 'employee_files',
      'job_categories', 'jobs', 'job_cost_items',
      'lead_sources', 'leads', 'crm_activities', 'sales_pipeline',
      'gst_settings', 'gst_returns', 'gst_transactions',
      'expense_categories', 'reimbursement_requests', 'receipts',
      'company_events', 'holidays', 'calendar_settings',
      'team_members', 'custom_reports', 'role_change_requests', 'feature_flags',
      'permissions', 'role_permissions', 'user_preferences'
    ];

    await ensureUpdatedAtTriggers(client, tablesWithUpdatedAt);

    // Final verification: Count all tables
    const tableCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log(`[SQL] ✅ Agency schema created successfully with ${tableCount.rows[0].count} tables, unified_employees view, and migrations applied`);
  } catch (error) {
    console.error('[SQL] ❌ Error creating agency schema:', error.message);
    console.error('[SQL] Error stack:', error.stack);
    throw error;
  }
}

module.exports = {
  createAgencySchema,
};

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/buildflow_db'
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'chart_of_accounts', 
        'journal_entries', 
        'journal_entry_lines', 
        'invoices', 
        'reimbursement_requests',
        'gst_settings', 
        'gst_returns', 
        'gst_transactions', 
        'jobs', 
        'job_cost_items',
        'expense_categories'
      ) 
      ORDER BY table_name
    `);
    
    console.log('Finance tables found:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check chart_of_accounts structure
    const coaStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'chart_of_accounts'
      ORDER BY ordinal_position
    `);
    
    console.log('\nchart_of_accounts structure:');
    coaStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check journal_entries structure
    const jeStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'journal_entries'
      ORDER BY ordinal_position
    `);
    
    console.log('\njournal_entries structure:');
    jeStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTables();


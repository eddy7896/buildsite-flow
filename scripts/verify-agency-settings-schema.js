// Script to verify agency_settings table schema
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL ||
  'postgresql://postgres:admin@localhost:5432/buildflow_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function verifySchema() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('\n=== Checking agency_settings table ===');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agency_settings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Table agency_settings does not exist!');
      client.release();
      await pool.end();
      process.exit(1);
    }
    
    console.log('✅ Table agency_settings exists');
    
    // Get all columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'agency_settings'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== Current columns ===');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check for required columns
    const requiredColumns = [
      'domain',
      'default_currency',
      'currency',
      'primary_color',
      'secondary_color',
      'timezone',
      'date_format',
      'fiscal_year_start',
      'working_hours_start',
      'working_hours_end',
      'working_days'
    ];
    
    console.log('\n=== Checking required columns ===');
    const existingColumnNames = columns.rows.map(r => r.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.error('❌ Missing columns:');
      missingColumns.forEach(col => console.error(`  - ${col}`));
      console.log('\n⚠️  Please run the migration:');
      console.log('   psql -U postgres -d buildflow_db -f supabase/migrations/02_add_agency_settings_columns.sql');
      client.release();
      await pool.end();
      process.exit(1);
    } else {
      console.log('✅ All required columns exist');
    }
    
    // Test a simple query
    console.log('\n=== Testing query ===');
    const testQuery = await client.query(`
      SELECT id, agency_name, domain, default_currency, primary_color
      FROM public.agency_settings
      LIMIT 1;
    `);
    
    console.log('✅ Query successful');
    if (testQuery.rows.length > 0) {
      console.log('   Sample data:', testQuery.rows[0]);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Schema verification complete!');
    console.log('   If backend still shows errors, try restarting the backend server.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verifySchema();


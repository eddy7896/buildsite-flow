/**
 * Backfill Script: Set agency_id for existing records
 * This script fixes records that were created without agency_id during setup
 * 
 * Usage: node scripts/backfill_agency_id.js <database_name>
 * Example: node scripts/backfill_agency_id.js agency_bambulabs_83e24745
 */

const { Pool } = require('pg');
const { DATABASE_URL } = require('../server/config/constants');

async function backfillAgencyId(agencyDatabase) {
  if (!agencyDatabase) {
    console.error('❌ Error: Agency database name is required');
    console.log('Usage: node scripts/backfill_agency_id.js <database_name>');
    process.exit(1);
  }

  console.log(`\n🔧 Starting backfill for agency database: ${agencyDatabase}\n`);

  // Connect to main database to get agency_id
  const mainPool = new Pool({
    connectionString: DATABASE_URL,
  });

  let agencyId = null;
  try {
    const result = await mainPool.query(
      'SELECT id, name FROM public.agencies WHERE database_name = $1 LIMIT 1',
      [agencyDatabase]
    );
    
    if (result.rows.length === 0) {
      console.error(`❌ Error: No agency found with database_name: ${agencyDatabase}`);
      process.exit(1);
    }
    
    agencyId = result.rows[0].id;
    const agencyName = result.rows[0].name;
    console.log(`✅ Found agency: ${agencyName} (ID: ${agencyId})\n`);
  } catch (error) {
    console.error('❌ Error fetching agency from main database:', error);
    process.exit(1);
  } finally {
    await mainPool.end();
  }

  // Connect to agency database
  const { host, port, user, password } = parseDatabaseUrl(DATABASE_URL);
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new Pool({ connectionString: agencyDbUrl });
  const client = await agencyPool.connect();

  try {
    await client.query('BEGIN');
    console.log('📊 Checking and updating records...\n');

    // 1. Update departments
    const deptResult = await client.query(`
      UPDATE public.departments 
      SET agency_id = $1 
      WHERE agency_id IS NULL
      RETURNING id, name
    `, [agencyId]);
    console.log(`✅ Updated ${deptResult.rowCount} department(s):`);
    deptResult.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.id})`);
    });

    // 2. Update profiles
    const profileResult = await client.query(`
      UPDATE public.profiles 
      SET agency_id = $1 
      WHERE agency_id IS NULL
      RETURNING id, full_name, user_id
    `, [agencyId]);
    console.log(`\n✅ Updated ${profileResult.rowCount} profile(s):`);
    profileResult.rows.forEach(row => {
      console.log(`   - ${row.full_name || 'Unknown'} (user_id: ${row.user_id})`);
    });

    // 3. Update user_roles (set agency_id where it's NULL)
    const roleResult = await client.query(`
      UPDATE public.user_roles 
      SET agency_id = $1 
      WHERE agency_id IS NULL
      RETURNING id, user_id, role
    `, [agencyId]);
    console.log(`\n✅ Updated ${roleResult.rowCount} user role(s):`);
    roleResult.rows.forEach(row => {
      console.log(`   - User ${row.user_id} with role ${row.role}`);
    });

    // 4. Update team_assignments
    const teamResult = await client.query(`
      UPDATE public.team_assignments 
      SET agency_id = $1 
      WHERE agency_id IS NULL
      RETURNING id, user_id, department_id
    `, [agencyId]);
    console.log(`\n✅ Updated ${teamResult.rowCount} team assignment(s)`);

    // 5. Update employee_details
    const empResult = await client.query(`
      UPDATE public.employee_details 
      SET agency_id = $1 
      WHERE agency_id IS NULL
      RETURNING id, first_name, last_name
    `, [agencyId]);
    console.log(`\n✅ Updated ${empResult.rowCount} employee detail(s):`);
    empResult.rows.forEach(row => {
      console.log(`   - ${row.first_name} ${row.last_name}`);
    });

    await client.query('COMMIT');
    console.log('\n🎉 Backfill completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Departments: ${deptResult.rowCount}`);
    console.log(`   - Profiles: ${profileResult.rowCount}`);
    console.log(`   - User Roles: ${roleResult.rowCount}`);
    console.log(`   - Team Assignments: ${teamResult.rowCount}`);
    console.log(`   - Employee Details: ${empResult.rowCount}`);
    console.log(`\n✨ All records now have agency_id: ${agencyId}\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during backfill:', error);
    process.exit(1);
  } finally {
    client.release();
    await agencyPool.end();
  }
}

function parseDatabaseUrl(url) {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname,
    port: urlObj.port || 5432,
    user: urlObj.username || 'postgres',
    password: urlObj.password || 'admin',
  };
}

// Run the script
const agencyDatabase = process.argv[2];
backfillAgencyId(agencyDatabase).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

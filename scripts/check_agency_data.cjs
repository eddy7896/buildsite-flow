const { Pool } = require('pg');
const { DATABASE_URL } = require('../server/config/constants');

const agencyDatabase = process.argv[2] || 'agency_bambulabs_2409d5d2';

function parseDatabaseUrl(url) {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname,
    port: urlObj.port || 5432,
    user: urlObj.username || 'postgres',
    password: urlObj.password || 'admin',
  };
}

const { host, port, user, password } = parseDatabaseUrl(DATABASE_URL);
const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
const pool = new Pool({ connectionString: agencyDbUrl });

async function checkData() {
  const client = await pool.connect();
  try {
    console.log(`\n📊 Checking data in: ${agencyDatabase}\n`);

    // Check departments
    const depts = await client.query('SELECT id, name, agency_id FROM public.departments');
    console.log(`Departments (${depts.rowCount}):`);
    depts.rows.forEach(d => {
      console.log(`  - ${d.name} (agency_id: ${d.agency_id || 'NULL'})`);
    });

    // Check users
    const users = await client.query('SELECT id, email, is_active FROM public.users');
    console.log(`\nUsers (${users.rowCount}):`);
    users.rows.forEach(u => {
      console.log(`  - ${u.email} (active: ${u.is_active})`);
    });

    // Check profiles
    const profiles = await client.query('SELECT id, user_id, full_name, agency_id FROM public.profiles');
    console.log(`\nProfiles (${profiles.rowCount}):`);
    profiles.rows.forEach(p => {
      console.log(`  - ${p.full_name || 'Unknown'} (user_id: ${p.user_id}, agency_id: ${p.agency_id || 'NULL'})`);
    });

    // Check user_roles
    const roles = await client.query('SELECT id, user_id, role, agency_id FROM public.user_roles');
    console.log(`\nUser Roles (${roles.rowCount}):`);
    roles.rows.forEach(r => {
      console.log(`  - User ${r.user_id} -> ${r.role} (agency_id: ${r.agency_id || 'NULL'})`);
    });

    // Check team_assignments
    const teams = await client.query('SELECT id, user_id, department_id, agency_id FROM public.team_assignments');
    console.log(`\nTeam Assignments (${teams.rowCount}):`);
    teams.rows.forEach(t => {
      console.log(`  - User ${t.user_id} -> Dept ${t.department_id} (agency_id: ${t.agency_id || 'NULL'})`);
    });

    // Check employee_details
    const employees = await client.query('SELECT id, user_id, first_name, last_name, agency_id FROM public.employee_details');
    console.log(`\nEmployee Details (${employees.rowCount}):`);
    employees.rows.forEach(e => {
      console.log(`  - ${e.first_name} ${e.last_name} (user_id: ${e.user_id}, agency_id: ${e.agency_id || 'NULL'})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkData();

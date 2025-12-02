// Quick verification script to check if seed data exists
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL ||
  'postgresql://postgres:admin@localhost:5432/buildflow_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function verifySeed() {
  try {
    const client = await pool.connect();
    
    console.log('Checking seed data...\n');
    
    const checks = [
      { table: 'agencies', name: 'Agencies' },
      { table: 'users', name: 'Users' },
      { table: 'profiles', name: 'Profiles' },
      { table: 'departments', name: 'Departments' },
      { table: 'team_assignments', name: 'Team Assignments' },
      { table: 'team_members', name: 'Team Members' },
      { table: 'clients', name: 'Clients' },
      { table: 'projects', name: 'Projects' },
    ];
    
    for (const check of checks) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${check.table}`);
        const count = result.rows[0].count;
        console.log(`✅ ${check.name}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${check.name}: Error - ${error.message}`);
      }
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
}

verifySeed();


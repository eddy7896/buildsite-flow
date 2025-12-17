const { Pool } = require('pg');
const { DATABASE_URL } = require('../server/config/constants');

const pool = new Pool({ connectionString: DATABASE_URL });

pool.query(`
  SELECT database_name, name, domain, id 
  FROM public.agencies 
  ORDER BY created_at DESC
`).then(result => {
  console.log('\nFound agencies:');
  console.log(JSON.stringify(result.rows, null, 2));
  if (result.rows.length > 0) {
    console.log('\nTo backfill, run:');
    console.log(`node scripts/backfill_agency_id.js ${result.rows[0].database_name}`);
  }
  pool.end();
}).catch(error => {
  console.error('Error:', error);
  pool.end();
});

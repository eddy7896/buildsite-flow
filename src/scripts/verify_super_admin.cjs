/**
 * Script to verify super admin users in main database
 * Ensures all super_admin roles have agency_id = NULL
 */

const { Pool } = require('pg');
const { parseDatabaseUrl } = require('../server/utils/poolManager');

async function verifySuperAdmin() {
  const dbConfig = parseDatabaseUrl();
  const mainPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'buildflow_db',
  });

  try {
    console.log('🔍 Verifying super admin users in main database...\n');
    
    // Get all super admin users
    const result = await mainPool.query(`
      SELECT 
        u.id, 
        u.email, 
        ur.role, 
        ur.agency_id,
        p.full_name
      FROM public.users u
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      LEFT JOIN public.profiles p ON u.id = p.user_id
      WHERE ur.role = 'super_admin'
      ORDER BY u.email
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  No super admin users found in main database');
      console.log('   You may need to create a super admin user.');
      return;
    }

    console.log(`📊 Found ${result.rows.length} super admin user(s):\n`);

    let validCount = 0;
    let invalidCount = 0;

    for (const row of result.rows) {
      const isValid = row.agency_id === null;
      const status = isValid ? '✅' : '❌';
      
      console.log(`${status} ${row.email || row.id}`);
      console.log(`   Name: ${row.full_name || 'N/A'}`);
      console.log(`   Role: ${row.role}`);
      console.log(`   Agency ID: ${row.agency_id === null ? 'NULL (correct)' : row.agency_id + ' (INVALID - should be NULL)'}`);
      console.log('');

      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Valid (agency_id = NULL): ${validCount}`);
    console.log(`   Invalid (agency_id != NULL): ${invalidCount}`);

    if (invalidCount > 0) {
      console.log(`\n⚠️  Warning: ${invalidCount} super admin user(s) have agency_id set.`);
      console.log('   These should be cleaned up. Run the migration script again.');
    } else {
      console.log(`\n✅ All super admin users are correctly configured!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mainPool.end();
  }
}

// Run the script
if (require.main === module) {
  verifySuperAdmin()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifySuperAdmin };


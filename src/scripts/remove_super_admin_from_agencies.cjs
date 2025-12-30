/**
 * Script to remove super_admin role from all agency databases
 * 
 * This script:
 * 1. Connects to main database
 * 2. Gets all agency database names
 * 3. For each agency database, removes super_admin roles from user_roles table
 * 4. Ensures super_admin only exists in main database with agency_id = NULL
 * 
 * Run: node src/scripts/remove_super_admin_from_agencies.cjs
 */

const { Pool } = require('pg');
const { parseDatabaseUrl } = require('../server/utils/poolManager');

async function removeSuperAdminFromAgencies() {
  const dbConfig = parseDatabaseUrl();
  const mainPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'buildflow_db',
  });

  try {
    console.log('🔍 Fetching all agency databases...');
    
    // Get all agency databases
    const agenciesResult = await mainPool.query(`
      SELECT database_name 
      FROM public.agencies 
      WHERE database_name IS NOT NULL 
      AND database_name != 'buildflow_db'
      ORDER BY database_name
    `);

    const agencies = agenciesResult.rows;
    console.log(`📊 Found ${agencies.length} agency databases to process`);

    let processed = 0;
    let removed = 0;
    let errors = 0;

    for (const agency of agencies) {
      const dbName = agency.database_name;
      
      // Skip test databases
      if (dbName.startsWith('test_')) {
        console.log(`⏭️  Skipping test database: ${dbName}`);
        continue;
      }

      try {
        console.log(`\n🔄 Processing: ${dbName}`);
        
        // Create connection to agency database
        const agencyPool = new Pool({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password,
          database: dbName,
        });

        try {
          // Check if user_roles table exists
          const tableCheck = await agencyPool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'user_roles'
            )
          `);

          if (!tableCheck.rows[0].exists) {
            console.log(`   ⚠️  user_roles table does not exist, skipping`);
            continue;
          }

          // Count super_admin roles before removal
          const countResult = await agencyPool.query(`
            SELECT COUNT(*) as count
            FROM public.user_roles
            WHERE role = 'super_admin'
          `);

          const countBefore = parseInt(countResult.rows[0].count) || 0;

          if (countBefore === 0) {
            console.log(`   ✅ No super_admin roles found (already clean)`);
            processed++;
            continue;
          }

          // Remove super_admin roles
          const deleteResult = await agencyPool.query(`
            DELETE FROM public.user_roles
            WHERE role = 'super_admin'
          `);

          const deletedCount = deleteResult.rowCount || 0;
          removed += deletedCount;
          processed++;

          console.log(`   ✅ Removed ${deletedCount} super_admin role(s)`);

        } catch (error) {
          if (error.code === '3D000') {
            // Database does not exist
            console.log(`   ⚠️  Database does not exist, skipping`);
          } else {
            console.error(`   ❌ Error: ${error.message}`);
            errors++;
          }
        } finally {
          await agencyPool.end();
        }

      } catch (error) {
        console.error(`   ❌ Error connecting to ${dbName}: ${error.message}`);
        errors++;
      }
    }

    // Clean up main database
    console.log(`\n🧹 Cleaning up main database...`);
    let mainRemoved = 0;
    try {
      // First check if there are any super_admin roles with agency_id
      const checkResult = await mainPool.query(`
        SELECT COUNT(*) as count
        FROM public.user_roles 
        WHERE role = 'super_admin' 
        AND agency_id IS NOT NULL
      `);
      
      const countWithAgencyId = parseInt(checkResult.rows[0].count) || 0;
      
      if (countWithAgencyId === 0) {
        console.log(`   ✅ Main database is clean (no super_admin roles with agency_id)`);
      } else {
        // Temporarily disable the audit trigger to avoid foreign key issues
        await mainPool.query(`ALTER TABLE public.user_roles DISABLE TRIGGER ALL`);
        
        try {
          const mainCleanup = await mainPool.query(`
            DELETE FROM public.user_roles 
            WHERE role = 'super_admin' 
            AND agency_id IS NOT NULL
          `);
          
          mainRemoved = mainCleanup.rowCount || 0;
          console.log(`   ✅ Removed ${mainRemoved} super_admin role(s) with agency_id from main database`);
        } finally {
          // Re-enable the audit trigger
          await mainPool.query(`ALTER TABLE public.user_roles ENABLE TRIGGER ALL`);
        }
      }
    } catch (error) {
      console.error(`   ⚠️  Warning: Could not clean up main database: ${error.message}`);
      console.log(`   ℹ️  You may need to manually remove super_admin roles with agency_id from main database`);
    }

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Processed: ${processed} agency databases`);
    console.log(`   Removed: ${removed} super_admin role(s) from agency databases`);
    console.log(`   Removed: ${mainRemoved} super_admin role(s) from main database (with agency_id)`);
    console.log(`   Errors: ${errors}`);
    console.log(`\n✅ Migration complete!`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mainPool.end();
  }
}

// Run the script
if (require.main === module) {
  removeSuperAdminFromAgencies()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { removeSuperAdminFromAgencies };


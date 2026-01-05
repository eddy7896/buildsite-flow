/**
 * Migration Script: Add Maintenance Mode to Existing Agencies
 * 
 * This script:
 * 1. Adds maintenance_mode columns to agencies table in main database (if not exists)
 * 2. Adds maintenance_mode columns to agency_settings in all existing agency databases
 * 
 * Run with: node src/server/scripts/migrateAgencyMaintenanceMode.js
 */

const { pool } = require('../config/database');
const { getAgencyPool } = require('../utils/poolManager');
const { parseDatabaseUrl } = require('../utils/poolManager');
const { ensureAgencySettingsTable } = require('../utils/schema/agenciesSchema');

async function migrateMainDatabase() {
  console.log('📦 Migrating main database (agencies table)...');
  const client = await pool.connect();
  
  try {
    // Check if columns already exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'agencies' 
      AND column_name IN ('maintenance_mode', 'maintenance_message')
    `);
    
    const existingColumns = columnCheck.rows.map(r => r.column_name);
    
    if (!existingColumns.includes('maintenance_mode')) {
      await client.query(`
        ALTER TABLE public.agencies
        ADD COLUMN maintenance_mode BOOLEAN DEFAULT false
      `);
      console.log('  ✅ Added maintenance_mode column');
    } else {
      console.log('  ⏭️  maintenance_mode column already exists');
    }
    
    if (!existingColumns.includes('maintenance_message')) {
      await client.query(`
        ALTER TABLE public.agencies
        ADD COLUMN maintenance_message TEXT
      `);
      console.log('  ✅ Added maintenance_message column');
    } else {
      console.log('  ⏭️  maintenance_message column already exists');
    }
    
    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agencies_maintenance_mode 
      ON public.agencies(maintenance_mode) 
      WHERE maintenance_mode = true
    `);
    console.log('  ✅ Created index on maintenance_mode');
    
    console.log('✅ Main database migration complete\n');
  } catch (error) {
    console.error('❌ Error migrating main database:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function checkDatabaseExists(databaseName) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS(
        SELECT FROM pg_database WHERE datname = $1
      )
    `, [databaseName]);
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

async function migrateAgencyDatabase(agencyDatabase) {
  // First check if database exists
  const dbExists = await checkDatabaseExists(agencyDatabase);
  if (!dbExists) {
    return { success: false, skipped: true, reason: 'database_does_not_exist' };
  }

  let agencyPool;
  let client;
  
  try {
    agencyPool = getAgencyPool(agencyDatabase);
    client = await agencyPool.connect();
    
    // Check if agency_settings table exists, create if not
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agency_settings'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Create the table using the schema function
      console.log(`    📝 Creating agency_settings table...`);
      await ensureAgencySettingsTable(client);
      console.log(`    ✅ Created agency_settings table`);
    } else {
      // Table exists, just ensure maintenance columns exist
      // Use the schema function which handles all columns including maintenance
      await ensureAgencySettingsTable(client);
    }
    
    // Verify columns were added
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'agency_settings' 
      AND column_name IN ('maintenance_mode', 'maintenance_message')
    `);
    
    const existingColumns = columnCheck.rows.map(r => r.column_name);
    
    if (!existingColumns.includes('maintenance_mode') || !existingColumns.includes('maintenance_message')) {
      // Fallback: add columns directly if schema function didn't add them
      await client.query(`
        ALTER TABLE public.agency_settings
        ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS maintenance_message TEXT
      `);
    }
    
    return { success: true, skipped: false };
  } catch (error) {
    // Handle specific error cases
    if (error.code === '3D000' || error.message.includes('does not exist')) {
      // Database does not exist
      return { success: false, skipped: true, reason: 'database_does_not_exist' };
    } else if (error.code === '42P01' || (error.message.includes('relation') && error.message.includes('does not exist'))) {
      // Table does not exist - try to create it
      try {
        if (client) {
          console.log(`    📝 Creating agency_settings table...`);
          await ensureAgencySettingsTable(client);
          return { success: true, skipped: false };
        }
      } catch (retryError) {
        console.error(`  ❌ Error migrating ${agencyDatabase}:`, retryError.message);
        return { success: false, skipped: false, reason: retryError.message };
      }
    } else {
      console.error(`  ❌ Error migrating ${agencyDatabase}:`, error.message);
      return { success: false, skipped: false, reason: error.message };
    }
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function migrateAllAgencies() {
  console.log('📦 Migrating all agency databases...');
  const client = await pool.connect();
  
  try {
    // Get all agencies
    const result = await client.query(`
      SELECT id, name, database_name 
      FROM public.agencies 
      WHERE database_name IS NOT NULL
      ORDER BY created_at
    `);
    
    const agencies = result.rows;
    console.log(`  Found ${agencies.length} agencies to migrate\n`);
    
    if (agencies.length === 0) {
      console.log('  ⏭️  No agencies to migrate\n');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    
    for (const agency of agencies) {
      console.log(`  Migrating: ${agency.name} (${agency.database_name})...`);
      const result = await migrateAgencyDatabase(agency.database_name);
      
      if (result.success) {
        console.log(`    ✅ Success`);
        successCount++;
      } else if (result.skipped) {
        console.log(`    ⏭️  Skipped (${result.reason === 'database_does_not_exist' ? 'database does not exist' : result.reason})`);
        skippedCount++;
      } else {
        console.log(`    ❌ Failed: ${result.reason || 'Unknown error'}`);
        failCount++;
      }
    }
    
    console.log(`\n✅ Agency database migration complete`);
    console.log(`   Success: ${successCount}, Failed: ${failCount}, Skipped: ${skippedCount}\n`);
  } catch (error) {
    console.error('❌ Error fetching agencies:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigration() {
  console.log('🚀 Starting Maintenance Mode Migration\n');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Migrate main database
    await migrateMainDatabase();
    
    // Step 2: Migrate all agency databases
    await migrateAllAgencies();
    
    console.log('=' .repeat(50));
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateMainDatabase, migrateAllAgencies };


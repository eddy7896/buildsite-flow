/**
 * Schema Validation and Repair Utilities
 */

const { createTemporaryPool, parseDatabaseUrl } = require('./poolManager');
const { createAgencySchema } = require('./schemaCreator');
const { DATABASE_URL } = require('../config/constants');

/**
 * Ensure agency database exists, create if missing
 * @param {string} agencyDatabase - Agency database name
 * @returns {Promise<boolean>} - True if database was created, false if it already existed
 */
async function ensureAgencyDatabase(agencyDatabase) {
  const { host, port, user, password } = parseDatabaseUrl();
  const postgresUrl = `postgresql://${user}:${password}@${host}:${port}/postgres`;
  const { Pool } = require('pg');
  const postgresPool = new Pool({ connectionString: postgresUrl, max: 1 });
  const postgresClient = await postgresPool.connect();

  try {
    // Use advisory lock to prevent concurrent database creation
    // Generate a consistent lock ID from the database name
    const lockResult = await postgresClient.query(`
      SELECT pg_try_advisory_lock(hashtext($1)::bigint) as acquired
    `, [agencyDatabase]);
    
    try {
      const lockAcquired = lockResult.rows[0].acquired;
      
      if (!lockAcquired) {
        // Another process is creating the database, wait a bit and check if it exists
        await new Promise(resolve => setTimeout(resolve, 1000));
        const dbCheck = await postgresClient.query(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          [agencyDatabase]
        );
        if (dbCheck.rows.length > 0) {
          return false; // Database was created by another process
        }
        // If still doesn't exist, wait a bit more and check again
        await new Promise(resolve => setTimeout(resolve, 2000));
        const dbCheck2 = await postgresClient.query(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          [agencyDatabase]
        );
        return dbCheck2.rows.length > 0 ? false : true; // Return false if exists now
      }
      
      // Check if database exists
      const dbCheck = await postgresClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [agencyDatabase]
      );

      if (dbCheck.rows.length === 0) {
        // Database doesn't exist, create it
        console.log(`[API] Database ${agencyDatabase} does not exist, creating...`);
        try {
          await postgresClient.query(`CREATE DATABASE "${agencyDatabase}"`);
          console.log(`[API] ✅ Database created: ${agencyDatabase}`);
        } catch (createError) {
          // If database was created by another process, that's fine
          if (createError.code === '42P04' || createError.code === '23505' || 
              createError.message.includes('duplicate key') || 
              createError.message.includes('already exists')) {
            // Check if it exists now
            const dbCheck2 = await postgresClient.query(
              `SELECT 1 FROM pg_database WHERE datname = $1`,
              [agencyDatabase]
            );
            if (dbCheck2.rows.length > 0) {
              console.log(`[API] Database ${agencyDatabase} was created by another process`);
              return false; // Database exists now
            }
          }
          throw createError;
        }
        
        // After creating database, create the schema
        const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
        const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
        const agencyClient = await agencyPool.connect();
        
        try {
          console.log(`[API] Creating schema for ${agencyDatabase}...`);
          await createAgencySchema(agencyClient);
          console.log(`[API] ✅ Schema created for ${agencyDatabase}`);
        } finally {
          agencyClient.release();
          await agencyPool.end();
        }
        
        return true; // Database was created
      }
      
      return false; // Database already existed
    } finally {
      // Release advisory lock
      await postgresClient.query(`SELECT pg_advisory_unlock(hashtext($1)::bigint)`, [agencyDatabase]);
    }
  } finally {
    postgresClient.release();
    await postgresPool.end();
  }
}

/**
 * Check and repair database schema if needed
 * @param {string} agencyDatabase - Agency database name
 */
async function ensureAgencySchema(agencyDatabase) {
  if (!agencyDatabase) return; // Skip for main database

  const cacheKey = `schema_checked_${agencyDatabase}`;
  if (global.schemaCheckCache && global.schemaCheckCache[cacheKey]) {
    return; // Already checked recently
  }

  try {
    // First, ensure the database exists
    await ensureAgencyDatabase(agencyDatabase);

    const { host, port, user, password } = parseDatabaseUrl();
    const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
    const { Pool } = require('pg');
    const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
    const agencyClient = await agencyPool.connect();

    try {
      // Use advisory lock to prevent concurrent schema creation
      const lockKey = `schema_${agencyDatabase}`;
      const lockResult = await agencyClient.query(`
        SELECT pg_try_advisory_lock(hashtext($1)::bigint) as acquired
      `, [lockKey]);
      
      try {
        const lockAcquired = lockResult.rows[0].acquired;
        
        if (!lockAcquired) {
          // Another process is creating the schema, wait a bit and return
          console.log(`[API] Schema creation in progress for ${agencyDatabase}, waiting...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Cache to prevent repeated checks
          if (!global.schemaCheckCache) global.schemaCheckCache = {};
          global.schemaCheckCache[cacheKey] = true;
          setTimeout(() => {
            if (global.schemaCheckCache) delete global.schemaCheckCache[cacheKey];
          }, 5 * 60 * 1000);
          return;
        }
        
        // Check if critical tables exist
        const criticalTables = [
          'users',
          'profiles',
          'attendance',
          'projects',
          'invoices',
          'employee_details',
          'file_storage',
          'gst_settings',
          'gst_transactions',
          'gst_returns',
          'document_folders',
          'documents',
          'document_versions',
          'document_permissions'
        ];
        const checkResult = await agencyClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ANY($1::text[])
        `, [criticalTables]);

        const existingTables = checkResult.rows.map(r => r.table_name);
        const missingTables = criticalTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
          console.log(`[API] Missing tables detected in ${agencyDatabase}: ${missingTables.join(', ')}`);
          console.log(`[API] Auto-repairing database schema...`);
          
          // Run schema creation to add missing tables
          await createAgencySchema(agencyClient);
          
          console.log(`[API] Database schema repair completed for ${agencyDatabase}`);
        }

        // Cache the check for 5 minutes
        if (!global.schemaCheckCache) global.schemaCheckCache = {};
        global.schemaCheckCache[cacheKey] = true;
        setTimeout(() => {
          if (global.schemaCheckCache) delete global.schemaCheckCache[cacheKey];
        }, 5 * 60 * 1000); // 5 minutes
      } finally {
        // Release advisory lock
        await agencyClient.query(`SELECT pg_advisory_unlock(hashtext($1)::bigint)`, [lockKey]);
      }

    } finally {
      agencyClient.release();
      await agencyPool.end();
    }
  } catch (error) {
    console.error(`[API] Error checking/repairing schema for ${agencyDatabase}:`, error.message);
    
    // If database doesn't exist (3D000), try to create it and retry
    if (error.code === '3D000') {
      console.log(`[API] Database ${agencyDatabase} does not exist, attempting to create...`);
      try {
        await ensureAgencyDatabase(agencyDatabase);
        // Retry schema check after database creation
        return await ensureAgencySchema(agencyDatabase);
      } catch (createError) {
        console.error(`[API] Failed to create database ${agencyDatabase}:`, createError.message);
        // Don't throw - allow query to proceed, it will fail with a clear error
      }
    }
    // Don't throw - allow query to proceed, it will fail with a clear error if table is missing
  }
}

module.exports = {
  ensureAgencySchema,
  ensureAgencyDatabase,
};

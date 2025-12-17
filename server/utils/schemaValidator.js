/**
 * Schema Validation and Repair Utilities
 */

const { createTemporaryPool, parseDatabaseUrl } = require('./poolManager');
const { createAgencySchema } = require('./schemaCreator');
const { DATABASE_URL } = require('../config/constants');

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
    const { host, port, user, password } = parseDatabaseUrl();
    const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
    const { Pool } = require('pg');
    const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
    const agencyClient = await agencyPool.connect();

    try {
      // Check if critical tables exist
      const criticalTables = [
        'users',
        'profiles',
        'attendance',
        'projects',
        'invoices',
        'employee_details',
        'file_storage'
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
      agencyClient.release();
      await agencyPool.end();
    }
  } catch (error) {
    console.error(`[API] Error checking/repairing schema for ${agencyDatabase}:`, error.message);
    // Don't throw - allow query to proceed, it will fail with a clear error if table is missing
  }
}

module.exports = {
  ensureAgencySchema,
};

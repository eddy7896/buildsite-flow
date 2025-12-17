/**
 * Database Routes
 * Handles database queries and transactions
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { executeQuery, executeTransaction, repairMissingColumn } = require('../services/databaseService');
const { createAgencySchema } = require('../utils/schemaCreator');
const { parseDatabaseUrl } = require('../utils/poolManager');

/**
 * POST /api/database/query
 * Execute a single database query
 */
router.post('/query', asyncHandler(async (req, res) => {
  const { sql: originalSql, params: originalParams = [], userId } = req.body;
  const agencyDatabase = req.headers['x-agency-database'];

  // Validate SQL early
  if (!originalSql) {
    return res.status(400).json({ error: 'SQL query is required' });
  }

  const sql = originalSql.trim();
  const params = originalParams;

  try {
    const result = await executeQuery(sql, params, agencyDatabase, userId);
    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (error) {
    console.error('[API] Query error:', error);

    // If it's a NOT NULL constraint violation for leads.name, try to make it nullable and retry
    if (error.code === '23502' && agencyDatabase && error.message.includes('column "name" of relation "leads"')) {
      console.log(`[API] NOT NULL constraint violation detected for leads.name, attempting to make nullable...`);
      try {
        const { host, port, user, password } = parseDatabaseUrl();
        const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
        const { Pool } = require('pg');
        const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
        const agencyClient = await agencyPool.connect();
        try {
          await agencyClient.query('ALTER TABLE public.leads ALTER COLUMN name DROP NOT NULL');
          console.log(`[API] ✅ Made leads.name column nullable`);
          
          // Wait a moment for the change to be fully available
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Retry the query
          const retryResult = await executeQuery(sql, params, agencyDatabase, userId);
          console.log(`[API] ✅ Query retry successful after making leads.name nullable`);
          return res.json({
            rows: retryResult.rows,
            rowCount: retryResult.rowCount,
          });
        } finally {
          agencyClient.release();
          await agencyPool.end();
        }
      } catch (repairError) {
        console.error('[API] ❌ Failed to make leads.name nullable:', repairError.message);
        // Fall through to return original error
      }
    }

    // If it's a "column does not exist" error, try to add the column and retry
    if (error.code === '42703' && agencyDatabase && error.message.includes('does not exist')) {
      const columnMatch = error.message.match(/column "([^"]+)" of relation "([^"]+)"/);
      if (columnMatch) {
        const [, columnName, tableName] = columnMatch;
        console.log(`[API] Missing column detected: ${tableName}.${columnName}, attempting to add...`);
        
        // Special handling for clients billing columns - add all at once
        const billingColumns = ['billing_city', 'billing_state', 'billing_postal_code', 'billing_country'];
        const isBillingColumn = tableName === 'clients' && billingColumns.includes(columnName);
        
        try {
          if (isBillingColumn) {
            // For billing columns, add all of them at once to prevent multiple repair cycles
            console.log(`[API] Detected missing billing column, adding all billing columns to clients table...`);
            const { host, port, user, password } = parseDatabaseUrl();
            const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
            const { Pool } = require('pg');
            const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
            const agencyClient = await agencyPool.connect();
            try {
              // Check which billing columns exist first
              const columnCheck = await agencyClient.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'clients' 
                AND column_name IN ('billing_city', 'billing_state', 'billing_postal_code', 'billing_country')
              `);
              const existingColumns = columnCheck.rows.map(r => r.column_name);
              const missingColumns = billingColumns.filter(col => !existingColumns.includes(col));
              
              if (missingColumns.length > 0) {
                console.log(`[API] Adding missing billing columns: ${missingColumns.join(', ')}`);
                for (const col of missingColumns) {
                  await agencyClient.query(`ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ${col} TEXT`);
                }
                console.log(`[API] ✅ Added all missing billing columns to clients table`);
              } else {
                console.log(`[API] ℹ️ All billing columns already exist`);
              }
            } finally {
              agencyClient.release();
              await agencyPool.end();
            }
          } else {
            await repairMissingColumn(agencyDatabase, tableName, columnName);
          }

          // Wait a moment for the column(s) to be fully available
          await new Promise(resolve => setTimeout(resolve, 300));

          // Retry the query
          const retryResult = await executeQuery(sql, params, agencyDatabase, userId);
          console.log(`[API] ✅ Query retry successful after adding ${columnName} to ${tableName}`);
          return res.json({
            rows: retryResult.rows,
            rowCount: retryResult.rowCount,
          });
        } catch (repairError) {
          console.error('[API] ❌ Column repair failed:', repairError.message);
          // Try one more time with full schema repair
          try {
            console.log('[API] Attempting full schema repair as fallback...');
            const { host, port, user, password } = parseDatabaseUrl();
            const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
            const { Pool } = require('pg');
            const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
            const agencyClient = await agencyPool.connect();
            try {
              await createAgencySchema(agencyClient);
              const retryResult = await executeQuery(sql, params, agencyDatabase, userId);
              return res.json({
                rows: retryResult.rows,
                rowCount: retryResult.rowCount,
              });
            } finally {
              agencyClient.release();
              await agencyPool.end();
            }
          } catch (fallbackError) {
            console.error('[API] ❌ Full schema repair also failed:', fallbackError.message);
            // Fall through to return original error
          }
        }
      }
    }

    res.status(500).json({
      error: error.message,
      detail: error.detail,
      code: error.code,
    });
  }
}));

/**
 * POST /api/database/transaction
 * Execute multiple queries in a single transaction
 */
router.post('/transaction', asyncHandler(async (req, res) => {
  try {
    const { queries = [], userId } = req.body;
    const agencyDatabase = req.headers['x-agency-database'];

    const results = await executeTransaction(queries, agencyDatabase, userId);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('[API] Transaction error:', error);
    res.status(500).json({
      error: error.message,
      detail: error.detail,
      code: error.code,
    });
  }
}));

module.exports = router;

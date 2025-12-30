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
const logger = require('../utils/logger');
const { queryOne } = require('../utils/dbQuery');
const { send, success, error: errorResponse } = require('../utils/responseHelper');

/**
 * POST /api/database/query
 * Execute a single database query
 */
router.post('/query', asyncHandler(async (req, res) => {
  let { sql: originalSql, params: originalParams = [], userId } = req.body;
  const agencyDatabase = req.headers['x-agency-database'];

  // Validate SQL early
  if (!originalSql) {
    return res.status(400).json({ error: 'SQL query is required' });
  }

  let sql = originalSql.trim();
  let params = [...originalParams]; // Create a copy to modify

  // Safety check: Remove agency_id from agency_settings INSERT/UPDATE queries
  // agency_settings table doesn't have agency_id column - each agency has its own database
  if (sql.includes('agency_settings') && sql.includes('INSERT INTO')) {
    // Check if agency_id is present (case-insensitive)
    if (sql.match(/\bagency_id\b/i)) {
      logger.debug('Detected agency_id in agency_settings INSERT, removing it', {
        sql: sql.substring(0, 200),
      });
      
      // Match the full INSERT statement including RETURNING clause
      const fullMatch = sql.match(/INSERT\s+INTO\s+([^(]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)\s*(RETURNING\s+\*)?/is);
      
      if (fullMatch) {
        const tablePart = fullMatch[1].trim();
        const columnsStr = fullMatch[2];
        const valuesStr = fullMatch[3];
        const returningClause = fullMatch[4] || '';
        
        // Parse columns and values
        const columns = columnsStr.split(',').map(c => c.trim());
        const values = valuesStr.split(',').map(v => v.trim());
        
        // Find agency_id index
        const agencyIdIndex = columns.findIndex(c => c.toLowerCase() === 'agency_id');
        
        if (agencyIdIndex !== -1) {
          logger.debug('Found agency_id in agency_settings INSERT', {
            agencyIdIndex,
            originalColumnsCount: columns.length,
            originalParamsCount: params.length,
          });
          
          // Remove agency_id from columns
          columns.splice(agencyIdIndex, 1);
          
          // Remove corresponding value placeholder
          values.splice(agencyIdIndex, 1);
          
          // Rebuild the SQL
          sql = `INSERT INTO ${tablePart} (${columns.join(',')}) VALUES (${values.join(',')})${returningClause}`;
          
          // Remove the corresponding parameter from params array
          if (params.length > agencyIdIndex) {
            params.splice(agencyIdIndex, 1);
          }
          
          logger.debug('Removed agency_id from agency_settings INSERT', {
            newColumnsCount: columns.length,
            newParamsCount: params.length,
          });
        }
      } else {
        // Fallback: aggressive regex replacement
        logger.debug('Full match failed for agency_id removal, using fallback regex');
        sql = sql.replace(/,\s*agency_id\s*(?=,|\))/gi, '');
        sql = sql.replace(/\(\s*agency_id\s*,/gi, '(');
        sql = sql.replace(/,\s*agency_id\s*\)/gi, ')');
        sql = sql.replace(/\(\s*agency_id\s*\)/gi, '()');
      }
    }
  }
  
  // Remove agency_id from UPDATE statements
  if (sql.includes('agency_settings') && sql.includes('UPDATE') && sql.includes('agency_id')) {
    sql = sql.replace(/,\s*agency_id\s*=\s*\$?\d+/gi, '');
    sql = sql.replace(/agency_id\s*=\s*\$?\d+\s*,/gi, '');
  }

  try {
    const result = await executeQuery(sql, params, agencyDatabase, userId);
    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (error) {
    logger.error('Database query error', {
      error: error.message,
      code: error.code,
      detail: error.detail,
      agencyDatabase,
      sql: sql.substring(0, 200),
    });

    // Handle missing notifications table in MAIN database (not agency database)
    if (error.code === '42P01' && error.message.includes('notifications') && !agencyDatabase) {
      logger.info('Notifications table missing in main database, creating...');
      try {
        const { pool } = require('../config/database');
        const client = await pool.connect();
        try {
          const { ensureNotificationsTable } = require('../utils/schema/miscSchema');
          await ensureNotificationsTable(client);
          logger.info('Notifications table created in main database, retrying query...');
          
          // Retry the query
          const retryResult = await executeQuery(sql, params, agencyDatabase, userId);
          return res.json({
            rows: retryResult.rows,
            rowCount: retryResult.rowCount,
          });
        } finally {
          client.release();
        }
      } catch (repairError) {
        logger.error('Failed to repair notifications table', {
          error: repairError.message,
          code: repairError.code,
        });
      }
    }

    // Handle missing database (3D000 = database does not exist)
    if (error.code === '3D000' && agencyDatabase) {
      logger.info('Database does not exist, checking agency', {
        agencyDatabase,
      });
      
      // Check if agency exists in main database
      try {
        const agency = await queryOne(
          'SELECT id, name FROM agencies WHERE database_name = $1',
          [agencyDatabase],
          { requestId: req.requestId }
        );
        
        if (!agency) {
          // Agency doesn't exist - invalid reference
          logger.warn('Agency not found in main database', {
            agencyDatabase,
            message: 'User session references non-existent agency. User should log out and log in again.',
          });
          return send(res, errorResponse(
            `Agency database "${agencyDatabase}" does not exist. This usually happens when the development database is reset. Please log out and log in again, or contact support if the issue persists.`,
            'AGENCY_DB_NOT_FOUND',
            { 
              error: 'Agency database not found',
              agencyDatabase,
              suggestion: 'Log out and log in again, or recreate your agency account'
            },
            404
          ));
        }
        
        // Agency exists but database is missing - try to create it
        logger.info('Agency exists but database missing, creating database', {
          agencyDatabase,
          agencyId: agency.id,
          agencyName: agency.name,
        });
        const { createAgencySchema } = require('../utils/schemaCreator');
        const { parseDatabaseUrl } = require('../utils/poolManager');
        const { Pool } = require('pg');
        
        const { host, port, user, password } = parseDatabaseUrl();
        const postgresUrl = `postgresql://${user}:${password}@${host}:${port}/postgres`;
        const postgresPool = new Pool({ connectionString: postgresUrl, max: 1 });
        const postgresClient = await postgresPool.connect();
        
        try {
          // Create database securely
          const { validateDatabaseName, quoteIdentifier } = require('../utils/securityUtils');
          const validatedDbName = validateDatabaseName(agencyDatabase);
          const quotedDbName = quoteIdentifier(validatedDbName);
          await postgresClient.query(`CREATE DATABASE ${quotedDbName}`);
          logger.info('Database created successfully', {
            agencyDatabase,
          });
          
          // Connect to new database and create schema
          const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
          const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
          const agencyClient = await agencyPool.connect();
          
          try {
            await createAgencySchema(agencyClient);
            logger.info('Schema created for agency database', {
              agencyDatabase,
            });
            
            // Retry the original query
            const retryResult = await executeQuery(sql, params, agencyDatabase, userId);
            return res.json({
              rows: retryResult.rows,
              rowCount: retryResult.rowCount,
            });
          } finally {
            agencyClient.release();
            await agencyPool.end();
          }
        } catch (createError) {
          logger.error('Error creating database/schema', {
            error: createError.message,
            code: createError.code,
            agencyDatabase,
          });
          return send(res, errorResponse(
            createError.message,
            'DB_CREATION_FAILED',
            { error: 'Failed to create agency database' },
            500
          ));
        } finally {
          postgresClient.release();
          await postgresPool.end();
        }
      } catch (checkError) {
        logger.error('Error checking agency', {
          error: checkError.message,
          code: checkError.code,
          agencyDatabase,
        });
        return send(res, errorResponse(
          checkError.message,
          'DB_CHECK_FAILED',
          { error: 'Database error' },
          500
        ));
      }
    }

    // DISABLED: Automatic schema repair consumes too much CPU
    // Schema should be created during agency setup, not on every query error
    // Only repair if explicitly enabled via environment variable
    if (false && (error.code === '42P01' || error.code === '42883') && agencyDatabase && req && !req._schemaRepairAttempted && process.env.ENABLE_SCHEMA_REPAIR === 'true') {
      // 42P01 = relation does not exist (table/view)
      // 42883 = function does not exist
      req._schemaRepairAttempted = true; // Prevent infinite loops
      logger.debug(`Missing table/function detected (${error.code}), attempting schema repair (one time only)...`, { errorCode: error.code, agencyDatabase });
      try {
        const { host, port, user, password } = parseDatabaseUrl();
        const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
        const { Pool } = require('pg');
        const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
        const agencyClient = await agencyPool.connect();
        try {
          // Check which table is missing and repair appropriate schema
          const tableMatch = error.message.match(/relation "public\.([^"]+)" does not exist/);
          const missingTable = tableMatch ? tableMatch[1] : null;
          
          if (missingTable) {
            logger.debug(`Missing table detected`, { missingTable, agencyDatabase });
            
            // Document tables - repair misc schema
            if (['document_folders', 'documents', 'document_versions', 'document_permissions'].includes(missingTable)) {
              // Ensure shared functions first (needed for triggers)
              const { ensureSharedFunctions } = require('../utils/schema/sharedFunctions');
              try {
                await ensureSharedFunctions(agencyClient);
                logger.debug(`Shared functions ensured`, { agencyDatabase });
              } catch (funcError) {
                logger.warn(`Could not ensure shared functions`, { error: funcError.message, agencyDatabase });
                // Continue anyway - tables can be created without triggers
              }
              
              const { ensureMiscSchema } = require('../utils/schema/miscSchema');
              await ensureMiscSchema(agencyClient);
              logger.debug(`Document tables schema repair completed, retrying query...`, { missingTable, agencyDatabase });
            }
            // Holidays and company events - repair misc schema
            else if (['holidays', 'company_events', 'calendar_settings', 'notifications'].includes(missingTable)) {
              const { ensureMiscSchema, ensureNotificationsTable } = require('../utils/schema/miscSchema');
              // Explicitly ensure notifications table first
              if (missingTable === 'notifications') {
                await ensureNotificationsTable(agencyClient);
                logger.debug(`Notifications table explicitly created`, { agencyDatabase });
              }
              await ensureMiscSchema(agencyClient);
              logger.debug(`Miscellaneous schema repair completed`, { missingTable, agencyDatabase });
            }
            // Leave requests - repair HR schema
            else if (['leave_requests', 'leave_types', 'employee_details', 'employee_salary_details', 'employee_files', 'payroll', 'payroll_periods'].includes(missingTable)) {
              const { ensureHrSchema } = require('../utils/schema/hrSchema');
              await ensureHrSchema(agencyClient);
              logger.debug(`HR schema repair completed`, { missingTable, agencyDatabase });
            }
            // Reimbursement - repair reimbursement schema
            else if (['reimbursement_requests', 'reimbursement_attachments', 'expense_categories'].includes(missingTable)) {
              const { ensureReimbursementSchema } = require('../utils/schema/reimbursementSchema');
              await ensureReimbursementSchema(agencyClient);
              logger.debug(`Reimbursement schema repair completed`, { missingTable, agencyDatabase });
            }
            // Projects and tasks - repair projects schema
            else if (['projects', 'tasks', 'task_assignments', 'task_comments', 'task_time_tracking'].includes(missingTable)) {
              const { ensureProjectsTasksSchema } = require('../utils/schema/projectsTasksSchema');
              await ensureProjectsTasksSchema(agencyClient);
              logger.debug(`Projects schema repair completed`, { missingTable, agencyDatabase });
            }
            // Invoices and clients - repair clients financial schema
            else if (['invoices', 'clients', 'quotations', 'quotation_templates', 'quotation_line_items'].includes(missingTable)) {
              const { ensureClientsFinancialSchema } = require('../utils/schema/clientsFinancialSchema');
              await ensureClientsFinancialSchema(agencyClient);
              logger.debug(`Clients/Financial schema repair completed`, { missingTable, agencyDatabase });
            }
            // GST tables - repair GST schema
            else if (missingTable.startsWith('gst_')) {
              const { ensureGstSchema } = require('../utils/schema/gstSchema');
              await ensureGstSchema(agencyClient);
              logger.debug(`GST schema repair completed`, { missingTable, agencyDatabase });
            }
            // For other missing tables, run full schema creation
            else {
              const { createAgencySchema } = require('../utils/schemaCreator');
              await createAgencySchema(agencyClient);
              logger.debug(`Full schema repair completed`, { missingTable, agencyDatabase });
            }
          } else {
            // If we can't identify the table, run full schema creation
            const { createAgencySchema } = require('../utils/schemaCreator');
            await createAgencySchema(agencyClient);
            logger.debug(`Full schema repair completed`, { agencyDatabase });
          }
          
          // Wait a moment for schema to be fully available
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify table exists before retrying
          const tableCheck = await agencyClient.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )
          `, [missingTable]);
          
          if (!tableCheck.rows[0].exists) {
            logger.error(`Table still does not exist after schema repair`, { missingTable, agencyDatabase });
            // Try one more time with explicit table creation
            if (missingTable === 'document_folders') {
              const { ensureDocumentFoldersTable } = require('../utils/schema/miscSchema');
              await ensureDocumentFoldersTable(agencyClient);
              logger.debug(`Explicitly created table`, { missingTable, agencyDatabase });
            } else if (missingTable === 'documents') {
              const { ensureDocumentsTable } = require('../utils/schema/miscSchema');
              await ensureDocumentsTable(agencyClient);
              logger.debug(`Explicitly created table`, { missingTable, agencyDatabase });
            } else if (missingTable === 'notifications') {
              const { ensureNotificationsTable } = require('../utils/schema/miscSchema');
              await ensureNotificationsTable(agencyClient);
              logger.debug(`Explicitly created table`, { missingTable, agencyDatabase });
            } else {
              throw new Error(`Table ${missingTable} was not created`);
            }
          }
          
          logger.debug(`Verified table exists, retrying query...`, { missingTable, agencyDatabase });
          
          // Retry the query
          const retryResult = await executeQuery(sql, params, agencyDatabase, userId);
          logger.debug(`Query retry successful after schema repair`, { missingTable, agencyDatabase });
          return res.json({
            rows: retryResult.rows,
            rowCount: retryResult.rowCount,
          });
        } finally {
          agencyClient.release();
          await agencyPool.end();
        }
      } catch (repairError) {
        logger.error('Schema repair failed', {
          error: repairError.message,
          stack: repairError.stack,
          agencyDatabase,
        });
        // Fall through to return original error
      }
    }

    // If it's a NOT NULL constraint violation for leads.name, try to make it nullable and retry
    if (error.code === '23502' && agencyDatabase && error.message.includes('column "name" of relation "leads"')) {
      logger.info('NOT NULL constraint violation detected for leads.name, attempting to make nullable', { agencyDatabase });
      try {
        const { host, port, user, password } = parseDatabaseUrl();
        const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
        const { Pool } = require('pg');
        const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
        const agencyClient = await agencyPool.connect();
        try {
          await agencyClient.query('ALTER TABLE public.leads ALTER COLUMN name DROP NOT NULL');
          logger.info('Made leads.name column nullable', { agencyDatabase });
          
          // Wait a moment for the change to be fully available
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Retry the query
          const retryResult = await executeQuery(sql, params, agencyDatabase, userId);
          logger.info('Query retry successful after making leads.name nullable', { agencyDatabase });
          return res.json({
            rows: retryResult.rows,
            rowCount: retryResult.rowCount,
          });
        } finally {
          agencyClient.release();
          await agencyPool.end();
        }
      } catch (repairError) {
        logger.error('Failed to make leads.name nullable', {
          error: repairError.message,
          code: repairError.code,
          agencyDatabase,
        });
        // Fall through to return original error
      }
    }

    // DISABLED: Automatic column repair consumes too much CPU
    // Columns should be added via migrations, not on every query error
    // Only repair if explicitly enabled via environment variable
    if (false && error.code === '42703' && agencyDatabase && error.message.includes('does not exist') && !req._columnRepairAttempted && process.env.ENABLE_SCHEMA_REPAIR === 'true') {
      req._columnRepairAttempted = true; // Prevent infinite loops
      const columnMatch = error.message.match(/column "([^"]+)" of relation "([^"]+)"/);
      if (columnMatch) {
        const [, columnName, tableName] = columnMatch;
        logger.debug(`Missing column detected, attempting to add`, { tableName, columnName, agencyDatabase });
        
        // Special handling for reimbursement tables - run full reimbursement schema repair
        if (tableName === 'reimbursement_requests' || tableName === 'expense_categories') {
          try {
            logger.debug(`Running reimbursement schema repair`, { tableName, columnName, agencyDatabase });
            const { host, port, user, password } = parseDatabaseUrl();
            const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
            const { Pool } = require('pg');
            const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
            const agencyClient = await agencyPool.connect();
            try {
              const { ensureReimbursementSchema } = require('../utils/schema/reimbursementSchema');
              await ensureReimbursementSchema(agencyClient);
              logger.debug(`Reimbursement schema repair completed`, { tableName, columnName, agencyDatabase });
            } finally {
              agencyClient.release();
              await agencyPool.end();
            }
            
            // Wait a moment for schema to be fully available
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Retry the query
            const retryResult = await executeQuery(sql, params, agencyDatabase, userId);
            logger.debug(`Query retry successful after reimbursement schema repair`, { tableName, columnName, agencyDatabase });
            return res.json({
              rows: retryResult.rows,
              rowCount: retryResult.rowCount,
            });
          } catch (repairError) {
            logger.error('Reimbursement schema repair failed', {
              error: repairError.message,
              code: repairError.code,
              tableName,
              columnName,
              agencyDatabase,
            });
            // Fall through to return original error
          }
        }
        
        // Special handling for clients billing columns - add all at once
        const billingColumns = ['billing_city', 'billing_state', 'billing_postal_code', 'billing_country'];
        const isBillingColumn = tableName === 'clients' && billingColumns.includes(columnName);
        
        try {
          if (isBillingColumn) {
            // For billing columns, add all of them at once to prevent multiple repair cycles
            logger.debug(`Detected missing billing column, adding all billing columns to clients table`, { columnName, agencyDatabase });
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
                logger.debug(`Adding missing billing columns`, { missingColumns, agencyDatabase });
                for (const col of missingColumns) {
                  await agencyClient.query(`ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ${col} TEXT`);
                }
                logger.debug(`Added all missing billing columns to clients table`, { missingColumns, agencyDatabase });
              } else {
                logger.debug(`All billing columns already exist`, { agencyDatabase });
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
          logger.debug(`Query retry successful after adding column`, { tableName, columnName, agencyDatabase });
          return res.json({
            rows: retryResult.rows,
            rowCount: retryResult.rowCount,
          });
        } catch (repairError) {
          logger.error('Column repair failed', {
            error: repairError.message,
            code: repairError.code,
            tableName,
            columnName,
            agencyDatabase,
          });
          // Try one more time with full schema repair
          try {
            logger.debug('Attempting full schema repair as fallback', { tableName, columnName, agencyDatabase });
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
            logger.error('Full schema repair also failed', {
              error: fallbackError.message,
              code: fallbackError.code,
              tableName,
              columnName,
              agencyDatabase,
            });
            // Fall through to return original error
          }
        }
      }
    }

    // Return detailed error information for debugging
    const errorDetails = {
      error: error.message || 'Database query failed',
      detail: error.detail,
      code: error.code,
      hint: error.hint,
      position: error.position,
      internalQuery: error.internalQuery,
      internalPosition: error.internalPosition,
      where: error.where,
      schema: error.schema,
      table: error.table,
      column: error.column,
      dataType: error.dataType,
      constraint: error.constraint,
      file: error.file,
      line: error.line,
      routine: error.routine
    };
    
    // Remove undefined fields
    Object.keys(errorDetails).forEach(key => {
      if (errorDetails[key] === undefined) {
        delete errorDetails[key];
      }
    });
    
    res.status(500).json(errorDetails);
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
    logger.error('Database transaction error', {
      error: error.message,
      code: error.code,
      detail: error.detail,
      agencyDatabase: req.headers['x-agency-database'],
    });
    return send(res, errorResponse(
      error.message,
      error.code || 'TRANSACTION_FAILED',
      { detail: error.detail },
      500
    ));
  }
}));

module.exports = router;

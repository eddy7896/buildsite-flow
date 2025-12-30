/**
 * Centralized Database Query Helper
 * Provides unified interface for all database queries with consistent error handling,
 * logging, connection management, and retry logic.
 */

const logger = require('./logger');
const { getAgencyPool, getMainPool } = require('../utils/poolManager');

/**
 * Query execution options
 * @typedef {Object} QueryOptions
 * @property {string} [agencyDatabase] - Agency database name (for agency-specific queries)
 * @property {string} [userId] - User ID for audit context
 * @property {number} [timeout] - Query timeout in milliseconds (default: 60000)
 * @property {boolean} [useTransaction] - Whether to use transaction (default: false)
 * @property {boolean} [retryOnError] - Whether to retry on transient errors (default: true)
 * @property {number} [maxRetries] - Maximum number of retries (default: 2)
 */

/**
 * Execute a database query with consistent error handling and logging
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @param {QueryOptions} options - Query options
 * @returns {Promise<Object>} Query result with rows and rowCount
 */
async function query(sql, params = [], options = {}) {
  const {
    agencyDatabase = null,
    userId = null,
    timeout = 60000,
    useTransaction = false,
    retryOnError = true,
    maxRetries = 2,
  } = options;

  const trimmedSql = sql.trim();
  const startTime = Date.now();
  let retryCount = 0;

  // Determine which pool to use
  const pool = agencyDatabase ? getAgencyPool(agencyDatabase) : getMainPool();

  // Log query (truncated for security)
  const logQuery = trimmedSql.substring(0, 200);
  logger.debug('Executing database query', {
    query: logQuery,
    hasParams: params.length > 0,
    agencyDatabase,
    userId,
    timeout,
  });

  while (retryCount <= maxRetries) {
    let client = null;
    try {
      if (useTransaction || userId) {
        // Use transaction for user context or explicit transaction requests
        client = await pool.connect();
        
        try {
          await client.query('BEGIN');
          
          // Set user context for audit logs if userId provided
          if (userId) {
            const { validateUUID, setSessionVariable } = require('./securityUtils');
            try {
              validateUUID(userId);
              await setSessionVariable(client, 'app.current_user_id', userId);
            } catch (uuidError) {
              logger.warn('Invalid userId provided, skipping audit context', {
                userId,
                error: uuidError.message,
              });
            }
          }

          // Execute query with timeout
          const result = await Promise.race([
            client.query(trimmedSql, params),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout')), timeout)
            ),
          ]);

          await client.query('COMMIT');
          
          const duration = Date.now() - startTime;
          logger.logQuery(trimmedSql, duration, params);
          
          return result;
        } catch (error) {
          await client.query('ROLLBACK').catch(() => {
            // Ignore rollback errors
          });
          throw error;
        } finally {
          if (client) {
            client.release();
          }
        }
      } else {
        // Simple query without transaction
        const result = await Promise.race([
          pool.query(trimmedSql, params),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          ),
        ]);

        const duration = Date.now() - startTime;
        logger.logQuery(trimmedSql, duration, params);
        
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      
      if (retryOnError && isRetryable && retryCount < maxRetries) {
        retryCount++;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Exponential backoff, max 5s
        
        logger.warn('Query failed, retrying', {
          query: logQuery,
          retryCount,
          maxRetries,
          error: error.message,
          delay: retryDelay,
        });
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // Log error
      logger.error('Database query failed', {
        query: logQuery,
        params: params.length > 0 ? '[REDACTED]' : null,
        error: error.message,
        code: error.code,
        duration: `${duration}ms`,
        retryCount,
        agencyDatabase,
      });

      // Enhance error with context
      const enhancedError = new Error(`Database query failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.code = error.code || 'DATABASE_ERROR';
      enhancedError.query = logQuery;
      enhancedError.duration = duration;
      
      throw enhancedError;
    }
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {Array<{sql: string, params?: Array}>} queries - Array of query objects
 * @param {QueryOptions} options - Query options
 * @returns {Promise<Array>} Array of query results
 */
async function transaction(queries, options = {}) {
  const {
    agencyDatabase = null,
    userId = null,
    timeout = 60000,
  } = options;

  if (!Array.isArray(queries) || queries.length === 0) {
    throw new Error('Queries array is required and must not be empty');
  }

  const pool = agencyDatabase ? getAgencyPool(agencyDatabase) : getMainPool();
  const client = await pool.connect();
  const startTime = Date.now();

  logger.info('Starting database transaction', {
    queryCount: queries.length,
    agencyDatabase,
    userId,
  });

  try {
    await client.query('BEGIN');

    // Set user context if provided
    if (userId) {
      const { validateUUID, setSessionVariable } = require('./securityUtils');
      try {
        validateUUID(userId);
        await setSessionVariable(client, 'app.current_user_id', userId);
      } catch (uuidError) {
        logger.warn('Invalid userId provided, skipping audit context', {
          userId,
          error: uuidError.message,
        });
      }
    }

    const results = [];

    for (const { sql, params = [] } of queries) {
      const trimmedSql = sql.trim();
      const queryStartTime = Date.now();

      try {
        const result = await Promise.race([
          client.query(trimmedSql, params),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          ),
        ]);

        const queryDuration = Date.now() - queryStartTime;
        logger.logQuery(trimmedSql, queryDuration, params);

        results.push({
          rows: result.rows,
          rowCount: result.rowCount,
        });
      } catch (error) {
        logger.error('Transaction query failed', {
          query: trimmedSql.substring(0, 200),
          error: error.message,
          queryIndex: results.length,
        });
        throw error;
      }
    }

    await client.query('COMMIT');
    
    const duration = Date.now() - startTime;
    logger.info('Transaction completed successfully', {
      queryCount: queries.length,
      duration: `${duration}ms`,
    });

    return results;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {
      // Ignore rollback errors
    });

    const duration = Date.now() - startTime;
    logger.error('Transaction failed, rolled back', {
      queryCount: queries.length,
      error: error.message,
      duration: `${duration}ms`,
    });

    const enhancedError = new Error(`Transaction failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.code = error.code || 'TRANSACTION_ERROR';
    
    throw enhancedError;
  } finally {
    client.release();
  }
}

/**
 * Check if an error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error) {
  // Connection errors
  if (
    error.message?.includes('timeout') ||
    error.message?.includes('Connection terminated') ||
    error.message?.includes('ECONNREFUSED') ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ECONNREFUSED' ||
    error.code === '57P01' || // Admin shutdown
    error.code === '57P02' || // Crash shutdown
    error.code === '57P03'    // Cannot connect now
  ) {
    return true;
  }

  // Deadlock and lock timeout errors
  if (
    error.code === '40P01' || // Deadlock detected
    error.code === '55P03'    // Lock not available
  ) {
    return true;
  }

  return false;
}

/**
 * Execute a query and return a single row
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @param {QueryOptions} options - Query options
 * @returns {Promise<Object|null>} Single row or null
 */
async function queryOne(sql, params = [], options = {}) {
  const result = await query(sql, params, options);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Execute a query and return all rows
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @param {QueryOptions} options - Query options
 * @returns {Promise<Array>} Array of rows
 */
async function queryMany(sql, params = [], options = {}) {
  const result = await query(sql, params, options);
  return result.rows;
}

module.exports = {
  query,
  queryOne,
  queryMany,
  transaction,
};


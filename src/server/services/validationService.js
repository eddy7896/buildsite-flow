/**
 * Validation Service
 * 
 * Centralized validation checks with request-level caching to prevent duplicate queries.
 * All existence checks should go through this service.
 */

const { getAgencyPool } = require('../utils/poolManager');
const { pool } = require('../config/database');

// Request-level cache for validation results
// Key format: "validation:type:value:agencyDatabase"
const validationCache = new WeakMap();

/**
 * Get validation cache key for request
 */
function getValidationCacheKey(req, type, value, agencyDatabase) {
  if (!req._validationCache) {
    req._validationCache = new Map();
  }
  return `${type}:${value}:${agencyDatabase || 'main'}`;
}

/**
 * Check if email exists in database
 * Uses request-level caching to avoid duplicate queries
 * 
 * @param {string} email - Email to check
 * @param {string} agencyDatabase - Agency database name (optional, uses main DB if not provided)
 * @param {string} excludeUserId - User ID to exclude from check (for updates)
 * @param {Object} req - Express request object (for caching)
 * @returns {Promise<boolean>} True if email exists
 */
async function checkEmailExists(email, agencyDatabase, excludeUserId = null, req = null) {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const cacheKey = req ? getValidationCacheKey(req, 'email', normalizedEmail, agencyDatabase) : null;

  // Check cache first
  if (req && req._validationCache && req._validationCache.has(cacheKey)) {
    return req._validationCache.get(cacheKey);
  }

  try {
    let client;
    let shouldRelease = true;

    if (agencyDatabase) {
      const agencyPool = await getAgencyPool(agencyDatabase);
      client = await agencyPool.connect();
    } else {
      client = await pool.connect();
    }

    try {
      let query;
      let params;

      if (excludeUserId) {
        query = 'SELECT id FROM public.users WHERE LOWER(email) = $1 AND id != $2 LIMIT 1';
        params = [normalizedEmail, excludeUserId];
      } else {
        query = 'SELECT id FROM public.users WHERE LOWER(email) = $1 LIMIT 1';
        params = [normalizedEmail];
      }

      const result = await client.query(query, params);
      const exists = result.rows.length > 0;

      // Cache result
      if (req && cacheKey) {
        if (!req._validationCache) {
          req._validationCache = new Map();
        }
        req._validationCache.set(cacheKey, exists);
      }

      return exists;
    } finally {
      if (shouldRelease) {
        client.release();
      }
    }
  } catch (error) {
    console.error('[Validation] Error checking email existence:', error);
    // On error, don't cache - return false to allow operation
    return false;
  }
}

/**
 * Check if employee ID exists in database
 * Uses request-level caching to avoid duplicate queries
 * 
 * @param {string} employeeId - Employee ID to check
 * @param {string} agencyDatabase - Agency database name
 * @param {string} excludeUserId - User ID to exclude from check (for updates)
 * @param {Object} req - Express request object (for caching)
 * @returns {Promise<boolean>} True if employee ID exists
 */
async function checkEmployeeIdExists(employeeId, agencyDatabase, excludeUserId = null, req = null) {
  if (!employeeId || !agencyDatabase) {
    return false;
  }

  const normalizedEmployeeId = employeeId.trim();
  const cacheKey = req ? getValidationCacheKey(req, 'employeeId', normalizedEmployeeId, agencyDatabase) : null;

  // Check cache first
  if (req && req._validationCache && req._validationCache.has(cacheKey)) {
    return req._validationCache.get(cacheKey);
  }

  try {
    const agencyPool = await getAgencyPool(agencyDatabase);
    const client = await agencyPool.connect();

    try {
      let query;
      let params;

      if (excludeUserId) {
        query = `
          SELECT ed.id 
          FROM public.employee_details ed
          INNER JOIN public.users u ON u.id = ed.user_id
          WHERE ed.employee_id = $1 AND u.id != $2
          LIMIT 1
        `;
        params = [normalizedEmployeeId, excludeUserId];
      } else {
        query = `
          SELECT ed.id 
          FROM public.employee_details ed
          WHERE ed.employee_id = $1
          LIMIT 1
        `;
        params = [normalizedEmployeeId];
      }

      const result = await client.query(query, params);
      const exists = result.rows.length > 0;

      // Cache result
      if (req && cacheKey) {
        if (!req._validationCache) {
          req._validationCache = new Map();
        }
        req._validationCache.set(cacheKey, exists);
      }

      return exists;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Validation] Error checking employee ID existence:', error);
    return false;
  }
}

/**
 * Check if holiday exists on a specific date
 * Uses request-level caching to avoid duplicate queries
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} agencyDatabase - Agency database name
 * @param {string} excludeHolidayId - Holiday ID to exclude from check (for updates)
 * @param {Object} req - Express request object (for caching)
 * @returns {Promise<boolean>} True if holiday exists on date
 */
async function checkHolidayExists(date, agencyDatabase, excludeHolidayId = null, req = null) {
  if (!date || !agencyDatabase) {
    return false;
  }

  const cacheKey = req ? getValidationCacheKey(req, 'holiday', date, agencyDatabase) : null;

  // Check cache first
  if (req && req._validationCache && req._validationCache.has(cacheKey)) {
    return req._validationCache.get(cacheKey);
  }

  try {
    const agencyPool = await getAgencyPool(agencyDatabase);
    const client = await agencyPool.connect();

    try {
      let query;
      let params;

      if (excludeHolidayId) {
        query = 'SELECT id FROM public.holidays WHERE date = $1 AND id != $2 LIMIT 1';
        params = [date, excludeHolidayId];
      } else {
        query = 'SELECT id FROM public.holidays WHERE date = $1 LIMIT 1';
        params = [date];
      }

      const result = await client.query(query, params);
      const exists = result.rows.length > 0;

      // Cache result
      if (req && cacheKey) {
        if (!req._validationCache) {
          req._validationCache = new Map();
        }
        req._validationCache.set(cacheKey, exists);
      }

      return exists;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Validation] Error checking holiday existence:', error);
    return false;
  }
}

/**
 * Clear validation cache for a request
 * Useful for testing or when you need to force re-validation
 */
function clearValidationCache(req) {
  if (req && req._validationCache) {
    req._validationCache.clear();
  }
}

module.exports = {
  checkEmailExists,
  checkEmployeeIdExists,
  checkHolidayExists,
  clearValidationCache,
};


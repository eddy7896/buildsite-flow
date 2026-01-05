/**
 * Maintenance Mode Middleware
 * Checks agency-specific maintenance mode and blocks agency users
 * Super admin routes are always accessible
 */

const { pool } = require('../config/database');
const { getAgencyPool } = require('../utils/poolManager');

// Cache agency maintenance status to avoid database queries on every request
const maintenanceCache = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Get agency maintenance status from main database (agencies table)
 */
async function getAgencyMaintenanceFromMainDB(agencyDatabase) {
  if (!agencyDatabase) return null;

  const cacheKey = `main_${agencyDatabase}`;
  const cached = maintenanceCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT maintenance_mode, maintenance_message
      FROM public.agencies
      WHERE database_name = $1
      LIMIT 1
    `, [agencyDatabase]);

    const data = result.rows.length > 0 ? {
      maintenance_mode: result.rows[0].maintenance_mode || false,
      maintenance_message: result.rows[0].maintenance_message || null,
    } : null;

    maintenanceCache.set(cacheKey, { data, timestamp: now });
    return data;
  } catch (error) {
    console.warn('[Maintenance] Could not fetch agency maintenance from main DB:', error.message);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Get agency maintenance status from agency database (agency_settings table)
 */
async function getAgencyMaintenanceFromAgencyDB(agencyDatabase) {
  if (!agencyDatabase) return null;

  const cacheKey = `agency_${agencyDatabase}`;
  const cached = maintenanceCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const agencyPool = getAgencyPool(agencyDatabase);
    const client = await agencyPool.connect();

    try {
      const result = await client.query(`
        SELECT maintenance_mode, maintenance_message
        FROM public.agency_settings
        LIMIT 1
      `);

      const data = result.rows.length > 0 ? {
        maintenance_mode: result.rows[0].maintenance_mode || false,
        maintenance_message: result.rows[0].maintenance_message || null,
      } : null;

      maintenanceCache.set(cacheKey, { data, timestamp: now });
      return data;
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('[Maintenance] Could not fetch agency maintenance from agency DB:', error.message);
    return null;
  }
}

/**
 * Clear maintenance cache for an agency
 */
function clearMaintenanceCache(agencyDatabase) {
  if (agencyDatabase) {
    maintenanceCache.delete(`main_${agencyDatabase}`);
    maintenanceCache.delete(`agency_${agencyDatabase}`);
  } else {
    maintenanceCache.clear();
  }
}

/**
 * Check if user is super admin
 */
function isSuperAdmin(req) {
  if (!req.user) return false;
  
  // Check roles array
  if (req.user.roles && Array.isArray(req.user.roles)) {
    return req.user.roles.includes('super_admin');
  }
  
  // Check role string
  if (req.user.role === 'super_admin') {
    return true;
  }

  // Check isSystemSuperAdmin flag
  if (req.user.isSystemSuperAdmin === true) {
    return true;
  }

  return false;
}

/**
 * Check if route is a super admin route (always accessible)
 */
function isSuperAdminRoute(path) {
  const superAdminPaths = [
    '/api/system/',
    '/api/super-admin/',
  ];
  
  return superAdminPaths.some(prefix => path.startsWith(prefix));
}

/**
 * Maintenance mode middleware
 * Blocks agency users if their agency is in maintenance mode
 * Super admin routes and super admin users always bypass
 */
async function maintenanceMode(req, res, next) {
  // Always allow these paths
  const alwaysAllowPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
    '/api/system/health',
    '/api/system/maintenance-status', // Public endpoint for checking status
  ];

  if (alwaysAllowPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Super admin routes are always accessible
  if (isSuperAdminRoute(req.path)) {
    return next();
  }

  // Super admin users always bypass maintenance
  if (isSuperAdmin(req)) {
    return next();
  }

  // Get agency database from header
  const agencyDatabase = req.headers['x-agency-database'] || 
                        req.headers['X-Agency-Database'] ||
                        null;

  // If no agency database header, allow request (might be public route)
  if (!agencyDatabase) {
    return next();
  }

  try {
    // Check maintenance mode from both sources
    // Main DB (agencies table) takes precedence - super admin can override
    const mainDBMaintenance = await getAgencyMaintenanceFromMainDB(agencyDatabase);
    const agencyDBMaintenance = await getAgencyMaintenanceFromAgencyDB(agencyDatabase);

    // Check main DB first (super admin override)
    if (mainDBMaintenance && mainDBMaintenance.maintenance_mode) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'MAINTENANCE_MODE',
          message: mainDBMaintenance.maintenance_message || 'This agency is currently under maintenance. Please check back later.',
        },
        message: mainDBMaintenance.maintenance_message || 'Agency is under maintenance',
        maintenance_mode: true,
      });
    }

    // Check agency DB (agency admin setting)
    if (agencyDBMaintenance && agencyDBMaintenance.maintenance_mode) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'MAINTENANCE_MODE',
          message: agencyDBMaintenance.maintenance_message || 'This agency is currently under maintenance. Please check back later.',
        },
        message: agencyDBMaintenance.maintenance_message || 'Agency is under maintenance',
        maintenance_mode: true,
      });
    }

    // No maintenance mode active, continue
    next();
  } catch (error) {
    // On error, allow request to proceed (fail open)
    console.error('[Maintenance] Error checking maintenance mode:', error);
    next();
  }
}

module.exports = {
  maintenanceMode,
  clearMaintenanceCache,
  getAgencyMaintenanceFromMainDB,
  getAgencyMaintenanceFromAgencyDB,
};

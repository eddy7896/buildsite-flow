/**
 * Maintenance Mode Middleware
 * Checks system settings for maintenance mode and blocks non-super-admin requests
 */

const { pool } = require('../config/database');

// Cache system settings to avoid database queries on every request
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Get system settings (with caching)
 */
async function getSystemSettings() {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (settingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return settingsCache;
  }

  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT maintenance_mode, maintenance_message
      FROM public.system_settings
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      settingsCache = result.rows[0];
      cacheTimestamp = now;
      return settingsCache;
    }

    // Default: maintenance mode disabled
    settingsCache = { maintenance_mode: false, maintenance_message: null };
    cacheTimestamp = now;
    return settingsCache;
  } catch (error) {
    // If table doesn't exist or error, assume maintenance mode is off
    console.warn('[Maintenance] Could not fetch system settings:', error.message);
    settingsCache = { maintenance_mode: false, maintenance_message: null };
    cacheTimestamp = now;
    return settingsCache;
  } finally {
    client.release();
  }
}

/**
 * Clear settings cache (call this when settings are updated)
 */
function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = null;
}

/**
 * Maintenance mode middleware
 * Blocks all requests except:
 * - Super admin users
 * - Login/authentication endpoints
 * - Health check endpoints
 */
async function maintenanceMode(req, res, next) {
  // Skip maintenance check for these paths
  const skipPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
    '/api/system/health',
    '/api/system/settings', // Super admin needs to access settings to disable maintenance
  ];

  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  try {
    const settings = await getSystemSettings();

    if (settings.maintenance_mode) {
      // Allow super admin to bypass maintenance mode
      if (req.user && req.user.roles && req.user.roles.includes('super_admin')) {
        return next();
      }

      // Return maintenance response
      return res.status(503).json({
        success: false,
        error: {
          code: 'MAINTENANCE_MODE',
          message: settings.maintenance_message || 'The system is currently under maintenance. Please check back later.',
        },
        message: settings.maintenance_message || 'System is under maintenance',
        maintenance_mode: true,
      });
    }

    // Maintenance mode is off, continue
    next();
  } catch (error) {
    // On error, allow request to proceed (fail open)
    console.error('[Maintenance] Error checking maintenance mode:', error);
    next();
  }
}

module.exports = {
  maintenanceMode,
  getSystemSettings,
  clearSettingsCache,
};


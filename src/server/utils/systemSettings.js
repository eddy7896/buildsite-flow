/**
 * System Settings Utility
 * Provides cached access to system settings across the application
 */

const { pool } = require('../config/database');

// Cache system settings
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Get all system settings (with caching)
 * @returns {Promise<Object>} System settings object
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
      SELECT * FROM public.system_settings
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      settingsCache = result.rows[0];
      cacheTimestamp = now;
      return settingsCache;
    }

    // Return default settings if none exist
    const defaults = {
      maintenance_mode: false,
      maintenance_message: null,
      email_provider: 'smtp',
      smtp_host: null,
      smtp_port: 587,
      smtp_user: null,
      smtp_password: null,
      smtp_from: null,
      password_min_length: 8,
      session_timeout_minutes: 60,
      max_login_attempts: 5,
      lockout_duration_minutes: 30,
      require_email_verification: true,
      enable_two_factor: false,
      enable_captcha: false,
      enable_rate_limiting: true,
      rate_limit_requests_per_minute: 60,
      file_storage_provider: 'local',
      file_storage_path: '/app/storage',
      max_file_size_mb: 10,
      api_rate_limit_enabled: true,
      api_rate_limit_requests_per_minute: 100,
      log_level: 'info',
      enable_audit_logging: true,
      enable_auto_backup: true,
      backup_frequency_hours: 24,
      backup_retention_days: 7,
    };

    settingsCache = defaults;
    cacheTimestamp = now;
    return defaults;
  } catch (error) {
    // If table doesn't exist or error, return defaults
    console.warn('[SystemSettings] Could not fetch system settings:', error.message);
    const defaults = {
      maintenance_mode: false,
      maintenance_message: null,
    };
    settingsCache = defaults;
    cacheTimestamp = now;
    return defaults;
  } finally {
    client.release();
  }
}

/**
 * Get a specific setting value
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if not found
 * @returns {Promise<any>} Setting value
 */
async function getSetting(key, defaultValue = null) {
  const settings = await getSystemSettings();
  return settings[key] !== undefined ? settings[key] : defaultValue;
}

/**
 * Clear settings cache (call this when settings are updated)
 */
function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = null;
}

/**
 * Get email configuration from system settings
 * @returns {Promise<Object>} Email configuration
 */
async function getEmailConfig() {
  const settings = await getSystemSettings();
  
  return {
    provider: settings.email_provider || 'smtp',
    smtp: {
      host: settings.smtp_host || process.env.SMTP_HOST,
      port: settings.smtp_port || parseInt(process.env.SMTP_PORT || '587', 10),
      user: settings.smtp_user || process.env.SMTP_USER,
      password: settings.smtp_password || process.env.SMTP_PASSWORD,
      from: settings.smtp_from || process.env.SMTP_FROM,
      secure: settings.smtp_secure || false,
    },
    sendgrid: {
      apiKey: settings.sendgrid_api_key || process.env.SENDGRID_API_KEY,
      from: settings.sendgrid_from || process.env.SENDGRID_FROM,
    },
    mailgun: {
      apiKey: settings.mailgun_api_key || process.env.MAILGUN_API_KEY,
      domain: settings.mailgun_domain || process.env.MAILGUN_DOMAIN,
    },
    awsSes: {
      region: settings.aws_ses_region || process.env.AWS_SES_REGION,
      accessKeyId: settings.aws_access_key_id || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: settings.aws_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY,
    },
    resend: {
      apiKey: settings.resend_api_key || process.env.RESEND_API_KEY,
      from: settings.resend_from || process.env.RESEND_FROM,
    },
  };
}

/**
 * Get security configuration from system settings
 * @returns {Promise<Object>} Security configuration
 */
async function getSecurityConfig() {
  const settings = await getSystemSettings();
  
  return {
    password: {
      minLength: settings.password_min_length || 8,
      requireUppercase: settings.password_require_uppercase !== false,
      requireLowercase: settings.password_require_lowercase !== false,
      requireNumbers: settings.password_require_numbers !== false,
      requireSymbols: settings.password_require_symbols || false,
      expiryDays: settings.password_expiry_days || 90,
    },
    session: {
      timeoutMinutes: settings.session_timeout_minutes || 60,
    },
    login: {
      maxAttempts: settings.max_login_attempts || 5,
      lockoutDurationMinutes: settings.lockout_duration_minutes || 30,
    },
    verification: {
      requireEmailVerification: settings.require_email_verification !== false,
      enableTwoFactor: settings.enable_two_factor || false,
    },
    captcha: {
      enabled: settings.enable_captcha || false,
      siteKey: settings.captcha_site_key,
      secretKey: settings.captcha_secret_key,
    },
    rateLimiting: {
      enabled: settings.enable_rate_limiting !== false,
      requestsPerMinute: settings.rate_limit_requests_per_minute || 60,
    },
  };
}

module.exports = {
  getSystemSettings,
  getSetting,
  clearSettingsCache,
  getEmailConfig,
  getSecurityConfig,
};


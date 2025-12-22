/**
 * Authentication Service
 * Handles user authentication across multiple agency databases
 */

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { parseDatabaseUrl } = require('../utils/poolManager');

/**
 * Search for user across all agency databases
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object|null>} User data with agency info or null
 */
async function findUserAcrossAgencies(email, password) {
  const mainClient = await pool.connect();

  try {
    // Get all active agencies with database names
    const agencies = await mainClient.query(`
      SELECT id, name, domain, database_name 
      FROM public.agencies 
      WHERE is_active = true AND database_name IS NOT NULL
    `);

    if (agencies.rows.length === 0) {
      return null;
    }

    const { host, port, user, password: dbPassword } = parseDatabaseUrl();
    let foundUser = null;
    let foundAgency = null;
    let userProfile = null;
    let userRoles = [];

    // Search each agency database for this user
    for (const agency of agencies.rows) {
      // Skip test databases that might not exist
      if (agency.database_name && agency.database_name.startsWith('test_')) {
        continue;
      }
      
      if (!agency.database_name) {
        continue;
      }

      try {
        const agencyDbUrl = `postgresql://${user}:${dbPassword}@${host}:${port}/${agency.database_name}`;
        const { Pool } = require('pg');
        const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
        const agencyClient = await agencyPool.connect();

        try {
          // Check which optional columns exist in the users table
          const columnCheck = await agencyClient.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name IN ('two_factor_enabled', 'two_factor_secret', 'password_policy_id')
          `);
          
          const availableColumns = columnCheck.rows.map(row => row.column_name);
          let hasTwoFactorEnabled = availableColumns.includes('two_factor_enabled');
          let hasTwoFactorSecret = availableColumns.includes('two_factor_secret');
          let hasPasswordPolicyId = availableColumns.includes('password_policy_id');
          
          // Auto-repair: Add missing columns if they don't exist
          if (!hasTwoFactorEnabled) {
            try {
              await agencyClient.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false');
              hasTwoFactorEnabled = true;
            } catch (addError) {
              // Column might have been added by another process, ignore
            }
          }
          
          if (!hasTwoFactorSecret) {
            try {
              await agencyClient.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT');
              hasTwoFactorSecret = true;
            } catch (addError) {
              // Column might have been added by another process, ignore
            }
          }
          
          if (!hasPasswordPolicyId) {
            try {
              await agencyClient.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_policy_id UUID');
              hasPasswordPolicyId = true;
            } catch (addError) {
              // Column might have been added by another process, ignore
            }
          }
          
          // Build query with all columns (they should all exist now)
          const selectColumns = 'id, email, password_hash, email_confirmed, is_active, two_factor_enabled, two_factor_secret, password_policy_id';
          
          // Check if user exists in this agency database
          const userResult = await agencyClient.query(
            `SELECT ${selectColumns}
             FROM public.users 
             WHERE email = $1`,
            [email]
          );

          if (userResult.rows.length > 0) {
            const dbUser = userResult.rows[0];
            
            // Verify password
            const passwordMatch = await bcrypt.compare(password, dbUser.password_hash);
            if (passwordMatch) {
              // Get user profile
              const profileResult = await agencyClient.query(
                `SELECT id, user_id, full_name, agency_id, phone, avatar_url
                 FROM public.profiles 
                 WHERE user_id = $1`,
                [dbUser.id]
              );

              // Get user roles
              const rolesResult = await agencyClient.query(
                `SELECT role FROM public.user_roles 
                 WHERE user_id = $1 AND agency_id = $2`,
                [dbUser.id, agency.id]
              );

              foundUser = dbUser;
              foundAgency = agency;
              userProfile = profileResult.rows[0] || null;
              userRoles = rolesResult.rows.map(r => r.role);
              
              // Update last sign in time
              await agencyClient.query(
                'UPDATE public.users SET last_sign_in_at = NOW() WHERE id = $1',
                [dbUser.id]
              );
              
              break; // Found user, stop searching
            }
          }
        } finally {
          agencyClient.release();
          await agencyPool.end();
        }
      } catch (error) {
        // Skip databases that don't exist or have connection issues
        // Only log if it's not a "database does not exist" error (3D000)
        // This prevents spam from test databases or deleted databases
        if (error.code !== '3D000') {
          console.warn(`[API] Error searching database ${agency.database_name}:`, error.message);
        }
        // Continue searching other databases
        continue;
      }
    }

    if (!foundUser || !foundAgency) {
      return null;
    }

    return {
      user: foundUser,
      agency: foundAgency,
      profile: userProfile,
      roles: userRoles,
    };
  } finally {
    mainClient.release();
  }
}

/**
 * Generate authentication token
 * @param {Object} user - User object
 * @param {Object} agency - Agency object
 * @returns {string} Base64 encoded token
 */
function generateToken(user, agency) {
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    agencyId: agency.id,
    agencyDatabase: agency.database_name,
    exp: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
    iat: Math.floor(Date.now() / 1000),
  };
  return Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
}

/**
 * Format user response for login
 * @param {Object} userData - User data from findUserAcrossAgencies
 * @returns {Object} Formatted user response
 */
function formatUserResponse(userData) {
  const { user, agency, profile, roles } = userData;

  return {
    id: user.id,
    email: user.email,
    email_confirmed: user.email_confirmed,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_sign_in_at: user.last_sign_in_at,
    profile: profile || undefined,
    roles: roles || [],
    agency: {
      id: agency.id,
      name: agency.name,
      domain: agency.domain,
      databaseName: agency.database_name,
    },
  };
}

module.exports = {
  findUserAcrossAgencies,
  generateToken,
  formatUserResponse,
};

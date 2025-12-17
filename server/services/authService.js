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
      try {
        const agencyDbUrl = `postgresql://${user}:${dbPassword}@${host}:${port}/${agency.database_name}`;
        const { Pool: AgencyPool } = require('pg');
        const agencyPool = new AgencyPool({ connectionString: agencyDbUrl, max: 1 });
        const agencyClient = await agencyPool.connect();

        try {
          const userResult = await agencyClient.query(
            'SELECT * FROM public.users WHERE email = $1 AND is_active = true',
            [email]
          );

          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (passwordMatch) {
              foundUser = user;
              foundAgency = agency;

              const profileResult = await agencyClient.query(
                'SELECT * FROM public.profiles WHERE user_id = $1',
                [user.id]
              );
              userProfile = profileResult.rows[0] || null;

              const rolesResult = await agencyClient.query(
                'SELECT * FROM public.user_roles WHERE user_id = $1',
                [user.id]
              );
              userRoles = rolesResult.rows;

              await agencyClient.query(
                'UPDATE public.users SET last_sign_in_at = NOW() WHERE id = $1',
                [user.id]
              );

              break;
            }
          }
        } finally {
          agencyClient.release();
          await agencyPool.end();
        }
      } catch (error) {
        console.warn(`[API] Error searching database ${agency.database_name}:`, error.message);
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

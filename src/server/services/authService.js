/**
 * Authentication Service
 * Handles user authentication across multiple agency databases
 */

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { parseDatabaseUrl } = require('../utils/poolManager');

/**
 * Search for user across all agency databases and main database (for super admins)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object|null>} User data with agency info or null
 */
async function findUserAcrossAgencies(email, password) {
  // Normalize email to lowercase for consistent lookup
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  if (!normalizedEmail) {
    throw new Error('Email is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }
  
  console.log('[Auth] findUserAcrossAgencies called with email:', normalizedEmail);
  const mainClient = await pool.connect();

  try {
    // FIRST: Check main database for super admin users
    // Super admins are in buildflow_db with role 'super_admin' and agency_id = NULL
    try {
      console.log('[Auth] Checking for super admin with email:', email);
      
      // Query only columns that definitely exist in buildflow_db users table
      // Note: profiles table uses 'phone' column, not 'phone_number'
      const superAdminCheck = await mainClient.query(`
        SELECT 
          u.id, 
          u.email, 
          u.password_hash, 
          u.email_confirmed, 
          u.is_active,
          u.created_at,
          u.updated_at,
          u.last_sign_in_at,
          ur.role,
          p.full_name,
          p.phone,
          p.avatar_url
        FROM public.users u
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id 
          AND ur.role = 'super_admin' 
          AND ur.agency_id IS NULL
        LEFT JOIN public.profiles p ON u.id = p.user_id
        WHERE LOWER(u.email) = LOWER($1)
          AND ur.role = 'super_admin'
          AND u.is_active = true
      `, [normalizedEmail]);
      
      console.log('[Auth] Super admin check result:', {
        found: superAdminCheck.rows.length > 0,
        rowCount: superAdminCheck.rows.length
      });

      if (superAdminCheck.rows.length > 0) {
        const dbUser = superAdminCheck.rows[0];
        console.log('[Auth] Found super admin user:', {
          email: dbUser.email,
          is_active: dbUser.is_active,
          role: dbUser.role,
          hasPasswordHash: !!dbUser.password_hash
        });
        
        // Verify password using pgcrypto crypt function
        // Check if password_hash uses bcrypt or pgcrypto format
        let passwordMatch = false;
        
        if (dbUser.password_hash) {
          // Verify password using pgcrypto crypt function
          // The password_hash was created with: crypt('password', gen_salt('bf'))
          // To verify: crypt('password', existing_hash) should equal existing_hash
          try {
            const cryptResult = await mainClient.query(
              `SELECT ($1 = crypt($2, $1)) as match`,
              [dbUser.password_hash, password]
            );
            passwordMatch = cryptResult.rows[0]?.match || false;
            console.log('[Auth] pgcrypto verification result:', passwordMatch);
          } catch (cryptError) {
            console.log('[Auth] pgcrypto verification failed, trying bcrypt:', cryptError.message);
            passwordMatch = false;
          }
          
          // If pgcrypto fails, try bcrypt (for backward compatibility)
          if (!passwordMatch) {
            try {
              passwordMatch = await bcrypt.compare(password, dbUser.password_hash);
              console.log('[Auth] bcrypt verification result:', passwordMatch);
            } catch (bcryptError) {
              console.log('[Auth] bcrypt verification failed:', bcryptError.message);
              passwordMatch = false;
            }
          }
        } else {
          console.log('[Auth] No password hash found for super admin');
        }
        
        console.log('[Auth] Super admin password verification final:', {
          email: dbUser.email,
          passwordMatch,
          hashPrefix: dbUser.password_hash?.substring(0, 20)
        });
        
        if (passwordMatch) {
          // Update last sign in time (if column exists)
          try {
            await mainClient.query(
              'UPDATE public.users SET last_sign_in_at = NOW() WHERE id = $1',
              [dbUser.id]
            );
          } catch (updateError) {
            // Column might not exist, ignore error
            console.warn(`[Auth] Could not update last_sign_in_at for super admin ${dbUser.id}:`, updateError.message);
          }

          // Return super admin user with special agency object
          return {
            user: {
              id: dbUser.id,
              email: dbUser.email,
              password_hash: dbUser.password_hash,
              email_confirmed: dbUser.email_confirmed,
              is_active: dbUser.is_active,
              two_factor_enabled: false, // Default for buildflow_db users
              two_factor_secret: null, // Default for buildflow_db users
              password_policy_id: null, // Default for buildflow_db users
              created_at: dbUser.created_at,
              updated_at: dbUser.updated_at,
              last_sign_in_at: dbUser.last_sign_in_at,
            },
            agency: {
              id: null, // Super admin has no agency
              name: 'BuildFlow System',
              domain: null,
              database_name: null, // Main database, not an agency database
            },
            profile: dbUser.full_name ? {
              id: null,
              user_id: dbUser.id,
              full_name: dbUser.full_name,
              agency_id: null,
              phone: dbUser.phone,
              avatar_url: dbUser.avatar_url,
            } : null,
            roles: ['super_admin'],
          };
        }
      }
    } catch (superAdminError) {
      // If super admin check fails (e.g., tables don't exist), continue to agency search
      console.warn('[Auth] Super admin check failed:', superAdminError.message);
    }

    // SECOND: Search agency databases for regular users
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
        // Use pool manager for agency database
        const { getAgencyPool } = require('../utils/poolManager');
        const agencyPool = getAgencyPool(agency.database_name);
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
          
          // Check if user exists in this agency database (case-insensitive email lookup)
          const userResult = await agencyClient.query(
            `SELECT ${selectColumns}
             FROM public.users 
             WHERE LOWER(email) = LOWER($1)`,
            [normalizedEmail]
          );

          if (userResult.rows.length > 0) {
            const dbUser = userResult.rows[0];
            
            // Verify password - check if password_hash exists
            if (!dbUser.password_hash) {
              console.warn(`[Auth] User ${normalizedEmail} has no password hash`);
              continue; // Skip this user, continue searching
            }
            
            // Verify password
            let passwordMatch = false;
            try {
              passwordMatch = await bcrypt.compare(password, dbUser.password_hash);
            } catch (bcryptError) {
              console.error(`[Auth] Password comparison error for ${normalizedEmail}:`, bcryptError.message);
              continue; // Skip this user, continue searching
            }
            if (passwordMatch) {
              // Get user profile
              const profileResult = await agencyClient.query(
                `SELECT id, user_id, full_name, agency_id, phone, avatar_url
                 FROM public.profiles 
                 WHERE user_id = $1`,
                [dbUser.id]
              );

              // Get user roles
              // In isolated databases, agency_id may be NULL or set to the agency ID
              // Query should handle both cases
              const rolesResult = await agencyClient.query(
                `SELECT role FROM public.user_roles 
                 WHERE user_id = $1 AND (agency_id IS NULL OR agency_id = $2)`,
                [dbUser.id, agency.id]
              );

              foundUser = dbUser;
              foundAgency = agency;
              userProfile = profileResult.rows[0] || null;
              userRoles = rolesResult.rows.map(r => r.role);
              
              // Update last sign in time (if column exists)
              try {
                await agencyClient.query(
                  'UPDATE public.users SET last_sign_in_at = NOW() WHERE id = $1',
                  [dbUser.id]
                );
              } catch (updateError) {
                // Column might not exist, ignore error
                console.warn(`[Auth] Could not update last_sign_in_at for user ${dbUser.id}:`, updateError.message);
              }
              
              break; // Found user, stop searching
            }
          }
        } finally {
          agencyClient.release();
          // Don't close pool - it's managed by pool manager
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
 * Generate secure JWT authentication token
 * @param {Object} user - User object
 * @param {Object} agency - Agency object
 * @returns {string} Signed JWT token
 */
function generateToken(user, agency) {
  const jwt = require('jsonwebtoken');
  const jwtSecret = process.env.VITE_JWT_SECRET || process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  // Ensure agency.id is properly set (handle both agency object and null cases)
  const agencyId = (agency && agency.id) ? agency.id : null;
  const agencyDatabase = (agency && agency.database_name) ? agency.database_name : null;
  
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    agencyId: agencyId, // Explicitly set - null for super admins, agency.id for agency users
    agencyDatabase: agencyDatabase, // Explicitly set - null for super admins, database_name for agency users
    isSuperAdmin: !agencyDatabase, // Flag to identify system-level super admins (no agency database)
  };
  

  // Generate signed JWT token
  return jwt.sign(tokenPayload, jwtSecret, {
    expiresIn: '24h',
    issuer: 'buildflow',
    audience: 'buildflow-api',
    algorithm: 'HS256',
  });
}

/**
 * Format user response for login
 * @param {Object} userData - User data from findUserAcrossAgencies
 * @returns {Object} Formatted user response
 */
function formatUserResponse(userData) {
  const { user, agency, profile, roles } = userData;


  // Ensure agency object always has id, even if agency is null (for super admins)
  const agencyResponse = agency ? {
    id: agency.id || null, // Explicitly handle null case
    name: agency.name || null,
    domain: agency.domain || null,
    databaseName: agency.database_name || null,
  } : {
    id: null,
    name: null,
    domain: null,
    databaseName: null,
  };

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
    agency: agencyResponse,
  };
}

module.exports = {
  findUserAcrossAgencies,
  generateToken,
  formatUserResponse,
};

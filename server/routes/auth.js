/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { findUserAcrossAgencies, generateToken, formatUserResponse } = require('../services/authService');

/**
 * POST /api/auth/login
 * Login endpoint - searches across all agency databases for the user
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password, twoFactorToken, recoveryCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
      message: 'Email and password are required',
    });
  }

  try {
    console.log('[Auth] Login attempt:', {
      email,
      hasTwoFactorToken: !!twoFactorToken,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
    });

    const userData = await findUserAcrossAgencies(email, password);

    if (!userData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        message: 'Invalid email or password',
      });
    }

    // Check if 2FA is enabled for this user
    const { parseDatabaseUrl } = require('../utils/poolManager');
    const { Pool } = require('pg');
    const twoFactorService = require('../services/twoFactorService');
    const { host, port, user, password: dbPassword } = parseDatabaseUrl();
    const agencyDbUrl = `postgresql://${user}:${dbPassword}@${host}:${port}/${userData.agency.database_name}`;
    const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
    const agencyClient = await agencyPool.connect();

    try {
      // First check if 2FA columns exist in the database
      const columnCheck = await agencyClient.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'two_factor_enabled'
      `);

      const hasTwoFactorColumns = columnCheck.rows.length > 0;
      let twoFactorEnabled = false;
      let twoFactorSecret = null;
      let recoveryCodes = null;

      if (hasTwoFactorColumns) {
        // Columns exist, query them
        const twoFactorResult = await agencyClient.query(
          `SELECT two_factor_enabled, two_factor_secret, recovery_codes 
           FROM public.users WHERE id = $1`,
          [userData.user.id]
        );

        twoFactorEnabled = twoFactorResult.rows[0]?.two_factor_enabled || false;
        twoFactorSecret = twoFactorResult.rows[0]?.two_factor_secret || null;
        recoveryCodes = twoFactorResult.rows[0]?.recovery_codes || null;
      } else {
        // Columns don't exist, 2FA is not available - skip 2FA check
        console.log('[Auth] 2FA columns not found in database, skipping 2FA check');
      }

      // If 2FA is enabled, verify token
      if (twoFactorEnabled) {
        // If no 2FA token provided, return response indicating 2FA verification is required
        if (!twoFactorToken && !recoveryCode) {
          return res.json({
            success: true,
            requiresTwoFactor: true,
            userId: userData.user.id,
            agencyDatabase: userData.agency.database_name,
            message: '2FA verification required',
          });
        }

        // Verify 2FA token
        let isValid = false;
        if (twoFactorToken && twoFactorSecret) {
          isValid = twoFactorService.verifyToken(
            twoFactorToken,
            twoFactorSecret
          );
        } else if (recoveryCode && recoveryCodes) {
          const recoveryResult = twoFactorService.verifyRecoveryCode(
            recoveryCode,
            recoveryCodes
          );
          isValid = recoveryResult.valid;
          
          if (isValid && hasTwoFactorColumns) {
            // Update recovery codes (remove used one)
            await agencyClient.query(
              'UPDATE public.users SET recovery_codes = $1 WHERE id = $2',
              [recoveryResult.remainingCodes, userData.user.id]
            );
          }
        }

        if (!isValid) {
          return res.status(401).json({
            success: false,
            error: 'Invalid 2FA token or recovery code',
            message: 'Invalid 2FA token or recovery code',
          });
        }

        // Update last verification time (only if columns exist)
        if (hasTwoFactorColumns) {
          await agencyClient.query(
            'UPDATE public.users SET two_factor_verified_at = NOW() WHERE id = $1',
            [userData.user.id]
          );
        }
      }

      // Generate token and return user data
      const token = generateToken(userData.user, userData.agency);
      const userResponse = formatUserResponse(userData);

      res.json({
        success: true,
        token,
        user: userResponse,
        requiresTwoFactor: false,
      });
    } finally {
      agencyClient.release();
      await agencyPool.end();
    }
  } catch (error) {
    console.error('[API] Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed',
      message: 'Login failed',
    });
  }
}));

module.exports = router;

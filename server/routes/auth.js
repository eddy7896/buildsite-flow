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
  const { email, password } = req.body;

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

    const token = generateToken(userData.user, userData.agency);
    const userResponse = formatUserResponse(userData);

    res.json({
      success: true,
      token,
      user: userResponse,
    });
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

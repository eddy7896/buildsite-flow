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
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userData = await findUserAcrossAgencies(email, password);

    if (!userData) {
      return res.status(401).json({ error: 'Invalid email or password' });
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
      error: error.message || 'Login failed',
    });
  }
}));

module.exports = router;

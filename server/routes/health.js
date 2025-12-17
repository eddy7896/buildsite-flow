/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /health
 * Health check endpoint - verifies database connectivity
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
}));

module.exports = router;

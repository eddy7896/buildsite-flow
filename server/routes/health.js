/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { isRedisAvailable } = require('../config/redis');
const { getStats } = require('../services/cacheService');

/**
 * GET /health
 * Health check endpoint - verifies database and Redis connectivity
 */
router.get('/', asyncHandler(async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Check database
  try {
    const result = await pool.query('SELECT NOW()');
    health.services.database = {
      status: 'connected',
      responseTime: Date.now(),
    };
    health.services.database.responseTime = Date.now() - health.services.database.responseTime;
  } catch (error) {
    health.status = 'degraded';
    health.services.database = {
      status: 'disconnected',
      error: error.message,
    };
  }

  // Check Redis
  try {
    const redisAvailable = await isRedisAvailable();
    if (redisAvailable) {
      const cacheStats = await getStats();
      health.services.redis = {
        status: 'connected',
        type: cacheStats.type,
        cacheSize: cacheStats.size,
      };
    } else {
      health.status = 'degraded';
      health.services.redis = {
        status: 'unavailable',
        fallback: 'in-memory',
      };
    }
  } catch (error) {
    health.status = 'degraded';
    health.services.redis = {
      status: 'error',
      error: error.message,
      fallback: 'in-memory',
    };
  }

  // Return 200 if database is connected (even if Redis is down)
  // This allows the container to be considered healthy as long as DB works
  const statusCode = health.services.database?.status === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
}));

module.exports = router;

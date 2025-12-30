/**
 * Common Middleware
 * Reusable middleware for common functionality like CORS, request ID, etc.
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Set CORS headers based on request origin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function corsHeaders(req, res, next) {
  const origin = req.headers.origin;
  
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agency-Database, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  
  next();
}

/**
 * Handle CORS preflight requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function corsPreflight(req, res) {
  corsHeaders(req, res, () => {
    res.sendStatus(204);
  });
}

/**
 * Generate and attach request ID to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requestId(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Log request and response time
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
    userId: req.user?.id,
    agencyDatabase: req.user?.agencyDatabase,
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    logger.logRequest(req, res, responseTime);
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

/**
 * Extract agency database from headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function extractAgencyDatabase(req, res, next) {
  req.agencyDatabase = req.headers['x-agency-database'] || null;
  next();
}

/**
 * Validate required fields in request body
 * @param {Array<string>} fields - Required field names
 * @returns {Function} Express middleware
 */
function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: `Missing required fields: ${missing.join(', ')}`,
          details: { missing },
        },
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    
    next();
  };
}

/**
 * Validate UUID format
 * @param {string} paramName - Parameter name to validate
 * @returns {Function} Express middleware
 */
function validateUUID(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName] || req.body[paramName];
    
    if (!value) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: `${paramName} is required`,
        },
        message: `${paramName} is required`,
      });
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: `${paramName} must be a valid UUID`,
          details: { value },
        },
        message: `${paramName} must be a valid UUID`,
      });
    }
    
    next();
  };
}

module.exports = {
  corsHeaders,
  corsPreflight,
  requestId,
  requestLogger,
  extractAgencyDatabase,
  requireFields,
  validateUUID,
};


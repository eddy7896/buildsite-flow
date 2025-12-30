/**
 * Standardized API Response Helper
 * Provides consistent response format across all API endpoints
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Standard API response structure
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {any} [data] - Response data (only on success)
 * @property {Object} [error] - Error details (only on error)
 * @property {string} [message] - Human-readable message
 * @property {Object} [meta] - Response metadata
 */

/**
 * Create a successful API response
 * @param {any} data - Response data
 * @param {string} [message] - Success message
 * @param {Object} [meta] - Additional metadata (pagination, etc.)
 * @returns {Object} Standardized success response
 */
function success(data = null, message = null, meta = {}) {
  const response = {
    success: true,
  };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  if (Object.keys(meta).length > 0) {
    response.meta = {
      timestamp: new Date().toISOString(),
      requestId: meta.requestId || uuidv4(),
      ...meta,
    };
  } else {
    response.meta = {
      timestamp: new Date().toISOString(),
      requestId: meta.requestId || uuidv4(),
    };
  }

  return response;
}

/**
 * Create an error API response
 * @param {string|Error} error - Error message or Error object
 * @param {string} [code] - Error code
 * @param {any} [details] - Additional error details
 * @param {number} [statusCode] - HTTP status code
 * @param {Object} [meta] - Additional metadata
 * @returns {Object} Standardized error response
 */
function error(error, code = 'INTERNAL_ERROR', details = null, statusCode = 500, meta = {}) {
  const response = {
    success: false,
    error: {
      code,
      message: error instanceof Error ? error.message : String(error),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: meta.requestId || uuidv4(),
      ...meta,
    },
  };

  if (details !== null) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (error instanceof Error && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  // Store status code for middleware
  response._statusCode = statusCode;

  return response;
}

/**
 * Standard error codes
 */
const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_VALUE: 'INVALID_VALUE',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',

  // Database errors (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',

  // Internal errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};

/**
 * Create validation error response
 * @param {string} message - Error message
 * @param {Object} [details] - Validation details
 * @returns {Object} Error response
 */
function validationError(message, details = null) {
  return error(message, ErrorCodes.VALIDATION_ERROR, details, 400);
}

/**
 * Create not found error response
 * @param {string} resource - Resource name
 * @param {string} [id] - Resource ID
 * @returns {Object} Error response
 */
function notFound(resource, id = null) {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return error(message, ErrorCodes.NOT_FOUND, { resource, id }, 404);
}

/**
 * Create unauthorized error response
 * @param {string} [message] - Error message
 * @returns {Object} Error response
 */
function unauthorized(message = 'Unauthorized') {
  return error(message, ErrorCodes.UNAUTHORIZED, null, 401);
}

/**
 * Create forbidden error response
 * @param {string} [message] - Error message
 * @returns {Object} Error response
 */
function forbidden(message = 'Forbidden') {
  return error(message, ErrorCodes.FORBIDDEN, null, 403);
}

/**
 * Create conflict error response
 * @param {string} message - Error message
 * @param {Object} [details] - Conflict details
 * @returns {Object} Error response
 */
function conflict(message, details = null) {
  return error(message, ErrorCodes.CONFLICT, details, 409);
}

/**
 * Create database error response
 * @param {Error} dbError - Database error
 * @param {string} [operation] - Operation that failed
 * @returns {Object} Error response
 */
function databaseError(dbError, operation = 'Database operation') {
  const code = dbError.code || ErrorCodes.DATABASE_ERROR;
  const message = `${operation} failed: ${dbError.message}`;
  
  return error(message, code, {
    operation,
    originalError: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
  }, 500);
}

/**
 * Send standardized response
 * @param {Object} res - Express response object
 * @param {Object} response - Response object from success() or error()
 * @param {number} [statusCode] - Optional status code override
 * @returns {void}
 */
function send(res, response, statusCode = null) {
  const finalStatusCode = statusCode || response._statusCode || (response.success ? 200 : 500);
  res.status(finalStatusCode).json(response);
}

/**
 * Pagination metadata helper
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
function pagination(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

module.exports = {
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  databaseError,
  send,
  pagination,
  ErrorCodes,
};


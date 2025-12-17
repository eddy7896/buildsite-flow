/**
 * Centralized Error Handling Middleware
 */

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  console.error('[API] Error:', err);

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: err.message || 'Internal server error',
    detail: err.detail,
    code: err.code,
  };

  res.status(statusCode).json(errorResponse);
}

module.exports = {
  asyncHandler,
  errorHandler,
};

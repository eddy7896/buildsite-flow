/**
 * Request-Level Authentication Caching Middleware
 * 
 * Prevents duplicate token validation and user data fetches within the same request.
 * Caches authenticated user data, roles, and agency context on req object.
 */

/**
 * Initialize request-level auth cache
 * Should be called early in the request pipeline, before authenticate middleware
 */
function initAuthCache(req, res, next) {
  // Initialize cache object on request if not already present
  if (!req._authCache) {
    req._authCache = {
      user: null,
      roles: null,
      rolesFetched: false,
      agencyContext: null,
      tokenPayload: null,
      tokenDecoded: false,
    };
  }
  next();
}

/**
 * Get cached user from request
 * Returns null if not cached
 */
function getCachedUser(req) {
  return req._authCache?.user || null;
}

/**
 * Set cached user on request
 */
function setCachedUser(req, user) {
  if (!req._authCache) {
    req._authCache = {};
  }
  req._authCache.user = user;
  // Also set on req.user for compatibility
  req.user = user;
}

/**
 * Get cached roles from request
 * Returns null if not cached
 */
function getCachedUserRoles(req) {
  if (!req._authCache) {
    return null;
  }
  return req._authCache.rolesFetched ? req._authCache.roles : null;
}

/**
 * Set cached roles on request
 */
function setCachedUserRoles(req, roles) {
  if (!req._authCache) {
    req._authCache = {};
  }
  req._authCache.roles = roles;
  req._authCache.rolesFetched = true;
  // Also set on req.user.roles for compatibility
  if (req.user) {
    req.user.roles = roles;
  }
}

/**
 * Check if roles have been fetched for this request
 */
function areRolesCached(req) {
  return req._authCache?.rolesFetched === true;
}

/**
 * Get cached agency context from request
 */
function getCachedAgencyContext(req) {
  return req._authCache?.agencyContext || null;
}

/**
 * Set cached agency context on request
 */
function setCachedAgencyContext(req, agencyContext) {
  if (!req._authCache) {
    req._authCache = {};
  }
  req._authCache.agencyContext = agencyContext;
  req.agencyDatabase = agencyContext?.database || null;
}

/**
 * Get cached token payload from request
 */
function getCachedTokenPayload(req) {
  return req._authCache?.tokenPayload || null;
}

/**
 * Set cached token payload on request
 */
function setCachedTokenPayload(req, payload) {
  if (!req._authCache) {
    req._authCache = {};
  }
  req._authCache.tokenPayload = payload;
  req._authCache.tokenDecoded = true;
}

/**
 * Check if token has been decoded for this request
 */
function isTokenDecoded(req) {
  return req._authCache?.tokenDecoded === true;
}

/**
 * Clear all cached auth data for request
 * Useful for testing or error recovery
 */
function clearAuthCache(req) {
  if (req._authCache) {
    req._authCache = null;
  }
  req.user = null;
  req.agencyDatabase = null;
}

module.exports = {
  initAuthCache,
  getCachedUser,
  setCachedUser,
  getCachedUserRoles,
  setCachedUserRoles,
  areRolesCached,
  getCachedAgencyContext,
  setCachedAgencyContext,
  getCachedTokenPayload,
  setCachedTokenPayload,
  isTokenDecoded,
  clearAuthCache,
};


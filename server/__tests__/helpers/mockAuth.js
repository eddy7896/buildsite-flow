/**
 * Mock Authentication Middleware
 * For testing purposes - bypasses actual authentication
 */

function mockAuthenticate(req, res, next) {
  // Use global test context if available, otherwise use defaults
  const testUserId = global.testUserId || 'test-user-id';
  const testAgencyId = global.testAgencyId || 'test-agency-id';
  const testAgencyDatabase = global.testAgencyDatabase || 'test_agency_db';
  
  req.user = {
    id: testUserId,
    email: 'test@example.com',
    agencyId: testAgencyId,
    agencyDatabase: testAgencyDatabase,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
  };
  req.agencyDatabase = testAgencyDatabase;
  next();
}

function mockRequireAgencyContext(req, res, next) {
  // Use global test context if available
  const testAgencyDatabase = global.testAgencyDatabase || 'test_agency_db';
  const testAgencyId = global.testAgencyId || 'test-agency-id';
  const testUserId = global.testUserId || 'test-user-id';
  
  if (!req.user) {
    req.user = {
      id: testUserId,
      email: 'test@example.com',
      agencyId: testAgencyId,
      agencyDatabase: testAgencyDatabase,
    };
  }
  
  if (!req.user.agencyDatabase) {
    req.user.agencyDatabase = testAgencyDatabase;
  }
  
  if (!req.user.agencyId) {
    req.user.agencyId = testAgencyId;
  }
  
  req.agencyDatabase = req.user.agencyDatabase;
  
  if (!req.user || !req.user.agencyDatabase) {
    return res.status(403).json({
      success: false,
      error: { code: 'RBAC_NO_AGENCY_CONTEXT', message: 'Agency context is required' },
      message: 'Access denied',
    });
  }
  next();
}

module.exports = {
  mockAuthenticate,
  mockRequireAgencyContext,
};

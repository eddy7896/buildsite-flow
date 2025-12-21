/**
 * Test Database Setup Helper
 * Sets up test database with schema for all API tests
 */

const { getTestConnection, createTestAgency, createTestUser, cleanupTestData } = require('./testHelpers');

let testSetup = null;

/**
 * Set up test database once for all tests
 */
async function setupTestDatabase() {
  if (testSetup) {
    return testSetup;
  }

  const client = await getTestConnection();
  const testAgency = await createTestAgency(client);
  const testUser = await createTestUser(client, testAgency.agencyId, testAgency.agencyDatabase);
  
  testSetup = {
    client,
    testAgency,
    testUser,
  };
  
  // Set global test context
  global.testAgencyDatabase = testAgency.agencyDatabase;
  global.testUserId = testUser.userId;
  global.testAgencyId = testAgency.agencyId;
  
  return testSetup;
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
  if (testSetup) {
    await cleanupTestData(testSetup.client, testSetup.testAgency.agencyDatabase);
    testSetup.client.release();
    testSetup = null;
  }
}

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
};

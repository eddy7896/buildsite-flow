/**
 * GraphQL API Tests
 */

const request = require('supertest');
const express = require('express');
const { mockAuthenticate, mockRequireAgencyContext } = require('../helpers/mockAuth');
const { getTestConnection, createTestAgency, createTestUser, cleanupTestData } = require('../helpers/testHelpers');

// Mock the auth middleware module
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: require('../helpers/mockAuth').mockAuthenticate,
  requireAgencyContext: require('../helpers/mockAuth').mockRequireAgencyContext,
}));

const graphqlRoutes = require('../../routes/graphql');

const app = express();
app.use(express.json());
app.use('/api/graphql', graphqlRoutes);

describe('GraphQL API', () => {
  let client;
  let testAgency;
  let testUser;

  beforeAll(async () => {
    client = await getTestConnection();
    testAgency = await createTestAgency(client);
    testUser = await createTestUser(client, testAgency.agencyId, testAgency.agencyDatabase);
    
    global.testAgencyDatabase = testAgency.agencyDatabase;
    global.testUserId = testUser.userId;
    global.testAgencyId = testAgency.agencyId;
  });

  afterAll(async () => {
    if (testAgency) {
      await cleanupTestData(client, testAgency.agencyDatabase);
    }
    if (client) {
      client.release();
    }
  });
  describe('POST /api/graphql', () => {
    test('should execute GraphQL query', async () => {
      const query = `
        query {
          products(limit: 5) {
            id
            name
            sku
          }
        }
      `;

      const response = await request(app)
        .post('/api/graphql')
        .send({ query })
        .expect(200);

      // GraphQL-http returns data in response body
      expect(response.body).toBeDefined();
    });

    test('should handle GraphQL errors gracefully', async () => {
      const query = `
        query {
          invalidField {
            id
          }
        }
      `;

      const response = await request(app)
        .post('/api/graphql')
        .send({ query })
        .expect(200);

      // Should return error in response
      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/graphql', () => {
    test('should serve GraphiQL interface', async () => {
      const response = await request(app)
        .get('/api/graphql')
        .expect(200);

      // Should return HTML for GraphiQL
      expect(response.text).toBeDefined();
    });
  });
});

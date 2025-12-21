/**
 * Webhook System API Tests
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

const webhookRoutes = require('../../routes/webhooks');

const app = express();
app.use(express.json());
app.use('/api/webhooks', webhookRoutes);

describe('Webhook System API', () => {
  let client;
  let testAgency;
  let testUser;
  let webhookId;

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

  describe('POST /api/webhooks', () => {
    test('should create a webhook subscription', async () => {
      const webhookData = {
        event_type: 'project.created',
        url: 'https://example.com/webhook',
        secret: 'test-secret',
      };

      const response = await request(app)
        .post('/api/webhooks')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      webhookId = response.body.data.id;
    });
  });

  describe('GET /api/webhooks', () => {
    test('should get all webhooks', async () => {
      const response = await request(app)
        .get('/api/webhooks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/webhooks/:id/deliveries', () => {
    test('should get webhook delivery history', async () => {
      if (webhookId) {
        const response = await request(app)
          .get(`/api/webhooks/${webhookId}/deliveries`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });
});

/**
 * Two-Factor Authentication API Tests
 */

const request = require('supertest');
const express = require('express');
const { mockAuthenticate, mockRequireAgencyContext } = require('../helpers/mockAuth');
const { getTestConnection, createTestAgency, createTestUser, cleanupTestData } = require('../helpers/testHelpers');

// Mock the auth middleware module BEFORE requiring routes
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: require('../helpers/mockAuth').mockAuthenticate,
  requireAgencyContext: require('../helpers/mockAuth').mockRequireAgencyContext,
}));

const twoFactorRoutes = require('../../routes/twoFactor');

const app = express();
app.use(express.json());
app.use('/api/two-factor', twoFactorRoutes);

describe('Two-Factor Authentication API', () => {
  let client;
  let testAgency;
  let testUser;

  beforeAll(async () => {
    client = await getTestConnection();
    testAgency = await createTestAgency(client);
    testUser = await createTestUser(client, testAgency.agencyId, testAgency.agencyDatabase);
    
    // Set global test context
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
  describe('POST /api/two-factor/setup', () => {
    test('should generate 2FA setup with QR code', async () => {
      const response = await request(app)
        .post('/api/two-factor/setup')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data).toHaveProperty('qrCode');
      // QRCode library returns PNG by default, accept either PNG or SVG
      expect(response.body.data.qrCode).toMatch(/^data:image\/(png|svg\+xml);base64,/);
    });
  });

  describe('POST /api/two-factor/verify-and-enable', () => {
    test('should verify token and enable 2FA', async () => {
      // First get setup
      const setupResponse = await request(app)
        .post('/api/two-factor/setup')
        .expect(200);

      const secret = setupResponse.body.data.secret;
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      const response = await request(app)
        .post('/api/two-factor/verify-and-enable')
        .send({ token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recoveryCodes');
      expect(response.body.data.recoveryCodes).toHaveLength(10);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/two-factor/verify-and-enable')
        .send({ token: '000000' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/two-factor/verify', () => {
    test('should return error when 2FA is not enabled', async () => {
      // Create a separate user that doesn't have 2FA enabled
      const { createTestUser } = require('../helpers/testHelpers');
      const testUser2 = await createTestUser(client, testAgency.agencyId, testAgency.agencyDatabase, 'test2@example.com');
      
      // This endpoint requires userId, agencyDatabase, and token
      // It's used during login after password verification
      // Since 2FA is not enabled for this user, it should return 400
      const response = await request(app)
        .post('/api/two-factor/verify')
        .send({ 
          userId: testUser2.userId,
          agencyDatabase: testAgency.agencyDatabase,
          token: '123456' 
        });

      expect(response.status).toBe(400); // 2FA is not enabled
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('2FA not enabled');
    });
  });

  describe('GET /api/two-factor/status', () => {
    test('should return 2FA status', async () => {
      const response = await request(app)
        .get('/api/two-factor/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('enabled');
      expect(typeof response.body.data.enabled).toBe('boolean');
    });
  });
});

/**
 * Financial Management API Tests
 */

const request = require('supertest');
const express = require('express');
const { mockAuthenticate, mockRequireAgencyContext } = require('../helpers/mockAuth');
const { getTestConnection, createTestAgency, createTestUser, cleanupTestData, createTestChartOfAccount, ensureAgencySettingsCurrency } = require('../helpers/testHelpers');

// Mock the auth middleware module
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: require('../helpers/mockAuth').mockAuthenticate,
  requireAgencyContext: require('../helpers/mockAuth').mockRequireAgencyContext,
}));

const financialRoutes = require('../../routes/financial');

const app = express();
app.use(express.json());
app.use('/api/financial', financialRoutes);

describe('Financial Management API', () => {
  let client;
  let testAgency;
  let testUser;
  let testAccountId;

  beforeAll(async () => {
    client = await getTestConnection();
    testAgency = await createTestAgency(client);
    testUser = await createTestUser(client, testAgency.agencyId, testAgency.agencyDatabase);
    
    // Ensure agency_settings has default_currency
    await ensureAgencySettingsCurrency(client, testAgency.agencyDatabase, 'INR');
    
    // Create test chart of accounts entry for budget tests
    testAccountId = await createTestChartOfAccount(client, testAgency.agencyDatabase, '1000', 'Test Asset Account', 'asset');
    
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
  describe('GET /api/financial/currencies', () => {
    test('should get all currencies', async () => {
      const response = await request(app)
        .get('/api/financial/currencies');
      
      if (response.status !== 200) {
        console.error('Error response:', response.status, response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('code');
        expect(response.body.data[0]).toHaveProperty('name');
        expect(response.body.data[0]).toHaveProperty('exchange_rate');
      }
    });
  });

  describe('POST /api/financial/currencies/update-rates', () => {
    test('should update exchange rates', async () => {
      const response = await request(app)
        .post('/api/financial/currencies/update-rates');
      
      if (response.status !== 200) {
        console.error('Update rates error:', response.status, response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/financial/currencies/convert', () => {
    test('should convert currency', async () => {
      const conversionData = {
        amount: 100,
        from_currency: 'USD',
        to_currency: 'INR',
      };

      const response = await request(app)
        .post('/api/financial/currencies/convert')
        .send(conversionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('converted_amount');
      expect(typeof response.body.data.converted_amount).toBe('number');
    });
  });

  describe('POST /api/financial/budgets', () => {
    test('should create a budget', async () => {
      const budgetData = {
        budget_name: 'Test Budget 2025',
        budget_type: 'annual',
        fiscal_year: '2025',
        period_start: '2025-01-01',
        period_end: '2025-12-31',
        total_budget: 100000.00,
        items: [
          {
            account_id: testAccountId,
            budgeted_amount: 100000.00,
          },
        ],
      };

      const response = await request(app)
        .post('/api/financial/budgets')
        .send(budgetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('GET /api/financial/budgets', () => {
    test('should get all budgets', async () => {
      const response = await request(app)
        .get('/api/financial/budgets')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

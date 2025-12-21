/**
 * Procurement Management API Tests
 */

const request = require('supertest');
const express = require('express');
const { mockAuthenticate, mockRequireAgencyContext } = require('../helpers/mockAuth');
const { getTestConnection, createTestAgency, createTestUser, cleanupTestData, createTestSupplier } = require('../helpers/testHelpers');

// Mock the auth middleware module
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: require('../helpers/mockAuth').mockAuthenticate,
  requireAgencyContext: require('../helpers/mockAuth').mockRequireAgencyContext,
}));

const procurementRoutes = require('../../routes/procurement');

const app = express();
app.use(express.json());
app.use('/api/procurement', procurementRoutes);

describe('Procurement Management API', () => {
  let client;
  let testAgency;
  let testUser;
  let requisitionId;
  let purchaseOrderId;
  let supplierId;

  beforeAll(async () => {
    client = await getTestConnection();
    testAgency = await createTestAgency(client);
    testUser = await createTestUser(client, testAgency.agencyId, testAgency.agencyDatabase);
    
    // Create test supplier for purchase orders
    supplierId = await createTestSupplier(client, testAgency.agencyDatabase, 'Test Supplier');
    
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

  describe('POST /api/procurement/requisitions', () => {
    test('should create a purchase requisition', async () => {
      const requisitionData = {
        items: [
          {
            description: 'Test Product',
            quantity: 10,
            unit_price: 100.00,
          },
        ],
        notes: 'Test requisition',
      };

      const response = await request(app)
        .post('/api/procurement/requisitions')
        .send(requisitionData);

      if (response.status !== 200) {
        console.error('Requisition error:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('requisition_number');
      requisitionId = response.body.data.id;
    });
  });

  describe('GET /api/procurement/requisitions', () => {
    test('should get all purchase requisitions', async () => {
      const response = await request(app)
        .get('/api/procurement/requisitions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/procurement/purchase-orders', () => {
    test('should create a purchase order', async () => {
      const poData = {
        supplier_id: supplierId,
        requisition_id: requisitionId,
        items: [
          {
            description: 'Test Product',
            quantity: 10,
            unit_price: 100.00,
          },
        ],
        notes: 'Test PO',
      };

      const response = await request(app)
        .post('/api/procurement/purchase-orders')
        .send(poData);

      if (response.status !== 200) {
        console.error('PO error:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('po_number');
      purchaseOrderId = response.body.data.id;
    });
  });

  describe('GET /api/procurement/purchase-orders', () => {
    test('should get all purchase orders', async () => {
      const response = await request(app)
        .get('/api/procurement/purchase-orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

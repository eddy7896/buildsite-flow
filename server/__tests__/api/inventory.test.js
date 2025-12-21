/**
 * Inventory Management API Tests
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

const inventoryRoutes = require('../../routes/inventory');

const app = express();
app.use(express.json());
app.use('/api/inventory', inventoryRoutes);

describe('Inventory Management API', () => {
  let client;
  let testAgency;
  let testUser;
  let warehouseId;
  let productId;

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

  describe('POST /api/inventory/warehouses', () => {
    test('should create a warehouse', async () => {
      const warehouseData = {
        code: `WH-${Date.now()}`,
        name: 'Test Warehouse',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postal_code: '12345',
        country: 'USA',
      };

      const response = await request(app)
        .post('/api/inventory/warehouses')
        .send(warehouseData);

      if (response.status !== 200) {
        console.error('Warehouse error:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(warehouseData.name);
      warehouseId = response.body.data.id;
    });
  });

  describe('GET /api/inventory/warehouses', () => {
    test('should get all warehouses', async () => {
      const response = await request(app)
        .get('/api/inventory/warehouses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/inventory/products', () => {
    test('should create a product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        sku: `TEST-${Date.now()}`,
        category: 'Test Category',
        unit: 'pcs',
        warehouse_id: warehouseId,
      };

      const response = await request(app)
        .post('/api/inventory/products')
        .send(productData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(productData.name);
      productId = response.body.data.id;
    });
  });

  describe('GET /api/inventory/products', () => {
    test('should get all products', async () => {
      const response = await request(app)
        .get('/api/inventory/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/inventory/products/:productId/levels', () => {
    test('should get inventory levels for a product', async () => {
      const response = await request(app)
        .get(`/api/inventory/products/${productId}/levels`);

      if (response.status !== 200) {
        console.error('Inventory levels error:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/inventory/alerts/low-stock', () => {
    test('should get low stock alerts', async () => {
      const response = await request(app)
        .get('/api/inventory/alerts/low-stock')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

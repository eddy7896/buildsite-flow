/**
 * CRM Enhancements API Tests
 */

const request = require('supertest');
const express = require('express');
const { mockAuthenticate, mockRequireAgencyContext } = require('../helpers/mockAuth');
const { getTestConnection, createTestAgency, createTestUser, cleanupTestData, createTestLead } = require('../helpers/testHelpers');

// Mock the auth middleware module
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: require('../helpers/mockAuth').mockAuthenticate,
  requireAgencyContext: require('../helpers/mockAuth').mockRequireAgencyContext,
}));

const crmEnhancementsRoutes = require('../../routes/crmEnhancements');

const app = express();
app.use(express.json());
app.use('/api/crm', crmEnhancementsRoutes);

describe('CRM Enhancements API', () => {
  let client;
  let testAgency;
  let testUser;
  let testLeadId;

  beforeAll(async () => {
    client = await getTestConnection();
    testAgency = await createTestAgency(client);
    testUser = await createTestUser(client, testAgency.agencyId, testAgency.agencyDatabase);
    
    // Create test lead
    testLeadId = await createTestLead(client, testAgency.agencyDatabase, 'Test Lead');
    
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

  describe('POST /api/crm/leads/:leadId/score', () => {
    test('should calculate lead score', async () => {
      const response = await request(app)
        .post(`/api/crm/leads/${testLeadId}/score`);
      
      if (response.status !== 200) {
        console.error('Lead score error:', response.status, response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('breakdown');
      expect(typeof response.body.data.score).toBe('number');
    });
  });

  describe('GET /api/crm/leads/high-scoring', () => {
    test('should get high-scoring leads', async () => {
      const response = await request(app)
        .get('/api/crm/leads/high-scoring')
        .query({ min_score: 50 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/crm/opportunities', () => {
    test('should create an opportunity', async () => {
      const opportunityData = {
        opportunity_name: 'Test Opportunity',
        description: 'Test opportunity description',
        stage: 'prospecting',
        probability: 25,
        expected_value: 50000.00,
        expected_close_date: '2025-06-30',
      };

      const response = await request(app)
        .post('/api/crm/opportunities')
        .send(opportunityData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.opportunity_name).toBe(opportunityData.opportunity_name);
    });
  });

  describe('GET /api/crm/opportunities', () => {
    test('should get all opportunities', async () => {
      const response = await request(app)
        .get('/api/crm/opportunities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/crm/segments', () => {
    test('should create a customer segment', async () => {
      const segmentData = {
        segment_name: 'Enterprise Clients',
        description: 'Large enterprise customers',
        criteria: {
          industry: ['construction', 'real_estate'],
          revenue_range: '>1000000',
        },
      };

      const response = await request(app)
        .post('/api/crm/segments')
        .send(segmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.segment_name).toBe(segmentData.segment_name);
    });
  });
});

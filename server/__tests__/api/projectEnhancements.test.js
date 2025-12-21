/**
 * Project Enhancements API Tests
 */

const request = require('supertest');
const express = require('express');
const { mockAuthenticate, mockRequireAgencyContext } = require('../helpers/mockAuth');
const { getTestConnection, createTestAgency, createTestUser, cleanupTestData, createTestProject } = require('../helpers/testHelpers');

// Mock the auth middleware module
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: require('../helpers/mockAuth').mockAuthenticate,
  requireAgencyContext: require('../helpers/mockAuth').mockRequireAgencyContext,
}));

const projectEnhancementsRoutes = require('../../routes/projectEnhancements');

const app = express();
app.use(express.json());
app.use('/api/projects', projectEnhancementsRoutes);

describe('Project Enhancements API', () => {
  let client;
  let testAgency;
  let testUser;
  let testProjectId;

  beforeAll(async () => {
    client = await getTestConnection();
    testAgency = await createTestAgency(client);
    testUser = await createTestUser(client, testAgency.agencyId, testAgency.agencyDatabase);
    
    // Create test project
    testProjectId = await createTestProject(client, testAgency.agencyDatabase, 'Test Project');
    
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

  describe('GET /api/projects/:projectId/gantt', () => {
    test('should get Gantt chart data', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/gantt`);
      
      if (response.status !== 200) {
        console.error('Gantt error:', response.status, response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tasks');
      expect(response.body.data).toHaveProperty('dependencies');
      expect(response.body.data).toHaveProperty('milestones');
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
    });
  });

  describe('POST /api/projects/:projectId/risks', () => {
    test('should create a project risk', async () => {
      const riskData = {
        risk_title: 'Test Risk',
        description: 'Test risk description',
        category: 'technical',
        probability: 'medium',
        impact: 'high',
        mitigation_plan: 'Test mitigation',
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/risks`)
        .send(riskData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.risk_title).toBe(riskData.risk_title);
    });
  });

  describe('GET /api/projects/:projectId/risks', () => {
    test('should get project risks', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/risks`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/projects/:projectId/issues', () => {
    test('should create a project issue', async () => {
      const issueData = {
        issue_title: 'Test Issue',
        description: 'Test issue description',
        priority: 'high',
        issue_type: 'bug',
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/issues`)
        .send(issueData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.issue_title).toBe(issueData.issue_title);
    });
  });

  describe('POST /api/projects/:projectId/milestones', () => {
    test('should create a project milestone', async () => {
      const milestoneData = {
        name: 'Test Milestone',
        description: 'Test milestone description',
        target_date: '2025-12-31',
        is_critical: true,
      };

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/milestones`)
        .send(milestoneData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(milestoneData.name);
    });
  });
});

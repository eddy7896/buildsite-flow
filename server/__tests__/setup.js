/**
 * Test Setup
 * Configures test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/buildflow_db';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-chars-long!!';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testAgencyDatabase = 'test_agency_db';
global.testUserId = null;
global.testAgencyId = null;
global.testAuthToken = null;

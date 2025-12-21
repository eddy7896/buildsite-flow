/**
 * Test Helpers
 * Utility functions for testing
 */

const { Pool } = require('pg');
const { parseDatabaseUrl } = require('../../utils/poolManager');

/**
 * Get database connection
 */
let testPool = null;
async function getTestConnection() {
  if (!testPool) {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/buildflow_db';
    const url = new URL(dbUrl.replace('postgresql://', 'http://'));
    const database = url.pathname.slice(1) || 'buildflow_db';
    const user = url.username || 'postgres';
    const password = url.password || 'admin';
    const host = url.hostname || 'localhost';
    const port = url.port || '5432';
    
    const testDbUrl = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    testPool = new Pool({ connectionString: testDbUrl, max: 1 });
  }
  const client = await testPool.connect();
  // Add release method for cleanup
  const originalRelease = client.release.bind(client);
  client.release = function() {
    originalRelease();
    // Don't end pool here - let it be reused
  };
  return client;
}

/**
 * Create test agency database
 */
async function createTestAgency(client, agencyName = 'Test Agency') {
  const crypto = require('crypto');
  const { createAgencySchema } = require('../../utils/schemaCreator');
  const agencyId = crypto.randomUUID();
  const agencyDatabase = `test_agency_${Date.now()}`;
  
  // Create database
  await client.query(`CREATE DATABASE ${agencyDatabase}`);
  
  // Insert agency record
  await client.query(
    `INSERT INTO public.agencies (id, name, database_name, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [agencyId, agencyName, agencyDatabase]
  );
  
  // Set up schema in the new database
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const { Pool } = require('pg');
  const agencyPool = new Pool({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();
  
  try {
    await createAgencySchema(agencyClient);
    console.log(`[Test] ✅ Created schema for test agency: ${agencyDatabase}`);
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
  
  return { agencyId, agencyDatabase };
}

/**
 * Create test user
 */
async function createTestUser(client, agencyId, agencyDatabase, email = 'test@example.com') {
  const crypto = require('crypto');
  const bcrypt = require('bcrypt');
  const userId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  
  // Connect to agency database
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new (require('pg').Pool)({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();
  
  try {
    // Create user in agency database
    await agencyClient.query(
      `INSERT INTO public.users (id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [userId, email, hashedPassword]
    );
    
    // Create profile
    await agencyClient.query(
      `INSERT INTO public.profiles (user_id, full_name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [userId, 'Test User']
    );
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
  
  return { userId, email, password: 'testpassword123' };
}

/**
 * Generate auth token
 */
function generateTestToken(userId, agencyId, agencyDatabase) {
  const tokenData = {
    id: userId,
    email: 'test@example.com',
    agencyId: agencyId,
    agencyDatabase: agencyDatabase,
    role: 'admin',
  };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

/**
 * Cleanup test data
 */
async function cleanupTestData(client, agencyDatabase) {
  try {
    // Drop agency database
    await client.query(`DROP DATABASE IF EXISTS ${agencyDatabase}`);
    
    // Remove agency record
    await client.query(
      `DELETE FROM public.agencies WHERE database_name = $1`,
      [agencyDatabase]
    );
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
}

/**
 * Create test chart of accounts entry
 */
async function createTestChartOfAccount(client, agencyDatabase, accountCode = '1000', accountName = 'Test Account', accountType = 'asset') {
  const crypto = require('crypto');
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new (require('pg').Pool)({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();
  
  try {
    const accountId = crypto.randomUUID();
    await agencyClient.query(
      `INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       ON CONFLICT (account_code) DO NOTHING`,
      [accountId, accountCode, accountName, accountType]
    );
    return accountId;
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
}

/**
 * Create test supplier
 */
async function createTestSupplier(client, agencyDatabase, supplierName = 'Test Supplier') {
  const crypto = require('crypto');
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new (require('pg').Pool)({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();
  
  try {
    const supplierId = crypto.randomUUID();
    const agencyId = global.testAgencyId || crypto.randomUUID();
    
    // Create supplier (suppliers table uses 'name' not 'supplier_name')
    await agencyClient.query(
      `INSERT INTO public.suppliers (id, agency_id, name, contact_person, email, phone, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
      [supplierId, agencyId, supplierName, 'Test Contact', 'supplier@example.com', '1234567890']
    );
    
    return supplierId;
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
}

/**
 * Create test lead
 */
async function createTestLead(client, agencyDatabase, leadName = 'Test Lead') {
  const crypto = require('crypto');
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new (require('pg').Pool)({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();
  
  try {
    const leadId = crypto.randomUUID();
    const agencyId = global.testAgencyId || crypto.randomUUID();
    
    // Create lead (company_name is required NOT NULL, ensure agency_id is set)
    const finalAgencyId = agencyId || global.testAgencyId || crypto.randomUUID();
    await agencyClient.query(
      `INSERT INTO public.leads (id, agency_id, name, company_name, email, phone, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [leadId, finalAgencyId, leadName, `${leadName} Company`, 'testlead@example.com', '1234567890', 'new']
    );
    
    return leadId;
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
}

/**
 * Create test project
 */
async function createTestProject(client, agencyDatabase, projectName = 'Test Project') {
  const crypto = require('crypto');
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new (require('pg').Pool)({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();
  
  try {
    const projectId = crypto.randomUUID();
    // First, check if clients table exists and create a test client if needed
    const clientCheck = await agencyClient.query('SELECT id FROM public.clients LIMIT 1');
    let clientId = null;
    
    if (clientCheck.rows.length === 0) {
      // Create a test client
      clientId = crypto.randomUUID();
      await agencyClient.query(
        `INSERT INTO public.clients (id, name, email, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [clientId, 'Test Client', 'testclient@example.com']
      );
    } else {
      clientId = clientCheck.rows[0].id;
    }
    
    // Get agency_id from global context or use a default
    const agencyId = global.testAgencyId || crypto.randomUUID();
    
    // Create project (projects table uses 'name' not 'project_name', and requires agency_id)
    await agencyClient.query(
      `INSERT INTO public.projects (id, client_id, name, status, agency_id, start_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
      [projectId, clientId, projectName, 'active', agencyId]
    );
    
    return projectId;
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
}

/**
 * Ensure agency_settings has default_currency set
 */
async function ensureAgencySettingsCurrency(client, agencyDatabase, defaultCurrency = 'INR') {
  const { host, port, user, password } = parseDatabaseUrl();
  const agencyDbUrl = `postgresql://${user}:${password}@${host}:${port}/${agencyDatabase}`;
  const agencyPool = new (require('pg').Pool)({ connectionString: agencyDbUrl, max: 1 });
  const agencyClient = await agencyPool.connect();
  
  try {
    // Check if agency_settings exists
    const checkResult = await agencyClient.query('SELECT id FROM public.agency_settings LIMIT 1');
    
    if (checkResult.rows.length > 0) {
      // Update existing row
      await agencyClient.query(`
        UPDATE public.agency_settings 
        SET default_currency = $1, currency = $1
        WHERE id = $2
      `, [defaultCurrency, checkResult.rows[0].id]);
    } else {
      // Insert new row
      await agencyClient.query(`
        INSERT INTO public.agency_settings (id, agency_name, default_currency, currency, setup_complete)
        VALUES (gen_random_uuid(), 'Test Agency', $1, $1, false)
      `, [defaultCurrency]);
    }
  } finally {
    agencyClient.release();
    await agencyPool.end();
  }
}

module.exports = {
  getTestConnection,
  createTestAgency,
  createTestUser,
  generateTestToken,
  cleanupTestData,
  createTestChartOfAccount,
  ensureAgencySettingsCurrency,
  createTestProject,
  createTestLead,
  createTestSupplier,
};

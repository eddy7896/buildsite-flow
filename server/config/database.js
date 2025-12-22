/**
 * Database Connection Configuration
 * Manages PostgreSQL connection pools for main and agency databases
 */

const { Pool } = require('pg');
const { DATABASE_URL, POOL_CONFIG } = require('./constants');

// Create main PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ...POOL_CONFIG,
});

// Cache for per-agency database pools
const agencyPools = new Map();

/**
 * Get or create a database pool for a specific agency
 * @param {string} databaseName - The agency database name
 * @returns {Pool} - PostgreSQL connection pool
 */
function getAgencyPool(databaseName) {
  if (!databaseName || typeof databaseName !== 'string') {
    return pool;
  }

  const normalizedName = databaseName.trim();
  if (!normalizedName) {
    return pool;
  }

  // Return cached pool if it exists
  if (agencyPools.has(normalizedName)) {
    return agencyPools.get(normalizedName);
  }

  // Create new agency pool
  const mainDbUrl = new URL(DATABASE_URL);
  const dbHost = mainDbUrl.hostname;
  const dbPort = mainDbUrl.port || 5432;
  const dbUser = mainDbUrl.username || 'postgres';
  const dbPassword = mainDbUrl.password || 'admin';

  const agencyDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${normalizedName}`;
  const agencyPool = new Pool({
    connectionString: agencyDbUrl,
    ...POOL_CONFIG,
  });

  // Add error handlers for agency pools
  agencyPool.on('error', (err) => {
    console.error(`❌ PostgreSQL connection error for agency pool ${normalizedName}:`, err.message);
    // Remove the pool from cache if it's in a bad state
    if (err.code === 'ECONNREFUSED' || err.message.includes('timeout')) {
      console.log(`[DB] Removing bad pool from cache: ${normalizedName}`);
      agencyPools.delete(normalizedName);
    }
  });

  agencyPool.on('connect', () => {
    console.log(`✅ Connected to agency database: ${normalizedName}`);
  });

  agencyPools.set(normalizedName, agencyPool);
  console.log(`[DB] Created new agency pool for database: ${normalizedName}`);

  return agencyPool;
}

// Database connection event handlers
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

module.exports = {
  pool,
  getAgencyPool,
  agencyPools,
};

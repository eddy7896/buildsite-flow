/**
 * Database Pool Management Utilities
 * Helper functions for managing database connections
 */

const { Pool } = require('pg');
const { DATABASE_URL, POOL_CONFIG } = require('../config/constants');

/**
 * Create a temporary pool for a specific database
 * Used for one-off operations like login searches
 * @param {string} databaseName - Database name
 * @param {number} max - Maximum pool size (default: 1)
 * @returns {Pool} - PostgreSQL connection pool
 */
function createTemporaryPool(databaseName, max = 1) {
  const mainDbUrl = new URL(DATABASE_URL);
  const dbHost = mainDbUrl.hostname;
  const dbPort = mainDbUrl.port || 5432;
  const dbUser = mainDbUrl.username || 'postgres';
  const dbPassword = mainDbUrl.password || 'admin';

  const dbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${databaseName}`;
  return new Pool({
    connectionString: dbUrl,
    max,
    ...POOL_CONFIG,
  });
}

/**
 * Parse database connection details from DATABASE_URL
 * @returns {Object} - Connection details { host, port, user, password }
 */
function parseDatabaseUrl() {
  const mainDbUrl = new URL(DATABASE_URL);
  return {
    host: mainDbUrl.hostname,
    port: mainDbUrl.port || 5432,
    user: mainDbUrl.username || 'postgres',
    password: mainDbUrl.password || 'admin',
  };
}

module.exports = {
  createTemporaryPool,
  parseDatabaseUrl,
};

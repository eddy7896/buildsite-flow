/**
 * Application Constants and Environment Configuration
 */

const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL ||
  'postgresql://postgres:admin@localhost:5432/buildflow_db';

const PORT = process.env.PORT || 3000;

const POOL_CONFIG = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const JSON_LIMIT = '50mb';

module.exports = {
  DATABASE_URL,
  PORT,
  POOL_CONFIG,
  JSON_LIMIT,
};

/**
 * Application Constants and Environment Configuration
 */

// Helper function to URL-encode password in connection string
function encodeDatabaseUrl(urlString) {
  if (!urlString) return urlString;
  
  // If URL parsing fails (due to special chars in password), encode it manually
  try {
    const url = new URL(urlString);
    // If we can parse it, return as-is (password might already be encoded)
    return urlString;
  } catch (error) {
    // Parse manually and encode password
    // Format: postgresql://user:password@host:port/database
    const match = urlString.match(/^(postgresql:\/\/)([^:@]+)(?::([^@]+))?@([^:]+)(?::(\d+))?\/(.+)$/);
    if (match) {
      const [, protocol, user, password, host, port, database] = match;
      const encodedPassword = password ? encodeURIComponent(password) : '';
      const portPart = port ? `:${port}` : '';
      return `${protocol}${user}${encodedPassword ? ':' + encodedPassword : ''}@${host}${portPart}/${database}`;
    }
    // If regex doesn't match, return original (let pg handle it)
    return urlString;
  }
}

const rawDatabaseUrl = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL ||
  'postgresql://postgres:admin@localhost:5432/buildflow_db';

const DATABASE_URL = encodeDatabaseUrl(rawDatabaseUrl);

const PORT = process.env.PORT || 3000;

const POOL_CONFIG = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased from 2000ms to 30000ms (30 seconds)
  statement_timeout: 60000, // 60 seconds for query execution
  query_timeout: 60000, // 60 seconds for query timeout
};

const JSON_LIMIT = '50mb';

module.exports = {
  DATABASE_URL,
  PORT,
  POOL_CONFIG,
  JSON_LIMIT,
};

/**
 * Global Connection Pool Manager
 * 
 * Manages PostgreSQL connection pools with:
 * - LRU cache for pool eviction
 * - Global connection limits
 * - Per-pool connection limits
 * - Automatic cleanup of idle pools
 * - Connection monitoring
 */

const { Pool } = require('pg');
const { DATABASE_URL, POOL_CONFIG } = require('../config/constants');

/**
 * LRU Cache implementation for connection pools
 */
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      const evictedPool = this.cache.get(firstKey);
      this.cache.delete(firstKey);
      
      // Close evicted pool gracefully
      if (evictedPool && typeof evictedPool.end === 'function') {
        evictedPool.end().catch(err => {
          console.warn(`[PoolManager] Error closing evicted pool ${firstKey}:`, err.message);
        });
      }
      
      console.log(`[PoolManager] Evicted pool: ${firstKey} (cache limit reached)`);
    }
    
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }

  clear() {
    // Close all pools before clearing
    for (const [key, pool] of this.cache.entries()) {
      if (pool && typeof pool.end === 'function') {
        pool.end().catch(err => {
          console.warn(`[PoolManager] Error closing pool ${key} during clear:`, err.message);
        });
      }
    }
    this.cache.clear();
  }

  keys() {
    return this.cache.keys();
  }
}

/**
 * Global Pool Manager
 */
class GlobalPoolManager {
  constructor() {
    // Configuration
    this.maxPools = parseInt(process.env.MAX_AGENCY_POOLS || '50', 10);
    this.maxConnectionsPerPool = parseInt(process.env.MAX_CONNECTIONS_PER_POOL || '5', 10);
    this.poolIdleTimeout = parseInt(process.env.POOL_IDLE_TIMEOUT || '300000', 10); // 5 minutes
    
    // Main database pool (always available)
    this.mainPool = new Pool({
      connectionString: DATABASE_URL,
      ...POOL_CONFIG,
      max: Math.min(POOL_CONFIG.max || 20, 20), // Cap main pool at 20
    });

    // LRU cache for agency pools
    this.agencyPools = new LRUCache(this.maxPools);
    
    // Track pool access times for cleanup
    this.poolAccessTimes = new Map();
    
    // Start cleanup interval
    this.startCleanupInterval();
    
    // Setup error handlers
    this.setupErrorHandlers();
  }

  /**
   * Get main database pool
   */
  getMainPool() {
    return this.mainPool;
  }

  /**
   * Get or create agency database pool
   * @param {string} databaseName - Agency database name
   * @returns {Pool} PostgreSQL connection pool
   */
  getAgencyPool(databaseName) {
    if (!databaseName || typeof databaseName !== 'string') {
      return this.mainPool;
    }

    const normalizedName = databaseName.trim();
    if (!normalizedName) {
      return this.mainPool;
    }

    // Validate database name for security
    const { validateDatabaseName } = require('./securityUtils');
    try {
      validateDatabaseName(normalizedName);
    } catch (error) {
      console.error(`[PoolManager] Invalid database name: ${normalizedName}`, error.message);
      throw new Error(`Invalid database name: ${error.message}`);
    }

    // Check cache first
    let pool = this.agencyPools.get(normalizedName);
    if (pool) {
      // Update access time
      this.poolAccessTimes.set(normalizedName, Date.now());
      return pool;
    }

    // Create new pool if under limit
    if (this.agencyPools.size() >= this.maxPools) {
      console.warn(`[PoolManager] Pool limit reached (${this.maxPools}). LRU eviction will occur.`);
    }

    // Build connection string - use parseDatabaseUrl to handle special characters
    const dbConfig = parseDatabaseUrl();
    const dbHost = dbConfig.host;
    const dbPort = dbConfig.port;
    const dbUser = dbConfig.user;
    const dbPassword = dbConfig.password;

    // URL-encode password for connection string
    const encodedPassword = encodeURIComponent(dbPassword);
    const agencyDbUrl = `postgresql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${normalizedName}`;
    
    // Create pool with reduced connection limit
    pool = new Pool({
      connectionString: agencyDbUrl,
      max: this.maxConnectionsPerPool,
      idleTimeoutMillis: POOL_CONFIG.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: POOL_CONFIG.connectionTimeoutMillis || 2000,
      statement_timeout: POOL_CONFIG.statement_timeout || 60000,
      query_timeout: POOL_CONFIG.query_timeout || 60000,
    });

    // Setup error handlers
    pool.on('error', (err) => {
      console.error(`[PoolManager] PostgreSQL connection error for agency pool ${normalizedName}:`, err.message);
      // Remove pool from cache on critical errors
      if (err.code === 'ECONNREFUSED' || err.message.includes('timeout') || err.code === '57P01') {
        console.log(`[PoolManager] Removing bad pool from cache: ${normalizedName}`);
        this.agencyPools.delete(normalizedName);
        this.poolAccessTimes.delete(normalizedName);
      }
    });

    pool.on('connect', () => {
      console.log(`[PoolManager] ✅ Connected to agency database: ${normalizedName}`);
    });

    // Add to cache
    this.agencyPools.set(normalizedName, pool);
    this.poolAccessTimes.set(normalizedName, Date.now());
    
    console.log(`[PoolManager] Created new agency pool for database: ${normalizedName} (${this.agencyPools.size()}/${this.maxPools} pools)`);

    return pool;
  }

  /**
   * Setup error handlers for main pool
   */
  setupErrorHandlers() {
    this.mainPool.on('connect', () => {
      console.log('[PoolManager] ✅ Connected to PostgreSQL main database');
    });

    this.mainPool.on('error', (err) => {
      console.error('[PoolManager] ❌ PostgreSQL main pool connection error:', err);
    });
  }

  /**
   * Start cleanup interval to remove idle pools
   */
  startCleanupInterval() {
    // Cleanup every 5 minutes
    setInterval(() => {
      this.cleanupIdlePools();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup pools that haven't been accessed recently
   */
  cleanupIdlePools() {
    const now = Date.now();
    const poolsToRemove = [];

    for (const [dbName, lastAccess] of this.poolAccessTimes.entries()) {
      const idleTime = now - lastAccess;
      if (idleTime > this.poolIdleTimeout) {
        poolsToRemove.push(dbName);
      }
    }

    for (const dbName of poolsToRemove) {
      const pool = this.agencyPools.get(dbName);
      if (pool) {
        console.log(`[PoolManager] Cleaning up idle pool: ${dbName} (idle for ${Math.round((now - this.poolAccessTimes.get(dbName)) / 1000)}s)`);
        this.agencyPools.delete(dbName);
        this.poolAccessTimes.delete(dbName);
        
        // Close pool gracefully
        pool.end().catch(err => {
          console.warn(`[PoolManager] Error closing idle pool ${dbName}:`, err.message);
        });
      }
    }

    if (poolsToRemove.length > 0) {
      console.log(`[PoolManager] Cleaned up ${poolsToRemove.length} idle pools. Active pools: ${this.agencyPools.size()}`);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const stats = {
      mainPool: {
        totalCount: this.mainPool.totalCount || 0,
        idleCount: this.mainPool.idleCount || 0,
        waitingCount: this.mainPool.waitingCount || 0,
      },
      agencyPools: {
        count: this.agencyPools.size(),
        maxPools: this.maxPools,
        maxConnectionsPerPool: this.maxConnectionsPerPool,
      },
      totalAgencyConnections: 0,
    };

    // Calculate total agency connections
    for (const dbName of this.agencyPools.keys()) {
      const pool = this.agencyPools.get(dbName);
      if (pool) {
        stats.totalAgencyConnections += (pool.totalCount || 0);
      }
    }

    return stats;
  }

  /**
   * Close all pools (for graceful shutdown)
   */
  async closeAll() {
    console.log('[PoolManager] Closing all connection pools...');
    
    // Close all agency pools
    for (const dbName of this.agencyPools.keys()) {
      const pool = this.agencyPools.get(dbName);
      if (pool && typeof pool.end === 'function') {
        try {
          await pool.end();
          console.log(`[PoolManager] Closed pool: ${dbName}`);
        } catch (err) {
          console.warn(`[PoolManager] Error closing pool ${dbName}:`, err.message);
        }
      }
    }
    
    // Close main pool
    if (this.mainPool && typeof this.mainPool.end === 'function') {
      try {
        await this.mainPool.end();
        console.log('[PoolManager] Closed main pool');
      } catch (err) {
        console.warn('[PoolManager] Error closing main pool:', err.message);
      }
    }
    
    this.agencyPools.clear();
    this.poolAccessTimes.clear();
    console.log('[PoolManager] All pools closed');
  }
}

// Create singleton instance
const poolManager = new GlobalPoolManager();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[PoolManager] SIGTERM received, closing pools...');
  await poolManager.closeAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[PoolManager] SIGINT received, closing pools...');
  await poolManager.closeAll();
  process.exit(0);
});

/**
 * Parse DATABASE_URL and return connection components
 * Handles URL encoding for passwords with special characters
 * @returns {Object} { host, port, user, password }
 */
function parseDatabaseUrl() {
  const dbUrl = DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  try {
    // Try to parse as URL first
    let url;
    try {
      url = new URL(dbUrl);
      // If successful, decode components
      return {
        host: url.hostname,
        port: parseInt(url.port || '5432', 10),
        user: decodeURIComponent(url.username || 'postgres'),
        password: decodeURIComponent(url.password || 'admin'),
      };
    } catch (urlError) {
      // If URL parsing fails (e.g., due to special characters in password),
      // parse manually using regex
      // Format: postgresql://user:password@host:port/database
      const match = dbUrl.match(/^postgresql:\/\/([^:@]+)(?::([^@]+))?@([^:]+)(?::(\d+))?\/(.+)$/);
      if (match) {
        return {
          host: match[3],
          port: parseInt(match[4] || '5432', 10),
          user: decodeURIComponent(match[1]),
          password: match[2] ? decodeURIComponent(match[2]) : 'admin',
        };
      }
      
      // Try alternative format without database
      const match2 = dbUrl.match(/^postgresql:\/\/([^:@]+)(?::([^@]+))?@([^:]+)(?::(\d+))?$/);
      if (match2) {
        return {
          host: match2[3],
          port: parseInt(match2[4] || '5432', 10),
          user: decodeURIComponent(match2[1]),
          password: match2[2] ? decodeURIComponent(match2[2]) : 'admin',
        };
      }
      
      throw new Error(`Invalid DATABASE_URL format: ${urlError.message}`);
    }
  } catch (error) {
    console.error('[PoolManager] Error parsing DATABASE_URL:', error.message);
    console.error('[PoolManager] DATABASE_URL:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'undefined');
    throw new Error(`Failed to parse DATABASE_URL: ${error.message}`);
  }
}

module.exports = {
  poolManager,
  getAgencyPool: (databaseName) => poolManager.getAgencyPool(databaseName),
  getMainPool: () => poolManager.getMainPool(),
  getPoolStats: () => poolManager.getStats(),
  parseDatabaseUrl,
};

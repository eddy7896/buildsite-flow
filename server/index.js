/**
 * BuildFlow API Server
 * Main entry point - modular Express.js application
 */

// Load environment variables from .env file (must be first)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

/**
 * Validate required secrets on startup
 * Prevents server from starting with default or missing secrets
 * 
 * Note: In Docker, environment variables are set by docker-compose.yml
 * In local development, they come from .env file via dotenv
 * 
 * Note: Uses console.log because this runs before logger is initialized
 */
function validateRequiredSecrets() {
  // Check all possible environment variable names
  const postgresPassword = process.env.POSTGRES_PASSWORD || 
                          process.env.DATABASE_URL?.match(/:(.+?)@/)?.[1] ||
                          process.env.VITE_DATABASE_URL?.match(/:(.+?)@/)?.[1];
  
  const jwtSecret = process.env.VITE_JWT_SECRET || 
                   process.env.JWT_SECRET;

  const required = {
    POSTGRES_PASSWORD: postgresPassword,
    VITE_JWT_SECRET: jwtSecret,
  };

  const missing = [];
  const weak = [];
  const defaultValues = [
    'admin',
    'your-super-secret-jwt-key-change-this-in-production',
    'change-this-in-production',
  ];

  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    } else if (value.length < 32) {
      weak.push(key);
    } else if (defaultValues.some(defaultVal => value.includes(defaultVal))) {
      weak.push(`${key} (appears to be using default value)`);
    }
  }

  if (missing.length > 0) {
    // Use console.error here because logger is not initialized yet
    console.error('❌ CRITICAL: Missing required secrets:', missing.join(', '));
    console.error('   Please set these in your .env file or docker-compose.yml');
    console.error('   Generate secrets with: openssl rand -base64 32');
    console.error('');
    console.error('   For Docker: Set in .env file and docker-compose.yml will use them');
    console.error('   For local: Set in .env file in project root');
    process.exit(1);
  }

  if (weak.length > 0) {
    // Use console.error here because logger is not initialized yet
    console.error('❌ CRITICAL: Weak or default secrets detected:', weak.join(', '));
    console.error('   Secrets must be at least 32 characters and not use default values');
    console.error('   Generate strong secrets with: openssl rand -base64 32');
    process.exit(1);
  }

  // Use console.log here because logger is not initialized yet
  console.log('✅ All required secrets validated');
}

// Validate secrets before starting server
validateRequiredSecrets();

const express = require('express');
const http = require('http');
const logger = require('./utils/logger');
const { configureMiddleware } = require('./config/middleware');
const { errorHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { PORT, DATABASE_URL } = require('./config/constants');
const { getRedisClient, isRedisAvailable } = require('./config/redis');

// Import routes
const healthRoutes = require('./routes/health');
const filesRoutes = require('./routes/files');
const databaseRoutes = require('./routes/database');
const authRoutes = require('./routes/auth');
const agenciesRoutes = require('./routes/agencies');
const schemaRoutes = require('./routes/schema');
const systemRoutes = require('./routes/system');
const permissionsRoutes = require('./routes/permissions');
const auditRoutes = require('./routes/audit');
const reportsRoutes = require('./routes/reports');
const twoFactorRoutes = require('./routes/twoFactor');
const systemHealthRoutes = require('./routes/systemHealth');
const backupRoutes = require('./routes/backups');
const inventoryRoutes = require('./routes/inventory');
const procurementRoutes = require('./routes/procurement');
const assetsRoutes = require('./routes/assets');
const currencyRoutes = require('./routes/currency');
const financialRoutes = require('./routes/financial');
const advancedReportsRoutes = require('./routes/advancedReports');
const graphqlRoutes = require('./routes/graphql');
const webhookRoutes = require('./routes/webhooks');
const apiDocsRoutes = require('./routes/api-docs');
const projectEnhancementsRoutes = require('./routes/projectEnhancements');
const crmEnhancementsRoutes = require('./routes/crmEnhancements');
const ssoRoutes = require('./routes/sso');
const passwordPolicyRoutes = require('./routes/passwordPolicy');
const databaseOptimizationRoutes = require('./routes/databaseOptimization');
const apiKeysRoutes = require('./routes/apiKeys');
const sessionManagementRoutes = require('./routes/sessionManagement');
const emailRoutes = require('./routes/email');
const messagingRoutes = require('./routes/messaging');
const workflowsRoutes = require('./routes/workflows');
const integrationsRoutes = require('./routes/integrations');
const settingsRoutes = require('./routes/settings');
const pageCatalogRoutes = require('./routes/pageCatalog');
const schemaAdminRoutes = require('./routes/schemaAdmin');

// Create Express app
const app = express();

// Configure middleware
configureMiddleware(app);

// Request logging (after CORS, before routes)
app.use(requestLogger);

// Apply general API rate limiting (after CORS but before routes)
// Note: system-health endpoints are excluded from rate limiting in rateLimiter.js
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

// Health check route
app.use('/health', healthRoutes);

// API routes
app.use('/api/files', filesRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/schema', schemaRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/two-factor', twoFactorRoutes);
app.use('/api/system-health', systemHealthRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/advanced-reports', advancedReportsRoutes);
app.use('/api/graphql', graphqlRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api-docs', apiDocsRoutes);
app.use('/api/projects', projectEnhancementsRoutes);
app.use('/api/crm', crmEnhancementsRoutes);
app.use('/api/sso', ssoRoutes);
app.use('/api/password-policy', passwordPolicyRoutes);
app.use('/api/database-optimization', databaseOptimizationRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/sessions', sessionManagementRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/system/page-catalog', pageCatalogRoutes);
app.use('/health', schemaAdminRoutes); // Health check routes (no /api prefix)
app.use('/admin', schemaAdminRoutes); // Admin routes (no /api prefix)

// Global error handler (must be last)
app.use(errorHandler);

// Initialize Redis on startup
async function initializeRedis() {
  try {
    const available = await isRedisAvailable();
    if (available) {
      logger.info('Redis cache initialized');
    } else {
      logger.warn('Redis not available, using in-memory cache fallback');
    }
  } catch (error) {
    logger.warn('Redis initialization warning', { error: error.message });
  }
}

// Initialize automated backups
function initializeBackups() {
  const cron = require('node-cron');
  const { createBackup, cleanupOldBackups, BACKUP_SCHEDULE } = require('./services/backupService');
  const { parseDatabaseUrl } = require('./utils/poolManager');
  
  // Schedule daily backups
  cron.schedule(BACKUP_SCHEDULE, async () => {
    try {
      logger.info('Starting scheduled backup');
      const dbConfig = parseDatabaseUrl();
      const dbName = dbConfig.database || 'buildflow_db';
      await createBackup(dbName, 'full');
      
      // Clean up old backups
      const deleted = await cleanupOldBackups();
      if (deleted > 0) {
        logger.info('Cleaned up old backups', { count: deleted });
      }
    } catch (error) {
      logger.error('Scheduled backup failed', { error: error.message, stack: error.stack });
    }
  });
  
  logger.info('Automated backups scheduled', { schedule: BACKUP_SCHEDULE });
}

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize WebSocket server
const { initializeWebSocket } = require('./services/websocketService');
const io = initializeWebSocket(server);

// Make io available globally for services
global.io = io;

// Start server
server.listen(PORT, '0.0.0.0', async () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  
  try {
    const dbHostInfo = DATABASE_URL.split('@')[1] || DATABASE_URL;
    logger.info('Database connected', { host: dbHostInfo });
  } catch (error) {
    logger.warn('Database connection info unavailable', { error: error.message });
  }
  
  // Initialize Redis
  await initializeRedis();
  
  // Initialize automated backups
  initializeBackups();
  
  // Initialize scheduled reports
  const { initializeScheduledReports } = require('./services/scheduledReportService');
  initializeScheduledReports();
  
  logger.info('WebSocket server initialized');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  const { closeRedisConnection } = require('./config/redis');
  await closeRedisConnection();
  logger.info('Shutdown complete');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  const { closeRedisConnection } = require('./config/redis');
  await closeRedisConnection();
  logger.info('Shutdown complete');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { 
    reason: reason?.message || reason, 
    stack: reason?.stack,
  });
});

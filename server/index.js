/**
 * BuildFlow API Server
 * Main entry point - modular Express.js application
 */

// Load environment variables from .env file (must be first)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const { configureMiddleware } = require('./config/middleware');
const { errorHandler } = require('./middleware/errorHandler');
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

// Create Express app
const app = express();

// Configure middleware
configureMiddleware(app);

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

// Global error handler (must be last)
app.use(errorHandler);

// Initialize Redis on startup
async function initializeRedis() {
  try {
    const available = await isRedisAvailable();
    if (available) {
      console.log('✅ Redis cache initialized');
    } else {
      console.log('⚠️  Redis not available, using in-memory cache fallback');
    }
  } catch (error) {
    console.warn('⚠️  Redis initialization warning:', error.message);
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
      console.log('[Backup] Starting scheduled backup...');
      const dbConfig = parseDatabaseUrl();
      const dbName = dbConfig.database || 'buildflow_db';
      await createBackup(dbName, 'full');
      
      // Clean up old backups
      const deleted = await cleanupOldBackups();
      if (deleted > 0) {
        console.log(`[Backup] Cleaned up ${deleted} old backup(s)`);
      }
    } catch (error) {
      console.error('[Backup] Scheduled backup failed:', error);
    }
  });
  
  console.log(`✅ Automated backups scheduled (${BACKUP_SCHEDULE})`);
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('   Ensure VITE_API_URL points at this host/port for frontend calls.');
  try {
    const dbHostInfo = DATABASE_URL.split('@')[1] || DATABASE_URL;
    console.log(`📊 Database: ${dbHostInfo}`);
  } catch {
    console.log(`📊 Database URL: ${DATABASE_URL}`);
  }
  
  // Initialize Redis
  await initializeRedis();
  
  // Initialize automated backups
  initializeBackups();
  
  // Initialize scheduled reports
  const { initializeScheduledReports } = require('./services/scheduledReportService');
  initializeScheduledReports();
  
  console.log('✅ WebSocket server initialized');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis connection...');
  const { closeRedisConnection } = require('./config/redis');
  await closeRedisConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Redis connection...');
  const { closeRedisConnection } = require('./config/redis');
  await closeRedisConnection();
  process.exit(0);
});

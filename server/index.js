/**
 * BuildFlow API Server
 * Main entry point - modular Express.js application
 */

const express = require('express');
const { configureMiddleware } = require('./config/middleware');
const { errorHandler } = require('./middleware/errorHandler');
const { PORT, DATABASE_URL } = require('./config/constants');

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

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('   Ensure VITE_API_URL points at this host/port for frontend calls.');
  try {
    const dbHostInfo = DATABASE_URL.split('@')[1] || DATABASE_URL;
    console.log(`📊 Database: ${dbHostInfo}`);
  } catch {
    console.log(`📊 Database URL: ${DATABASE_URL}`);
  }
});

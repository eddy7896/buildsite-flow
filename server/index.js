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

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${DATABASE_URL.split('@')[1]}`);
});

/**
 * Express Middleware Configuration
 */

const cors = require('cors');
const express = require('express');
const { JSON_LIMIT } = require('./constants');

/**
 * Build CORS options from environment variables.
 * Supports multiple frontends (localhost, LAN IPs, production domains).
 */
function buildCorsOptions() {
  const rawOrigins = process.env.CORS_ORIGINS || '';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // In development, if no explicit origins are configured, allow all.
  const allowAll = allowedOrigins.length === 0;

  /** @type {cors.CorsOptions} */
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser / same-origin requests (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      if (allowAll || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn('[CORS] Blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Agency-Database',
      'X-Requested-With',
      'X-API-Key',
    ],
    credentials: false, // Auth is header-based, not cookie-based
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  return corsOptions;
}

/**
 * Configure and return Express middleware
 * @param {Express} app - Express application instance
 */
function configureMiddleware(app) {
  // CORS middleware
  app.use(cors(buildCorsOptions()));

  // JSON body parser with 50MB limit for base64 encoded images
  app.use(express.json({ limit: JSON_LIMIT }));

  // URL-encoded body parser
  app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));
}

module.exports = {
  configureMiddleware,
};

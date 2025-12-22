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

  const isDevelopment = process.env.NODE_ENV !== 'production' || 
                        process.env.VITE_APP_ENVIRONMENT === 'development';
  
  // Common development origins (Vite, React, etc.) - always allow localhost for local dev/testing
  const commonDevOrigins = [
    'http://localhost:5173',  // Vite default
    'http://localhost:5174',  // Vite alternate
    'http://localhost:3000',  // React default
    'http://localhost:3001',  // React alternate
    'http://localhost:8080',  // Vue/other
    'http://localhost:8081',  // Vue alternate
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
  ];

  // Helper to check if origin is localhost
  const isLocalhost = (origin) => {
    if (!origin) return false;
    try {
      const url = new URL(origin);
      return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.');
    } catch {
      return false;
    }
  };

  // In development, allow all if no explicit origins, or merge with common dev origins
  const allowAll = isDevelopment && allowedOrigins.length === 0;
  const finalAllowedOrigins = isDevelopment && allowedOrigins.length > 0
    ? [...new Set([...allowedOrigins, ...commonDevOrigins])]
    : allowedOrigins;

  /** @type {cors.CorsOptions} */
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser / same-origin requests (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      // Always allow localhost origins (for local development and Docker testing)
      if (isLocalhost(origin)) {
        return callback(null, true);
      }

      if (allowAll || finalAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn('[CORS] Blocked origin:', origin);
      console.warn('[CORS] Allowed origins:', finalAllowedOrigins);
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

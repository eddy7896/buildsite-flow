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

  // Debug logging
  console.log('[CORS] Raw CORS_ORIGINS from env:', rawOrigins);
  console.log('[CORS] Parsed allowed origins:', allowedOrigins);

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

  // Helper to check if origin is localhost or private IP
  const isLocalhost = (origin) => {
    if (!origin) return false;
    try {
      const url = new URL(origin);
      const hostname = url.hostname.toLowerCase();
      return hostname === 'localhost' || 
             hostname === '127.0.0.1' || 
             hostname.startsWith('192.168.') || 
             hostname.startsWith('10.') ||
             hostname.startsWith('172.16.') ||
             hostname.startsWith('172.17.') ||
             hostname.startsWith('172.18.') ||
             hostname.startsWith('172.19.') ||
             hostname.startsWith('172.20.') ||
             hostname.startsWith('172.21.') ||
             hostname.startsWith('172.22.') ||
             hostname.startsWith('172.23.') ||
             hostname.startsWith('172.24.') ||
             hostname.startsWith('172.25.') ||
             hostname.startsWith('172.26.') ||
             hostname.startsWith('172.27.') ||
             hostname.startsWith('172.28.') ||
             hostname.startsWith('172.29.') ||
             hostname.startsWith('172.30.') ||
             hostname.startsWith('172.31.');
    } catch {
      return false;
    }
  };

  // Helper to check if origin matches any allowed origin (with or without port/protocol)
  const matchesAllowedOrigin = (origin, allowedList) => {
    if (!origin) return false;
    try {
      const originUrl = new URL(origin);
      const originHost = originUrl.hostname.toLowerCase();
      const originPort = originUrl.port || (originUrl.protocol === 'https:' ? '443' : '80');
      
      for (const allowed of allowedList) {
        try {
          const allowedUrl = new URL(allowed);
          const allowedHost = allowedUrl.hostname.toLowerCase();
          const allowedPort = allowedUrl.port || (allowedUrl.protocol === 'https:' ? '443' : '80');
          
          // Match hostname and port
          if (originHost === allowedHost && originPort === allowedPort) {
            return true;
          }
          // Also match without port (default ports)
          if (originHost === allowedHost && 
              ((originPort === '80' && !allowedUrl.port) || 
               (originPort === '443' && !allowedUrl.port))) {
            return true;
          }
        } catch {
          // If allowed is not a full URL, try string matching
          if (origin.includes(allowed) || allowed.includes(origin)) {
            return true;
          }
        }
      }
      return false;
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

      // Normalize origin for comparison (remove trailing slash, lowercase)
      const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');

      // Check exact match first (normalized)
      if (allowAll) {
        return callback(null, true);
      }

      // Check exact match in allowed origins (normalized)
      const normalizedAllowed = finalAllowedOrigins.map(o => o.toLowerCase().replace(/\/$/, ''));
      if (normalizedAllowed.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Check if origin matches any allowed origin (flexible matching)
      if (matchesAllowedOrigin(origin, finalAllowedOrigins)) {
        return callback(null, true);
      }

      // Additional check: match by hostname (ignore protocol/port differences for same domain)
      try {
        const originUrl = new URL(origin);
        const originHost = originUrl.hostname.toLowerCase();
        const originBaseHost = originHost.replace(/^www\./, '');
        
        for (const allowed of finalAllowedOrigins) {
          try {
            const allowedUrl = new URL(allowed);
            const allowedHost = allowedUrl.hostname.toLowerCase();
            const allowedBaseHost = allowedHost.replace(/^www\./, '');
            
            // Match if hostnames are the same (e.g., www.dezignbuild.site matches dezignbuild.site)
            if (originHost === allowedHost || 
                originBaseHost === allowedBaseHost ||
                originHost === allowedBaseHost ||
                originBaseHost === allowedHost) {
              console.log('[CORS] ✅ Allowed origin (hostname match):', origin, 'matched', allowed);
              return callback(null, true);
            }
          } catch {
            // If allowed is not a full URL, try string matching
            const allowedLower = allowed.toLowerCase();
            if (originHost.includes(allowedLower) || allowedLower.includes(originHost) ||
                originBaseHost.includes(allowedLower) || allowedLower.includes(originBaseHost)) {
              console.log('[CORS] ✅ Allowed origin (string match):', origin, 'matched', allowed);
              return callback(null, true);
            }
          }
        }
      } catch (e) {
        // If origin is not a valid URL, log and continue to error
        console.warn('[CORS] Invalid origin URL:', origin, e.message);
      }

      console.warn('[CORS] ❌ Blocked origin:', origin);
      console.warn('[CORS] Normalized origin:', normalizedOrigin);
      console.warn('[CORS] Allowed origins count:', finalAllowedOrigins.length);
      console.warn('[CORS] First 3 allowed origins:', finalAllowedOrigins.slice(0, 3));
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

  // Handle preflight OPTIONS requests explicitly
  app.options('*', (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agency-Database, X-Requested-With, X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }
    res.sendStatus(204);
  });

  // JSON body parser with 50MB limit for base64 encoded images
  app.use(express.json({ limit: JSON_LIMIT }));

  // URL-encoded body parser
  app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));
}

module.exports = {
  configureMiddleware,
};

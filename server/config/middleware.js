/**
 * Express Middleware Configuration
 */

const cors = require('cors');
const express = require('express');
const { JSON_LIMIT } = require('./constants');

/**
 * Configure and return Express middleware
 * @param {Express} app - Express application instance
 */
function configureMiddleware(app) {
  // CORS middleware
  app.use(cors());

  // JSON body parser with 50MB limit for base64 encoded images
  app.use(express.json({ limit: JSON_LIMIT }));

  // URL-encoded body parser
  app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));
}

module.exports = {
  configureMiddleware,
};

#!/usr/bin/env node
/**
 * Production-Ready Frontend Server
 * 
 * Features:
 * - Serves static assets from build directory
 * - Injects runtime environment variables
 * - Sets security headers
 * - Handles SPA routing
 * - Supports healthchecks
 * - Provides response compression
 * - Configurable cache control
 */
const express = require('express');
const path = require('path');
const compression = require('compression');
const fs = require('fs');
const helmet = require('helmet');

// App configuration
const app = express();
const port = process.env.PORT || 3000;
const buildDir = path.join(__dirname, process.env.BUILD_DIR || 'build');
const isDev = process.env.NODE_ENV !== 'production';

// Check build directory exists
if (!fs.existsSync(buildDir)) {
  console.error(`Error: Build directory "${buildDir}" not found`);
  console.error('Please run "npm run build" before starting the server');
  process.exit(1);
}

// Environment variables to expose to the frontend
function getClientEnv() {
  // Whitelist of environment variables that can be exposed to the client
  const envWhitelist = [
    'API_URL',
    'SOCKET_URL',
    'NODE_ENV',
    'ENVIRONMENT',
    'PUBLIC_PATH',
    'ASSET_URL',
    'ANALYTICS_ID',
    'SENTRY_DSN',
    'SENTRY_ENVIRONMENT',
    'SENTRY_RELEASE',
    'LOG_LEVEL',
    'CSRF_HEADER_NAME',
    'CSRF_COOKIE_NAME',
    'ENABLE_NOTIFICATIONS',
    'ENABLE_CHAT',
    'ENABLE_PAYMENTS',
  ];
  
  // Collect all environment variables with REACT_APP_ or VITE_ prefixes
  const clientEnv = {};
  
  // Get whitelisted env vars
  envWhitelist.forEach(key => {
    // Check for variables with and without prefix
    const value = process.env[`REACT_APP_${key}`] || 
                  process.env[`VITE_${key}`] || 
                  process.env[key];
                  
    if (value !== undefined) {
      clientEnv[key] = value;
    }
  });
  
  // Add all environment variables with REACT_APP_ prefix
  Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .forEach(key => {
      const unprefixedKey = key.replace(/^REACT_APP_/, '');
      clientEnv[unprefixedKey] = process.env[key];
    });
  
  // Add all environment variables with VITE_ prefix
  Object.keys(process.env)
    .filter(key => key.startsWith('VITE_'))
    .forEach(key => {
      const unprefixedKey = key.replace(/^VITE_/, '');
      clientEnv[unprefixedKey] = process.env[key];
    });
  
  // Version and deployment info
  clientEnv.APP_VERSION = process.env.npm_package_version || '0.0.0';
  clientEnv.BUILD_TIME = new Date().toISOString();
  
  return clientEnv;
}

// Enable response compression
app.use(compression());

// Set security headers in production
if (!isDev) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https://*.amazonaws.com", "https://*.cloudfront.net"],
          connectSrc: ["'self'", "https://*.amazonaws.com", "https://*.cloudfront.net", "https://*.sentry.io"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      // Allow iframes for same origin
      frameguard: { action: 'sameorigin' }
    })
  );
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ready check endpoint
app.get('/ready', (_req, res) => {
  res.status(200).send({ status: 'ready', timestamp: new Date().toISOString() });
});

// Expose runtime env to window.__ENV
app.get('/env.js', (_req, res) => {
  const clientEnv = getClientEnv();
  
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  
  res.type('application/javascript');
  res.send(`window.__ENV = ${JSON.stringify(clientEnv, null, isDev ? 2 : 0)};`);
});

// Static files - configure caching based on file type
app.use(
  express.static(buildDir, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Long-term caching for hashed assets
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        const maxAge = isDev ? 0 : 31536000; // 1 year in seconds
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      } else {
        // Shorter caching for other files
        const maxAge = isDev ? 0 : 86400; // 1 day in seconds
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      }
    },
  })
);

// SPA routing - serve index.html for all routes
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(buildDir, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (isDev) {
    console.log(`Open: http://localhost:${port}`);
  }
});
#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are present
 * for the current environment (development, production, or test).
 * 
 * Usage: npm run validate:env
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
const NODE_ENV = process.env.NODE_ENV || 'development';

// Define required variables for each environment
const requiredVars = {
  base: [
    'REACT_APP_API_URL',
  ],
  development: [
    'REACT_APP_SOCKET_URL',
  ],
  production: [
    'REACT_APP_SOCKET_URL',
    'REACT_APP_FRONTEND_URL',
  ],
  test: [],
};

// Define warning variables (not required but recommended)
const warningVars = {
  base: [
    'REACT_APP_LOG_LEVEL',
  ],
  development: [],
  production: [
    'REACT_APP_SENTRY_DSN',
    'REACT_APP_ANALYTICS_ID',
  ],
  test: [],
};

console.log(`Validating environment variables for ${NODE_ENV} environment...`);

// Combine base variables with environment-specific variables
const requiredForEnv = [...requiredVars.base, ...requiredVars[NODE_ENV]];
const warningForEnv = [...warningVars.base, ...warningVars[NODE_ENV]];

// Track missing variables
const missing = [];
const warnings = [];

// Check required variables
requiredForEnv.forEach(varName => {
  if (!process.env[varName]) {
    missing.push(varName);
  }
});

// Check warning variables
warningForEnv.forEach(varName => {
  if (!process.env[varName]) {
    warnings.push(varName);
  }
});

// Display results
if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missing.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease add these variables to your .env file or deployment environment.');
  console.error('See .env.example for reference.\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are present.');
}

if (warnings.length > 0) {
  console.warn('\n⚠️ Missing recommended environment variables:');
  warnings.forEach(varName => {
    console.warn(`   - ${varName}`);
  });
  console.warn('\nThese are not required but recommended for optimal functionality.');
  console.warn('See .env.example for reference.\n');
}

console.log('✅ Environment validation completed successfully.');

// frontend/src/config/environment.js

/**
 * Environment configuration for the frontend application
 * This centralizes all environment-specific settings
 * 
 * Supports multiple sources of environment variables:
 * 1. Runtime variables injected via window.__ENV (highest priority)
 * 2. Vite environment variables (import.meta.env.VITE_*)
 * 3. Create React App environment variables (process.env.REACT_APP_*)
 * 4. Default values (lowest priority)
 */

// Helper function to get environment variables from different sources
const getEnv = (key, defaultValue) => {
  // Check for runtime injected environment variables (highest priority)
  if (typeof window !== 'undefined' && window.__ENV && window.__ENV[key] !== undefined) {
    return window.__ENV[key];
  }
  
  // Check for Vite environment variables
  if (import.meta?.env?.[`VITE_${key}`] !== undefined) {
    return import.meta.env[`VITE_${key}`];
  }
  
  // Check for CRA environment variables
  if (process.env[`REACT_APP_${key}`] !== undefined) {
    return process.env[`REACT_APP_${key}`];
  }
  
  // Return default value
  return defaultValue;
};

// Helper for boolean environment variables
const getBoolEnv = (key, defaultValue = false) => {
  const val = getEnv(key, defaultValue ? 'true' : 'false');
  return val === 'true' || val === '1' || val === 'yes';
};

// Helper for numeric environment variables
const getNumEnv = (key, defaultValue) => {
  const val = getEnv(key, String(defaultValue));
  const num = Number(val);
  return isNaN(num) ? defaultValue : num;
};

// Environment name
export const ENVIRONMENT = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = ENVIRONMENT === 'production';
export const IS_DEVELOPMENT = ENVIRONMENT === 'development';
export const IS_TEST = ENVIRONMENT === 'test';

// API URLs
export const API_URL = getEnv('API_URL', IS_DEVELOPMENT ? 'http://localhost:5050/api' : '/api');
export const SOCKET_URL = getEnv('SOCKET_URL', IS_DEVELOPMENT ? 'http://localhost:5050' : '');

// Auth settings
export const TOKEN_REFRESH_INTERVAL = getNumEnv('TOKEN_REFRESH_INTERVAL', 15 * 60 * 1000); // 15 minutes
export const TOKEN_EXPIRY = getNumEnv('TOKEN_EXPIRY', 60 * 60 * 1000); // 1 hour
export const AUTH_STORAGE_PREFIX = getEnv('AUTH_STORAGE_PREFIX', 'aa_');
export const CSRF_HEADER_NAME = getEnv('CSRF_HEADER_NAME', 'X-CSRF-Token');
export const CSRF_COOKIE_NAME = getEnv('CSRF_COOKIE_NAME', 'csrf-token');

// Feature flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: getBoolEnv('ENABLE_NOTIFICATIONS', false),
  ENABLE_CHAT: getBoolEnv('ENABLE_CHAT', false),
  ENABLE_PAYMENTS: getBoolEnv('ENABLE_PAYMENTS', false),
};

// Asset paths
export const ASSET_URL = getEnv('ASSET_URL', '');
export const PUBLIC_PATH = getEnv('PUBLIC_PATH', '');

// Analytics and monitoring
export const ANALYTICS_ID = getEnv('ANALYTICS_ID', '');
export const SENTRY_DSN = getEnv('SENTRY_DSN', '');
export const SENTRY_ENVIRONMENT = getEnv('SENTRY_ENVIRONMENT', ENVIRONMENT);
export const SENTRY_RELEASE = getEnv('SENTRY_RELEASE', '');

// Performance and caching
export const API_CACHE_DURATION = getNumEnv('API_CACHE_DURATION', 5 * 60 * 1000); // 5 minutes
export const MAX_RETRY_ATTEMPTS = getNumEnv('MAX_RETRY_ATTEMPTS', 3);
export const RETRY_DELAY_MS = getNumEnv('RETRY_DELAY_MS', 1000); // 1 second

// Logging
export const LOG_LEVEL = getEnv('LOG_LEVEL', IS_PRODUCTION ? 'error' : 'debug');

/**
 * Get all environment variables with a specific prefix from all sources
 * @param {string} prefix - The prefix to filter environment variables by
 * @returns {Object} Object containing all matching environment variables
 */
export const getEnvVarsByPrefix = (prefix) => {
  const result = {};
  
  // Get environment variables from window.__ENV (runtime)
  if (typeof window !== 'undefined' && window.__ENV) {
    Object.keys(window.__ENV)
      .filter(key => key.startsWith(prefix))
      .forEach(key => {
        result[key] = window.__ENV[key];
      });
  }
  
  // Get environment variables from Vite (build time)
  if (import.meta?.env) {
    Object.keys(import.meta.env)
      .filter(key => key.startsWith(`VITE_${prefix}`))
      .forEach(key => {
        const cleanKey = key.replace(/^VITE_/, '');
        if (!result[cleanKey]) {
          result[cleanKey] = import.meta.env[key];
        }
      });
  }
  
  // Get environment variables from process.env (CRA build time)
  Object.keys(process.env)
    .filter(key => key.startsWith(`REACT_APP_${prefix}`))
    .forEach(key => {
      const cleanKey = key.replace(/^REACT_APP_/, '');
      if (!result[cleanKey]) {
        result[cleanKey] = process.env[key];
      }
    });
    
  return result;
};

/**
 * Get complete environment configuration
 * @returns {Object} Complete environment configuration
 */
export const getEnvironmentConfig = () => {
  return {
    // API settings
    API_URL,
    SOCKET_URL,
    
    // Environment info
    ENVIRONMENT,
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    IS_TEST,
    
    // Auth settings
    TOKEN_REFRESH_INTERVAL,
    TOKEN_EXPIRY,
    AUTH_STORAGE_PREFIX,
    CSRF_HEADER_NAME,
    CSRF_COOKIE_NAME,
    
    // Features
    FEATURES,
    
    // Assets
    ASSET_URL,
    PUBLIC_PATH,
    
    // Analytics and monitoring
    ANALYTICS_ID,
    SENTRY_DSN,
    SENTRY_ENVIRONMENT,
    SENTRY_RELEASE,
    
    // Performance and caching
    API_CACHE_DURATION,
    MAX_RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
    
    // Logging
    LOG_LEVEL,
  };
};

/**
 * Check if all required environment variables are present
 * @returns {Object} Object with isValid flag and any missing variables
 */
export const validateEnvironment = () => {
  const requiredVars = [
    'API_URL'
  ];
  
  const missing = requiredVars.filter(varName => !getEnv(varName, null));
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Export all environment variables as a single object
export default {
  // API settings
  API_URL,
  SOCKET_URL,
  
  // Environment info
  ENVIRONMENT,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  
  // Auth settings
  TOKEN_REFRESH_INTERVAL,
  TOKEN_EXPIRY,
  AUTH_STORAGE_PREFIX,
  CSRF_HEADER_NAME,
  CSRF_COOKIE_NAME,
  
  // Features
  FEATURES,
  
  // Assets
  ASSET_URL,
  PUBLIC_PATH,
  
  // Analytics and monitoring
  ANALYTICS_ID,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_RELEASE,
  
  // Performance and caching
  API_CACHE_DURATION,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY_MS,
  
  // Logging
  LOG_LEVEL,
  
  // Utility functions
  getEnv,
  getBoolEnv,
  getNumEnv,
  getEnvVarsByPrefix,
  getEnvironmentConfig,
  validateEnvironment,
};

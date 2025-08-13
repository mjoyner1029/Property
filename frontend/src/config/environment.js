// frontend/src/config/environment.js

/**
 * Environment configuration for the frontend application
 * This centralizes all environment-specific settings
 */

// API URLs
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5050';

// Auth settings
export const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
export const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds
export const AUTH_STORAGE_PREFIX = 'aa_'; // Prefix for all auth-related localStorage items

// Feature flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_CHAT: process.env.REACT_APP_ENABLE_CHAT === 'true',
  ENABLE_PAYMENTS: process.env.REACT_APP_ENABLE_PAYMENTS === 'true',
};

// Environment name
export const ENVIRONMENT = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = ENVIRONMENT === 'production';
export const IS_DEVELOPMENT = ENVIRONMENT === 'development';

// Asset paths
export const ASSET_URL = process.env.REACT_APP_ASSET_URL || '';

// Analytics
export const ANALYTICS_ID = process.env.REACT_APP_ANALYTICS_ID || '';

/**
 * Get all environment variables with a specific prefix
 * @param {string} prefix - The prefix to filter environment variables by
 * @returns {Object} Object containing all matching environment variables
 */
export const getEnvVarsByPrefix = (prefix) => {
  return Object.keys(process.env)
    .filter(key => key.startsWith(prefix))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});
};

/**
 * Get complete environment configuration
 * @returns {Object} Complete environment configuration
 */
export const getEnvironmentConfig = () => {
  return {
    API_URL,
    SOCKET_URL,
    ENVIRONMENT,
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    FEATURES,
    ASSET_URL,
  };
};

export default {
  API_URL,
  SOCKET_URL,
  TOKEN_REFRESH_INTERVAL,
  TOKEN_EXPIRY,
  AUTH_STORAGE_PREFIX,
  FEATURES,
  ENVIRONMENT,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  ASSET_URL,
  ANALYTICS_ID,
  getEnvVarsByPrefix,
  getEnvironmentConfig,
};

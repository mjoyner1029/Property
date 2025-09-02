/**
 * Environment configuration for the application
 * Centralizes all environment variables with proper TypeScript typing
 */

// Types for environment variables
export interface Environment {
  // Core configuration
  NODE_ENV: 'development' | 'test' | 'production';
  API_BASE_URL: string;
  
  // Feature flags
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_CHAT: boolean;
  ENABLE_PAYMENTS: boolean;
  
  // Monitoring
  SENTRY_DSN: string;
  SENTRY_ENVIRONMENT: string;
  SENTRY_RELEASE: string;
  
  // Auth configuration
  TOKEN_REFRESH_INTERVAL: number;
  AUTH_STORAGE_PREFIX: string;
  
  // Misc configuration
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

// Helper to get environment variables with proper type checking and fallbacks
const getBoolEnv = (key: string, defaultValue = false): boolean => {
  const val = getEnvValue(`REACT_APP_${key}`, String(defaultValue));
  return val === 'true' || val === '1' || val === 'yes';
};

const getNumEnv = (key: string, defaultValue: number): number => {
  const val = getEnvValue(`REACT_APP_${key}`, String(defaultValue));
  const num = Number(val);
  return isNaN(num) ? defaultValue : num;
};

const getEnvValue = (key: string, defaultValue: string): string => {
  // First check window.__ENV (runtime injected)
  if (typeof window !== 'undefined' && 
      window.__ENV && 
      window.__ENV[key.replace('REACT_APP_', '')] !== undefined &&
      window.__ENV[key.replace('REACT_APP_', '')] !== '') {
    return window.__ENV[key.replace('REACT_APP_', '')];
  }
  
  // Then check process.env
  if (process.env[key] !== undefined && process.env[key] !== '') {
    return process.env[key] as string;
  }
  
  // Production checks for required variables
  if (process.env.NODE_ENV === 'production') {
    // List of variables that are required in production
    const requiredInProduction = ['REACT_APP_API_BASE_URL'];
    
    if (requiredInProduction.includes(key) && defaultValue === '') {
      throw new Error(`Required environment variable ${key} is missing in production`);
    }
  }
  
  return defaultValue;
};

// Create and export the environment object
const env: Environment = {
  // Core configuration
  NODE_ENV: process.env.NODE_ENV as 'development' | 'test' | 'production' || 'development',
  API_BASE_URL: getEnvValue('REACT_APP_API_BASE_URL', process.env.NODE_ENV === 'development' ? 'http://localhost:5050/api' : '/api'),
  
  // Feature flags
  ENABLE_NOTIFICATIONS: getBoolEnv('ENABLE_NOTIFICATIONS', false),
  ENABLE_CHAT: getBoolEnv('ENABLE_CHAT', false),
  ENABLE_PAYMENTS: getBoolEnv('ENABLE_PAYMENTS', true),
  
  // Monitoring
  SENTRY_DSN: getEnvValue('REACT_APP_SENTRY_DSN', ''),
  SENTRY_ENVIRONMENT: getEnvValue('REACT_APP_SENTRY_ENVIRONMENT', process.env.NODE_ENV || 'development'),
  SENTRY_RELEASE: getEnvValue('REACT_APP_SENTRY_RELEASE', ''),
  
  // Auth configuration
  TOKEN_REFRESH_INTERVAL: getNumEnv('TOKEN_REFRESH_INTERVAL', 15 * 60 * 1000), // 15 minutes
  AUTH_STORAGE_PREFIX: getEnvValue('REACT_APP_AUTH_STORAGE_PREFIX', 'aa_'),
  
  // Misc configuration
  LOG_LEVEL: getEnvValue('REACT_APP_LOG_LEVEL', process.env.NODE_ENV === 'production' ? 'error' : 'debug') as 'debug' | 'info' | 'warn' | 'error',
};

// Add window type declaration for the runtime env
declare global {
  interface Window {
    __ENV?: Record<string, string>;
  }
}

export default env;

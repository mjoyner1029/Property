// public/env.js - Runtime environment variable injector
(function(window) {
  // This script injects environment variables at runtime
  // It allows static deployments to have environment-specific configuration
  
  window.__ENV = window.__ENV || {};
  
  // These environment variables are replaced at runtime by the server
  // or can be manually configured in different environments
  window.__ENV.API_URL = "%API_URL%";
  window.__ENV.SENTRY_DSN = "%SENTRY_DSN%";
  window.__ENV.SENTRY_ENVIRONMENT = "%SENTRY_ENVIRONMENT%";
  window.__ENV.SENTRY_RELEASE = "%SENTRY_RELEASE%";
  window.__ENV.ANALYTICS_ID = "%ANALYTICS_ID%";
  
  // Clean up any placeholders that weren't replaced
  Object.keys(window.__ENV).forEach(key => {
    if (typeof window.__ENV[key] === 'string' && 
        window.__ENV[key].startsWith('%') && 
        window.__ENV[key].endsWith('%')) {
      window.__ENV[key] = '';
    }
  });
  
  console.log('[env.js] Runtime environment loaded:', 
    Object.keys(window.__ENV).reduce((acc, key) => {
      acc[key] = window.__ENV[key] ? (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN') || key.includes('PASSWORD') ? '[REDACTED]' : window.__ENV[key]) : undefined;
      return acc;
    }, {})
  );
})(typeof window !== 'undefined' ? window : {});

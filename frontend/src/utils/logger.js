/**
 * Logger utility for consistent logging in the frontend
 * In production, this could be connected to a service like Sentry, LogRocket, etc.
 */

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Only log debug in development
const CURRENT_LOG_LEVEL = ENVIRONMENT === 'production' ? LOG_LEVEL.INFO : LOG_LEVEL.DEBUG;

// Track errors to avoid duplicates (especially for recurring errors)
const errorTracker = new Set();
const ERROR_LIMIT = 100;

// Format the log with timestamp
const formatLog = (level, message, data) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    data,
    environment: ENVIRONMENT
  };
};

// Clear error tracker when it gets too big
const clearOldErrors = () => {
  if (errorTracker.size > ERROR_LIMIT) {
    errorTracker.clear();
  }
};

// Main logger object
const logger = {
  debug: (message, data = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      console.debug(formatLog('debug', message, data));
    }
    return null;
  },

  info: (message, data = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.INFO) {
      console.info(formatLog('info', message, data));
    }
    return null;
  },

  warn: (message, data = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.WARN) {
      console.warn(formatLog('warn', message, data));
    }
    return null;
  },

  error: (message, error = {}, data = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.ERROR) {
      // Generate a simple hash for deduplication
      const errorHash = `${message}:${error.message || ''}`;
      
      if (!errorTracker.has(errorHash)) {
        errorTracker.add(errorHash);
        clearOldErrors();
        
        const logData = {
          ...data,
          errorMessage: error.message || 'No error message',
          stack: error.stack || 'No stack trace'
        };
        
        console.error(formatLog('error', message, logData));
        
        // In production, we would send this to an external service
        if (ENVIRONMENT === 'production') {
          // Example: Send to Sentry or similar service
          // Sentry.captureException(error, { extra: logData });
          
          // For now, just store in localStorage for debugging
          try {
            const logs = JSON.parse(localStorage.getItem('assetAnchor_errorLogs') || '[]');
            logs.push(formatLog('error', message, logData));
            // Keep last 50 errors only
            if (logs.length > 50) logs.splice(0, logs.length - 50);
            localStorage.setItem('assetAnchor_errorLogs', JSON.stringify(logs));
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      }
    }
    
    return null;
  }
};

export default logger;

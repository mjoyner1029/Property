// Get environment variables with proper fallbacks
const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Support both Vite and CRA environment variables
  LOG_LEVEL: (
    // Runtime environment injection
    (typeof window !== 'undefined' && window.__ENV?.LOG_LEVEL) ||
    // Build-time environment
    import.meta?.env?.VITE_LOG_LEVEL ||
    process.env.REACT_APP_LOG_LEVEL ||
    // Default based on environment
    (process.env.NODE_ENV === 'production' ? 'error' : 'debug')
  ).toLowerCase(),
};

// Log level hierarchy: debug < info < warn < error
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

// Get current log level value
const currentLogLevel = LOG_LEVELS[ENV.LOG_LEVEL] || LOG_LEVELS.info;

// Format log messages with timestamp, level, and data
function format(level, args) {
  const timestamp = new Date().toISOString();
  
  // Check if the last argument is an object for structured logging
  let metadata = {};
  let messages = [...args];
  
  const lastArg = args[args.length - 1];
  if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg) && !(lastArg instanceof Error)) {
    metadata = lastArg;
    messages = args.slice(0, -1);
  }
  
  // Format log with timestamp and level
  const formattedMessages = [`[${timestamp}] [${level}]`, ...messages];
  
  // Clean metadata to avoid sensitive information
  const cleanedMetadata = sanitizeLogData(metadata);
  
  // Add metadata if present
  if (Object.keys(cleanedMetadata).length > 0) {
    formattedMessages.push(cleanedMetadata);
  }
  
  return formattedMessages;
}

// Sanitize log data to remove sensitive information
function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') return data;
  
  // Deep clone to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // List of sensitive field patterns to redact
  const sensitivePatterns = [
    /token/i, /password/i, /secret/i, /key/i, /auth/i, /jwt/i,
    /credit/i, /card/i, /cvv/i, /ssn/i, /social/i, /passport/i,
    /license/i, /account.*number/i
  ];
  
  // Recursively sanitize objects
  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      // Check if this key matches any sensitive pattern
      const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        // Redact sensitive value
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recurse into nested objects
        sanitizeObject(obj[key]);
      }
    });
  }
  
  sanitizeObject(sanitized);
  return sanitized;
}

// Logger implementation that respects the configured log level
export const logger = {
  debug: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.debug) {
      console.debug(...format('DEBUG', args));
    }
  },
  
  info: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.info) {
      console.info(...format('INFO', args));
    }
  },
  
  warn: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.warn) {
      console.warn(...format('WARN', args));
    }
  },
  
  error: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.error) {
      console.error(...format('ERROR', args));
    }
    
    // Send error to monitoring if available
    if (typeof window !== 'undefined' && window.__ENV?.SENTRY_DSN) {
      try {
        const errorObj = args.find(arg => arg instanceof Error) || new Error(args.join(' '));
        const metadata = args.find(arg => typeof arg === 'object' && !(arg instanceof Error)) || {};
        
        // Report error to monitoring service if available
        if (window.Sentry) {
          window.Sentry.captureException(errorObj, {
            extra: sanitizeLogData(metadata)
          });
        }
      } catch (e) {
        // Fail silently - logging should never throw
        console.error('Error reporting to monitoring service:', e);
      }
    }
  },
  
  // Log with specified level
  log: (level, ...args) => {
    if (logger[level]) {
      logger[level](...args);
    } else {
      logger.info(...args);
    }
  }
};

export default logger;
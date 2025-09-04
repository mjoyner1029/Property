/**
 * Sentry initialization and error tracking configuration
 * This module initializes Sentry for error tracking in production environments
 * Simplified for compatibility and only enabled when REACT_APP_SENTRY_DSN is provided
 */
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/react';
import { SENTRY_ENVIRONMENT, SENTRY_RELEASE, IS_PRODUCTION } from '../config/environment';

// User-centric performance metrics for monitoring
const VITAL_METRICS = {
  FP: 'first-paint',
  FCP: 'first-contentful-paint',
  LCP: 'largest-contentful-paint',
  FID: 'first-input-delay',
  CLS: 'cumulative-layout-shift',
  TTFB: 'time-to-first-byte'
};

/**
 * Initialize Sentry for error tracking and basic performance monitoring
 * Only initializes when REACT_APP_SENTRY_DSN environment variable is set
 * Simplified implementation for better compatibility with React 18+
 * 
 * @returns {boolean} Whether Sentry was initialized
 */
export const initSentry = () => {
  // Only initialize Sentry if REACT_APP_SENTRY_DSN is provided
  if (!process.env.REACT_APP_SENTRY_DSN) {
    console.debug('[Sentry] Skipping initialization - no REACT_APP_SENTRY_DSN provided');
    return false;
  }

  try {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE || undefined,
      
      // Only send errors in production by default
      enabled: IS_PRODUCTION || process.env.REACT_APP_ENABLE_SENTRY === 'true',
      
      // Performance monitoring configuration
      integrations: [
        // Browser performance tracking
        new BrowserTracing({
          // Trace navigation and fetch requests
          tracingOrigins: ['localhost', /^\//],
          
          // Track route changes in React Router
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            history => {
              let { pathname, search } = window.location;
              return { pathname, search };
            }
          ),
        }),
        // No Replay/Profiler integrations for better compatibility
      ],
      
      // Web Vitals and Performance Monitoring
      // Use very low sampling rate to minimize overhead (0.1 = 10% of transactions)
      tracesSampleRate: process.env.REACT_APP_SENTRY_SAMPLE_RATE 
        ? parseFloat(process.env.REACT_APP_SENTRY_SAMPLE_RATE) 
        : 0.1,
      
      // Enhanced Context for better debugging
      attachStacktrace: true,
      
      // Send default PII data to Sentry for better debugging
      sendDefaultPii: true,
      
      // Include user context information
      initialScope: {
        // Add build information for better debugging context
        tags: {
          'app.version': SENTRY_RELEASE || 'dev',
          'app.environment': SENTRY_ENVIRONMENT || 'development'
        }
      },
      
      // Ignore specific errors that are not actionable
      ignoreErrors: [
        // Common browser extensions errors
        /extension/i,
        /^ResizeObserver loop/,
        // Network errors that are not our fault
        /Network request failed/,
        /Failed to fetch/,
        /ChunkLoadError/,
        /Loading CSS chunk/,
        // User actions during page unload
        /AbortError/,
        /Cancel/,
        // Third-party script errors
        /Script error/,
        // Ad blockers
        /getadblock/,
        /adsbygoogle/,
      ],
      
      // Prevent collecting URLs that might contain sensitive data
      beforeBreadcrumb(breadcrumb) {
        // Don't capture URL breadcrumbs for routes that might contain sensitive data
        if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
          const url = breadcrumb.data.to;
          // Filter out sensitive URLs
          if (url.includes('reset-password') || url.includes('token=') || 
              url.includes('auth') || url.includes('payment')) {
            return null;
          }
          
          // Remove query params from URLs to avoid capturing sensitive data
          try {
            const urlObj = new URL(url, window.location.origin);
            if (urlObj.search) {
              urlObj.search = ''; // Remove query params
              breadcrumb.data.to = urlObj.toString();
            }
          } catch (e) {
            // URL parsing failed, just continue
          }
        }
        
        // Filter out sensitive data from XHR/fetch requests
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          if (breadcrumb.data && breadcrumb.data.url) {
            // Remove auth headers
            if (breadcrumb.data.headers && breadcrumb.data.headers.Authorization) {
              breadcrumb.data.headers = { ...breadcrumb.data.headers, Authorization: '[FILTERED]' };
            }
            
            // Remove request/response bodies for sensitive endpoints
            if (/auth|login|payment|user|profile|password/.test(breadcrumb.data.url)) {
              if (breadcrumb.data.body) breadcrumb.data.body = '[FILTERED]';
              if (breadcrumb.data.response) breadcrumb.data.response = '[FILTERED]';
            }
          }
        }
        
        return breadcrumb;
      },
      
      // Hooks into React component lifecycle for better context
      beforeSend(event, hint) {
        // Add performance metrics to error events
        if (window.performance && window.performance.getEntriesByType) {
          const perfEntries = {};
          
          // Gather vital metrics if available
          Object.entries(VITAL_METRICS).forEach(([key, metric]) => {
            const entries = window.performance.getEntriesByType('paint')
              .filter(entry => entry.name === metric);
            
            if (entries.length > 0) {
              perfEntries[key] = entries[0].startTime;
            }
          });
          
          // Add metrics to event
          if (Object.keys(perfEntries).length) {
            event.contexts = {
              ...event.contexts,
              performance: perfEntries
            };
          }
        }
        
        // Remove sensitive stack frames (e.g., eval, inline scripts)
        if (event.exception && event.exception.values) {
          event.exception.values.forEach(exception => {
            if (exception.stacktrace && exception.stacktrace.frames) {
              exception.stacktrace.frames = exception.stacktrace.frames.filter(frame => {
                return !frame.filename || !(
                  frame.filename.includes('eval') || 
                  frame.filename.includes('<anonymous>')
                );
              });
            }
          });
        }
        
        return event;
      },
    });

    // Error boundary monitoring is already available from Sentry React
    
    // No ReactProfiler or Replay initialization - removed for compatibility

    console.debug('[Sentry] Initialized successfully with basic monitoring');
    return true;
  } catch (err) {
    console.error('[Sentry] Initialization failed:', err);
    // Fail gracefully - application should work without Sentry
    return false;
  }
};

/**
 * Set user information for Sentry error tracking
 * Allows associating errors with specific users
 * 
 * @param {Object} user User information
 * @param {string} user.id User ID (required)
 * @param {string} [user.email] User email (optional)
 */
export const setSentryUser = (user) => {
  if (!process.env.REACT_APP_SENTRY_DSN || !user?.id) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    ip_address: '0.0.0.0', // Prevent IP collection
  });
};

/**
 * Clear user information from Sentry
 * Should be called on logout
 */
export const clearSentryUser = () => {
  if (!process.env.REACT_APP_SENTRY_DSN) return;
  Sentry.setUser(null);
};

/**
 * Capture an exception in Sentry
 * 
 * @param {Error} error The error to capture
 * @param {Object} [context] Additional context information
 * @returns {string|null} The Sentry event ID or null if Sentry is not initialized
 */
export const captureException = (error, context = {}) => {
  if (!process.env.REACT_APP_SENTRY_DSN) return null;
  return Sentry.captureException(error, { extra: context });
};

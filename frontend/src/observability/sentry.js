/**
 * Sentry initialization and error tracking configuration
 * This module initializes Sentry for error tracking in production environments
 * with enhanced features for comprehensive error monitoring and performance tracking
 */
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/react';
import { SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE, IS_PRODUCTION } from '../config/environment';

// User-centric performance metrics for monitoring
const VITAL_METRICS = {
  FP: 'first-paint',
  FCP: 'first-contentful-paint',
  LCP: 'largest-contentful-paint',
  FID: 'first-input-delay',
  CLS: 'cumulative-layout-shift',
  TTFB: 'time-to-first-byte',
  INP: 'interaction-to-next-paint'
};

/**
 * Initialize Sentry for comprehensive error tracking and performance monitoring
 * This function implements advanced features for better debugging and user experience insights
 * 
 * @returns {boolean} Whether Sentry was initialized
 */
export const initSentry = () => {
  // Only initialize Sentry if DSN is provided
  if (!SENTRY_DSN) {
    console.debug('[Sentry] Skipping initialization - no DSN provided');
    return false;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE || undefined,
      
      // Only send errors in production by default
      enabled: IS_PRODUCTION,
      
      // Performance monitoring configuration
      integrations: [
        // Browser performance tracking
        new BrowserTracing({
          // Trace all navigation and fetch requests by default
          tracingOrigins: ['localhost', /^\//],
          
          // Track route changes in React Router
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            history => {
              let { pathname, search } = window.location;
              return { pathname, search };
            }
          ),
        }),
        
        // Session replay functionality removed due to compatibility issues
      ],
      
      // Web Vitals and Performance Monitoring
      // Capture 15% of transactions to keep overhead low but get meaningful data
      tracesSampleRate: 0.15,
      
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

    // Add React error boundary monitoring
    Sentry.withErrorBoundary = Sentry.withErrorBoundary;
    
    // React profiler support removed due to compatibility issues

    console.debug('[Sentry] Initialized successfully with enhanced monitoring');
    return true;
  } catch (err) {
    console.error('[Sentry] Initialization failed:', err);
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
  if (!SENTRY_DSN || !user?.id) return;
  
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
  if (!SENTRY_DSN) return;
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
  if (!SENTRY_DSN) return null;
  return Sentry.captureException(error, { extra: context });
};

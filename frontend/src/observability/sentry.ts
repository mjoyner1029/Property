/**
 * Sentry initialization and error tracking configuration
 * This module initializes Sentry for error tracking in production environments
 */
import * as Sentry from '@sentry/react';
import { SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE, IS_PRODUCTION } from '../config/environment';

/**
 * Initialize Sentry for error tracking
 * This function is safe to call in all environments but will only
 * actually initialize Sentry if SENTRY_DSN is provided
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
      
      // Capture 10% of transactions for performance monitoring
      tracesSampleRate: 0.1,
      
      // Don't send personally identifiable information
      sendDefaultPii: false,
      
      // Prevent collecting IP addresses
      initialScope: {
        user: { ip_address: '0.0.0.0' },
      },
      
      // Ignore specific errors that are not actionable
      ignoreErrors: [
        // Common browser extensions errors
        /extension/i,
        /^ResizeObserver loop/,
        // Network errors that are not our fault
        /Network request failed/,
        /Failed to fetch/,
        // User actions during page unload
        /AbortError/,
        // Third-party script errors
        /Script error/,
      ],
      
      // Prevent collecting URLs that might contain sensitive data
      beforeBreadcrumb(breadcrumb) {
        // Don't capture URL breadcrumbs for routes that might contain sensitive data
        if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
          const url = breadcrumb.data.to;
          if (url.includes('reset-password') || url.includes('token=')) {
            return null;
          }
        }
        return breadcrumb;
      },
    });

    console.debug('[Sentry] Initialized successfully');
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

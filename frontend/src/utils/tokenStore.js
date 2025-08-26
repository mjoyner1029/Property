/**
 * Secure Memory-First Token Store
 * 
 * This implements a secure token management system:
 * - Primary token storage is in-memory (not accessible via XSS)
 * - Refresh token is managed via httpOnly cookie on the backend
 * - Cross-tab synchronization via BroadcastChannel API (with localStorage fallback)
 * - Token listeners for real-time token state updates
 * - Utility functions for working with authorization headers
 * - CSRF token support
 */
import { AUTH_STORAGE_PREFIX, CSRF_COOKIE_NAME, CSRF_HEADER_NAME, IS_DEVELOPMENT } from '../config/environment';
import { logger } from './logger';

// Memory storage (primary source of truth)
let accessToken = null;

// Listeners for token changes
const listeners = new Set();

// Channel for cross-tab communication
const BROADCAST_CHANNEL_NAME = `${AUTH_STORAGE_PREFIX}token_sync`;
let broadcastChannel = null;

// Cookie helpers
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Set up cross-tab communication
function setupBroadcastChannel() {
  // Skip in non-browser environments
  if (typeof window === 'undefined') return;
  
  try {
    // Try BroadcastChannel API first (more secure)
    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      
      broadcastChannel.onmessage = (event) => {
        // Only process if the token is different from current value
        if (event.data !== accessToken) {
          // Update local token without triggering broadcast
          updateTokenInternally(event.data);
        }
      };
      
      if (IS_DEVELOPMENT) {
        logger.debug('TokenStore: Using BroadcastChannel for cross-tab sync');
      }
      return;
    }
    
    // Fallback to storage event for older browsers
    window.addEventListener('storage', (event) => {
      if (event.key === `${AUTH_STORAGE_PREFIX}token`) {
        // localStorage value is just a flag, not the actual token
        // This just tells us another tab has updated the token
        // The app should call the refresh endpoint to get the actual token
        notifyListeners(null);
      }
    });
    
    if (IS_DEVELOPMENT) {
      logger.debug('TokenStore: Using storage event fallback for cross-tab sync');
    }
  } catch (error) {
    logger.error('Failed to setup token broadcast channel', error);
  }
}

// Initialize broadcast channel
setupBroadcastChannel();

// Internal function to update token without broadcasting
function updateTokenInternally(token) {
  const normalizedToken = token || null;
  accessToken = normalizedToken;
  notifyListeners(normalizedToken);
}

// Notify all listeners of token change
function notifyListeners(token) {
  for (const fn of listeners) {
    try { 
      fn(token);
    } catch (error) {
      logger.error('Error in token change listener', error);
    }
  }
}

// Broadcast token change to other tabs
function broadcastTokenChange(token) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage(token);
    } else if (typeof localStorage !== 'undefined') {
      // For storage event fallback, just update a timestamp
      // The actual token is not stored in localStorage
      localStorage.setItem(`${AUTH_STORAGE_PREFIX}token`, Date.now().toString());
    }
  } catch (error) {
    logger.warn('Failed to broadcast token change', error);
  }
}

/**
 * Get the current access token from memory
 * @returns {string|null} The current access token or null
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Set the access token and notify listeners
 * @param {string|null} token - The new access token or null to clear
 */
export function setAccessToken(token) {
  const normalizedToken = token || null;
  
  // Only update and broadcast if the token actually changed
  if (accessToken !== normalizedToken) {
    accessToken = normalizedToken;
    notifyListeners(normalizedToken);
    broadcastTokenChange(normalizedToken);
  }
}

/**
 * Clear the access token and notify listeners
 */
export function clearAccessToken() {
  setAccessToken(null);
}

/**
 * Add a listener for token changes
 * @param {Function} callback - Function to call when token changes
 * @returns {Function} Function to remove the listener
 */
export function addTokenListener(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Token listener must be a function');
  }
  
  listeners.add(callback);
  return () => removeTokenListener(callback);
}

/**
 * Remove a token change listener
 * @param {Function} callback - The listener to remove
 */
export function removeTokenListener(callback) {
  listeners.delete(callback);
}

/**
 * Legacy alias for addTokenListener
 * @deprecated Use addTokenListener instead
 */
export function onTokenChange(callback) {
  logger.warn('onTokenChange is deprecated, use addTokenListener instead');
  return addTokenListener(callback);
}

/**
 * Add authorization headers to an existing headers object
 * @param {Object} headers - Existing headers object
 * @returns {Object} Headers with Authorization header added if token exists
 */
export function withAccessTokenHeaders(headers = {}) {
  const token = getAccessToken();
  if (!token) return headers;
  
  return { 
    ...headers, 
    Authorization: `Bearer ${token}` 
  };
}

/**
 * Get CSRF token from cookies and add it to headers
 * @param {Object} headers - Existing headers object
 * @returns {Object} Headers with CSRF token added if available
 */
export function withCsrfHeader(headers = {}) {
  const csrfToken = getCookie(CSRF_COOKIE_NAME);
  if (!csrfToken) return headers;
  
  return {
    ...headers,
    [CSRF_HEADER_NAME]: csrfToken
  };
}

/**
 * Add both authorization and CSRF tokens to headers
 * @param {Object} headers - Existing headers object
 * @returns {Object} Headers with both auth and CSRF tokens added
 */
export function withSecurityHeaders(headers = {}) {
  return withCsrfHeader(withAccessTokenHeaders(headers));
}

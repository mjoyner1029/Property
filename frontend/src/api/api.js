// frontend/src/api/api.js

import axios from 'axios';
import { setAccessToken, clearAccessToken, withAccessTokenHeaders } from '../utils/tokenStore';
import { logger } from '../utils/logger';

/**
 * Centralized API Client for the Property application
 * Single source of truth for API base URL, authentication, and error handling
 */

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 
               (typeof window !== 'undefined' && window.__APP_API_URL__) || 
               'http://localhost:5050/api';

/**
 * Create the axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Request interceptor
 * - Adds authentication headers to each request
 * - Configures timeouts and other request options
 */
apiClient.interceptors.request.use((config) => {
  config.headers = withAccessTokenHeaders(config.headers);
  if (!config.timeout) config.timeout = 15000;
  return config;
});

/**
 * Response interceptor
 * - Handles token refresh when 401 errors occur
 * - Retries transient errors with backoff
 * - Normalizes error responses
 */
let isRefreshing = false;
let refreshPromise = null;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { response, config } = error || {};
    const status = response?.status;
    const url = config?.url || 'unknown endpoint';

    // Normalize error object
    const normalized = new Error(
      response?.data?.message ||
      response?.data?.error ||
      error?.message ||
      'Request failed'
    );
    normalized.status = status;
    normalized.data = response?.data;
    
    // Log error with appropriate level based on error type
    if (!response) {
      // Network errors are often transient
      logger.warn(`Network error for ${url}`, { 
        message: error.message, 
        code: error.code 
      });
    } else if (status >= 500) {
      logger.error(`API server error: ${status} for ${url}`, {
        status,
        url,
        message: normalized.message
      });
    } else if (status === 401) {
      logger.info(`Authentication required for ${url}`);
    } else if (status === 403) {
      logger.warn(`Permission denied for ${url}`, { status });
    } else if (status === 404) {
      logger.warn(`Resource not found: ${url}`, { status });
    } else if (status === 400) {
      logger.warn(`Bad request for ${url}`, { 
        status, 
        message: normalized.message,
        data: normalized.data
      });
    } else {
      logger.warn(`API error: ${status} for ${url}`, {
        status,
        message: normalized.message
      });
    }

    // Retry transient errors (network error, 429, 502/503/504) up to 2 times with backoff
    const transient = !response || [429, 502, 503, 504].includes(status);
    if (transient) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 2) {
        config._retryCount += 1;
        const delay = 300 * Math.pow(2, config._retryCount - 1); // Exponential backoff
        logger.info(`Retrying ${url} (attempt ${config._retryCount + 1}) after ${delay}ms`);
        await sleep(delay);
        return apiClient(config);
      }
    }

    // Handle 401 with refresh, once per request
    if (status === 401 && !config._retry) {
      config._retry = true;
      logger.info(`Authentication expired, attempting token refresh for ${url}`);

      if (!isRefreshing) {
        isRefreshing = true;
        // Refresh uses httpOnly cookie set by backend
        refreshPromise = axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
          .then((r) => {
            const newToken = r?.data?.access_token;
            if (!newToken) throw new Error('No access token from refresh');
            logger.info('Successfully refreshed authentication token');
            setAccessToken(newToken);
            axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            return newToken;
          })
          .catch((e) => {
            logger.warn('Token refresh failed', { message: e.message });
            clearAccessToken();
            throw e;
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        const newToken = await refreshPromise;
        logger.info(`Retrying ${url} with new token`);
        config.headers = withAccessTokenHeaders(config.headers);
        return apiClient(config);
      } catch (e) {
        // Bubble up 401 after failed refresh
        throw normalized;
      }
    }

    throw normalized;
  }
);

// ==========================================
// API endpoint methods
// ==========================================

/**
 * Authentication API
 */
const auth = {
  /**
   * Login with email and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Login response with tokens and user data
   */
  login: (credentials) => apiClient.post('/auth/login', credentials),
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  register: (userData) => apiClient.post('/auth/register', userData),
  
  /**
   * Refresh the access token using refresh token
   * @returns {Promise<Object>} New access token
   */
  refreshToken: () => apiClient.post('/auth/refresh'),
  
  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Verification result
   */
  verifyEmail: (token) => apiClient.get(`/verify/${token}`),
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset request confirmation
   */
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  
  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Password reset confirmation
   */
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
  
  /**
   * Logout the current user
   * @returns {Promise<Object>} Logout confirmation
   */
  logout: () => apiClient.post('/auth/logout'),
  
  /**
   * Get current user data
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: () => apiClient.get('/auth/me'),
  
  /**
   * Validate a reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Token validation result
   */
  validateResetToken: (token) => apiClient.get(`/auth/reset-password/${token}/validate`),
};

/**
 * Properties API
 */
const properties = {
  /**
   * Get all properties
   * @returns {Promise<Array>} List of properties
   */
  getAll: () => apiClient.get('/properties'),
  
  /**
   * Get property by ID
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Property data
   */
  getById: (propertyId) => apiClient.get(`/properties/${propertyId}`),
  
  /**
   * Create a new property
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>} Created property
   */
  create: (propertyData) => apiClient.post('/properties', propertyData),
  
  /**
   * Update a property
   * @param {string} propertyId - Property ID
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>} Updated property
   */
  update: (propertyId, propertyData) => apiClient.put(`/properties/${propertyId}`, propertyData),
  
  /**
   * Delete a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<boolean>} Success status
   */
  delete: (propertyId) => apiClient.delete(`/properties/${propertyId}`),
};

/**
 * Maintenance API
 */
const maintenance = {
  /**
   * Get all maintenance requests
   * @returns {Promise<Array>} List of maintenance requests
   */
  getAll: () => apiClient.get('/maintenance'),
  
  /**
   * Get maintenance request by ID
   * @param {string} requestId - Maintenance request ID
   * @returns {Promise<Object>} Maintenance request data
   */
  getById: (requestId) => apiClient.get(`/maintenance/${requestId}`),
  
  /**
   * Create a new maintenance request
   * @param {Object} requestData - Maintenance request data
   * @returns {Promise<Object>} Created maintenance request
   */
  create: (requestData) => apiClient.post('/maintenance', requestData),
  
  /**
   * Update a maintenance request
   * @param {string} requestId - Maintenance request ID
   * @param {Object} requestData - Maintenance request data
   * @returns {Promise<Object>} Updated maintenance request
   */
  update: (requestId, requestData) => apiClient.put(`/maintenance/${requestId}`, requestData),
  
  /**
   * Delete a maintenance request
   * @param {string} requestId - Maintenance request ID
   * @returns {Promise<boolean>} Success status
   */
  delete: (requestId) => apiClient.delete(`/maintenance/${requestId}`),
  
  /**
   * Add a comment to a maintenance request
   * @param {string} requestId - Maintenance request ID
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} Updated maintenance request with new comment
   */
  addComment: (requestId, commentData) => apiClient.post(`/maintenance/${requestId}/comments`, commentData),
};

/**
 * Notifications API
 */
const notifications = {
  /**
   * Get all notifications
   * @returns {Promise<Array>} List of notifications
   */
  getAll: () => apiClient.get('/notifications'),
  
  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: (notificationId) => apiClient.put(`/notifications/${notificationId}/read`),
  
  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Operation result
   */
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  
  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success status
   */
  delete: (notificationId) => apiClient.delete(`/notifications/${notificationId}`),
};

/**
 * Tenants API
 */
const tenants = {
  /**
   * Get all tenants
   * @returns {Promise<Array>} List of tenants
   */
  getAll: () => apiClient.get('/tenants'),
  
  /**
   * Get tenant by ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Tenant data
   */
  getById: (tenantId) => apiClient.get(`/tenants/${tenantId}`),
  
  /**
   * Create a new tenant
   * @param {Object} tenantData - Tenant data
   * @returns {Promise<Object>} Created tenant
   */
  create: (tenantData) => apiClient.post('/tenants', tenantData),
  
  /**
   * Update a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} tenantData - Tenant data
   * @returns {Promise<Object>} Updated tenant
   */
  update: (tenantId, tenantData) => apiClient.put(`/tenants/${tenantId}`, tenantData),
  
  /**
   * Delete a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} Success status
   */
  delete: (tenantId) => apiClient.delete(`/tenants/${tenantId}`),
  
  /**
   * Invite a tenant to create an account
   * @param {Object} inviteData - Invite data with email and property information
   * @returns {Promise<Object>} Invite result
   */
  invite: (inviteData) => apiClient.post('/invite/tenant', inviteData),
  
  /**
   * Complete tenant onboarding
   * @param {Object} onboardingData - Tenant onboarding data
   * @returns {Promise<Object>} Onboarding result
   */
  completeOnboarding: (onboardingData) => apiClient.post('/onboard/tenant', onboardingData),
};

/**
 * Payments API
 */
const payments = {
  /**
   * Get all payments
   * @returns {Promise<Array>} List of payments
   */
  getAll: () => apiClient.get('/payments'),
  
  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment data
   */
  getById: (paymentId) => apiClient.get(`/payments/${paymentId}`),
  
  /**
   * Create a new payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment
   */
  create: (paymentData) => apiClient.post('/payments', paymentData),
  
  /**
   * Update a payment
   * @param {string} paymentId - Payment ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Updated payment
   */
  update: (paymentId, paymentData) => apiClient.put(`/payments/${paymentId}`, paymentData),
  
  /**
   * Delete a payment
   * @param {string} paymentId - Payment ID
   * @returns {Promise<boolean>} Success status
   */
  delete: (paymentId) => apiClient.delete(`/payments/${paymentId}`),
};

/**
 * Messages API
 */
const messages = {
  /**
   * Get all messages
   * @returns {Promise<Array>} List of messages
   */
  getAll: () => apiClient.get('/messages'),
  
  /**
   * Get message thread by ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<Object>} Message thread data
   */
  getThread: (threadId) => apiClient.get(`/messages/threads/${threadId}`),
  
  /**
   * Get recipients for messaging
   * @returns {Promise<Array>} List of potential message recipients
   */
  getRecipients: () => apiClient.get('/messages/recipients'),
  
  /**
   * Create a new message or thread
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message thread
   */
  create: (messageData) => apiClient.post('/messages', messageData),
  
  /**
   * Reply to a message thread
   * @param {string} threadId - Thread ID
   * @param {Object} messageData - Message reply data
   * @returns {Promise<Object>} Updated message thread
   */
  reply: (threadId, messageData) => apiClient.post(`/messages/threads/${threadId}`, messageData),
  
  /**
   * Mark a thread as read
   * @param {string} threadId - Thread ID
   * @returns {Promise<Object>} Updated message thread
   */
  markAsRead: (threadId) => apiClient.put(`/messages/threads/${threadId}/read`),
};

/**
 * Error logging API
 */
const logging = {
  /**
   * Log a frontend error
   * @param {Object} errorData - Error data to log
   * @returns {Promise<Object>} Logging result
   */
  logFrontendError: (errorData) => apiClient.post('/log/frontend-error', errorData),
};

/**
 * Health check API
 */
const health = {
  /**
   * Get API health status
   * @returns {Promise<Object>} Health check result
   */
  check: () => apiClient.get('/health'),
  
  /**
   * Get API readiness status (includes DB check)
   * @returns {Promise<Object>} Readiness check result
   */
  ready: () => apiClient.get('/readyz'),
};

// Export the raw axios instance for advanced use cases
export const axiosInstance = apiClient;

// Export the API client with all the method groups
const api = {
  auth,
  properties,
  maintenance,
  notifications,
  tenants,
  payments,
  messages,
  logging,
  health,
  
  // Raw HTTP methods for custom endpoints
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
};

export default api;

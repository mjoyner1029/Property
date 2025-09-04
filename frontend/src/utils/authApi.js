// frontend/src/utils/authApi.js

import api from './api';
// No need to import API_URL as we're using the api instance

/**
 * Authentication API service
 * Provides methods for authentication-related API calls
 */
const authApi = {
  /**
   * Login with email and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {string} credentials.role - Optional user portal/role
   * @returns {Promise<Object>} Login response with tokens and user data
   */
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  
  /**
   * Refresh the access token using refresh token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Promise<Object>} New access token
   */
  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh', {}, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });
  },
  
  /**
   * Validate the current token
   * @param {string} token - JWT access token
   * @returns {Promise<Object>} User data if token is valid
   */
  validateToken: (token) => {
    return api.get('/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  
  /**
   * Logout the current user
   * @param {string} token - JWT access token
   * @returns {Promise<Object>} Logout confirmation
   */
  logout: () => {
    return api.post('/auth/logout');
  },
  
  /**
   * Get current user data
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: () => {
    return api.get('/auth/me');
  },
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset request confirmation
   */
  requestPasswordReset: (email) => {
    return api.post('/auth/forgot-password', { email });
  },
  
  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Password reset confirmation
   */
  resetPassword: (token, password) => {
    return api.post('/auth/reset-password', { token, password });
  }
};

export default authApi;

// frontend/src/services/api.js

/**
 * API Service
 * 
 * Central place for all API calls in the application
 */

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Makes an HTTP request to the API
 * 
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} - The response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Include auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Handle non-2xx responses
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  // Parse and return JSON response
  return response.json();
}

// Authentication API

/**
 * Log in a user
 * 
 * @param {Object} credentials - User credentials
 * @returns {Promise<Object>} - User data
 */
export async function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

/**
 * Log out the current user
 * 
 * @returns {Promise<boolean>} - Success status
 */
export async function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST'
  });
}

/**
 * Register a new user
 * 
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - User data
 */
export async function register(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

// User API

/**
 * Get current user profile
 * 
 * @returns {Promise<Object>} - User data
 */
export async function getCurrentUser() {
  return apiRequest('/users/me');
}

/**
 * Update user profile
 * 
 * @param {Object} userData - User profile data
 * @returns {Promise<Object>} - Updated user data
 */
export async function updateUserProfile(userData) {
  return apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
}

// Notification API

/**
 * Get user notifications
 * 
 * @returns {Promise<Array>} - List of notifications
 */
export async function getNotifications() {
  return apiRequest('/notifications');
}

/**
 * Mark notification as read
 * 
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} - Updated notification
 */
export async function markNotificationAsRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT'
  });
}

// Property API

/**
 * Get all properties
 * 
 * @returns {Promise<Array>} - List of properties
 */
export async function getProperties() {
  return apiRequest('/properties');
}

/**
 * Get property by ID
 * 
 * @param {string} propertyId - Property ID
 * @returns {Promise<Object>} - Property data
 */
export async function getProperty(propertyId) {
  return apiRequest(`/properties/${propertyId}`);
}

/**
 * Create a new property
 * 
 * @param {Object} propertyData - Property data
 * @returns {Promise<Object>} - Created property
 */
export async function createProperty(propertyData) {
  return apiRequest('/properties', {
    method: 'POST',
    body: JSON.stringify(propertyData)
  });
}

/**
 * Update a property
 * 
 * @param {string} propertyId - Property ID
 * @param {Object} propertyData - Property data
 * @returns {Promise<Object>} - Updated property
 */
export async function updateProperty(propertyId, propertyData) {
  return apiRequest(`/properties/${propertyId}`, {
    method: 'PUT',
    body: JSON.stringify(propertyData)
  });
}

/**
 * Delete a property
 * 
 * @param {string} propertyId - Property ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteProperty(propertyId) {
  return apiRequest(`/properties/${propertyId}`, {
    method: 'DELETE'
  });
}

// Maintenance API

/**
 * Get all maintenance requests
 * 
 * @returns {Promise<Array>} - List of maintenance requests
 */
export async function getMaintenanceRequests() {
  return apiRequest('/maintenance');
}

/**
 * Get maintenance request by ID
 * 
 * @param {string} requestId - Maintenance request ID
 * @returns {Promise<Object>} - Maintenance request data
 */
export async function getMaintenanceRequest(requestId) {
  return apiRequest(`/maintenance/${requestId}`);
}

/**
 * Create a new maintenance request
 * 
 * @param {Object} requestData - Maintenance request data
 * @returns {Promise<Object>} - Created maintenance request
 */
export async function createMaintenanceRequest(requestData) {
  return apiRequest('/maintenance', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
}

/**
 * Update a maintenance request
 * 
 * @param {string} requestId - Maintenance request ID
 * @param {Object} requestData - Maintenance request data
 * @returns {Promise<Object>} - Updated maintenance request
 */
export async function updateMaintenanceRequest(requestId, requestData) {
  return apiRequest(`/maintenance/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify(requestData)
  });
}

/**
 * Delete a maintenance request
 * 
 * @param {string} requestId - Maintenance request ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteMaintenanceRequest(requestId) {
  return apiRequest(`/maintenance/${requestId}`, {
    method: 'DELETE'
  });
}

// Test utility functions that are used in our example DOM tests
export async function createItem(data) {
  return apiRequest('/items', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteItem(itemId) {
  return apiRequest(`/items/${itemId}`, {
    method: 'DELETE'
  });
}

// frontend/src/utils/api.js

import axios from 'axios';
import { API_URL } from '../config/environment';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Keep track of refresh token promise to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is not 401 or we've already tried to refresh, reject
    if (
      !error.response || 
      error.response.status !== 401 || 
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }
    
    // If this request was already retried after refresh
    originalRequest._retry = true;
    
    // Check for refresh token
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      // No refresh token available - logout and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (isRefreshing) {
      // If already refreshing, add request to queue
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }
    
    isRefreshing = true;
    
    try {
      // Try to refresh the token
      const response = await axios.post(
        `${backendUrl}/auth/refresh`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        }
      );
      
      const { access_token } = response.data;
      
      if (access_token) {
        // Update token in localStorage and headers
        localStorage.setItem('token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        
        // Process all queued requests
        processQueue(null, access_token);
        
        // Retry the original request
        return api(originalRequest);
      } else {
        throw new Error('No access token received');
      }
    } catch (refreshError) {
      // Refresh token also failed - logout and redirect
      processQueue(refreshError, null);
      
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
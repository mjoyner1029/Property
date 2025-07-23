// frontend/src/utils/api.js

import axios from 'axios';
import { logout } from './auth';
import { logError } from './errorHandler';
import logger from './logger';
import performance from './performance';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Default configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance with default config
const api = axios.create({
  baseURL: `${backendUrl}/api`,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    // Start timing the request
    const requestId = `${config.method}-${config.url}-${Date.now()}`;
    performance.startTimer(requestId);
    config.metadata = { requestId, startTime: Date.now(), retryCount: 0 };

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logger.error('Request error interceptor', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    // End timing for successful request
    const { requestId } = response.config.metadata;
    const duration = performance.endTimer(requestId);

    // Log for slow requests (over 2 seconds)
    if (duration > 2000) {
      logger.warn('Slow API request', {
        url: response.config.url,
        duration: `${duration.toFixed(0)}ms`,
      });
    }

    return response;
  },
  async (error) => {
    // Extract request metadata
    const { config } = error;

    // If there's no config, we can't retry
    if (!config || !config.metadata) {
      return Promise.reject(error);
    }

    const { requestId, retryCount } = config.metadata;

    // End performance timing
    performance.endTimer(requestId);

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !config.url.includes('/auth/login')) {
      logger.info('Token expired, attempting to refresh');

      try {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login?expired=true';
        return Promise.reject(error);
      } catch (refreshError) {
        logger.error('Token refresh failed', refreshError);
        return Promise.reject(error);
      }
    }

    // Retry logic for server errors and network issues
    const shouldRetry =
      // Retry on network errors or 5xx status codes
      (!error.response || (error.response.status >= 500 && error.response.status !== 501)) &&
      // Only if it's a GET request (don't retry mutations)
      config.method.toUpperCase() === 'GET' &&
      // Don't exceed max retries
      retryCount < MAX_RETRIES;

    if (shouldRetry) {
      config.metadata.retryCount = retryCount + 1;

      logger.info(`Retrying request (${retryCount + 1}/${MAX_RETRIES})`, {
        url: config.url,
        method: config.method,
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));

      // Retry the request
      return api(config);
    }

    // Log all API errors for monitoring
    logError(error, `API ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || ''}`);

    return Promise.reject(error);
  }
);

export default api;
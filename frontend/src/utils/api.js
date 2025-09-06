import axios from 'axios';
import { setAccessToken, clearAccessToken, withAccessTokenHeaders } from './tokenStore';

/**
 * Unified API Client for the Property application
 * Single source of truth for API base URL, authentication, and error handling
 */

// Prefer REACT_APP_API_URL to include the `/api` prefix, e.g. http://localhost:5050/api
export const backendUrl =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.__APP_API_URL__) ||
  'http://localhost:5050/api';

console.log('[API Client] Initializing with base URL:', backendUrl);

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

console.log('[API Client] Configured with:', {
  baseURL: backendUrl,
  withCredentials: true,
  timeout: 15000
});

// --- Attach Authorization header if present ---
api.interceptors.request.use((config) => {
  config.headers = withAccessTokenHeaders(config.headers);
  if (!config.timeout) config.timeout = 15000;
  return config;
});

// --- 401 refresh with concurrency guard + limited retries for transient errors ---
let isRefreshing = false;
let refreshPromise = null;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Simple logger for API errors
const logApiError = (level, message, details = {}) => {
  const logEntry = { 
    timestamp: new Date().toISOString(), 
    level, 
    message, 
    ...details 
  };
  
  if (level === 'error') {
    console.error('[API Error]', logEntry);
  } else if (level === 'warn') {
    console.warn('[API Warning]', logEntry);
  } else {
    console.log('[API Info]', logEntry);
  }
};

api.interceptors.response.use(
  (res) => {
    // Log successful API calls in development
    if (process.env.NODE_ENV === 'development') {
      const url = res.config?.url || 'unknown endpoint';
      logApiError('info', `✅ API success: ${res.status} for ${url}`, {
        status: res.status,
        method: res.config?.method?.toUpperCase(),
        url
      });
    }
    return res;
  },
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
      logApiError('warn', `Network error for ${url}`, { 
        message: error.message, 
        code: error.code 
      });
    } else if (status >= 500) {
      logApiError('error', `API server error: ${status} for ${url}`, {
        status,
        url,
        message: normalized.message
      });
    } else if (status === 401) {
      logApiError('info', `Authentication required for ${url}`);
    } else if (status === 403) {
      logApiError('warn', `Permission denied for ${url}`, { status });
    } else if (status === 404) {
      logApiError('warn', `Resource not found: ${url}`, { status });
    } else if (status >= 400) {
      logApiError('warn', `API error: ${status} for ${url}`, {
        status,
        message: normalized.message,
        data: normalized.data
      });
    }

    // Retry transient errors (network error, 429, 502/503/504) up to 2 times with backoff
    const transient = !response || [429, 502, 503, 504].includes(status);
    if (transient) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 2) {
        config._retryCount += 1;
        await sleep(300 * config._retryCount);
        return api(config);
      }
    }

    // Handle 401 with refresh, once per request
    if (status === 401 && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        // Refresh uses httpOnly cookie set by backend
        refreshPromise = axios.post(`${backendUrl}/auth/refresh`, {}, { withCredentials: true })
          .then((r) => {
            const newToken = r?.data?.access_token;
            if (!newToken) throw new Error('No access token from refresh');
            setAccessToken(newToken);
            axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            return newToken;
          })
          .catch((e) => {
            clearAccessToken();
            throw e;
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        const _newToken = await refreshPromise;
        config.headers = withAccessTokenHeaders(config.headers);
        return api(config);
      } catch (e) {
        // Bubble up 401 after failed refresh
        throw normalized;
      }
    }

    throw normalized;
  }
);

export default api;

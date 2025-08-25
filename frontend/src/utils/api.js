import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken, withAccessTokenHeaders } from './tokenStore';

// Prefer REACT_APP_API_URL to include the `/api` prefix, e.g. http://localhost:5050/api
export const backendUrl =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.__APP_API_URL__) ||
  'http://localhost:5050/api';

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  timeout: 15000,
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

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    const status = response?.status;

    // Normalize error object
    const normalized = new Error(
      response?.data?.message ||
      response?.data?.error ||
      error?.message ||
      'Request failed'
    );
    normalized.status = status;
    normalized.data = response?.data;

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
        const newToken = await refreshPromise;
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

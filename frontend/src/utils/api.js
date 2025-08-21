import axios from 'axios';

export const backendUrl =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.__APP_API_URL__) ||
  'http://localhost:5050';

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  timeout: 15000,
});

// Attach bearer token if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Generic error normalization
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const normalized = new Error(
      err?.response?.data?.message ||
      err?.message ||
      'Request failed'
    );
    normalized.status = err?.response?.status;
    normalized.data = err?.response?.data;
    return Promise.reject(normalized);
  }
);

export default api;
// frontend/src/utils/api.js

import axios from 'axios';
import { logout } from './auth';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors by logging out
    if (error.response && error.response.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;
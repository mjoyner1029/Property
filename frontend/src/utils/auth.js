// frontend/src/utils/auth.js
import { TOKEN_EXPIRY } from '../config/environment';
import authApi from './authApi';

/**
 * Check if user is logged in by verifying token exists
 * @returns {boolean} True if user is logged in
 */
export const isLoggedIn = () => {
  return !!localStorage.getItem("token");
};

/**
 * Check if token is expired based on login time
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = () => {
  const loginTime = parseInt(localStorage.getItem('login_time') || '0', 10);
  const refreshTime = parseInt(localStorage.getItem('token_refresh_time') || '0', 10);
  const lastAuthTime = Math.max(loginTime, refreshTime);
  
  if (lastAuthTime === 0) return true;
  
  const currentTime = Date.now();
  return currentTime - lastAuthTime > TOKEN_EXPIRY;
};

/**
 * Get user data from localStorage
 * @returns {Object|null} User data or null if not logged in
 */
export const getUser = () => {
  const userJson = localStorage.getItem("user");
  return userJson ? JSON.parse(userJson) : null;
};

/**
 * Get auth token from localStorage
 * @returns {string|null} Auth token or null if not present
 */
export const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} Refresh token or null if not present
 */
export const getRefreshToken = () => {
  return localStorage.getItem("refresh_token");
};

/**
 * Clear all auth data and redirect to login
 * @param {string} [redirectUrl="/login"] - URL to redirect to after logout
 */
export const logout = async (redirectUrl = "/login") => {
  try {
    // Try to call the logout endpoint to invalidate the token
    if (isLoggedIn()) {
      await authApi.logout();
    }
  } catch (err) {
    console.error('Error during logout:', err);
  } finally {
    // Clear all auth data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("login_time");
    localStorage.removeItem("token_refresh_time");
    
    // Redirect to login page
    window.location.href = redirectUrl;
  }
};

/**
 * Get role-based redirect URL after login
 * @param {Object} user - User object
 * @returns {string} URL to redirect to
 */
export const getPostLoginRedirect = (user) => {
  if (!user) return '/login';
  
  const role = user.selectedPortal || user.role;
  
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'landlord':
      return '/landlord/properties';
    case 'tenant':
      return '/tenant/dashboard';
    default:
      return '/dashboard';
  }
};

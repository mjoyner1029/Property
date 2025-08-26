// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import api from '../utils/api';
import { logger } from '../utils/logger';
import { getAccessToken, setAccessToken, clearAccessToken, addTokenListener, removeTokenListener } from '../utils/tokenStore';
import { 
  TOKEN_REFRESH_INTERVAL, 
  TOKEN_EXPIRY, 
  IS_DEVELOPMENT 
} from '../config/environment';

/**
 * Auth Context provides:
 * - User authentication state management
 * - Login/logout functionality
 * - Automatic token refresh
 * - Role-based access control helpers
 * - Token synchronization across tabs
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Core state
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAccessToken());
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);
  
  // Refs for lifecycle management
  const initCalled = useRef(false);
  const refreshTimerId = useRef(null);
  const tokenExpiryTime = useRef(null);
  
  // Track auth state
  const isAuthenticated = Boolean(token && user);
  
  // Helper to keep memory token + state in sync
  const updateToken = useCallback((newToken) => {
    // Update token in memory and storage
    setAccessToken(newToken);
    setTokenState(newToken);
    
    // Update token expiry time if we have a token
    if (newToken) {
      tokenExpiryTime.current = Date.now() + TOKEN_EXPIRY;
    } else {
      tokenExpiryTime.current = null;
    }
    
    // Clear any existing refresh timer
    if (refreshTimerId.current) {
      clearTimeout(refreshTimerId.current);
      refreshTimerId.current = null;
    }
    
    // Set up the new refresh timer if we have a token
    if (newToken) {
      refreshTimerId.current = setTimeout(refreshToken, TOKEN_REFRESH_INTERVAL);
    }
  }, []);
  
  // Handle token refresh
  const refreshToken = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        logger.debug('Refreshing auth token');
      }
      
      const response = await api.post('/auth/refresh', {}, {
        // Skip auth interceptor to avoid circular dependency
        skipAuthRefresh: true,
      });
      
      const newToken = response?.data?.access_token || null;
      const userData = response?.data?.user || null;
      
      // Update token and user state
      if (newToken) updateToken(newToken);
      if (userData) setUser(userData);
      
      return { token: newToken, user: userData };
    } catch (error) {
      // On failure, clear auth state if not silent
      if (!silent) {
        logger.warn('Token refresh failed', error);
        // Only clear token if we get a 401/403, not on network errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setUser(null);
          updateToken(null);
        }
      }
      throw error;
    }
  }, [updateToken]);

  // Token synchronization handler
  const handleTokenChange = useCallback((newToken) => {
    // This is called when another tab changes the token
    logger.debug('Token changed in another tab');
    setTokenState(newToken);
    
    // If token was cleared, clear user too
    if (!newToken) {
      setUser(null);
    }
  }, []);
  
  // Bootstrap auth on component mount
  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;
    
    // Add listener for cross-tab token synchronization
    addTokenListener(handleTokenChange);
    
    // Try to restore session from httpOnly refresh cookie
    let mounted = true;
    (async () => {
      try {
        const { token: newToken, user: userData } = await refreshToken(true);
        
        if (!mounted) return;
        
        // Only update state if we got a valid response
        if (newToken && userData) {
          logger.debug('Restored auth session');
        } else {
          logger.info('No active auth session to restore');
        }
      } catch (error) {
        logger.info('Auth bootstrap: no active session');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    
    // Cleanup function
    return () => { 
      mounted = false; 
      removeTokenListener(handleTokenChange);
      if (refreshTimerId.current) {
        clearTimeout(refreshTimerId.current);
      }
    };
  }, [updateToken, refreshToken, handleTokenChange]);

  // Log in user with email and password
  const login = useCallback(async (email, password) => {
    try {
      setLoginError(null);
      setLoading(true);
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Call login API
      const response = await api.post('/auth/login', { 
        email, 
        password 
      }, {
        // Skip auth interceptor to avoid circular dependency
        skipAuthRefresh: true,
      });
      
      // Extract token and user data
      const newToken = response?.data?.access_token || null;
      const userData = response?.data?.user || null;
      
      // Validate response
      if (!newToken || !userData) {
        throw new Error('Invalid response from authentication server');
      }
      
      // Update token and user state
      updateToken(newToken);
      setUser(userData);
      
      return userData;
    } catch (error) {
      // Handle login errors
      logger.error('Login failed', error);
      
      // Format user-friendly error message
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error?.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Your account has been locked. Please contact support.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message && !error.message.includes('Invalid response')) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateToken]);

  // Log out user
  const logout = useCallback(async (options = {}) => {
    const { silent = false } = options;
    
    try {
      if (!silent) {
        // Call logout API to invalidate refresh token cookie
        await api.post('/auth/logout');
      }
    } catch (error) {
      // Log error but proceed with client-side logout
      logger.warn('Error during logout', error);
    } finally {
      // Always clear local state
      setUser(null);
      updateToken(null);
      setLoginError(null);
    }
  }, [updateToken]);
  
  // Force token refresh - useful before critical operations
  const forceTokenRefresh = useCallback(async () => {
    return refreshToken();
  }, [refreshToken]);
  
  // Check if user has a specific role
  const hasRole = useCallback((role) => {
    if (!user || !user.roles) return false;
    
    // Handle single role
    if (typeof role === 'string') {
      return user.roles.includes(role);
    }
    
    // Handle array of roles (any match)
    if (Array.isArray(role)) {
      return role.some(r => user.roles.includes(r));
    }
    
    return false;
  }, [user]);
  
  // Check if user has all specified roles
  const hasAllRoles = useCallback((roles) => {
    if (!user || !user.roles || !Array.isArray(roles)) return false;
    return roles.every(role => user.roles.includes(role));
  }, [user]);

  // Provide auth context value
  const value = useMemo(() => ({
    // State
    user,
    token,
    loading,
    isAuthenticated,
    loginError,
    
    // Actions
    login,
    logout,
    refreshToken: forceTokenRefresh,
    
    // Role helpers
    hasRole,
    hasAllRoles,
    // Legacy method - kept for backward compatibility
    isRole: (role) => Boolean(user && user.role === role),
  }), [
    user, 
    token, 
    loading, 
    isAuthenticated, 
    loginError,
    login, 
    logout, 
    forceTokenRefresh,
    hasRole,
    hasAllRoles
  ]);

  // Debug auth state changes in development
  useEffect(() => {
    if (IS_DEVELOPMENT) {
      logger.debug('Auth state changed', { 
        isAuthenticated, 
        hasToken: Boolean(token),
        hasUser: Boolean(user),
        userRoles: user?.roles
      });
    }
  }, [isAuthenticated, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook for consuming auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;

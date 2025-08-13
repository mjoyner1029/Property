// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import authApi from '../utils/authApi';
import axios from 'axios';
import { TOKEN_REFRESH_INTERVAL } from '../config/environment';

// Create context
const AuthContext = createContext();

// Token refresh timer
let refreshTimer = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to refresh the token
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await authApi.refreshToken(refreshTokenValue);
      const { access_token } = response.data;
      
      if (access_token) {
        // Update state and localStorage
        setToken(access_token);
        localStorage.setItem('token', access_token);
        localStorage.setItem('token_refresh_time', Date.now().toString());
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        return true;
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      // If refresh fails, log the user out
      logout();
      return false;
    }
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (token) {
      // Set up timer to refresh token every 15 minutes (900000ms)
      // This is arbitrary - should be adjusted based on your token expiration time
      const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
      
      refreshTimer = setInterval(() => {
        refreshToken();
      }, REFRESH_INTERVAL);
      
      // Clear interval on unmount
      return () => clearInterval(refreshTimer);
    }
  }, [token, refreshToken]);

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refresh_token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedRefreshToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        
        // Set default authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Start the refresh timer
        if (refreshTimer) {
          clearInterval(refreshTimer);
        }
        
        refreshTimer = setInterval(() => {
          refreshToken();
        }, TOKEN_REFRESH_INTERVAL);
        
        // Verify token is still valid
        try {
          await authApi.validateToken(storedToken);
        } catch (err) {
          console.error('Token verification failed:', err);
          // If token is invalid, try to refresh it
          if (err.response && err.response.status === 401) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              logout();
            }
          }
        }
      } else {
        // No valid auth data in localStorage
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, [refreshToken]);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // Make sure portal is included in credentials
      const loginData = {
        email: credentials.email,
        password: credentials.password,
        portal: credentials.role || 'tenant' // Use the selected portal type
      };
      
      // Call the login endpoint
      const response = await authApi.login(loginData);
      
      const { access_token, refresh_token, user: userData } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      
      // Ensure the user has the selected portal (important for admin users who can access multiple portals)
      const enhancedUserData = {
        ...userData,
        selectedPortal: loginData.portal // Save the selected portal
      };
      
      // Save to state
      setToken(access_token);
      setUser(enhancedUserData);
      setIsAuthenticated(true);
      
      // Save to localStorage with expiration metadata
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(enhancedUserData));
      localStorage.setItem('login_time', Date.now().toString());
      
      // Set default auth header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      console.log('Authentication completed successfully');
      
      // Start token refresh interval
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      
      refreshTimer = setInterval(() => {
        refreshToken();
      }, TOKEN_REFRESH_INTERVAL);
      
      // Verify token is working by calling verify endpoint
      try {
        const verifyResponse = await axios.get('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${access_token}` }
        });
        console.log('Token verification successful:', verifyResponse.data);
      } catch (verifyErr) {
        console.error('Token verification failed:', verifyErr);
        // Continue anyway since we have a token
      }
      
      return enhancedUserData; // Return the user data so components can handle redirects
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

    // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.register(userData);
      const { access_token, refresh_token, user: newUser } = response.data;
      
      // If we got tokens back, log the user in automatically
      if (access_token && refresh_token) {
        // Save to state
        setToken(access_token);
        setUser(newUser);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('login_time', Date.now().toString());
        
        // Set default auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // Start token refresh interval
        if (refreshTimer) {
          clearInterval(refreshTimer);
        }
        
        refreshTimer = setInterval(() => {
          refreshToken();
        }, TOKEN_REFRESH_INTERVAL);
      }
      
      return newUser; // Return the new user data so components can handle redirects
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Try to call the logout endpoint to invalidate the token
      if (token) {
        await authApi.logout();
      }
    } catch (err) {
      console.error('Error during logout:', err);
      // Continue with local logout even if server logout fails
    } finally {
      // Clear timers
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
      
      // Clear state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('login_time');
      localStorage.removeItem('token_refresh_time');
      
      // Clear auth header
      delete axios.defaults.headers.common['Authorization'];
    }
    
    // No redirect here - components will handle redirect
    return true;
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`/api/users/${user.id}`, userData);
      const updatedUser = response.data;
      
      // Update state and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset password request
  const requestPasswordReset = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/auth/forgot-password', { email });
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request password reset.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Value object that will be passed to consumers of this context
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    token,
    login,
    logout,
    register,
    updateProfile,
    requestPasswordReset,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher order component for protected routes
export const withAuth = (Component) => {
  const AuthenticatedComponent = (props) => {
    const { isAuthenticated, loading } = useAuth();
    
    useEffect(() => {
      // We're not using navigation here anymore
      // Authentication checks are done via the ProtectedRoute component
    }, [loading, isAuthenticated]);
    
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh' 
        }}>
          <p>Loading...</p>
        </div>
      );
    }
    
    return isAuthenticated ? <Component {...props} /> : null;
  };
  
  return AuthenticatedComponent;
};

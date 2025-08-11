// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import axios from 'axios';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        
        // Set default authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token is still valid
        try {
          await axios.get('/api/auth/verify');
        } catch (err) {
          // If token is invalid, log the user out
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting login process...');
      
      // Make sure portal is included in credentials
      const loginData = {
        email: credentials.email,
        password: credentials.password,
        portal: credentials.role || 'tenant' // Use the selected portal type
      };
      
      console.log('Sending login request with data:', loginData);
      
      // Call the login endpoint
      const response = await axios.post('/api/auth/login', loginData);
      console.log('Login response received:', response.data);
      
      const { access_token, refresh_token, user: userData } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      
      // Ensure the user has the selected portal (important for admin users who can access multiple portals)
      const enhancedUserData = {
        ...userData,
        selectedPortal: loginData.portal // Save the selected portal
      };
      
      console.log('User data with portal:', enhancedUserData);
      
      // Save to state
      setToken(access_token);
      setUser(enhancedUserData);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(enhancedUserData));
      
      // Set default auth header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      console.log('Authentication completed successfully');
      
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
      const response = await axios.post('/api/auth/register', userData);
      const { user: newUser } = response.data;
      
      return newUser; // Return the new user data so components can handle redirects
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear auth header
    delete axios.defaults.headers.common['Authorization'];
    
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
    login,
    logout,
    register,
    updateProfile,
    requestPasswordReset
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

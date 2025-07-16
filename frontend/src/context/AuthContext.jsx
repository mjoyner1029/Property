// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  
  const navigate = useNavigate();

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
      const response = await axios.post('/api/auth/login', credentials);
      const { access_token, user: userData } = response.data;
      
      // Save to state
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Redirect based on user role and onboarding status
      if (userData.onboarding_complete) {
        navigate('/dashboard');
      } else {
        if (userData.role === 'landlord') {
          navigate(`/onboarding/landlord?user_id=${userData.id}`);
        } else if (userData.role === 'tenant') {
          navigate(`/onboarding/tenant?user_id=${userData.id}`);
        } else {
          navigate('/dashboard');
        }
      }
      
      return true;
    } catch (err) {
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
      
      // Redirect to appropriate onboarding flow
      if (newUser.role === 'landlord') {
        navigate(`/onboarding/landlord?user_id=${newUser.id}`);
      } else if (newUser.role === 'tenant') {
        navigate(`/onboarding/tenant?user_id=${newUser.id}`);
      } else {
        navigate('/login');
      }
      
      return true;
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
    
    // Redirect to login
    navigate('/login');
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
    const navigate = useNavigate();
    
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        navigate('/login');
      }
    }, [loading, isAuthenticated, navigate]);
    
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

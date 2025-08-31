// Mock implementation of AuthContext.jsx
import React from 'react';

// Keep a reference to the context value so tests can modify it
let authContextValue = {
  isAuthenticated: false,
  loading: false,
  user: null,
  roles: [],
  isRole: jest.fn((roleToCheck) => {
    // If roleToCheck is an array, check if user has any of those roles in authContextValue.roles
    if (Array.isArray(roleToCheck)) {
      return roleToCheck.some(r => authContextValue.roles.includes(r));
    }
    // Otherwise check for a single role
    return authContextValue.roles.includes(roleToCheck);
  }),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refreshUser: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn()
};

// Export a function to update the context value
export const __updateAuthContext = (newValue) => {
  authContextValue = { 
    ...authContextValue, 
    ...newValue,
    // Always rebuild isRole to use the latest roles array
    isRole: (roleToCheck) => {
      const roles = newValue.roles || authContextValue.roles;
      // If roleToCheck is an array, check if user has any of those roles
      if (Array.isArray(roleToCheck)) {
        return roleToCheck.some(r => roles.includes(r));
      }
      // Otherwise check for a single role
      return roles.includes(roleToCheck);
    }
  };
  return authContextValue;
};

// Export the mock useAuth hook
export const useAuth = jest.fn(() => authContextValue);

// Mock the AuthProvider component
export const AuthProvider = ({ children }) => <>{children}</>;

// Mock the default export
const mockAuthContext = { 
  Provider: AuthProvider 
};

export default mockAuthContext;

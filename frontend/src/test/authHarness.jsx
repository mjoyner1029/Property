import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

// Create a local mock for the auth context
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

// Function to update auth context values for tests
export const __updateAuthContext = (newValues) => {
  authContextValue = {
    ...authContextValue,
    ...newValues,
    // Always rebuild isRole to use the latest roles array
    isRole: (roleToCheck) => {
      const roles = newValues.roles || authContextValue.roles;
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

// Custom render function that wraps components with MemoryRouter and sets up auth
export const renderWithAuth = (ui, { auth = {}, route = '/' } = {}) => {
  // Update the mocked AuthContext with the provided auth values
  __updateAuthContext(auth);
  
  // Render with MemoryRouter to provide routing context
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

// Export for backwards compatibility 
export const TestAuthProvider = ({ initial = {}, children }) => {
  // Update the auth context with initial values
  __updateAuthContext(initial);
  
  // Simply render children - the mock context will be available via useAuth()
  return <>{children}</>;
};

// Export a simpler interface to update auth context directly in tests
export const useSetAuth = (newAuthValues) => {
  return __updateAuthContext(newAuthValues);
};

// Export a single default with all utilities
export default {
  renderWithAuth,
  useSetAuth,
  TestAuthProvider
};

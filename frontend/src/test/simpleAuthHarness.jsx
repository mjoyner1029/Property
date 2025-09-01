import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

// Create a simplified AuthContext for testing
const AuthContext = React.createContext(null);

// Default auth values
const defaultAuth = {
  isAuthenticated: false,
  loading: false,
  user: null,
  roles: [],
  login: jest.fn(),
  logout: jest.fn(),
  isRole: jest.fn((role) => false),
};

// Auth provider for tests
export const TestAuthProvider = ({ authValue = defaultAuth, children }) => {
  // Ensure we never pass null or undefined
  const value = authValue || defaultAuth;
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the useAuth hook that will be used by mocked imports
export const useAuth = () => {
  // Always return a non-null value with all expected properties
  const auth = React.useContext(AuthContext);
  return auth || defaultAuth;
};

// Helper to render components with auth context and routing
export function renderWithAuth(ui, options = {}) {
  const {
    auth = defaultAuth,
    route = '/',
    ...renderOptions
  } = options;
  
  // Create a complete auth object with all necessary properties
  const authValue = {
    ...defaultAuth,
    ...auth,
  };
  
  // Make sure isRole works properly
  if (!authValue.isRole || typeof authValue.isRole !== 'function') {
    authValue.isRole = (roleToCheck) => {
      if (Array.isArray(roleToCheck)) {
        return roleToCheck.some(r => (authValue.roles || []).includes(r));
      }
      return (authValue.roles || []).includes(roleToCheck);
    };
  }
  
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TestAuthProvider authValue={authValue}>
        {ui}
      </TestAuthProvider>
    </MemoryRouter>,
    renderOptions
  );
}

// Export a way to update auth context in tests if needed
export function createTestAuth(customValues = {}) {
  return {
    ...defaultAuth,
    ...customValues,
    isRole: (roleToCheck) => {
      const roles = customValues.roles || defaultAuth.roles;
      if (Array.isArray(roleToCheck)) {
        return roleToCheck.some(r => roles.includes(r));
      }
      return roles.includes(roleToCheck);
    }
  };
}

// Export everything for convenience
export default {
  TestAuthProvider,
  useAuth,
  renderWithAuth,
  createTestAuth
};

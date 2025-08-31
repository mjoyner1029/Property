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
export const TestAuthProvider = ({ authValue, children }) => {
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the useAuth hook that will be used by mocked imports
export const useAuth = () => {
  // ALWAYS return a non-null value with all expected properties
  const authFromContext = React.useContext(AuthContext);
  return authFromContext !== null ? authFromContext : defaultAuth;
};

// Helper to render components with auth context and routing
export function renderWithAuth(ui, options = {}) {
  const {
    auth = defaultAuth,
    route = '/',
    ...renderOptions
  } = options;
  
  // Make sure isRole works properly
  if (!auth.isRole || typeof auth.isRole !== 'function') {
    auth.isRole = (roleToCheck) => {
      if (Array.isArray(roleToCheck)) {
        return roleToCheck.some(r => auth.roles.includes(r));
      }
      return auth.roles.includes(roleToCheck);
    };
  }
  
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TestAuthProvider authValue={auth}>
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

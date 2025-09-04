import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Create a simple theme for tests
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#fff',
    },
  },
});

// Create a simplified AuthContext for testing that ensures we never return null
const AuthContext = React.createContext({
  isAuthenticated: false,
  loading: false,
  user: null,
  token: null,
  roles: [],
  login: () => {},
  logout: () => {},
  isRole: () => false,
});

// Default auth values that will prevent "Cannot destructure property of null" errors
const defaultAuth = {
  isAuthenticated: false,
  loading: false,
  user: null,
  token: null,
  roles: [],
  login: jest.fn().mockResolvedValue({}),
  logout: jest.fn().mockResolvedValue({}),
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

// Export the useAuth hook that will be mocked in tests
export const useAuth = () => {
  const auth = React.useContext(AuthContext);
  return auth || defaultAuth; // Always return non-null value
};

/**
 * Custom render function that wraps components with necessary providers
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Options for rendering
 * @param {Object} options.auth - Auth context values
 * @param {String} options.route - Initial route for MemoryRouter
 * @param {Object} options.routes - Route configuration for more complex routing tests
 * @param {Boolean} options.withTheme - Whether to wrap with ThemeProvider
 * @param {Object} options.renderOptions - Additional render options to pass to RTL render
 */
function render(ui, options = {}) {
  const {
    auth = defaultAuth,
    route = '/',
    routes = null,
    withTheme = true,
    ...renderOptions
  } = options;
  
  // Create a complete auth object with all necessary properties
  const authValue = {
    ...defaultAuth,
    ...auth,
  };
  
  // Make sure isRole works properly
  authValue.isRole = (roleToCheck) => {
    if (Array.isArray(roleToCheck)) {
      return roleToCheck.some(r => (authValue.roles || []).includes(r));
    }
    return (authValue.roles || []).includes(roleToCheck);
  };

  function AllTheProviders({ children }) {
    // Conditional rendering based on options
    let wrapped = children;
    
    // Wrap with TestAuthProvider
    wrapped = <TestAuthProvider authValue={authValue}>{wrapped}</TestAuthProvider>;
    
    // Wrap with ThemeProvider if requested
    if (withTheme) {
      wrapped = <ThemeProvider theme={theme}>{wrapped}</ThemeProvider>;
    }
    
    // Wrap with MemoryRouter
    if (routes) {
      wrapped = (
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            {routes}
          </Routes>
        </MemoryRouter>
      );
    } else {
      wrapped = (
        <MemoryRouter initialEntries={[route]}>
          {wrapped}
        </MemoryRouter>
      );
    }
    
    return wrapped;
  }
  
  return rtlRender(ui, { wrapper: AllTheProviders, ...renderOptions });
}

// Export a way to create test auth values
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

// Re-export everything from RTL
export * from '@testing-library/react';

// Override the default render method
export { render };

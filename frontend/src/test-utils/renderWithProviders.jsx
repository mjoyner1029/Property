// frontend/src/test-utils/renderWithProviders.jsx
import React, { createContext } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { TestAuthProvider } from '../test/simpleAuthHarness';

// Mock axios defaults
if (!axios.defaults) {
  axios.defaults = { headers: { common: {} } };
}

// Create mock context providers for testing
const mockContextValue = { loading: false, error: null };

const AppContext = createContext();
const AppThemeContext = createContext();
const NotificationContext = createContext();
const PropertyContext = createContext();
const MaintenanceContext = createContext();
const PaymentContext = createContext();
const TenantContext = createContext();

const AppProvider = ({ children }) => (
  <AppContext.Provider value={{ ...mockContextValue, title: 'Test App' }}>
    {children}
  </AppContext.Provider>
);

const AppThemeProvider = ({ children }) => (
  <AppThemeContext.Provider value={{ ...mockContextValue, isDarkMode: false, toggleDarkMode: () => {} }}>
    {children}
  </AppThemeContext.Provider>
);

const NotificationProvider = ({ children }) => (
  <NotificationContext.Provider value={{ ...mockContextValue, notifications: [] }}>
    {children}
  </NotificationContext.Provider>
);

const PropertyProvider = ({ children }) => (
  <PropertyContext.Provider value={{ ...mockContextValue, properties: [] }}>
    {children}
  </PropertyContext.Provider>
);

const MaintenanceProvider = ({ children }) => (
  <MaintenanceContext.Provider value={{ ...mockContextValue, maintenanceRequests: [] }}>
    {children}
  </MaintenanceContext.Provider>
);

const PaymentProvider = ({ children }) => (
  <PaymentContext.Provider value={{ ...mockContextValue, payments: [] }}>
    {children}
  </PaymentContext.Provider>
);

const TenantProvider = ({ children }) => (
  <TenantContext.Provider value={{ ...mockContextValue, tenants: [] }}>
    {children}
  </TenantContext.Provider>
);

/**
 * Creates a mock provider for a context with given value
 * @param {React.Context} Context - The context to create a provider for
 * @param {*} value - The value to provide to the context
 * @returns {React.FC} A provider component that injects the given value
 */
export function makeMockProvider(Context, value) {
  return ({ children }) => (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}

export function renderWithProviders(
  ui,
  { 
    route = '/',
    withRouter = true,
    ...renderOptions 
  } = {}
) {
  function Wrapper({ children }) {
    // Setup a default auth state that matches what components might expect
    const defaultAuth = {
      isAuthenticated: true,
      user: { id: 'test-user', role: 'admin' },
      roles: ['admin'],
      loading: false,
      error: null
    };
    
    // Wrap content based on withRouter flag
    const content = (
      <ThemeProvider theme={theme}>
        <TestAuthProvider authValue={defaultAuth}>
          <div data-testid="provider-wrapper">
            {children}
          </div>
        </TestAuthProvider>
      </ThemeProvider>
    );
    
    // Only add the MemoryRouter if withRouter is true
    return withRouter ? (
      <MemoryRouter initialEntries={[route]}>
        {content}
      </MemoryRouter>
    ) : content;
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

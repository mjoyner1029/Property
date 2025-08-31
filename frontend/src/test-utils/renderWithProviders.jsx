// frontend/src/test-utils/renderWithProviders.jsx
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { TestAuthProvider } from '../test/simpleAuthHarness';
// Import everything from context to ensure we have all providers
import {
  PropertyProvider,
  AppProvider,
  MaintenanceProvider,
  PaymentProvider,
  TenantProvider,
  NotificationProvider,
  useAuth
} from '../context';

// Mock axios defaults
if (!axios.defaults) {
  axios.defaults = { headers: { common: {} } };
}

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
    authState = null,
    ...renderOptions 
  } = {}
) {
  function Wrapper({ children }) {
    // Setup a default auth state that matches what components might expect
    const defaultAuth = {
      isAuthenticated: true,
      user: { id: 'test-user', role: 'admin' },
      roles: ['admin'],
      login: jest.fn().mockResolvedValue({}),
      logout: jest.fn().mockResolvedValue({}),
      isRole: (role) => {
        const roles = ['admin'];
        return Array.isArray(role) ? role.some(r => roles.includes(r)) : roles.includes(role);
      },
      loading: false,
      error: null,
      ...authState // Allow overriding of auth properties
    };
    
    return (
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider theme={theme}>
          <TestAuthProvider authValue={defaultAuth}>
            <AppProvider>
              <NotificationProvider>
                <PropertyProvider>
                  <MaintenanceProvider>
                    <PaymentProvider>
                      <TenantProvider>
                        {/* Remove the extra div wrapper which might cause issues */}
                        {children}
                      </TenantProvider>
                    </PaymentProvider>
                  </MaintenanceProvider>
                </PropertyProvider>
              </NotificationProvider>
            </AppProvider>
          </TestAuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

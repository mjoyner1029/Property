// frontend/src/test-utils/renderWithProviders.jsx
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { AuthProvider } from '../context/AuthContext';
import { PropertyProvider } from '../context/PropertyContext';
import { AppProvider } from '../context/AppContext';
import { MaintenanceProvider } from '../context/MaintenanceContext';
import { PaymentProvider } from '../context/PaymentContext';
import { TenantProvider } from '../context/TenantContext';

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

import { NotificationProvider } from '../context/NotificationContext';

export function renderWithProviders(
  ui,
  { 
    route = '/',
    ...renderOptions 
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <AppProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

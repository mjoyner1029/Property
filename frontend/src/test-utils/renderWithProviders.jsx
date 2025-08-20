// frontend/src/test-utils/renderWithProviders.jsx
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { TestProviders } from './TestProviders';

/**
 * Creates a mock provider for a context with given value
 * @param {React.Context} Context - The context to create a provider for
 * @param {*} value - The value to provide to the context
 * @returns {React.FC} A provider component that injects the given value
 */
export function makeMockProvider(Context, value) {
  return ({ children }) => {
    // Make sure Context is valid before trying to use its Provider
    if (!Context || !Context.Provider) {
      console.error('Invalid context provided to makeMockProvider', Context);
      return <>{children}</>;
    }
    return (
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    );
  };
}

export function renderWithProviders(
  ui,
  { 
    route = '/',
    authValue = undefined,
    appValue = undefined,
    notificationValue = undefined,
    propertyValue = undefined,
    maintenanceValue = undefined,
    paymentValue = undefined,
    tenantValue = undefined,
    themeValue = theme,
    integrationMode = false,
    ...renderOptions 
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider theme={themeValue}>
          <TestProviders
            integrationMode={integrationMode}
            authOverrides={authValue}
            appOverrides={appValue}
            notificationOverrides={notificationValue}
            propertyOverrides={propertyValue}
            maintenanceOverrides={maintenanceValue}
            paymentOverrides={paymentValue}
            tenantOverrides={tenantValue}
          >
            {children}
          </TestProviders>
        </ThemeProvider>
      </MemoryRouter>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

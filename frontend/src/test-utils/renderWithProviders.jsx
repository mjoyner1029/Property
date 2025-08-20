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
    authValue = null,
    appValue = null,
    notificationValue = null,
    propertyValue = null,
    maintenanceValue = null,
    paymentValue = null,
    tenantValue = null,
    themeValue = theme,
    ...renderOptions 
  } = {}
) {
  function Wrapper({ children }) {
    // Create custom provider components when values are provided
    const CustomAuthProvider = authValue ? makeMockProvider(require('../context/AuthContext').AuthContext, authValue) : AuthProvider;
    const CustomAppProvider = appValue ? makeMockProvider(require('../context/AppContext').AppContext, appValue) : AppProvider;
    const CustomNotificationProvider = notificationValue ? makeMockProvider(require('../context/NotificationContext').NotificationContext, notificationValue) : NotificationProvider;
    const CustomPropertyProvider = propertyValue ? makeMockProvider(require('../context/PropertyContext').PropertyContext, propertyValue) : PropertyProvider;
    const CustomMaintenanceProvider = maintenanceValue ? makeMockProvider(require('../context/MaintenanceContext').MaintenanceContext, maintenanceValue) : MaintenanceProvider;
    const CustomPaymentProvider = paymentValue ? makeMockProvider(require('../context/PaymentContext').PaymentContext, paymentValue) : PaymentProvider;
    const CustomTenantProvider = tenantValue ? makeMockProvider(require('../context/TenantContext').TenantContext, tenantValue) : TenantProvider;
    
    return (
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider theme={themeValue}>
          <CustomAuthProvider>
            <CustomAppProvider>
              <CustomNotificationProvider>
                <CustomPropertyProvider>
                  <CustomMaintenanceProvider>
                    <CustomPaymentProvider>
                      <CustomTenantProvider>
                        {children}
                      </CustomTenantProvider>
                    </CustomPaymentProvider>
                  </CustomMaintenanceProvider>
                </CustomPropertyProvider>
              </CustomNotificationProvider>
            </CustomAppProvider>
          </CustomAuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

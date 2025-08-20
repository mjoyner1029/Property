import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Real contexts
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { PropertyProvider, PropertyContext } from '../context/PropertyContext';
import { TenantProvider, TenantContext } from '../context/TenantContext';
import { NotificationProvider, NotificationContext } from '../context/NotificationContext';
import { AppProvider, AppContext } from '../context/AppContext';
import { MaintenanceProvider, MaintenanceContext } from '../context/MaintenanceContext';
import { PaymentProvider, PaymentContext } from '../context/PaymentContext';

// ---- default mock values (pure data, no side effects) ----
export const defaultAuth = {
  user: null,
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

export const defaultProperty = {
  properties: [],
  selectedProperty: null,
  loading: false,
  error: null,
  fetchProperties: jest.fn(),
  createProperty: jest.fn(),
  updateProperty: jest.fn(),
  deleteProperty: jest.fn(),
  fetchPropertyById: jest.fn(),
};

export const defaultTenant = {
  tenants: [],
  loading: false,
  error: null,
  fetchTenants: jest.fn(),
  getTenant: jest.fn(),
  createTenant: jest.fn(),
  updateTenant: jest.fn(),
  deleteTenant: jest.fn(),
};

export const defaultNotification = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  fetchNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
};

export const defaultApp = {
  darkMode: false,
  toggleDarkMode: jest.fn(),
  updatePageTitle: jest.fn(),
};

export const defaultMaintenance = {
  maintenanceRequests: [],
  loading: false,
  error: null,
  stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
  fetchRequests: jest.fn(),
  getRequest: jest.fn(),
  createRequest: jest.fn(),
  updateRequest: jest.fn(),
  deleteRequest: jest.fn(),
};

export const defaultPayment = {
  payments: [],
  loading: false,
  error: null,
  fetchPayments: jest.fn(),
  getPayment: jest.fn(),
  createPayment: jest.fn(),
  recordPayment: jest.fn(),
};

// ---- Helper that composes *mocked values* OR real Providers if `mode: 'integration'` ----
export function TestProviders({
  children,
  router = { initialEntries: ['/'] },
  mode = 'unit', // 'unit' uses mocked value providers; 'integration' uses real Providers
  authValue,
  propertyValue,
  tenantValue,
  notificationValue,
  appValue,
  maintenanceValue,
  paymentValue,
}) {
  const theme = createTheme();

  const content =
    mode === 'integration' ? (
      // Real providers, for selected integration tests only
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <PropertyProvider>
              <MaintenanceProvider>
                <PaymentProvider>
                  <TenantProvider>{children}</TenantProvider>
                </PaymentProvider>
              </MaintenanceProvider>
            </PropertyProvider>
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    ) : (
      // Mocked value providers (decouples provider coupling)
      <AuthContext.Provider value={{ ...defaultAuth, ...authValue }}>
        <AppContext.Provider value={{ ...defaultApp, ...appValue }}>
          <NotificationContext.Provider value={{ ...defaultNotification, ...notificationValue }}>
            <PropertyContext.Provider value={{ ...defaultProperty, ...propertyValue }}>
              <MaintenanceContext.Provider value={{ ...defaultMaintenance, ...maintenanceValue }}>
                <PaymentContext.Provider value={{ ...defaultPayment, ...paymentValue }}>
                  <TenantContext.Provider value={{ ...defaultTenant, ...tenantValue }}>
                    {children}
                  </TenantContext.Provider>
                </PaymentContext.Provider>
              </MaintenanceContext.Provider>
            </PropertyContext.Provider>
          </NotificationContext.Provider>
        </AppContext.Provider>
      </AuthContext.Provider>
    );

  return (
    <MemoryRouter {...router}>
      <ThemeProvider theme={theme}>
        {content}
      </ThemeProvider>
    </MemoryRouter>
  );
}

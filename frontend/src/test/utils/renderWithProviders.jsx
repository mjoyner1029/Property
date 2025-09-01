import React, { createContext } from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import theme from 'src/theme';

// Import all contexts directly
import { AppContext } from 'src/context/AppContext';
import { AuthContext } from 'src/context/AuthContext';
import { NotificationContext } from 'src/context/NotificationContext';
import { PropertyContext } from 'src/context/PropertyContext';
import { MaintenanceContext } from 'src/context/MaintenanceContext';
import { TenantContext } from 'src/context/TenantContext';
import { PaymentContext } from 'src/context/PaymentContext';
import { MessageContext } from 'src/context/MessageContext';

// Create theme context for tests
const ThemeContext = createContext();

// Default admin user for testing
const defaultUser = {
  id: 'test-user-id',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'admin',
};

// Default auth context values
const defaultAuthContext = {
  user: defaultUser,
  isAuthenticated: true,
  login: jest.fn().mockResolvedValue(true),
  logout: jest.fn().mockResolvedValue(true),
  register: jest.fn().mockResolvedValue(true),
  loading: false,
  error: null,
};

// Default app context values
const defaultAppContext = {
  title: 'Test App',
  loading: false,
  error: null,
};

// Default notification context values
const defaultNotificationContext = {
  notifications: [],
  loading: false,
  error: null,
  addNotification: jest.fn(),
  fetchNotifications: jest.fn(),
  deleteNotification: jest.fn(),
};

// Default property context values
const defaultPropertyContext = {
  properties: [],
  selectedProperty: null,
  loading: false,
  error: null,
  fetchProperties: jest.fn(),
  fetchProperty: jest.fn(),
  addProperty: jest.fn(),
  updateProperty: jest.fn(),
  deleteProperty: jest.fn(),
};

// Default maintenance context values
const defaultMaintenanceContext = {
  maintenanceRequests: [],
  selectedRequest: null,
  loading: false,
  error: null,
  fetchMaintenanceRequests: jest.fn(),
  fetchMaintenanceRequest: jest.fn(),
  addMaintenanceRequest: jest.fn(),
  updateMaintenanceRequest: jest.fn(),
  deleteMaintenanceRequest: jest.fn(),
};

// Default payment context values
const defaultPaymentContext = {
  payments: [],
  selectedPayment: null,
  loading: false,
  error: null,
  fetchPayments: jest.fn(),
  fetchPayment: jest.fn(),
  addPayment: jest.fn(),
  processPayment: jest.fn(),
};

// Default tenant context values
const defaultTenantContext = {
  tenants: [],
  selectedTenant: null,
  loading: false,
  error: null,
  fetchTenants: jest.fn(),
  fetchTenant: jest.fn(),
  addTenant: jest.fn(),
  updateTenant: jest.fn(),
  deleteTenant: jest.fn(),
};

// Default message context values
const defaultMessageContext = {
  messages: [],
  selectedMessage: null,
  loading: false,
  error: null,
  fetchMessages: jest.fn(),
  fetchMessage: jest.fn(),
  sendMessage: jest.fn(),
  deleteMessage: jest.fn(),
};

// Default theme context values
const defaultThemeContext = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

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

/**
 * Renders UI with all application providers wrapped in the correct order
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Configuration options
 * @param {string} [options.route='/'] - Initial route for MemoryRouter
 * @param {boolean} [options.withRouter=true] - Whether to wrap with MemoryRouter
 * @param {Object} [options.theme] - Custom theme object to override default theme
 * @param {Object} [options.auth] - Custom auth context values to override defaults
 * @param {Object} [options.app] - Custom app context values to override defaults
 * @param {Object} [options.notification] - Custom notification context values to override defaults
 * @param {Object} [options.property] - Custom property context values to override defaults
 * @param {Object} [options.maintenance] - Custom maintenance context values to override defaults
 * @param {Object} [options.tenant] - Custom tenant context values to override defaults
 * @param {Object} [options.payment] - Custom payment context values to override defaults
 * @param {Object} [options.message] - Custom message context values to override defaults
 * @param {Object} [options.themeContext] - Custom theme context values to override defaults
 * @returns {Object} - Object containing the rendered component and testing utilities
 */
export function renderWithProviders(ui, options = {}) {
  const {
    route = '/',
    withRouter = true,
    theme: customTheme = theme,
    auth = defaultAuthContext,
    app = defaultAppContext,
    notification = defaultNotificationContext,
    property = defaultPropertyContext,
    maintenance = defaultMaintenanceContext,
    tenant = defaultTenantContext,
    payment = defaultPaymentContext,
    message = defaultMessageContext,
    themeContext = defaultThemeContext,
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    // Create the content to be wrapped with or without router
    const content = (
      <ThemeProvider theme={customTheme}>
        <AppContext.Provider value={app}>
          <AuthContext.Provider value={auth}>
            <PropertyContext.Provider value={property}>
              <NotificationContext.Provider value={notification}>
                <MaintenanceContext.Provider value={maintenance}>
                  <TenantContext.Provider value={tenant}>
                    <PaymentContext.Provider value={payment}>
                      <MessageContext.Provider value={message}>
                        <ThemeContext.Provider value={themeContext}>
                          {children}
                        </ThemeContext.Provider>
                      </MessageContext.Provider>
                    </PaymentContext.Provider>
                  </TenantContext.Provider>
                </MaintenanceContext.Provider>
              </NotificationContext.Provider>
            </PropertyContext.Provider>
          </AuthContext.Provider>
        </AppContext.Provider>
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

export default renderWithProviders;

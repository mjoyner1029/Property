import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from 'src/contexts/AppContext';
import { AuthContext } from 'src/contexts/AuthContext';
import { NotificationProvider } from 'src/contexts/NotificationContext';
import { PropertyProvider } from 'src/contexts/PropertyContext';
import { MaintenanceProvider } from 'src/contexts/MaintenanceContext';
import { TenantProvider } from 'src/contexts/TenantContext';
import { PaymentProvider } from 'src/contexts/PaymentContext';

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
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
  error: null,
};

/**
 * Renders UI with all application providers wrapped in the correct order
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Configuration options
 * @param {string} [options.route='/'] - Initial route for MemoryRouter
 * @param {boolean} [options.withRouter=true] - Whether to wrap with MemoryRouter
 * @param {Object} [options.theme] - Custom theme object to override default theme
 * @param {Object} [options.auth] - Custom auth context values to override defaults
 * @returns {Object} - Object containing the rendered component and testing utilities
 */
export function renderWithProviders(ui, options = {}) {
  const {
    route = '/',
    withRouter = true,
    theme = createTheme(),
    auth = defaultAuthContext,
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    // Conditionally wrap with router based on withRouter option
    const content = withRouter ? (
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    ) : children;

    // Apply all providers in the specified nesting order
    return (
      <ThemeProvider theme={theme}>
        <AppProvider>
          <AuthContext.Provider value={auth}>
            <NotificationProvider>
              <PropertyProvider>
                <MaintenanceProvider>
                  <TenantProvider>
                    <PaymentProvider>
                      {content}
                    </PaymentProvider>
                  </TenantProvider>
                </MaintenanceProvider>
              </PropertyProvider>
            </NotificationProvider>
          </AuthContext.Provider>
        </AppProvider>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export default renderWithProviders;

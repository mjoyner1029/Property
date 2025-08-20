import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import NavBar from '../../components/NavBar';
import { withLocalStorage } from '../../test-utils/mockLocalStorage';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';

describe('NavBar Component', () => {
  const mockLogout = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    withLocalStorage();
  });
  
  test('admin user sees admin links in navbar', async () => {
    // Set up auth context values for admin user
    const authValue = {
      isAuthenticated: true,
      user: { role: 'admin', first_name: 'Admin', last_name: 'User' },
      logout: mockLogout
    };

    // Set up notification context value
    const notificationValue = {
      notifications: [],
      unreadCount: 0,
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      fetchNotifications: jest.fn()
    };
    
    // Set up property context value
    const propertyValue = {
      properties: [],
      loading: false,
      error: null,
      fetchProperties: jest.fn(),
      createProperty: jest.fn(),
      updateProperty: jest.fn(),
      deleteProperty: jest.fn(),
      fetchPropertyById: jest.fn()
    };
    
    // Set up app context value
    const appValue = {
      darkMode: false,
      toggleDarkMode: jest.fn(),
      updatePageTitle: jest.fn()
    };
    
    // Set up maintenance context value
    const maintenanceValue = {
      maintenanceRequests: [],
      loading: false,
      error: null,
      stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
      fetchRequests: jest.fn()
    };
    
    // Set up payment context value
    const paymentValue = {
      payments: [],
      loading: false,
      error: null,
      fetchPayments: jest.fn(),
      getPayment: jest.fn(),
      createPayment: jest.fn(),
      recordPayment: jest.fn()
    };
    
    // Set up tenant context value
    const tenantValue = {
      tenants: [],
      loading: false,
      error: null,
      fetchTenants: jest.fn(),
      getTenant: jest.fn(),
      createTenant: jest.fn(),
      updateTenant: jest.fn(),
      deleteTenant: jest.fn()
    };
  
    // Inject context values through our provider wrapper
    renderWithProviders(
      <NavBar data-testid="navbar" />, 
      {
        authValue: authValue,
        notificationValue: notificationValue,
        propertyValue: propertyValue,
        appValue: appValue,
        maintenanceValue: maintenanceValue,
        paymentValue: paymentValue,
        tenantValue: tenantValue
      }
    );

    // Admin should see dashboard link - use getByTestId instead of getByText
    expect(screen.getByTestId('navbar-dashboard')).toBeInTheDocument();
    
    // Admin should see properties link
    expect(screen.getByTestId('navbar-properties')).toBeInTheDocument();
  });
  
  test('tenant user only sees relevant links in navbar', async () => {
    // Set up auth context values for tenant user
    const authValue = {
      isAuthenticated: true,
      user: { role: 'tenant', first_name: 'Tenant', last_name: 'User' },
      logout: mockLogout
    };

    // Set up notification context value
    const notificationValue = {
      notifications: [],
      unreadCount: 0,
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      fetchNotifications: jest.fn()
    };
    
    // Set up property context value
    const propertyValue = {
      properties: [],
      loading: false,
      error: null,
      fetchProperties: jest.fn(),
      createProperty: jest.fn(),
      updateProperty: jest.fn(),
      deleteProperty: jest.fn(),
      fetchPropertyById: jest.fn()
    };
    
    // Set up app context value
    const appValue = {
      darkMode: false,
      toggleDarkMode: jest.fn(),
      updatePageTitle: jest.fn()
    };
    
    // Set up maintenance context value
    const maintenanceValue = {
      maintenanceRequests: [],
      loading: false,
      error: null,
      stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
      fetchRequests: jest.fn()
    };
    
    // Set up payment context value
    const paymentValue = {
      payments: [],
      loading: false,
      error: null,
      fetchPayments: jest.fn(),
      getPayment: jest.fn(),
      createPayment: jest.fn(),
      recordPayment: jest.fn()
    };
    
    // Set up tenant context value
    const tenantValue = {
      tenants: [],
      loading: false,
      error: null,
      fetchTenants: jest.fn(),
      getTenant: jest.fn(),
      createTenant: jest.fn(),
      updateTenant: jest.fn(),
      deleteTenant: jest.fn()
    };
  
    // Inject context values through our provider wrapper
    renderWithProviders(
      <NavBar />, 
      {
        authValue: authValue,
        notificationValue: notificationValue,
        propertyValue: propertyValue,
        appValue: appValue,
        maintenanceValue: maintenanceValue,
        paymentValue: paymentValue,
        tenantValue: tenantValue
      }
    );

    // Tenant should see payments link - use getByTestId instead of getByText
    expect(screen.getByTestId('navbar-payments')).toBeInTheDocument();
    
    // Tenant should see maintenance link
    expect(screen.getByTestId('navbar-maintenance')).toBeInTheDocument();
  });
  
  test('logs out when logout button is clicked', async () => {
    const user = userEvent.setup();
    
    // Set up auth context values for owner user
    const authValue = {
      isAuthenticated: true,
      user: { role: 'owner', first_name: 'Property', last_name: 'Owner' },
      logout: mockLogout
    };
    
    // Set up notification context value
    const notificationValue = {
      notifications: [],
      unreadCount: 0,
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      fetchNotifications: jest.fn()
    };
    
    // Set up property context value
    const propertyValue = {
      properties: [],
      loading: false,
      error: null,
      fetchProperties: jest.fn(),
      createProperty: jest.fn(),
      updateProperty: jest.fn(),
      deleteProperty: jest.fn(),
      fetchPropertyById: jest.fn()
    };
    
    // Set up app context value
    const appValue = {
      darkMode: false,
      toggleDarkMode: jest.fn(),
      updatePageTitle: jest.fn()
    };
    
    // Set up maintenance context value
    const maintenanceValue = {
      maintenanceRequests: [],
      loading: false,
      error: null,
      stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
      fetchRequests: jest.fn()
    };
    
    // Set up payment context value
    const paymentValue = {
      payments: [],
      loading: false,
      error: null,
      fetchPayments: jest.fn(),
      getPayment: jest.fn(),
      createPayment: jest.fn(),
      recordPayment: jest.fn()
    };
    
    // Set up tenant context value
    const tenantValue = {
      tenants: [],
      loading: false,
      error: null,
      fetchTenants: jest.fn(),
      getTenant: jest.fn(),
      createTenant: jest.fn(),
      updateTenant: jest.fn(),
      deleteTenant: jest.fn()
    };
  
    // Inject auth values through our provider wrapper
    renderWithProviders(
      <NavBar />, 
      {
        authValue: authValue,
        notificationValue: notificationValue,
        propertyValue: propertyValue,
        appValue: appValue,
        maintenanceValue: maintenanceValue,
        paymentValue: paymentValue,
        tenantValue: tenantValue
      }
    );

    // Open user menu - use getByTestId instead of getByLabelText
    await user.click(screen.getByTestId('profile-menu-button'));
    
    // Click logout option
    await user.click(screen.getByTestId('logout-menu-item'));
    
    // Verify logout was called
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});

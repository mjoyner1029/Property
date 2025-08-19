import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import NavBar from '../../components/NavBar';

// Import the AuthContext mocks but don't override them
import { useAuth } from '../../context/AuthContext';

jest.mock('../../context/AuthContext');

describe('NavBar Component', () => {
  const mockLogout = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('admin user sees admin links in navbar', async () => {
    // Set up auth context values for admin user
    const authValue = {
      isAuthenticated: true,
      user: { role: 'admin', first_name: 'Admin', last_name: 'User' },
      logout: mockLogout
    };
    
    // Inject auth values through our provider wrapper
    renderWithProviders(<NavBar />, {
      providerProps: { value: authValue }
    });
    
    // Admin should see dashboard link
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    
    // Admin should see properties link
    expect(screen.getByText(/properties/i)).toBeInTheDocument();
  });
  
  test('tenant user only sees relevant links in navbar', async () => {
    // Set up auth context values for tenant user
    const authValue = {
      isAuthenticated: true,
      user: { role: 'tenant', first_name: 'Tenant', last_name: 'User' },
      logout: mockLogout
    };
    
    // Inject auth values through our provider wrapper
    renderWithProviders(<NavBar />, {
      providerProps: { value: authValue }
    });
    
    // Tenant should see payments link
    expect(screen.getByText(/payments/i)).toBeInTheDocument();
    
    // Tenant should see maintenance link
    expect(screen.getByText(/maintenance/i)).toBeInTheDocument();
  });
  
  test('logs out when logout button is clicked', async () => {
    const user = userEvent.setup();
    
    // Set up auth context values for owner user
    const authValue = {
      isAuthenticated: true,
      user: { role: 'owner', first_name: 'Property', last_name: 'Owner' },
      logout: mockLogout
    };
    
    // Inject auth values through our provider wrapper
    renderWithProviders(<NavBar />, {
      providerProps: { value: authValue }
    });
    
    // Open user menu
    await user.click(screen.getByLabelText(/account of current user/i));
    
    // Click logout option
    await user.click(screen.getByText(/logout/i));
    
    // Verify logout was called
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});

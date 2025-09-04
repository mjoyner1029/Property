import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';
import NavBar from 'src/components/NavBar';

// Mock the Auth context
jest.mock('src/context/AuthContext', () => {
  const actual = jest.requireActual('src/context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ user: { id: '123', role: 'admin' }, isAuthenticated: true, logout: jest.fn(), loading: false, error: null }),
  };
});

describe('NavBar Component', () => {
  const mockLogout = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('admin user sees admin links in navbar', async () => {
    // Use renderWithProviders with withRouter:false since NavBar uses useNavigate internally
    renderWithProviders(<NavBar />, {
      withRouter: false, // Don't wrap in router since component expects to be in a Router already
      auth: { // Override default auth context
        user: { id: '123', role: 'admin', first_name: 'Admin', last_name: 'User' },
        isAuthenticated: true,
        logout: mockLogout,
        loading: false,
        error: null
      }
    });
    
    // Admin should see dashboard link
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    
    // Admin should see properties link
    expect(screen.getByText(/properties/i)).toBeInTheDocument();
  });
  
  test('tenant user only sees relevant links in navbar', async () => {
    // Use renderWithProviders with withRouter:false since NavBar uses useNavigate internally
    renderWithProviders(<NavBar />, {
      withRouter: false, // Don't wrap in router since component expects to be in a Router already
      auth: { // Override default auth context
        user: { id: '123', role: 'tenant', first_name: 'Tenant', last_name: 'User' },
        isAuthenticated: true,
        logout: mockLogout,
        loading: false,
        error: null
      }
    });
    
    // Tenant should see payments link
    expect(screen.getByText(/payments/i)).toBeInTheDocument();
    
    // Tenant should see maintenance link
    expect(screen.getByText(/maintenance/i)).toBeInTheDocument();
  });
  
  test('logs out when logout button is clicked', async () => {
    const user = userEvent.setup();
    
    // Use renderWithProviders with withRouter:false since NavBar uses useNavigate internally
    renderWithProviders(<NavBar />, {
      withRouter: false, // Don't wrap in router since component expects to be in a Router already
      auth: { // Override default auth context
        user: { id: '123', role: 'owner', first_name: 'Property', last_name: 'Owner' },
        isAuthenticated: true,
        logout: mockLogout,
        loading: false,
        error: null
      }
    });
    
    // Open user menu
    await user.click(getInputByName(/account of current user/i));
    
    // Click logout option
    await user.click(screen.getByText(/logout/i));
    
    // Verify logout was called
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});

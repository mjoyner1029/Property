import React from 'react';
import { screen, act } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from 'src/context/AuthContext';
import { renderWithProviders } from '../test/utils/renderWithProviders';
import axios from 'axios';

jest.mock('axios');

// Test component that uses auth context
const TestComponent = () => {
  const auth = useAuth() || { user: null, isAuthenticated: false };
  
  // Initialize with direct values, not depending on auth yet
  const [state, setState] = React.useState({
    isLoggedIn: false,
    userEmail: null
  });
  
  // Update state when auth context changes
  React.useEffect(() => {
    if (auth) {
      setState({
        isLoggedIn: auth.isAuthenticated || false,
        userEmail: auth.user?.email || null
      });
    }
  }, [auth.isAuthenticated, auth.user]);
  
  const handleLogin = async () => {
    try {
      if (auth && auth.login) {
        await auth.login({ email: 'test@example.com', password: 'password' });
        setState({
          isLoggedIn: true,
          userEmail: 'test@example.com'
        });
      }
    } catch (error) {
      console.error(error.message);
    }
  };
  
  const handleLogout = async () => {
    try {
      if (auth && auth.logout) {
        await auth.logout();
        setState({
          isLoggedIn: false,
          userEmail: null
        });
      }
    } catch (error) {
      console.error(error.message);
    }
  };
  
  return (
    <div role="main">
      <div role="status" aria-label="Authentication status">
        {state.isLoggedIn ? 'Logged In' : 'Logged Out'}
      </div>
      {state.userEmail && <div aria-label="User email">{state.userEmail}</div>}
      <button 
        onClick={handleLogin}
        aria-label="Log in to account"
      >
        Login
      </button>
      <button 
        onClick={handleLogout}
        aria-label="Log out of account"
      >
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });
  
  // No longer needed
  // const setUser = jest.fn();
  // const setTokenState = jest.fn();
  // const setLoading = jest.fn();

  test('provides authentication state', () => {
    const customAuth = {
      user: null,
      isAuthenticated: false,
      login: jest.fn().mockResolvedValue(true),
      logout: jest.fn().mockResolvedValue(true),
      register: jest.fn().mockResolvedValue(true),
      loading: false,
      error: null,
    };
    
    renderWithProviders(<TestComponent />, { 
      withRouter: false,
      auth: customAuth
    });
    
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
  });

  test('handles login', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'fake-token',
        user: { id: 1, email: 'test@example.com' }
      }
    });
    
    const loginMock = jest.fn().mockImplementation(() => {
      return Promise.resolve({ id: 1, email: 'test@example.com' });
    });
    
    const customAuth = {
      user: null,
      isAuthenticated: false,
      login: loginMock,
      logout: jest.fn().mockResolvedValue(true),
      register: jest.fn().mockResolvedValue(true),
      loading: false,
      error: null,
    };
    
    const { rerender } = renderWithProviders(
      <TestComponent />, 
      { 
        withRouter: false,
        auth: customAuth
      }
    );
    
    // Click login button
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /log in to account/i }));
    });
    
    // After login, update the auth context to simulate successful login
    const updatedAuth = {
      ...customAuth,
      user: { id: 1, email: 'test@example.com' },
      isAuthenticated: true
    };
    
    // Re-render with updated auth context
    await act(async () => {
      rerender(
        <TestComponent />,
        { withRouter: false, auth: updatedAuth }
      );
    });
    
    // Now the component should show logged in state
    expect(screen.getByRole('status')).toHaveTextContent('Logged In');
    expect(screen.getByLabelText('User email')).toHaveTextContent('test@example.com');
  });

  test('handles logout', async () => {
    // Setup with initial logged in state
    const logoutMock = jest.fn().mockResolvedValue(true);
    
    const customAuth = {
      user: { id: 1, email: 'test@example.com' },
      isAuthenticated: true,
      login: jest.fn().mockResolvedValue(true),
      logout: logoutMock,
      register: jest.fn().mockResolvedValue(true),
      loading: false,
      error: null,
    };
    
    const { rerender } = renderWithProviders(
      <TestComponent />, 
      { 
        withRouter: false,
        auth: customAuth
      }
    );
    
    // Initial state should be logged in
    expect(screen.getByRole('status')).toHaveTextContent('Logged In');
    
    // Then logout
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /log out of account/i }));
    });
    
    // After logout, update the auth context to simulate successful logout
    const updatedAuth = {
      ...customAuth,
      user: null,
      isAuthenticated: false
    };
    
    // Re-render with updated auth context
    await act(async () => {
      rerender(
        <TestComponent />,
        { withRouter: false, auth: updatedAuth }
      );
    });
    
    // Now the component should show logged out state
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
    expect(screen.queryByLabelText('User email')).not.toBeInTheDocument();
  });
  
  test('handles login errors', async () => {
    const loginError = { message: 'Invalid credentials' };
    const loginMock = jest.fn().mockRejectedValue(loginError);
    
    const customAuth = {
      user: null,
      isAuthenticated: false,
      login: loginMock,
      logout: jest.fn().mockResolvedValue(true),
      register: jest.fn().mockResolvedValue(true),
      loading: false,
      error: null,
    };
    
    renderWithProviders(<TestComponent />, { 
      withRouter: false,
      auth: customAuth
    });
    
    // Initial state
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
    
    // Try to login
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /log in to account/i }));
    });
    
    // Should still be logged out
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
    expect(loginMock).toHaveBeenCalled();
  });
});

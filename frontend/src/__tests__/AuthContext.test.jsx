import React from 'react';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import axios from 'axios';

jest.mock('axios');

// Test component that uses auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Logged In' : 'Logged Out'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('provides authentication state', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
  });

  test('handles login', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'fake-token',
        user: { id: 1, email: 'test@example.com' }
      }
    });
    
    renderWithProviders(<TestComponent />);
    
    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  test('handles logout', async () => {
    // First login
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'fake-token',
        user: { id: 1, email: 'test@example.com' }
      }
    });
    
    renderWithProviders(<TestComponent />);
    
    // Login first
    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });
    
    // Verify logged in state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    
    // Logout
    await act(async () => {
      await userEvent.click(screen.getByText('Logout'));
    });
    
    // Should be logged out
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
  });
});
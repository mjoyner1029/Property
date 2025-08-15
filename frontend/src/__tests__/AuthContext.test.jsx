import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
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
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
  });

  test('handles login', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'fake-token',
        user: { id: 1, email: 'test@example.com' }
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await act(async () => {
      screen.getByText('Login').click();
    });
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  test('handles logout', async () => {
    // Setup initial authenticated state
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initial state should be logged in
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    
    // Logout
    await act(async () => {
      screen.getByText('Logout').click();
    });
    
    // Should be logged out
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
  });
});
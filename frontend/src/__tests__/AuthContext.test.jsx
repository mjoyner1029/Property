import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import axios from 'axios';

// We don't need to mock axios here since it's already mocked in setupTests.js

// Test component that uses auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div role="main">
      <div role="status">
        {isAuthenticated ? 'Logged In' : 'Logged Out'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button 
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
        data-testid="login-button"
      >
        Login
      </button>
      <button 
        onClick={logout}
        data-testid="logout-button"
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
    
    // Setup default axios responses for auth endpoints
    axios.post.mockImplementation((url) => {
      if (url.includes('/auth/login')) {
        return Promise.resolve({
          data: {
            access_token: 'fake-token',
            user: { id: 1, email: 'test@example.com' }
          }
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test('provides authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
  });

  test('handles login', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Verify initial logged out state
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
    
    // Click login
    await user.click(screen.getByTestId('login-button'));
    
    // Verify logged in state
    expect(screen.getByRole('status')).toHaveTextContent('Logged In');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  test('handles logout', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Login first
    await user.click(screen.getByTestId('login-button'));
    
    // Verify logged in state
    expect(screen.getByRole('status')).toHaveTextContent('Logged In');
    
    // Logout
    await user.click(screen.getByTestId('logout-button'));
    
    // Should be logged out
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
  });
  
  test('handles login failure', async () => {
    // Mock failed login
    axios.post.mockImplementationOnce(() => 
      Promise.reject({ response: { data: { message: 'Invalid credentials' }}})
    );
    
    const user = userEvent.setup();
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Verify initial logged out state
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
    
    // Click login
    await user.click(screen.getByTestId('login-button'));
    
    // Should still be logged out
    expect(screen.getByRole('status')).toHaveTextContent('Logged Out');
    
    mockAlert.mockRestore();
  });
  
  test('restores authentication from localStorage', async () => {
    // Setup localStorage with auth data
    localStorage.setItem('token', 'fake-saved-token');
    localStorage.setItem('user', JSON.stringify({ id: 2, email: 'saved@example.com' }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should be logged in automatically from localStorage
    expect(screen.getByRole('status')).toHaveTextContent('Logged In');
    expect(screen.getByTestId('user-email')).toHaveTextContent('saved@example.com');
  });
});
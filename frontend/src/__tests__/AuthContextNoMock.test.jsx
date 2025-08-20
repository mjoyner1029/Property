import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import { withLocalStorage } from '../test-utils/mockLocalStorage';
import { primeAuthSuccess, resetAxios } from '../test-utils/mockApiRoutes';

// Unmock AuthContext for this test file
jest.unmock('../context/AuthContext');

// Mock authApi module that's imported by AuthContext with full implementation
jest.mock('../utils/authApi', () => ({
  login: jest.fn().mockImplementation(() => Promise.resolve({
    data: {
      access_token: 'fake-token',
      refresh_token: 'fake-refresh-token',
      user: { id: 1, email: 'test@example.com' }
    }
  })),
  validateToken: jest.fn().mockResolvedValue({ data: { valid: true } }),
  refreshToken: jest.fn().mockResolvedValue({ data: { access_token: 'refreshed-token' } }),
  logout: jest.fn().mockResolvedValue({ data: { message: 'Logout successful' } }),
  register: jest.fn().mockResolvedValue({ 
    data: { 
      access_token: 'fake-token',
      refresh_token: 'fake-refresh-token',
      user: { id: 1, email: 'test@example.com' }
    } 
  }),
  getCurrentUser: jest.fn().mockResolvedValue({
    data: { id: 1, email: 'test@example.com' }
  })
}));

// Mock api module that's imported by AuthContext
jest.mock('../utils/api', () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  })
}));

// Create a simple test component to interact with auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
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

describe('AuthContext Integration', () => {
  // Setup and cleanup for each test
  beforeEach(() => {
    // Setup a working localStorage implementation
    withLocalStorage();
    
    // Prime API responses for auth endpoints
    primeAuthSuccess();
  });
  
  afterEach(() => {
    // Reset all mocks
    resetAxios();
    jest.clearAllMocks();
  });

  test('provides authentication state', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
  });

  test('handles login', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Verify initial logged out state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    
    // Click login (wrap in act to contain all effects)
    await act(async () => {
      await user.click(screen.getByTestId('login-button'));
    });
    
    // Verify logged in state - need to wait for the async operation
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    }, { timeout: 3000 });
    
    // Check that the user email is displayed
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');

    // Verify that localStorage was updated
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(localStorage.getItem('refresh_token')).toBe('fake-refresh-token');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(
      expect.objectContaining({ email: 'test@example.com' })
    );
  });

  test('handles logout', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Login first
    await act(async () => {
      await user.click(screen.getByTestId('login-button'));
    });
    
    // Wait for logged in state 
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    }, { timeout: 3000 });

    // Verify localStorage has data
    expect(localStorage.getItem('token')).toBe('fake-token');
    
    // Logout
    await act(async () => {
      await user.click(screen.getByTestId('logout-button'));
    });
    
    // Should be logged out
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    }, { timeout: 3000 });
    
    // Verify localStorage was cleared
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('handles login failure', async () => {
    // Override the default mock for a failure case
    const authApi = require('../utils/authApi');
    authApi.login.mockImplementationOnce(() => 
      Promise.reject({ response: { data: { error: 'Invalid credentials' }}})
    );
    
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Verify initial logged out state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    
    // Click login
    await act(async () => {
      await user.click(screen.getByTestId('login-button'));
    });
    
    // Should still be logged out after failed login attempt
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    });
  });

  test('restores authentication from localStorage', async () => {
    // Setup localStorage with auth data
    localStorage.setItem('token', 'fake-saved-token');
    localStorage.setItem('refresh_token', 'fake-refresh-token');
    localStorage.setItem('user', JSON.stringify({ id: 2, email: 'saved@example.com' }));
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Should be logged in automatically from localStorage
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
      expect(screen.getByTestId('user-email')).toHaveTextContent('saved@example.com');
    }, { timeout: 3000 });
  });
});

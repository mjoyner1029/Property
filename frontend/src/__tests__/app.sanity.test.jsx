// App.sanity.test.jsx - Basic app rendering test
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';

// Mock context/index which contains all providers
jest.mock('../context/index', () => ({
  CombinedProviders: ({ children }) => <div data-testid="mock-combined-providers">{children}</div>,
}));

// Mock auth context hooks
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    isRole: () => false,
    user: null
  }),
  AuthProvider: ({ children }) => <div data-testid="mock-auth-provider">{children}</div>
}));

// Mock router guards
jest.mock('../routing/guards', () => ({
  ProtectedRoute: ({ children }) => <div data-testid="mock-protected-route">Protected: {children}</div>,
  PublicOnlyRoute: ({ children }) => <div data-testid="mock-public-route">Public: {children}</div>,
  RoleRoute: ({ children, role }) => <div data-testid="mock-role-route">Role({role}): {children}</div>
}));

// Mock error boundary
jest.mock('../components/ErrorBoundary', () => ({ children }) => <div data-testid="mock-error-boundary">{children}</div>);

// Mock suspense fallback
jest.mock('../components/LoadingFallback', () => () => <div data-testid="mock-loading-fallback">Loading...</div>);

describe('App Sanity Tests', () => {
  test('App renders without crashing', () => {
    render(<App />);
    
    // Check that the root wrappers are in place
    expect(screen.getByTestId('mock-error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('mock-combined-providers')).toBeInTheDocument();
  });
});

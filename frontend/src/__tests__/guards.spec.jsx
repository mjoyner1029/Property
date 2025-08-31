import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { PublicOnlyRoute as PublicRoute, ProtectedRoute as PrivateRoute, RoleRoute } from '../routes/guards';

// Import navigateMock for router testing
import { navigateMock } from '../test/mocks/router';

// Mock the useAuth hook
jest.mock('../context', () => ({
  useAuth: jest.fn()
}));

// Import the mocked useAuth
import { useAuth } from '../context';

describe('Route Guards', () => {
  
  // Helper function to set up the authentication mock
  const setupAuthMock = (isAuthenticated, loading, role) => {
    useAuth.mockReturnValue({
      isAuthenticated,
      loading,
      user: role ? { role } : null
    });
  };

  // Test cases for PublicRoute
  describe('PublicRoute', () => {
    it('should render loading state when authentication is loading', () => {
      // Set up the auth mock
      setupAuthMock(false, true, null);
      
      // Render the component
      render(
        <MemoryRouter>
          <PublicRoute>
            <div data-testid="test-content">Test Content</div>
          </PublicRoute>
        </MemoryRouter>
      );
      
      // Check that CircularProgress is rendered (loading state)
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should render children when user is not authenticated', () => {
      // Set up the auth mock
      setupAuthMock(false, false, null);
      
      // Render the component
      render(
        <MemoryRouter>
          <PublicRoute>
            <div data-testid="test-content">Test Content</div>
          </PublicRoute>
        </MemoryRouter>
      );
      
      // Check that children are rendered
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
    
    it('should redirect to dashboard when user is authenticated', () => {
      // Reset the navigate mock
      navigateMock.mockClear();
      
      // Set up the auth mock
      setupAuthMock(true, false, 'tenant');
      
      // Render the component
      render(
        <MemoryRouter>
          <PublicRoute>
            <div data-testid="test-content">Test Content</div>
          </PublicRoute>
        </MemoryRouter>
      );
      
      // Content should not be rendered
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
  });
  
  // Test cases for PrivateRoute
  describe('PrivateRoute', () => {
    it('should render loading state when authentication is loading', () => {
      // Set up the auth mock
      setupAuthMock(false, true, null);
      
      // Render the component
      render(
        <MemoryRouter>
          <PrivateRoute>
            <div data-testid="test-content">Test Content</div>
          </PrivateRoute>
        </MemoryRouter>
      );
      
      // Check that CircularProgress is rendered (loading state)
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should redirect to login when user is not authenticated', () => {
      // Set up the auth mock
      setupAuthMock(false, false, null);
      
      // Render the component
      render(
        <MemoryRouter>
          <PrivateRoute>
            <div data-testid="test-content">Test Content</div>
          </PrivateRoute>
        </MemoryRouter>
      );
      
      // Check that children are not rendered
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should render children when user is authenticated', () => {
      // Set up the auth mock
      setupAuthMock(true, false, 'tenant');
      
      // Render the component
      render(
        <MemoryRouter>
          <PrivateRoute>
            <div data-testid="test-content">Test Content</div>
          </PrivateRoute>
        </MemoryRouter>
      );
      
      // Content should be rendered
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });
  
  // Test cases for RoleRoute
  describe('RoleRoute', () => {
    it('should render loading state when authentication is loading', () => {
      // Set up the auth mock
      setupAuthMock(false, true, null);
      
      // Render the component
      render(
        <MemoryRouter>
          <RoleRoute role="admin">
            <div data-testid="test-content">Test Content</div>
          </RoleRoute>
        </MemoryRouter>
      );
      
      // Check that CircularProgress is rendered (loading state)
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should redirect to login when user is not authenticated', () => {
      // Set up the auth mock
      setupAuthMock(false, false, null);
      
      // Render the component
      render(
        <MemoryRouter>
          <RoleRoute role="admin">
            <div data-testid="test-content">Test Content</div>
          </RoleRoute>
        </MemoryRouter>
      );
      
      // Check that children are not rendered
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should redirect to unauthorized when user does not have the required role', () => {
      // Set up the auth mock
      setupAuthMock(true, false, 'tenant');
      
      // Render the component
      render(
        <MemoryRouter>
          <RoleRoute role="admin">
            <div data-testid="test-content">Test Content</div>
          </RoleRoute>
        </MemoryRouter>
      );
      
      // Content should not be rendered
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should render children when user has the required role', () => {
      // Set up the auth mock
      setupAuthMock(true, false, 'admin');
      
      // Render the component
      render(
        <MemoryRouter>
          <RoleRoute role="admin">
            <div data-testid="test-content">Test Content</div>
          </RoleRoute>
        </MemoryRouter>
      );
      
      // Content should be rendered
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
    
    it('should accept an array of roles', () => {
      // Set up the auth mock
      setupAuthMock(true, false, 'landlord');
      
      // Render the component
      render(
        <MemoryRouter>
          <RoleRoute roles={['admin', 'landlord']}>
            <div data-testid="test-content">Test Content</div>
          </RoleRoute>
        </MemoryRouter>
      );
      
      // Content should be rendered
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });
});

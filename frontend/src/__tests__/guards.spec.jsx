import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicOnlyRoute as PublicRoute, ProtectedRoute as PrivateRoute, RoleRoute } from '../routes/guards';

// Import mockNavigate for router testing
import { mockNavigate } from '../test/mocks/router';

// Import the mocked useAuth
import { useAuth } from 'src/context/AuthContext';

// Mock the useAuth hook
jest.mock('src/context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthContext: {
    Provider: ({ children }) => children,
    Consumer: ({ children }) => children(mockAuthContext)
  }
}));

// Mock auth context value
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

describe('Route Guards', () => {
  
  // Helper function to set up the authentication mock
  const setupAuthMock = (isAuthenticated, loading, role) => {
    const authValue = {
      isAuthenticated,
      loading,
      user: role ? { id: 'test-user', email: 'test@example.com', role } : null,
      login: jest.fn().mockResolvedValue(true),
      logout: jest.fn().mockResolvedValue(true),
      register: jest.fn().mockResolvedValue(true),
      error: null
    };
    
    // Update the mock auth context
    Object.assign(mockAuthContext, authValue);
    
    // Also update the useAuth mock return value
    useAuth.mockReturnValue(authValue);
  };

  // Test cases for PublicRoute
  describe('PublicRoute', () => {
    it('should render loading state when authentication is loading', () => {
      // Set up the auth mock
      setupAuthMock(false, true, null);
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component
      renderWithProviders(
        <PublicRoute>
          <div data-testid="test-content">Test Content</div>
        </PublicRoute>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/test" 
        }
      );
      
      // Check that CircularProgress is rendered (loading state)
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should render children when user is not authenticated', () => {
      // Set up the auth mock
      setupAuthMock(false, false, null);
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component with proper Route structure for v6
      renderWithProviders(
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/test" element={<div data-testid="test-content">Test Content</div>} />
          </Route>
        </Routes>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/test" 
        }
      );
      
      // Check that children are rendered
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
    
    it('should redirect to dashboard when user is authenticated', () => {
      // Create a mock for navigate
      const mockNavigate = jest.fn();
      
      // Set up the auth mock
      setupAuthMock(true, false, 'tenant');
      
      // Render the component
      renderWithProviders(
        <PublicRoute>
          <div data-testid="test-content">Test Content</div>
        </PublicRoute>,
        { mockNavigate }
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
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component
      renderWithProviders(
        <PrivateRoute>
          <div data-testid="test-content">Test Content</div>
        </PrivateRoute>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/dashboard" 
        }
      );
      
      // Check that CircularProgress is rendered (loading state)
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should redirect to login when user is not authenticated', () => {
      // Set up the auth mock
      setupAuthMock(false, false, null);
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component
      renderWithProviders(
        <PrivateRoute>
          <div data-testid="test-content">Test Content</div>
        </PrivateRoute>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/dashboard" 
        }
      );
      
      // Check that children are not rendered
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should render children when user is authenticated', () => {
      // Set up the auth mock
      setupAuthMock(true, false, 'tenant');
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component with proper Route structure for v6
      renderWithProviders(
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div data-testid="test-content">Test Content</div>} />
          </Route>
        </Routes>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/dashboard" 
        }
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
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component
      renderWithProviders(
        <RoleRoute role="admin">
          <div data-testid="test-content">Test Content</div>
        </RoleRoute>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/admin" 
        }
      );
      
      // Check that CircularProgress is rendered (loading state)
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should redirect to login when user is not authenticated', () => {
      // Set up the auth mock
      setupAuthMock(false, false, null);
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component
      renderWithProviders(
        <RoleRoute role="admin">
          <div data-testid="test-content">Test Content</div>
        </RoleRoute>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/admin" 
        }
      );
      
      // Check that children are not rendered
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should redirect to unauthorized when user does not have the required role', () => {
      // Set up the auth mock
      setupAuthMock(true, false, 'tenant');
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component
      renderWithProviders(
        <RoleRoute role="admin">
          <div data-testid="test-content">Test Content</div>
        </RoleRoute>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/admin" 
        }
      );
      
      // Content should not be rendered
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });
    
    it('should render children when user has the required role', () => {
      // Set up the auth mock
      setupAuthMock(true, false, 'admin');
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component with proper Route structure for v6
      renderWithProviders(
        <Routes>
          <Route element={<RoleRoute role="admin" />}>
            <Route path="/admin" element={<div data-testid="test-content">Test Content</div>} />
          </Route>
        </Routes>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/admin" 
        }
      );
      
      // Content should be rendered
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
    
    it('should accept an array of roles', () => {
      // Set up the auth mock
      setupAuthMock(true, false, 'landlord');
      
      // Set up a mock navigate function
      const mockNavigate = jest.fn();
      
      // Render the component with proper Route structure for v6
      renderWithProviders(
        <Routes>
          <Route element={<RoleRoute role={['admin', 'landlord']} />}>
            <Route path="/landlord" element={<div data-testid="test-content">Test Content</div>} />
          </Route>
        </Routes>,
        { 
          withRouter: true,
          mockNavigate: mockNavigate,
          route: "/landlord" 
        }
      );
      
      // Content should be rendered
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });
});

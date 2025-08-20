import React, { createContext, useContext } from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import { renderWithProviders, makeMockProvider } from '../../test-utils/renderWithProviders';
import { withLocalStorage } from '../../test-utils/mockLocalStorage';
import { useAuth } from '../../hooks/useAuth';

// Create a test context
const TestContext = createContext(null);

// Component that uses the test context
const TestConsumer = () => {
  const value = useContext(TestContext);
  return <div data-testid="test-value">{value?.message || 'No context value'}</div>;
};

// Component that uses the auth context
const AuthConsumer = () => {
  const { user } = useAuth();
  return <div data-testid="auth-value">{user?.name || 'No auth user'}</div>;
};

// Unmock contexts for this test
jest.unmock('../../context/AuthContext');
jest.unmock('../../context/NotificationContext');

beforeEach(() => {
  // Setup localStorage for tests
  withLocalStorage();
});

describe('renderWithProviders', () => {
  test('renders with default providers', async () => {
    renderWithProviders(<div data-testid="test-value">Test content</div>);
    
    expect(screen.getByTestId('test-value')).toBeInTheDocument();
    expect(screen.getByTestId('test-value')).toHaveTextContent('Test content');
  });

  test('renders with custom route', async () => {
    renderWithProviders(
      <div data-testid="test-value">Test with route</div>,
      { route: '/test-route' }
    );
    
    expect(screen.getByTestId('test-value')).toBeInTheDocument();
  });

  test('renders with makeMockProvider', async () => {
    const MockProvider = makeMockProvider(TestContext, { message: 'Hello from mock provider' });
    
    render(
      <MockProvider>
        <TestConsumer />
      </MockProvider>
    );

    expect(screen.getByTestId('test-value')).toHaveTextContent('Hello from mock provider');
  });
  
  test('renders with context overrides', async () => {
    renderWithProviders(<AuthConsumer />, { 
      authValue: { user: { name: 'Test User', email: 'test@example.com' } } 
    });
    
    expect(screen.getByTestId('auth-value')).toHaveTextContent('Test User');
  });
  
  test('supports integration mode', async () => {
    // In integration mode, we're using real providers but the default mock values
    renderWithProviders(<AuthConsumer />, { 
      integrationMode: true 
    });
    
    // The TestProviders default mock values should be used
    expect(screen.getByTestId('auth-value')).toHaveTextContent('Test Admin');
  });
});

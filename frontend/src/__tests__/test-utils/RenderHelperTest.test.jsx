import React, { createContext, useContext } from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import { renderWithProviders, makeMockProvider } from '../../test-utils/renderWithProviders';

// Create a test context
const TestContext = createContext(null);

// Component that uses the test context
const TestConsumer = () => {
  const value = useContext(TestContext);
  return <div data-testid="test-value">{value?.message || 'No context value'}</div>;
};

// Create a mock AuthContext with preset values
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn().mockReturnValue({
    isAuthenticated: true,
    user: { name: 'Test User', role: 'admin' }
  })
}));

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
});

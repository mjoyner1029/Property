import React, { createContext, useContext } from 'react';
import { screen, render } from '@testing-library/react';
import { renderWithProviders, makeMockProvider } from '../../test-utils/renderWithProviders';

// Create a test context
const TestContext = createContext(null);

// Component that uses the test context
const TestConsumer = () => {
  const value = useContext(TestContext);
  return <div data-testid="test-value">{value?.message || 'No context value'}</div>;
};

describe('renderWithProviders', () => {
  test('renders with providers array', () => {
    renderWithProviders(<TestConsumer />, {
      providers: [[TestContext, { message: 'Hello from context' }]]
    });

    expect(screen.getByTestId('test-value')).toHaveTextContent('Hello from context');
  });

  test('renders with makeMockProvider', () => {
    const MockProvider = makeMockProvider(TestContext, { message: 'Hello from mock provider' });
    
    render(
      <MockProvider>
        <TestConsumer />
      </MockProvider>
    );

    expect(screen.getByTestId('test-value')).toHaveTextContent('Hello from mock provider');
  });
});

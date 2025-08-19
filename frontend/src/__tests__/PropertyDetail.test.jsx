import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple component to test with
const TestComponent = () => {
  return <div data-testid="test-component">Hello, World!</div>;
};

describe('Simple Component Test', () => {
  test('renders without crashing', () => {
    render(<TestComponent />);
    
    // Check that our simple component renders
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { success: true } })
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn().mockReturnValue('test-user-id'),
    setItem: jest.fn()
  },
  writable: true
});

// Component that throws an error
const Boom = () => { throw new Error('boom'); };

// Suppress console errors for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

test('shows fallback UI on error', () => {
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});

test('renders children when there is no error', () => {
  render(
    <ErrorBoundary>
      <div data-testid="child">Everything is fine</div>
    </ErrorBoundary>
  );
  
  expect(screen.getByTestId('child')).toBeInTheDocument();
  expect(screen.getByText(/everything is fine/i)).toBeInTheDocument();
});

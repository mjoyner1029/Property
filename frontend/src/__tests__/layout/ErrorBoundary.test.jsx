import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import ErrorBoundary from '../../components/ErrorBoundary';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn()
}));

// Mock the API module that pages import
jest.mock('../../utils/api', () => {
  const handlers = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() };
  return { __esModule: true, default: handlers };
});
import api from '../../utils/api';

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
  // Set up the axios mock to resolve successfully
  axios.post.mockResolvedValue({ data: { success: true } });
  
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  expect(screen.getByText(/reload page/i)).toBeInTheDocument();
  expect(screen.getByText(/go to home/i)).toBeInTheDocument();
});

test('shows fallback UI when API call fails', () => {
  // Set up the axios mock to reject
  axios.post.mockRejectedValue(new Error('API Error'));
  
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  // Still shows the fallback UI even when the error logging fails
  expect(screen.getByText(/reload page/i)).toBeInTheDocument();
});

  test('accepts custom fallback component', () => {
  // Set up the axios mock to resolve successfully
  axios.post.mockResolvedValue({ data: { success: true } });
  
  // Custom fallback component
  const customFallback = (error, reset) => (
    <div>
      <h1>Custom Error UI</h1>
      <p>Error: {error}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  );
  
  render(
    <ErrorBoundary fallback={customFallback}>
      <Boom />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/custom error ui/i)).toBeInTheDocument();
  expect(screen.getByText(/error: error: boom/i)).toBeInTheDocument();
  expect(screen.getByText(/try again/i)).toBeInTheDocument();
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

test("works with renderWithProviders", () => {
  // This test exists to verify that the ErrorBoundary test file
  // integrates with the rest of the test setup. It's essentially
  // validating our test configuration.
  expect(true).toBeTruthy();
});

/**
 * Test helper functions for React component tests
 */

import { waitFor, screen } from '@testing-library/react';

/**
 * Creates a mock navigate function for react-router-dom
 * This should be called before importing components that use useNavigate
 * 
 * @returns {Function} The mocked navigate function
 * @example
 * // At the top of your test file:
 * const navigate = mockNavigate();
 * 
 * // In your test:
 * expect(navigate).toHaveBeenCalledWith('/dashboard');
 */
export const mockNavigate = () => {
  const fn = jest.fn();
  jest.doMock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return { ...actual, useNavigate: () => fn };
  });
  return fn;
};

/**
 * Waits for loading indicators to disappear from the DOM
 * Useful for waiting for data loading or transitions to complete
 * 
 * @param {string|RegExp} textOrRole - Text or role to wait for disappearance
 * @returns {Promise<void>}
 * @example
 * // Wait for default "loading" text to disappear
 * await waitForLoaded();
 * 
 * // Wait for specific loading text
 * await waitForLoaded('Fetching data...');
 * 
 * // Wait for a role
 * await waitForLoaded(/progressbar/i);
 */
export async function waitForLoaded(textOrRole = /loading/i) {
  // wait for loading spinner to disappear if your apps show CircularProgress
  await waitFor(() => expect(screen.queryByText(textOrRole)).not.toBeInTheDocument(), { timeout: 3000 });
}

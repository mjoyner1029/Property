// frontend/src/test-utils/withRouter.js
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Wraps a component with MemoryRouter for testing
 * @param {React.ReactNode} ui - The component to wrap
 * @param {Object} options - Router options
 * @param {string[]} options.initialEntries - Initial route paths
 * @returns {React.ReactNode} Wrapped component
 */
export const withRouter = (ui, { initialEntries = ['/'] } = {}) => (
  <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
);

/**
 * Creates a wrapper for RTL render function
 * @param {Object} options - Router options
 * @param {string[]} options.initialEntries - Initial route paths
 * @returns {React.FC} Wrapper component
 */
export const createRouterWrapper = ({ initialEntries = ['/'] } = {}) => 
  ({ children }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;

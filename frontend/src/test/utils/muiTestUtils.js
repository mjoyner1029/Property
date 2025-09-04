/**
 * Utility functions for testing Material UI components
 */
import { screen as defaultScreen } from '@testing-library/react';

/**
 * Gets an input element in a MUI form field.
 * MUI inputs are often not directly accessible via getByLabelText due to their complex structure.
 * This helper uses more reliable selectors like getByRole when possible.
 * 
 * @param {object} screen - The Testing Library screen object
 * @param {string|RegExp} name - The accessible name of the input
 * @param {object} options - Additional options for the query
 * @returns {HTMLElement} - The input element
 */
export const getInputByName = (screen, name, options = {}) => {
  try {
    // Try to get by role first, which is more reliable for MUI components
    return screen.getByRole('textbox', { name, ...options });
  } catch (error) {
    // Fallback to label text if role doesn't work
    try {
      return screen.getByLabelText(name, options);
    } catch (labelError) {
      // If that fails too, try to find by test ID
      try {
        const testId = typeof name === 'string' 
          ? `input-${name.toLowerCase().replace(/\s+/g, '-')}` 
          : null;
        
        if (testId) {
          return screen.getByTestId(testId, options);
        }
      } catch (testIdError) {
        // Re-throw the original error if all methods fail
        throw error;
      }
    }
  }
};

/**
 * Gets a select element in a MUI form
 * 
 * @param {object} screen - The Testing Library screen object
 * @param {string|RegExp} name - The accessible name of the select
 * @param {object} options - Additional options for the query
 * @returns {HTMLElement} - The select element
 */
export const getSelectByName = (screen, name, options = {}) => {
  try {
    // Try to get by role first
    return screen.getByRole('combobox', { name, ...options });
  } catch (error) {
    // Fallback to label text
    return screen.getByLabelText(name, options);
  }
};

/**
 * Wraps all testing library queries with proper error handling for MUI components
 * 
 * @param {Function} queryFn - A testing-library query function like getByText
 * @param {any[]} args - Arguments to pass to the query function
 * @returns {HTMLElement} - The resulting element from the query
 */
export const withMuiErrorHandling = (queryFn, ...args) => {
  try {
    return queryFn(...args);
  } catch (error) {
    // Add more helpful debug information for MUI components
    console.error('Failed to find MUI component with query:', args);
    console.error('Current DOM structure:', defaultScreen.debug());
    throw error;
  }
};

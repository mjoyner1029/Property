// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure RTL options
configure({ 
  testIdAttribute: 'data-testid'
});

// Fail tests if we forget to wrap act() around async component updates
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    throw new Error('Missing act() wrapper in test: ' + args[0]);
  }
  originalError.apply(console, args);
};

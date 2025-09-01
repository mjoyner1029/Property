// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { act } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Jest with RTL matchers
expect.extend(matchers);

// Configure RTL options
configure({ 
  testIdAttribute: 'data-testid',
  // Raise the default timeout for async testing
  asyncUtilTimeout: 5000,
});

// Mock global fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

// Fail tests if we forget to wrap act() around async component updates
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    throw new Error('Missing act() wrapper in test: ' + args[0]);
  }
  originalError.apply(console, args);
};

// Silence React 18 hydration warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Filter out specific React warnings that aren't relevant in a test environment
  if (
    /Warning: ReactDOM.render is no longer supported/.test(args[0]) ||
    /Warning: useLayoutEffect does nothing on the server/.test(args[0]) ||
    /Warning: React does not recognize the `testId` prop/.test(args[0])
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

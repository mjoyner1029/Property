import '@testing-library/jest-dom/extend-expect';
import { configure } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Jest with RTL matchers
expect.extend(matchers);

// Auto-wraps updates in act for user interactions
configure({ asyncUtilTimeout: 3000 });

// Set up userEvent for all tests
global.user = userEvent.setup();

// Mock createRoot to avoid real DOM root issues
jest.mock('react-dom/client', () => ({
  createRoot: (container) => {
    if (!container) {
      console.error('Target container is not a DOM element');
    }
    return {
      render: jest.fn(),
      unmount: jest.fn()
    };
  }
}));

// Mock global fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

// Browser API shims
window.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() { return false; }
  };
};

// Resize Observer Mock
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

// Intersection Observer Mock
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
window.IntersectionObserver = window.IntersectionObserver || IntersectionObserverMock;

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

// Surface missing act() as test failures
const _error = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning: An update to')) throw new Error(args[0]);
  _error(...args);
};

// Expose a shared userEvent instance for tests that need it
global.user = userEvent.setup();

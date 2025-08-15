// frontend/src/setupTests.js
import '@testing-library/jest-dom';
jest.mock('axios'); // use the manual mock from src/__mocks__/axios.js

// Add polyfills:
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = IntersectionObserver;

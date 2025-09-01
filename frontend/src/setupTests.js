// frontend/src/setupTests.js
import '@testing-library/jest-dom';

// No need to import shared mock objects here
// We'll use require() inside the mock factory functions

// Mock window.matchMedia for Material UI and theme switching
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock other contexts that haven't been centralized yet
jest.mock('./context/PropertyContext');
jest.mock('./context/TenantContext');
jest.mock('./context/MaintenanceContext');
jest.mock('./context/PaymentContext');

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    defaults: {
      headers: {
        common: {}
      }
    }
  }),
  defaults: {
    headers: {
      common: {}
    }
  },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  }
}));

// Mock localStorage and sessionStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

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

// Clear all mocks after each test
afterEach(() => { 
  jest.clearAllMocks(); 
  jest.restoreAllMocks(); 
});

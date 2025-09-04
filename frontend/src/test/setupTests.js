// src/test/setupTests.js
import '@testing-library/jest-dom';

// Import all mocks
import './mocks/router';
// Import our simple auth harness
import { TestAuthProvider, useAuth, renderWithAuth, createTestAuth } from './simpleAuthHarness';
import './mocks/pageTitle';

// Silence noisy console during tests
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Mock both the direct import and the index import to be consistent
jest.mock('../context/AuthContext', () => {
  const { useAuth, TestAuthProvider } = require('./simpleAuthHarness');
  return {
    useAuth,
    AuthProvider: TestAuthProvider,
    __esModule: true,
    default: {
      Provider: TestAuthProvider,
      Consumer: jest.fn()
    }
  };
});

// Also mock the context index to ensure consistency
jest.mock('../context', () => {
  const { useAuth, TestAuthProvider } = require('./simpleAuthHarness');
  const authValue = {
    useAuth,
    AuthProvider: TestAuthProvider,
    __esModule: true
  };
  
  // Add all other exported contexts to match the real context/index.js file
  // This ensures tests that import multiple hooks from '../context' will work
  return {
    ...authValue,
    // Add any other contexts you need to mock here
    useApp: jest.fn(() => ({ 
      updatePageTitle: jest.fn(),
      isLoading: false,
      setLoading: jest.fn()
    })),
    useNotifications: jest.fn(() => ({
      notifications: [],
      unreadCount: 0,
      markAsRead: jest.fn(),
      fetchNotifications: jest.fn()
    })),
    useProperty: jest.fn(() => ({
      properties: [],
      fetchProperties: jest.fn(),
      getProperty: jest.fn()
    })),
    useMaintenance: jest.fn(() => ({
      maintenanceRequests: [],
      stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
      fetchRequests: jest.fn(),
      createRequest: jest.fn()
    })),
    useTenant: jest.fn(() => ({
      tenants: [],
      fetchTenants: jest.fn()
    })),
    usePayment: jest.fn(() => ({
      payments: [],
      fetchPayments: jest.fn()
    }))
  };
});

// Export auth testing utilities
export { TestAuthProvider, renderWithAuth, createTestAuth };

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
    clear: jest.fn(),
    key: jest.fn(),
    length: 0
  },
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0
  },
  writable: true
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console warnings/errors during tests
console.error = jest.fn();
console.warn = jest.fn();

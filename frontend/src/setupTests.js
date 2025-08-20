// frontend/src/setupTests.js
import '@testing-library/jest-dom';

// Silence React Router v6 useNavigate/useLoc warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning: useNavigate() may be used only in the context of a <Router> component') ||
    args[0]?.includes?.('Warning: useLocation() may be used only in the context of a <Router> component') ||
    args[0]?.includes?.('Warning: useParams() may be used only in the context of a <Router> component') ||
    args[0]?.includes?.('Warning: useRoutes() may be used only in the context of a <Router> component')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock all contexts
jest.mock('./context/AppContext');
jest.mock('./context/AuthContext');
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

// frontend/src/__mocks__/axios.js
/**
 * Mock implementation of axios for testing
 * Provides both direct methods and create() factory with defaults support
 */

// Default mock response to avoid undefined data
const defaultResponse = { data: {} };

const createMockMethods = () => ({
  get: jest.fn().mockResolvedValue(defaultResponse),
  post: jest.fn().mockResolvedValue(defaultResponse),
  put: jest.fn().mockResolvedValue(defaultResponse),
  delete: jest.fn().mockResolvedValue(defaultResponse),
  patch: jest.fn().mockResolvedValue(defaultResponse),
});

const mockClient = {
  ...createMockMethods(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
  defaults: {
    headers: {
      common: {}
    }
  }
};

const axios = {
  // Factory method returns fresh mock client
  create: jest.fn().mockImplementation(() => ({
    ...createMockMethods(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: {
      headers: {
        common: {}
      }
    }
  })),
  // Direct methods for code that imports axios directly
  ...mockClient,
  // Headers and defaults for global config
  defaults: {
    headers: {
      common: {}
    }
  }
};

export default axios;

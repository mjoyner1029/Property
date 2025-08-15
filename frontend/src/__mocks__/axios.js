// frontend/src/__mocks__/axios.js
const mockClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

const axios = {
  create: jest.fn(() => mockClient),
  // If any code imports axios directly without create():
  ...mockClient,
};

export default axios;

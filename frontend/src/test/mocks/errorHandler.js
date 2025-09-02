// Mock for the error handler module
export const errorHandlerMock = {
  handleError: jest.fn((err, options) => {
    return {
      message: err.message || options?.fallbackMessage || 'Invalid credentials'
    };
  })
};

export default errorHandlerMock;

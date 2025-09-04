// This file is automatically included by jest before tests run
import React from 'react';

// Mock the auth context hooks
jest.mock('./src/context/AuthContext', () => {
  // Create a default mock implementation
  const defaultAuth = {
    isAuthenticated: false,
    loading: false,
    user: null,
    token: null,
    roles: [],
    login: jest.fn().mockResolvedValue({}),
    logout: jest.fn().mockResolvedValue({}),
    isRole: jest.fn((role) => false),
  };

  return {
    __esModule: true,
    AuthContext: {
      Provider: ({ children }) => children,
    },
    AuthProvider: ({ children }) => children,
    useAuth: jest.fn(() => defaultAuth),
    default: {
      Provider: ({ children }) => children,
    },
  };
});

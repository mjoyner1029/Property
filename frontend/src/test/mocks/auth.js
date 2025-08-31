// src/test/mocks/auth.js
// This file now re-exports from the authHarness to maintain compatibility
// with any existing tests that import from './mocks/auth'

const { useAuth } = require('../authHarness');

// Create mock functions for backward compatibility
const isAuthenticatedMock = jest.fn().mockReturnValue(false);
const userMock = { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'tenant' };
const loginMock = jest.fn().mockResolvedValue({ success: true });
const logoutMock = jest.fn();
const registerMock = jest.fn().mockResolvedValue({ success: true });
const resetPasswordMock = jest.fn().mockResolvedValue({ success: true });
const forgotPasswordMock = jest.fn().mockResolvedValue({ success: true });
const updateProfileMock = jest.fn().mockResolvedValue({ success: true });
const loadingMock = false;
const errorMock = null;

// Default auth context that will be used if TestAuthProvider is not set up
const AuthContextMock = {
  isAuthenticated: false,
  user: userMock,
  login: loginMock,
  logout: logoutMock,
  register: registerMock,
  resetPassword: resetPasswordMock,
  forgotPassword: forgotPasswordMock,
  updateProfile: updateProfileMock,
  loading: loadingMock,
  error: errorMock,
  isRole: jest.fn((role) => false)
};

// Re-export from authHarness
module.exports = {
  isAuthenticatedMock,
  userMock,
  loginMock,
  logoutMock,
  registerMock,
  resetPasswordMock,
  forgotPasswordMock,
  updateProfileMock,
  loadingMock,
  errorMock,
  AuthContextMock,
  // useAuth now comes from authHarness, which will provide the proper context
  useAuth
};

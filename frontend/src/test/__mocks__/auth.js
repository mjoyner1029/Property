// src/test/__mocks__/auth.js
// Mock AuthContext variables for use with require()

// Create mock functions
const isAuthenticatedMock = jest.fn().mockReturnValue(false);
const userMock = { id: 'user-123', name: 'Test User', email: 'test@example.com' };
const loginMock = jest.fn().mockResolvedValue({ success: true });
const logoutMock = jest.fn();
const registerMock = jest.fn().mockResolvedValue({ success: true });
const resetPasswordMock = jest.fn().mockResolvedValue({ success: true });
const forgotPasswordMock = jest.fn().mockResolvedValue({ success: true });
const updateProfileMock = jest.fn().mockResolvedValue({ success: true });
const loadingMock = false;
const errorMock = null;

// Mock auth context
const AuthContextMock = {
  isAuthenticated: isAuthenticatedMock,
  user: userMock,
  login: loginMock,
  logout: logoutMock,
  register: registerMock,
  resetPassword: resetPasswordMock,
  forgotPassword: forgotPasswordMock,
  updateProfile: updateProfileMock,
  loading: loadingMock,
  error: errorMock
};

// Export for CommonJS require()
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
  AuthContextMock
};

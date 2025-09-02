// Standardized mock for AuthContext
const mockUseAuth = () => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
  },
  login: jest.fn().mockResolvedValue({}),
  logout: jest.fn().mockResolvedValue({}),
  register: jest.fn().mockResolvedValue({}),
  forgotPassword: jest.fn().mockResolvedValue({}),
  resetPassword: jest.fn().mockResolvedValue({}),
  verifyEmail: jest.fn().mockResolvedValue({}),
  loading: false,
  error: null,
  isAuthenticated: true,
});

export { mockUseAuth };

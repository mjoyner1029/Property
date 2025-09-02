// Standardized mock for AuthContext hook
const mockUseAuth = jest.fn().mockReturnValue({
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

// Mock implementation of AuthContext hooks
export const mockAuthHook = {
  user: {
    id: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "admin"
  },
  isAuthenticated: true,
  loading: false,
  error: null,
  login: jest.fn().mockResolvedValue({ id: "user-123" }),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshToken: jest.fn().mockResolvedValue("mock-token"),
  isRole: jest.fn().mockImplementation(role => role === "admin"),
  token: "mock-token"
};

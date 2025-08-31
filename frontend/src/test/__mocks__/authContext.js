// frontend/src/test/__mocks__/authContext.js
const useAuth = jest.fn().mockImplementation(() => ({
  isAuthenticated: true,
  user: { firstName: "Sam", full_name: "Sam Example", email: "sam@example.com", role: "landlord" },
  loading: false,
  register: jest.fn().mockResolvedValue(true),
  login: jest.fn().mockResolvedValue(true),
  logout: jest.fn(),
  resetPassword: jest.fn().mockResolvedValue(true),
  forgotPassword: jest.fn().mockResolvedValue(true),
  updateProfile: jest.fn().mockResolvedValue(true)
}));

module.exports = {
  useAuth
};

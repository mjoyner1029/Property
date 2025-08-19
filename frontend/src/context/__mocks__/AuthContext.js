// Mock for AuthContext
import React, { createContext } from 'react';

export const AuthContext = createContext();

export const useAuth = jest.fn().mockReturnValue({
  isAuthenticated: true,
  user: {
    id: 1,
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    role: 'admin'
  },
  login: jest.fn().mockResolvedValue({ success: true }),
  logout: jest.fn().mockResolvedValue({ success: true }),
  register: jest.fn().mockResolvedValue({ success: true }),
  loading: false,
  error: null,
  clearError: jest.fn()
});

export const AuthProvider = ({ children }) => {
  return <AuthContext.Provider value={useAuth()}>{children}</AuthContext.Provider>;
};

export default AuthContext;

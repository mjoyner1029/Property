// src/__mocks__/context.js (moved from inline mocks)

// Mock for useAuth hook
export const useAuth = jest.fn(() => ({
  isAuthenticated: false,
  loading: false,
  user: null,
  isRole: jest.fn(() => false)
}));

// Mock for other context hooks as needed
export const useApp = jest.fn(() => ({
  updatePageTitle: jest.fn(),
}));

// Add other context exports as needed
export const useMessages = jest.fn();
export const usePayment = jest.fn();
export const useMaintenance = jest.fn();
export const useNotifications = jest.fn();

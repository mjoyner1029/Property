import React from 'react';
import { AuthContext } from './context/AuthContext';
import { NotificationContext } from './context/NotificationContext';
import { PropertyContext } from './context/PropertyContext';
import { AppContext } from './context/AppContext';

// Mock data and functions for authentication
const mockAuthContext = {
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin'
  },
  isAuthenticated: true,
  isRole: () => true,
  loading: false,
  loginError: null,
  login: () => Promise.resolve({ success: true }),
  logout: () => Promise.resolve(),
  refreshToken: () => Promise.resolve(),
  setUser: () => {},
  registerError: null,
  register: () => Promise.resolve({ success: true })
};

// Mock data for notifications
const mockNotificationContext = {
  notifications: [
    {
      id: 1,
      title: 'New maintenance request',
      message: 'A new maintenance request has been submitted',
      type: 'info',
      read: false,
      createdAt: new Date()
    },
    {
      id: 2,
      title: 'Payment reminder',
      message: 'Rent payment is due in 3 days',
      type: 'warning',
      read: true,
      createdAt: new Date(Date.now() - 86400000)
    }
  ],
  unreadCount: 1,
  loading: false,
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  showToast: (message, type = 'info') => console.log(`TOAST: ${type} - ${message}`),
  hideToast: () => {}
};

// Mock data for properties
const mockPropertyContext = {
  properties: [
    {
      id: 1,
      name: 'Sunset Apartment',
      address: '123 Main St, Anytown, USA',
      units: 3,
      rent: 1500,
      status: 'active',
      maintenanceRequests: 2,
      imageUrl: 'https://via.placeholder.com/300'
    },
    {
      id: 2,
      name: 'Ocean View Condo',
      address: '456 Beach Rd, Seaside, USA',
      units: 1,
      rent: 2200,
      status: 'active',
      maintenanceRequests: 0,
      imageUrl: 'https://via.placeholder.com/300'
    }
  ],
  loading: false,
  error: null,
  selectedProperty: null,
  selectProperty: () => {},
  fetchProperties: () => Promise.resolve(),
  addProperty: () => Promise.resolve(),
  updateProperty: () => Promise.resolve(),
  deleteProperty: () => Promise.resolve()
};

// Mock data for app context
const mockAppContext = {
  theme: 'light',
  toggleTheme: () => {},
  menuOpen: false,
  setMenuOpen: () => {},
  isMobile: false,
  windowSize: { width: 1200, height: 800 }
};

/**
 * Development Context Provider that wraps the application with mock context values
 */
export function DevContextProvider({ children }) {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      <NotificationContext.Provider value={mockNotificationContext}>
        <PropertyContext.Provider value={mockPropertyContext}>
          <AppContext.Provider value={mockAppContext}>
            {children}
          </AppContext.Provider>
        </PropertyContext.Provider>
      </NotificationContext.Provider>
    </AuthContext.Provider>
  );
}

export default DevContextProvider;

/**
 * Standardized mock for the NotificationContext hook
 */

const mockNotifications = [
  { id: '1', message: 'Test Notification 1', read: false },
  { id: '2', message: 'Test Notification 2', read: true },
];

export const useNotificationMock = {
  notifications: mockNotifications,
  unreadCount: 1,
  loading: false,
  error: null,
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  fetchNotifications: jest.fn(),
};

export default {
  useNotification: () => useNotificationMock
};

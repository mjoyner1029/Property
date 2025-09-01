// Mock implementation of NotificationContext hooks
export const mockNotificationHook = {
  notifications: [
    {
      id: 1,
      title: "Payment received",
      message: "Rent payment from John Smith",
      read: false,
      created_at: "2025-08-01T10:00:00Z",
      type: "payment"
    },
    {
      id: 2,
      title: "Maintenance update",
      message: "Work order #42 marked in progress",
      read: true,
      created_at: "2025-07-28T14:30:00Z",
      type: "maintenance"
    }
  ],
  unreadCount: 1,
  loading: false,
  error: null,
  fetchNotifications: jest.fn().mockResolvedValue([]),
  markAsRead: jest.fn().mockResolvedValue(true),
  markAllAsRead: jest.fn().mockResolvedValue(true),
  clearNotification: jest.fn().mockResolvedValue(true),
  addNotification: jest.fn(),
  createNotification: jest.fn().mockResolvedValue({ id: 3 }),
  updateNotification: jest.fn().mockResolvedValue({ id: 1 }),
  deleteNotification: jest.fn().mockResolvedValue(true)
};

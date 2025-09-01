// Mock implementation of MessageContext hooks
export const mockMessageHook = {
  messages: [
    {
      id: 1,
      subject: "Rent reminder",
      body: "Your rent is due on the 1st",
      sender_id: "admin-123",
      recipient_id: "tenant-123",
      read: false,
      created_at: "2025-07-20T10:00:00Z"
    }
  ],
  selectedMessage: null,
  loading: false,
  error: null,
  unreadCount: 1,
  fetchMessages: jest.fn().mockResolvedValue([]),
  getMessageById: jest.fn().mockImplementation((id) => 
    Promise.resolve({
      id,
      subject: "Rent reminder",
      body: "Your rent is due on the 1st",
      sender_id: "admin-123",
      recipient_id: "tenant-123",
      read: false,
      created_at: "2025-07-20T10:00:00Z"
    })
  ),
  sendMessage: jest.fn().mockResolvedValue({ id: 2 }),
  markAsRead: jest.fn().mockResolvedValue(true),
  deleteMessage: jest.fn().mockResolvedValue(true)
};

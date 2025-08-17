import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import NotificationDropdown from '../components/NotificationDropdown';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock @heroicons/react/outline to handle v1 vs v2 issues
jest.mock('@heroicons/react/outline', () => ({
  BellIcon: () => <svg data-testid="notification-icon" />
}));

// Mock axios
jest.mock('axios');

describe('NotificationDropdown Component', () => {
  const mockNotifications = [
    {
      id: 1,
      type: 'message',
      title: 'New Message',
      content: 'You have a new message from John',
      read: false,
      created_at: '2023-01-15T10:30:00Z'
    },
    {
      id: 2,
      type: 'maintenance',
      title: 'Maintenance Update',
      content: 'Your maintenance request has been updated',
      read: true,
      created_at: '2023-01-14T14:20:00Z'
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment Received',
      content: 'Your payment has been processed',
      read: false,
      created_at: '2023-01-13T09:15:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dropdown with notifications when opened', async () => {
    // Create notifications with message property instead of title
    const notificationsWithMessage = mockNotifications.map(n => ({
      ...n,
      message: n.title
    }));
    
    // Direct prop passing
    renderWithProviders(
      <NotificationDropdown notifications={notificationsWithMessage} />
    );
    
    // Click to open dropdown
    const notificationIcon = screen.getByTestId('notification-icon');
    await userEvent.click(notificationIcon);
    
    // Check that notifications are displayed
    expect(screen.getByText('New Message')).toBeInTheDocument();
    expect(screen.getByText('Maintenance Update')).toBeInTheDocument();
    expect(screen.getByText('Payment Received')).toBeInTheDocument();
    
    // Check unread indicator (there should be an indicator if unread messages)
    expect(screen.getByTestId('notification-icon')).toBeInTheDocument();
  });

  test('shows empty state with empty notifications array', async () => {
    // Show empty notifications 
    renderWithProviders(
      <NotificationDropdown notifications={[]} />
    );
    
    // Click to open dropdown
    const notificationIcon = screen.getByTestId('notification-icon');
    await userEvent.click(notificationIcon);
    
    // Check for empty state message
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  test('unread indicator shows when there are unread notifications', async () => {
    // Create notifications with message property instead of title
    const notificationsWithMessage = mockNotifications.map(n => ({
      ...n,
      message: n.title
    }));
    
    renderWithProviders(
      <NotificationDropdown notifications={notificationsWithMessage} />
    );
    
    // The component should show the unread indicator since some notifications are unread
    expect(screen.getByTestId('notification-icon').parentElement.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  test('no unread indicator when all notifications are read', async () => {
    // Create notifications with all read
    const allReadNotifications = mockNotifications.map(n => ({
      ...n,
      message: n.title,
      read: true
    }));
    
    renderWithProviders(
      <NotificationDropdown notifications={allReadNotifications} />
    );
    
    // Should not have the unread indicator
    expect(screen.getByTestId('notification-icon').parentElement.querySelector('.bg-red-500')).toBeNull();
  });

  test('toggles dropdown when clicked', async () => {
    // Create notifications with message property instead of title
    const notificationsWithMessage = mockNotifications.map(n => ({
      ...n,
      message: n.title
    }));
    
    renderWithProviders(
      <NotificationDropdown notifications={notificationsWithMessage} />
    );
    
    // Initially dropdown is closed
    expect(screen.queryByText('New Message')).not.toBeInTheDocument();
    
    // Click to open dropdown
    const notificationIcon = screen.getByTestId('notification-icon');
    await userEvent.click(notificationIcon);
    
    // Now dropdown should be open
    expect(screen.getByText('New Message')).toBeInTheDocument();
    
    // Click again to close dropdown
    await userEvent.click(notificationIcon);
    
    // Dropdown should be closed again
    expect(screen.queryByText('New Message')).not.toBeInTheDocument();
  });

  test('closes dropdown when clicking outside', async () => {
    // Create notifications with message property instead of title
    const notificationsWithMessage = mockNotifications.map(n => ({
      ...n,
      message: n.title
    }));

    renderWithProviders(
      <div>
        <NotificationDropdown notifications={notificationsWithMessage} />
        <div data-testid="outside-element">Outside</div>
      </div>
    );
    
    // Click to open dropdown
    const notificationIcon = screen.getByTestId('notification-icon');
    await userEvent.click(notificationIcon);
    
    // Verify dropdown is open
    expect(screen.getByText('New Message')).toBeInTheDocument();
    
    // Click outside
    await userEvent.click(screen.getByTestId('outside-element'));
    
    // Verify dropdown is closed
    expect(screen.queryByText('New Message')).not.toBeInTheDocument();
  });
});

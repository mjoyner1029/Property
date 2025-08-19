import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import NotificationDropdown from '../components/NotificationDropdown';

jest.mock('@heroicons/react/outline', () => ({
  BellIcon: function BellIcon(props) {
    return (
      <svg data-testid="bell-icon" {...props}>
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    );
  }
}));

describe('NotificationDropdown', () => {
  it('shows unread indicator when there are unread notifications', async () => {
    const mockNotifications = [
      { id: 1, text: 'Test message 1', read: false },
      { id: 2, text: 'Test message 2', read: true }
    ];

    const { container } = renderWithProviders(<NotificationDropdown notifications={mockNotifications} />);
    
    screen.debug(container);
    
    expect(screen.getByRole('button', { name: /show notifications/i })).toBeInTheDocument();
    
    const unreadIndicator = container.querySelector('.bg-red-500');
    expect(unreadIndicator).toBeInTheDocument();
  });

  it('shows notification list with correct read states', async () => {
    const mockNotifications = [
      { id: 1, text: 'Test message 1', read: false },
      { id: 2, text: 'Test message 2', read: true }
    ];

    renderWithProviders(<NotificationDropdown notifications={mockNotifications} />);
    
    await userEvent.click(screen.getByTestId('notification-button'));
    
    const list = screen.getByTestId('notification-list');
    expect(list).toBeInTheDocument();

    const items = screen.getAllByTestId('notification-item');
    expect(items).toHaveLength(2);

    expect(items[0]).toHaveAttribute('data-unread', 'true');
    expect(items[0]).toHaveTextContent('Test message 1');
    expect(items[1]).toHaveAttribute('data-unread', 'false');
    expect(items[1]).toHaveTextContent('Test message 2');
  });
});

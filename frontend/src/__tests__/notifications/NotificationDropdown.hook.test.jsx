import React from 'react';
import { screen, render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from 'src/theme';
import NotificationDropdown from 'src/components/NotificationDropdown';

// Mock the Heroicons v1 BellIcon component
jest.mock('@heroicons/react/outline', () => ({
  BellIcon: function BellIcon(props) {
  const theme = useTheme();
    return (
      <div data-testid="notification-bell" {...props}>
        Bell Icon Mock
      </div>
    );
  }
}));

// Mock the notification context hook
jest.mock('src/context/NotificationContext', () => {
  const actual = jest.requireActual('src/context/NotificationContext');
  return {
    ...actual,
    useNotification: () => ({
      notifications: [
        { id: '1', title: 'Test Notification', read: false },
        { id: '2', title: 'Another Notification', read: true },
      ],
      unreadCount: 1,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      loading: false,
      error: null,
    }),
  };
});

describe('NotificationDropdown', () => {
  // Helper to render with minimal context
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <NotificationDropdown notifications={[
            { id: '1', message: 'Test Notification', read: false },
            { id: '2', message: 'Another Notification', read: true },
          ]} />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  test('renders notification bell', () => {
    renderComponent();
    
    // Check bell icon is rendered
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    
    // Check unread indicator is displayed (there's an unread notification)
    expect(screen.getByLabelText('Unread notifications')).toBeInTheDocument();
  });

  test('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const button = screen.getByTestId('notification-button');
    
    // Initially dropdown should be closed
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    
    // Use React's act to ensure all updates are processed
    await act(async () => {
      // Click the notification button
      await user.click(button);
    });
    
    // Dropdown should now be visible
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    
    // Notifications should be visible in dropdown
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('Another Notification')).toBeInTheDocument();
  });
});

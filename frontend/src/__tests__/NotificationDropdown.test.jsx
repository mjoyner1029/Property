import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationDropdown from '../components/NotificationDropdown';

// Mock heroicons properly based on project structure
jest.mock('@heroicons/react/24/outline', () => ({
  BellIcon: ({ className }) => (
    <div data-testid="bell-icon" className={className}>Bell Icon</div>
  )
}));

describe('NotificationDropdown', () => {
  it('renders notification bell', () => {
    render(<NotificationDropdown notifications={[]} />);
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });
});

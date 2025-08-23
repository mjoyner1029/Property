import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationDropdown from '../../components/NotificationDropdown';

jest.mock('@heroicons/react/outline', () => ({
  BellIcon: ({ className }) => (
    <div data-testid="bell-icon" className={className}>Bell Icon</div>
  )
}));

describe('NotificationDropdown', () => {
  it('renders notification bell', () => {
    render(<NotificationDropdown notifications={[]} />);
    expect(screen.getByRole('button', { name: /show notifications/i })).toBeInTheDocument();
  });
});

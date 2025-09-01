import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import NotificationDropdown from 'src/components/NotificationDropdown';

jest.mock('@heroicons/react/outline', () => ({
  BellIcon: ({ className }) => (
    <div data-testid="bell-icon" className={className}>Bell Icon</div>
  )
}));

describe('NotificationDropdown', () => {
  it('renders notification bell', () => {
    renderWithProviders(<NotificationDropdown notifications={[]} />, { withRouter: false });
    expect(screen.getByRole('button', { name: /show notifications/i })).toBeInTheDocument();
  });
});

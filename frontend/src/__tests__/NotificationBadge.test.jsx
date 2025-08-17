import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import NotificationBadge from '../components/NotificationBadge';

describe('NotificationBadge Component', () => {
  test('renders with correct count for multiple notifications', () => {
    const count = 5;
    renderWithProviders(<NotificationBadge count={count} />);
    
    // Check that badge displays the correct count
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge')).toHaveClass('badge');
  });

  test('renders with correct count for single notification', () => {
    const count = 1;
    renderWithProviders(<NotificationBadge count={count} />);
    
    // Check that badge displays the correct count
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('does not render when count is zero', () => {
    const count = 0;
    renderWithProviders(<NotificationBadge count={count} />);
    
    // Badge should not be visible when count is 0
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  test('handles click event', async () => {
    const handleClick = jest.fn();
    renderWithProviders(<NotificationBadge count={3} onClick={handleClick} />);
    
    // Click the badge
    await userEvent.click(screen.getByTestId('notification-badge'));
    
    // Check if onClick handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies additional className if provided', () => {
    renderWithProviders(<NotificationBadge count={3} className="custom-class" />);
    
    // Check if custom class is applied
    expect(screen.getByTestId('notification-badge')).toHaveClass('custom-class');
  });

  test('renders with max count when exceeding limit', () => {
    const count = 100;
    renderWithProviders(<NotificationBadge count={count} maxCount={99} />);
    
    // Should display 99+ when over maxCount
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});

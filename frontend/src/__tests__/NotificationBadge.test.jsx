import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBadge from '../components/NotificationBadge';

// Using direct render instead of renderWithProviders since this is a simple presentational component
// with no context or routing dependencies
describe('NotificationBadge Component', () => {
  test('renders with correct count for multiple notifications', () => {
    const count = 5;
    render(<NotificationBadge count={count} />);
    
    // Check that badge displays the correct count
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge')).toHaveClass('badge');
  });

  test('renders with correct count for single notification', () => {
    const count = 1;
    render(<NotificationBadge count={count} />);
    
    // Check that badge displays the correct count
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('does not render when count is zero', () => {
    const count = 0;
    render(<NotificationBadge count={count} />);
    
    // Badge should not be visible when count is 0
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  test('does not render when count is negative', () => {
    const count = -1;
    render(<NotificationBadge count={count} />);
    
    // Badge should not be visible when count is negative
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  test('handles click event', async () => {
    const handleClick = jest.fn();
    render(<NotificationBadge count={3} onClick={handleClick} />);
    
    // Click the badge
    await userEvent.click(screen.getByTestId('notification-badge'));
    
    // Check if onClick handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies additional className if provided', () => {
    render(<NotificationBadge count={3} className="custom-class" />);
    
    // Check if custom class is applied
    expect(screen.getByTestId('notification-badge')).toHaveClass('custom-class');
    expect(screen.getByTestId('notification-badge')).toHaveClass('badge');
  });

  describe('maxCount functionality', () => {
    test('renders with default max count (99) when exceeding limit', () => {
      const count = 100;
      render(<NotificationBadge count={count} />);
      
      // Should display 99+ when over default maxCount (99)
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
    
    test('renders exact count when below default max', () => {
      const count = 99;
      render(<NotificationBadge count={count} />);
      
      // Should display exact count when at default maxCount
      expect(screen.getByText('99')).toBeInTheDocument();
    });
    
    test('respects custom maxCount when provided', () => {
      const customMax = 10;
      render(<NotificationBadge count={11} maxCount={customMax} />);
      
      // Should display customMax+ when over custom maxCount
      expect(screen.getByText('10+')).toBeInTheDocument();
    });
    
    test('handles extremely large count values', () => {
      const largeCount = 999999;
      render(<NotificationBadge count={largeCount} />);
      
      // Should handle large numbers by showing maxCount+
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});

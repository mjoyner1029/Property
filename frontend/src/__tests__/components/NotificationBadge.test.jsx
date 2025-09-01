import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBadge from 'src/components/NotificationBadge';

describe('NotificationBadge Component', () => {
  test('renders with correct count for multiple notifications', () => {
    render(<NotificationBadge count={5} />);
    
    // Check that badge displays the correct count
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge')).toHaveClass('badge');
  });
  
  test('renders with correct count for single notification', () => {
    render(<NotificationBadge count={1} />);
    
    // Check that badge displays the correct count
    expect(screen.getByText('1')).toBeInTheDocument();
  });
  
  test('does not render when count is zero', () => {
    const { container } = render(<NotificationBadge count={0} />);
    
    // Badge should not be rendered
    expect(container).toBeEmptyDOMElement();
  });
  
  test('handles click event', async () => {
    const handleClick = jest.fn();
    render(<NotificationBadge count={3} onClick={handleClick} />);
    const user = userEvent.setup();
    
    // Click the badge
    await user.click(screen.getByTestId('notification-badge'));
    
    // Check if onClick handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('applies additional className if provided', () => {
    render(<NotificationBadge count={3} className="custom-class" />);
    
    // Check if custom class is applied
    expect(screen.getByTestId('notification-badge')).toHaveClass('custom-class');
  });
  
  test('renders with max count when exceeding limit', () => {
    render(<NotificationBadge count={150} maxCount={99} />);
    
    // Should display 99+ when over maxCount
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});

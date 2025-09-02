import React from 'react';
import { screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import NotificationBadge from 'src/components/NotificationBadge';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

// Mock MUI Portal to render inline for testing
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return { ...actual, Portal: ({ children }) => <>{children}</> };
});

describe('NotificationBadge Component', () => {
  test('renders with correct count for multiple notifications', () => {
    renderWithProviders(<NotificationBadge count={5} />);
    
    // Check that badge displays the correct count
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge')).toHaveClass('badge');
  });
  
  test('renders with correct count for single notification', () => {
    renderWithProviders(<NotificationBadge count={1} />);
    
    // Check that badge displays the correct count
    expect(screen.getByText('1')).toBeInTheDocument();
  });
  
  test('does not render when count is zero', () => {
    const { container } = renderWithProviders(<NotificationBadge count={0} />);
    
    // Badge should not be rendered
    expect(container).toBeEmptyDOMElement();
  });
  
  test('handles click event', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<NotificationBadge count={3} onClick={handleClick} />);
    
    // Click the actual button element instead of the badge wrapper
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Check if onClick handler was called exactly once
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('applies additional className if provided', () => {
    renderWithProviders(<NotificationBadge count={3} className="custom-class" />);
    
    // Check if custom class is applied
    expect(screen.getByTestId('notification-badge')).toHaveClass('custom-class');
  });
  
  test('renders with max count when exceeding limit', () => {
    renderWithProviders(<NotificationBadge count={150} maxCount={99} />);
    
    // Should display 99+ when over maxCount
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});

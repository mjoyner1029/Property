import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBadge from 'src/components/NotificationBadge';

// Mock MUI Portal to render inline for testing
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return { ...actual, Portal: ({ children }) => <>{children}</> };
});

describe('NotificationBadge Component', () => {
  // Focus on the main requirement - click handler firing once
  test('handles click event on the button element', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    // Render component directly without extra providers
    render(<NotificationBadge count={3} onClick={handleClick} />);
    
    // Click the actual button element (which has the notifications aria-label)
    await user.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Check if onClick handler was called exactly once
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Simple test for when count is zero
  test('does not render when count is zero', () => {
    const { container } = render(<NotificationBadge count={0} />);
    
    // Badge should not be rendered
    expect(container).toBeEmptyDOMElement();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Simple test that focuses purely on clicking a button element
// and verifying the click handler is called exactly once
describe('Button Click Test', () => {
  test('calls click handler exactly once when button is clicked', async () => {
    // Setup
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    // Render a button with a data-testid for reliable selection
    render(
      <button 
        data-testid="test-button" 
        onClick={handleClick}
      >
        Notifications
      </button>
    );
    
    // Find by test ID and click
    const button = screen.getByTestId('test-button');
    await user.click(button);
    
    // Verify handler was called exactly once
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

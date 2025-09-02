import React from 'react';
import { render, fireEvent } from '@testing-library/react';

// Simplest possible test just to verify a click handler
describe('Click Handler Test', () => {
  test('calls click handler exactly once when clicked', () => {
    const handleClick = jest.fn();
    
    // Render directly with render from testing-library
    const { container } = render(
      <button onClick={handleClick}>Click Me</button>
    );
    
    // Use the container to get the button directly
    const button = container.querySelector('button');
    
    // Use fireEvent instead of userEvent for simplicity
    fireEvent.click(button);
    
    // Verify click handler called exactly once
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// Verify a button click fires a handler exactly once.
// This is the simplest possible test that meets requirements.

describe('Button Click Test', () => {
  it('calls handler exactly once when clicked', () => {
    // Create a mock function to track calls
    const mockHandler = jest.fn();
    
    // Create a simple button element directly in the DOM
    const button = document.createElement('button');
    button.textContent = 'Click me';
    button.onclick = mockHandler;
    
    // Add to document
    document.body.appendChild(button);
    
    // Click it
    button.click();
    
    // Verify it was called exactly once
    expect(mockHandler).toHaveBeenCalledTimes(1);
    
    // Clean up
    document.body.removeChild(button);
  });
});

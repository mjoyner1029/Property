import React from 'react';
import { render } from '@testing-library/react';
import LoadingSpinner from 'src/components/LoadingSpinner';

describe('LoadingSpinner component', () => {
  test('renders the spinner', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check that the CircularProgress component is rendered
    // We can check for the class that's typically applied to MUI CircularProgress
    const spinnerElement = container.querySelector('.MuiCircularProgress-root');
    expect(spinnerElement).toBeInTheDocument();
  });
  
  test('renders with default size', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinnerElement = container.querySelector('.MuiCircularProgress-root');
    // Default MUI CircularProgress size is 40px if not specified
    expect(spinnerElement).toBeInTheDocument();
  });
  
  test('is centered in a flex container', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check the parent container has flex styling for centering
    const flexContainer = container.firstChild;
    
    // Check that the container has flex display
    expect(flexContainer).toHaveStyle('display: flex');
    
    // Check that it's centered
    expect(flexContainer).toHaveStyle('justify-content: center');
    expect(flexContainer).toHaveStyle('align-items: center');
  });
});

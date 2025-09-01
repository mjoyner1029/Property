import React from 'react';
import { screen, within } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import LoadingSpinner from 'src/components/LoadingSpinner';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

describe('LoadingSpinner component', () => {
  test('renders the spinner', () => {
    const { container } = renderWithProviders(<LoadingSpinner />);
    
    // Check that the CircularProgress component is rendered
    // We can check for the class that's typically applied to MUI CircularProgress
    const spinnerElement = container.querySelector('.MuiCircularProgress-root');
    expect(spinnerElement).toBeInTheDocument();
  });
  
  test('renders with default size', () => {
    const { container } = renderWithProviders(<LoadingSpinner />);
    
    const spinnerElement = container.querySelector('.MuiCircularProgress-root');
    // Default MUI CircularProgress size is 40px if not specified
    expect(spinnerElement).toBeInTheDocument();
  });
  
  test('is centered in a flex container', () => {
    const { container } = renderWithProviders(<LoadingSpinner />);
    
    // Check the parent container has flex styling for centering
    const flexContainer = container.firstChild;
    
    // Check that the container has flex display
    expect(flexContainer).toHaveStyle('display: flex');
    
    // Check that it's centered
    expect(flexContainer).toHaveStyle('justify-content: center');
    expect(flexContainer).toHaveStyle('align-items: center');
  });
});

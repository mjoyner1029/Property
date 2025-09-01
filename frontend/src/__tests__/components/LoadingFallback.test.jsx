import React from 'react';
import { screen, within } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import LoadingFallback from 'src/components/LoadingFallback';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

describe('LoadingFallback component', () => {
  test('renders the fallback loading state', () => {
    const { container } = renderWithProviders(<LoadingFallback />);
    
    // Check that the CircularProgress component is rendered
    const spinnerElement = container.querySelector('.MuiCircularProgress-root');
    expect(spinnerElement).toBeInTheDocument();
  });
  
  test('renders in a centered container', () => {
    const { container } = renderWithProviders(<LoadingFallback />);
    
    // Check the container styling
    const containerElement = container.firstChild;
    
    // Should have flex styling for centering
    expect(containerElement).toHaveStyle('display: flex');
    expect(containerElement).toHaveStyle('justify-content: center');
    expect(containerElement).toHaveStyle('align-items: center');
  });
  
  test('has appropriate sizing for a fallback loader', () => {
    const { container } = renderWithProviders(<LoadingFallback />);
    
    // Check that the container takes up a reasonable amount of space
    const containerElement = container.firstChild;
    
    // Fallback loaders typically take full height to fill the space of the component being loaded
    expect(containerElement).toHaveStyle('min-height: 200px');
  });
});

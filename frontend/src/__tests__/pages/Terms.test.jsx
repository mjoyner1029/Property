import React from 'react';
import { screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import Terms from 'src/pages/Terms';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

describe('Terms Page', () => {
  test('renders terms page with title', () => {
    renderWithProviders(<Terms />);
    
    // Check for Terms title and content
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText(/Terms and conditions page content will be added soon/i)).toBeInTheDocument();
  });
});

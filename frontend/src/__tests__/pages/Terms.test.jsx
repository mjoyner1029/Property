import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Terms from '../../pages/Terms';

describe('Terms Page', () => {
  test('renders terms page with title', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );
    
    // Check for Terms title and content
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText(/Terms and conditions page content will be added soon/i)).toBeInTheDocument();
  });
});

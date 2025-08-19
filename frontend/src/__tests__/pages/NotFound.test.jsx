import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../../pages/NotFound';

describe('NotFound Page', () => {
  test('renders 404 page with correct heading and message', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    // Check for 404 heading
    expect(screen.getByText('404')).toBeInTheDocument();
    
    // Check for explanatory message
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    
    // Check for additional message
    expect(screen.getByText(/The page you're looking for doesn't exist or has been moved./i)).toBeInTheDocument();
  });
});

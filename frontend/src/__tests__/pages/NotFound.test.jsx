import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from 'src/pages/NotFound';

describe('NotFound Page', () => {
  test('renders 404 page with correct heading and message', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    // Check for 404 heading using role
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    
    // Check for explanatory message using role
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
    
    // Check for additional message using test ID or a more specific selector
    const messageContainer = screen.getByText(/The page you're looking for doesn't exist or has been moved./i);
    expect(messageContainer).toBeInTheDocument();
  });
});

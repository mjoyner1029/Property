import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Unauthorized from 'src/pages/Unauthorized';

describe('Unauthorized Page', () => {
  test('renders unauthorized page with correct heading', () => {
    render(
      <MemoryRouter>
        <Unauthorized />
      </MemoryRouter>
    );

    // Check for unauthorized heading or message
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to view this page/i)).toBeInTheDocument();
  });
});

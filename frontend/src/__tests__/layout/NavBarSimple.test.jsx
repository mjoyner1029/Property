import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Create a basic test for a simple navigation component
describe('Simple Navigation Component', () => {
  const SimpleNav = () => (
    <nav>
      <ul>
        <li>Dashboard</li>
        <li>Properties</li>
      </ul>
    </nav>
  );

  test('renders navigation links', () => {
    render(
      <MemoryRouter>
        <SimpleNav />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });
});

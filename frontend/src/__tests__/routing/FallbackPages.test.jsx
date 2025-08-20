import React from 'react';
import { screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import NotFound from '../../pages/NotFound';
import Unauthorized from '../../pages/Unauthorized';

describe('Fallback Pages', () => {
  test('renders 404 page', () => {
    renderWithProviders(
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>,
      { route: '/nope' }
    );
    
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    expect(screen.getByText(/back to home/i)).toBeInTheDocument();
  });
  
  test('renders unauthorized page', () => {
    renderWithProviders(
      <Unauthorized />
    );
    
    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
  });
});

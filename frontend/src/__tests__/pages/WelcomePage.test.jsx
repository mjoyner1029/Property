import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WelcomePage from 'src/pages/WelcomePage';
import { useAuth } from 'src/context/AuthContext';

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('WelcomePage', () => {
  beforeEach(() => {
    // Mock useAuth implementation for each test
    useAuth.mockImplementation(() => ({
      user: null
    }));
  });

  test('renders welcome page with welcome message', () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );

    // Check for welcome message
    expect(screen.getByText(/Welcome to Asset Anchor/i)).toBeInTheDocument();
    
    // Check for progress indicator (for redirection)
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

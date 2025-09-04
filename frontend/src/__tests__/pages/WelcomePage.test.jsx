import React from 'react';
import { screen, render } from '../../../test-utils';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import WelcomePage from 'src/pages/WelcomePage';
import { useAuth } from 'src/context/AuthContext';

// Mock the auth context
jest.mock('src/context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthContext: { Provider: ({ children }) => children }
}));

describe('WelcomePage', () => {
  beforeEach(() => {
    // Mock useAuth implementation for each test
    useAuth.mockImplementation(() => ({
      user: null
    }));
  });

  test('renders welcome page with welcome message', () => {
    render(<WelcomePage />, {
      auth: {
        user: null,
        isAuthenticated: false
      }
    });

    // Check for welcome message
    expect(screen.getByText(/Welcome to Asset Anchor/i)).toBeInTheDocument();
    
    // Check for progress indicator (for redirection)
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

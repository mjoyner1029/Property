import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';
import axios from 'axios';
import ForgotPassword from 'src/pages/ForgotPassword';

// Import renderWithProviders with absolute import
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

// Mock axios since the component uses axios
jest.mock('axios');

// Mock Auth context hook
jest.mock('src/context/AuthContext', () => {
  const actual = jest.requireActual('src/context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      forgotPassword: jest.fn().mockResolvedValue({}),
      loading: false,
      error: null,
    }),
  };
});

// Use renderWithProviders with withRouter=true for ForgotPassword
// since it doesn't include its own router

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.post.mockReset();
  });

  test('renders forgot password form with renderWithProviders', () => {
    // Use renderWithProviders
    const { debug } = renderWithProviders(<ForgotPassword />);
    
    // Debug to see what's actually rendered
    debug();
    
    // More permissive query
    expect(screen.getByText(/forgot password/i, { selector: 'h1, h2, h3, h4, h5, h6' })).toBeInTheDocument(); // Page title
    expect(screen.getByText(/reset password/i, { selector: 'button' })).toBeInTheDocument(); // Button
  });

  test('submits form successfully and shows success message', async () => {
    // Set up the test user
    const user = userEvent.setup();
    
    // Mock successful response
    axios.post.mockResolvedValueOnce({
      data: { message: 'Password reset email sent! Please check your inbox.' }
    });
    
    // Use renderWithProviders
    await act(async () => {
      renderWithProviders(<ForgotPassword />);
    });
    
    // Use more reliable selectors for MUI components
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill in the email using the proper setup method
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
    });
    
    // Submit the form
    await act(async () => {
      await user.click(submitButton);
    });
    
    // Check if axios was called with correct data
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(axios.post).toHaveBeenCalledWith(
        '/api/auth/forgot-password',
        { email: 'test@example.com' }
      );
    });
    
    // Check for success message
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument();
    });
  });

  test('shows error message with invalid email', async () => {
    // Set up the test user
    const user = userEvent.setup();
    
    // Mock error response
    const errorMessage = 'Failed to send reset email. Please try again.';
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage
        }
      }
    });
    
    // Use renderWithProviders
    await act(async () => {
      renderWithProviders(<ForgotPassword />);
    });
    
    // Use more reliable selectors for MUI components
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill in an invalid email
    await act(async () => {
      await user.type(emailInput, 'nonexistent@example.com');
    });
    
    // Submit the form
    await act(async () => {
      await user.click(submitButton);
    });
    
    // Check for error message
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('can submit form with empty email', async () => {
    // Set up the test user
    const user = userEvent.setup();
    
    // Mock error response for empty email
    const errorMessage = 'Failed to send reset email. Please try again.';
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage
        }
      }
    });
    
    // Use renderWithProviders
    await act(async () => {
      renderWithProviders(<ForgotPassword />);
    });
    
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Submit the form without entering email
    await act(async () => {
      await user.click(submitButton);
    });
    
    // Since the component doesn't prevent submission of empty emails,
    // verify that axios was called with an empty email string
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(axios.post).toHaveBeenCalledWith(
        '/api/auth/forgot-password',
        { email: '' }
      );
    });
    
    // Check for error message
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});

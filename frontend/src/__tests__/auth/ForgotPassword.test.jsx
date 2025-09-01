import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';
import ForgotPassword from 'src/auth/ForgotPassword';

// Mock fetch since the component uses fetch instead of axios
global.fetch = jest.fn();

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  test('renders forgot password form', () => {
    renderWithProviders(<ForgotPassword />);
    
    // Using label and role is already good practice
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  test('submits form successfully and shows success message', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Reset link sent' })
    });
    
    renderWithProviders(<ForgotPassword />);
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill in the email
    await userEvent.type(emailInput, 'test@example.com');
    
    // Submit the form
    await userEvent.click(submitButton);
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' })
        })
      );
    });
    
    // Check for success message - use role if possible, or testid if needed
    await waitFor(() => {
      const alertElement = screen.getByRole('alert');
      expect(within(alertElement).getByText(/reset link has been sent/i)).toBeInTheDocument();
    });
  });

  test('shows error message with invalid email', async () => {
    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email not found' })
    });
    
    renderWithProviders(<ForgotPassword />);
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill in an invalid email
    await userEvent.type(emailInput, 'nonexistent@example.com');
    
    // Submit the form
    await userEvent.click(submitButton);
    
    // Check for error message - use role if possible, or testid if needed
    await waitFor(() => {
      const alertElement = screen.getByRole('alert');
      expect(within(alertElement).getByText(/Email not found/i)).toBeInTheDocument();
    });
  });

  test('shows validation error when email is empty', async () => {
    renderWithProviders(<ForgotPassword />);
    
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Submit the form without entering email
    await userEvent.click(submitButton);
    
    // Check for validation error - use form field error message
    const formField = screen.getByRole('textbox', { name: /email/i }).closest('div');
    expect(within(formField).getByText(/Email is required/i)).toBeInTheDocument();
    
    // Fetch should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

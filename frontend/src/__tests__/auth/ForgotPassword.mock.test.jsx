import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { BrowserRouter } from 'react-router-dom';
import theme from '../../theme';
import ForgotPassword from '../../pages/auth/ForgotPassword';

// Mock Auth context hook
// Mock API service
jest.mock('../../services/api', () => ({
  forgotPassword: jest.fn().mockResolvedValue({}),
}));

describe('ForgotPassword Component with Hook Mocking', () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <ForgotPassword />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  test('renders forgot password form', () => {
    renderComponent();
    
    // Title and description should be visible
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    
    // Form elements should be present
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    
    // Back to login link should be present
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  test('submits form successfully and shows success message', async () => {
    renderComponent();
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Type email and submit
    await act(async () => {
      await userEvent.type(emailInput, 'test@example.com');
    });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText(/reset link has been sent/i)).toBeInTheDocument();
    });
  });
});

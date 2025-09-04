import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';
import VerifyEmail from 'src/pages/VerifyEmail';

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  
  return {
    ...originalModule,
    useNavigate: () => jest.fn(),
    useParams: () => ({ token: 'valid-verification-token' }),
    Link: function Link(props) {
      return <a href={props.to} {...props}>{props.children}</a>;
    }
  };
});

// Mock axios
jest.mock('axios', () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    create: () => ({
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn()
    })
  };
});

describe('VerifyEmail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    // Use fake timers
    jest.useFakeTimers();
    
    // Mock axios to delay response
    axios.get.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    renderWithProviders(<VerifyEmail />);
    
    // Should show loading state initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
    
    // Cleanup
    jest.useRealTimers();
  });

  test('shows success message on successful verification', async () => {
    // Mock successful verification - use get instead of post
    axios.get.mockResolvedValueOnce({ data: { success: true, message: "Email verified successfully" } });
    
    renderWithProviders(<VerifyEmail />);
    
    // Wait for API call to be made first
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(axios.get).toHaveBeenCalledWith(`/api/verify/valid-verification-token`);
    });
    
    // Then wait for success message using findBy for async rendering
    const successMessage = await screen.findByText(/email verified successfully/i);
    expect(successMessage).toBeInTheDocument();
  });

  test('shows error message on verification failure', async () => {
    // Mock failed verification - use get not post
    axios.get.mockRejectedValueOnce({ 
      response: { data: { message: 'Invalid verification token' } }
    });
    
    renderWithProviders(<VerifyEmail />);
    
    // Wait for API call to be attempted
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Then wait for error message to appear using findBy
    const errorMessage = await screen.findByText(/verification failed/i);
    expect(errorMessage).toBeInTheDocument();
    
    // Should show resend verification link - can use getBy since it should be in the DOM now
    expect(screen.getByRole('link', { name: /resend verification/i })).toBeInTheDocument();
  });

  test('handles resending verification email', async () => {
    // The VerifyEmail component just has a link to resend verification, not the actual form
    // So we'll simplify this test to just check navigation
    axios.get.mockRejectedValueOnce({ 
      response: { data: { message: 'Invalid verification token' } }
    });
    
    renderWithProviders(<VerifyEmail />);
    
    // Wait for API call to be attempted
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Wait for error state using findBy
    const errorElement = await screen.findByText(/verification failed/i);
    expect(errorElement).toBeInTheDocument();
    
    // Check that the resend link exists and links to the correct page
    const resendLink = screen.getByRole('link', { name: /resend verification/i });
    expect(resendLink).toHaveAttribute('href', '/resend-verification');
  });

  test('handles back to login navigation', async () => {
    // Same as above, the VerifyEmail component just has navigation links
    axios.get.mockRejectedValueOnce({ 
      response: { data: { message: 'Invalid verification token' } }
    });
    
    renderWithProviders(<VerifyEmail />);
    
    // Wait for API call to be attempted first
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Wait for error state using findBy
    const errorElement = await screen.findByText(/verification failed/i);
    expect(errorElement).toBeInTheDocument();
    
    // Check that the login link exists and links to the correct page
    const loginLink = await screen.findByRole('link', { name: /back to login/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('navigates to login after success', async () => {
    // Mock successful verification
    axios.get.mockResolvedValueOnce({ data: { success: true, message: "Email verified successfully" } });
    
    renderWithProviders(<VerifyEmail />);
    
    // Wait for API call to be attempted first
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Wait for success message using findBy
    const successHeading = await screen.findByText('Email Verified!');
    expect(successHeading).toBeInTheDocument();
    
    // Check login link
    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

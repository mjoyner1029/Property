import React from 'react';
import { screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import Login from "../auth/Login";
import axios from 'axios';
import { renderWithProviders } from '../test-utils/renderWithProviders';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test("renders login form", () => {
    renderWithProviders(<Login />);
    
    // Check for form elements using test IDs and labels
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });
  
  test("handles form submission and successful login", async () => {
    const user = userEvent.setup();
    
    // Mock successful login
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'mock-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      }
    });
    
    renderWithProviders(<Login />);
    
    // Fill out the form using userEvent for better interaction simulation
    const email = screen.getByTestId('email-input');
    const password = screen.getByLabelText(/password/i);
    const submitButton = screen.getByTestId('login-button');
    
    await user.type(email, 'test@example.com');
    await user.type(password, 'password123');
    
    // Submit the form
    await user.click(submitButton);
    
    // Check if axios was called with the right data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String), // Allow any URL
        { email: 'test@example.com', password: 'password123', role: 'tenant' }
      );
    });
    
    // Check if navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  test("displays error message on failed login", async () => {
    const user = userEvent.setup();
    
    // Mock failed login
    axios.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } }
    });
    
    renderWithProviders(<Login />);
    
    // Fill out and submit the form
    const email = screen.getByTestId('email-input');
    const password = screen.getByLabelText(/password/i);
    const submitButton = screen.getByTestId('login-button');
    
    await user.type(email, 'wrong@example.com');
    await user.type(password, 'wrongpassword');
    
    await user.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(/Invalid credentials/i);
    });
  });
  
  test("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const passwordField = screen.getByLabelText(/password/i);
    const visibilityToggle = screen.getByTestId('toggle-password-visibility');
    
    // Password should start as hidden
    expect(passwordField).toHaveAttribute('type', 'password');
    
    // Click toggle button to show password
    await user.click(visibilityToggle);
    expect(passwordField).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await user.click(visibilityToggle);
    expect(passwordField).toHaveAttribute('type', 'password');
  });
  
  test("handles form validation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByTestId('login-button');
    
    // Submit empty form
    await user.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    // No API call should have been made
    expect(axios.post).not.toHaveBeenCalled();
  });
});
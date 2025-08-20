import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import Login from "../auth/Login";
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

// We'll use a simple render without the complexity of renderWithProviders 
// since we only need the router for the Login component

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  test("renders login form", () => {
    renderLogin();
    
    // Look for email and password inputs using data-testid
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-password-visibility')).toBeInTheDocument();
    
    // Check for the "Log In" button
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
    
    renderLogin();
    
    // Get form fields by their data-testid
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    
    // Fill out the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Submit the form
    await user.click(loginButton);
    
    // Check if axios was called with the right data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
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
    
    renderLogin();
    
    // Get form fields by their data-testid
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    
    // Fill out the form
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    
    // Submit the form
    await user.click(loginButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
    });
  });
  
  test("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderLogin();
    
    // Find password input and visibility toggle
    const passwordInput = screen.getByTestId('password-input');
    const visibilityToggle = screen.getByTestId('toggle-password-visibility');
    
    // Password should start as hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button to show password
    await user.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await user.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
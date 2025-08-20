import React from 'react';
import { screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import Login from "../auth/Login";
import axios from 'axios';
import { renderWithProviders } from '../test-utils/renderWithProviders';

// Mock axios
jest.mock('axios');

describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test("renders login form", () => {
    renderWithProviders(<Login />);
    
    // Check for form elements using labels/roles
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
  
  test("handles form submission and successful login", async () => {
    // Mock successful login
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'mock-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      }
    });
    
    renderWithProviders(<Login />);
    
    // Fill out the form using userEvent for better interaction simulation
    const email = screen.getByRole('textbox', { name: /email/i });
    const password = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });
    
    await userEvent.type(email, 'test@example.com');
    await userEvent.type(password, 'password123');
    
    // Submit the form
    await userEvent.click(submitButton);
    
    // Check if axios was called with the right data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String), // Allow any URL
        { email: 'test@example.com', password: 'password123', role: 'tenant' }
      );
    });
  });
  
  test("displays error message on failed login", async () => {
    // Mock failed login
    axios.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } }
    });
    
    renderWithProviders(<Login />);
    
    // Fill out and submit the form
    const email = screen.getByRole('textbox', { name: /email/i });
    const password = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });
    
    await userEvent.type(email, 'wrong@example.com');
    await userEvent.type(password, 'wrongpassword');
    
    await userEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
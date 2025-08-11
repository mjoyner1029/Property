import React from 'react';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from "../auth/Login";
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test("renders login form", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Check for form elements
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  test("handles form submission and successful login", async () => {
    // Mock successful login
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'mock-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      }
    });
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText(/email/i), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check if axios was called with the right data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        { email: 'test@example.com', password: 'password123' },
        expect.any(Object)
      );
    });
  });
  
  test("displays error message on failed login", async () => {
    // Mock failed login
    axios.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } }
    });
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Fill out and submit the form
    fireEvent.change(screen.getByPlaceholderText(/email/i), { 
      target: { value: 'wrong@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { 
      target: { value: 'wrongpassword' } 
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
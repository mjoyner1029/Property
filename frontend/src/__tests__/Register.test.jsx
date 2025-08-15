// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Register.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Register from "../auth/Signup";
import axios from 'axios';

jest.mock('axios');

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders registration form", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test("handles registration submission", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: 'Registration successful' }
    });
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/full name/i), { 
      target: { value: 'Test User' } 
    });
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'Password123!' } 
    });
    
    // Check the terms of service box
    fireEvent.click(screen.getByRole('checkbox'));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Check API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/signup'),
        expect.objectContaining({
          full_name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          role: expect.any(String),
          tos_agreed: expect.any(Boolean)
        })
      );
    });
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Profile from "../pages/Profile";
import axios from "axios";

jest.mock("axios");

describe('Profile Component', () => {
  // Mock user data
  const mockUser = {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-123-4567',
    role: 'tenant'
  };
  
  beforeEach(() => {
    // Mock auth context
    jest.spyOn(require('../context/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    });
    
    // Mock API calls
    axios.get.mockResolvedValue({ data: mockUser });
    axios.put.mockResolvedValue({ data: mockUser });
  });
  
  test("renders profile with user data", async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Profile />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Check for profile title
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    
    // Check for user data
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Jane Doe/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/jane@example.com/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/555-123-4567/i)).toBeInTheDocument();
    });
  });
  
  test("handles profile update", async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Profile />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Jane Doe/i)).toBeInTheDocument();
    });
    
    // Update name field
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check if API was called with updated data
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/users/'),
        expect.objectContaining({ name: 'Jane Smith' }),
        expect.any(Object)
      );
    });
    
    // Check for success message
    expect(screen.getByText(/profile updated/i)).toBeInTheDocument();
  });
});
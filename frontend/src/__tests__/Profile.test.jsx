import React from 'react';
import { screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import Profile from "../pages/Profile";
import axios from "axios";
import { renderWithProviders } from '../test-utils/renderWithProviders';

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
    renderWithProviders(<Profile />, { 
      providerProps: { 
        initialUser: mockUser 
      } 
    });
    
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
    renderWithProviders(<Profile />, { 
      providerProps: { 
        initialUser: mockUser 
      } 
    });
    
    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Jane Doe/i)).toBeInTheDocument();
    });
    
    // Update name field
    const nameInput = screen.getByRole('textbox', { name: /name/i });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Jane Smith');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
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
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
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-123-4567',
    role: 'tenant'
  };
  
  beforeEach(() => {
    // Setup localStorage mock
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockUser));
    Storage.prototype.setItem = jest.fn();
    
    // Mock auth context
    jest.spyOn(require('../context/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    });
    
    // Mock API calls
    axios.get.mockResolvedValue({ data: mockUser });
    axios.put.mockResolvedValue({ data: mockUser });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("renders profile with user data", async () => {
    await waitFor(() => {
      renderWithProviders(<Profile />);
    });
    
    // Check for profile title
    await waitFor(() => {
      expect(screen.getByText(/My Profile/i)).toBeInTheDocument();
    });
    
    // Check for user data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    });
  });
  
  test("handles profile update", async () => {
    const user = userEvent.setup();
    
    await waitFor(() => {
      renderWithProviders(<Profile />);
    });
    
    // Profile should be loaded immediately with localStorage data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    });
    
    // Get form fields
    const nameInput = screen.getByDisplayValue('Jane Doe');
    
    // Wrap all interactions in waitFor to handle act() warnings
    await waitFor(async () => {
      // Change name
      await user.clear(nameInput);
    });
    
    await waitFor(async () => {
      await user.type(nameInput, 'Jane Smith');
    });
    
    // Submit form
    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /save changes/i }));
    });
    
    // Check if localStorage was updated
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user', 
        expect.stringContaining('Jane Smith')
      );
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
    });
  });
});
import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import Profile from "../pages/Profile";
import axios from "axios";
import { renderWithProviders } from '../test-utils/renderWithProviders';
import { withLocalStorage } from '../test-utils/mockLocalStorage';

describe('Profile Component', () => {
  // Mock user data
  const mockUser = {
    id: 1,
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-123-4567',
    role: 'tenant'
  };
  
  let localStorage;
  
  beforeEach(() => {
    // Setup localStorage with proper implementation
    localStorage = withLocalStorage();
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Mock API calls
    axios.get.mockResolvedValue({ data: mockUser });
    axios.put.mockResolvedValue({ data: mockUser });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test("renders profile with user data", async () => {
    renderWithProviders(<Profile />);
    
    // Check for profile title
    expect(screen.getByText(/My Profile/i)).toBeInTheDocument();
    
    // Check for user data (data-testid would be better here)
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(nameInput.value).toBe('Jane Doe');
      expect(emailInput.value).toBe('jane@example.com');
    });
  });
  
  test("handles profile update", async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<Profile />);
    
    // Wait for inputs to be populated
    let nameInput;
    await waitFor(() => {
      nameInput = screen.getByLabelText(/Full Name/i);
      expect(nameInput.value).toBe('Jane Doe');
    });
    
    // Change name using proper userEvent patterns
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Smith');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
    });
    
    // Verify localStorage was updated with the new name
    const savedUser = JSON.parse(localStorage.getItem('user'));
    expect(savedUser.full_name).toBe('Jane Smith');
  });
});
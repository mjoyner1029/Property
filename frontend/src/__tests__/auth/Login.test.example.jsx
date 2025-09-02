// frontend/src/__tests__/auth/Login.test.example.jsx
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "src/test/utils/renderWithProviders";
import Login from "src/pages/Login";

// Mock useNavigate at the top level
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the login form", () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /(log in|sign in|login)/i })).toBeInTheDocument();
  });

  it("handles login submission with loading state and navigation", async () => {
    // Create mock login function that sets loading state then resolves
    const mockLogin = jest.fn().mockImplementation(async () => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ id: '123', onboarding_complete: true });
        }, 100);
      });
    });

    // Setup initial auth state with loading false
    let loadingState = false;
    const authMock = {
      loading: loadingState,
      user: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: jest.fn(),
      refresh: jest.fn(),
      error: null
    };

    // Setup auth mock that will change loading state during login
    const mockAuthWithLoadingChange = {
      ...authMock,
      login: async (credentials) => {
        // Update loading state to true during login
        authMock.loading = true;
        const result = await mockLogin(credentials);
        // Reset loading state after login completes
        authMock.loading = false;
        return result;
      }
    };
    
    // Render with our custom auth mock
    renderWithProviders(<Login />, {
      auth: mockAuthWithLoadingChange
    });
    
    // Find form elements
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    
    // Type in credentials using global.user
    await user.type(email, 'test@example.com');
    await user.type(password, 'secret123');
    
    // Find and submit the form
    const submit = screen.getByRole('button', { name: /(log in|sign in|login)/i });
    
    // Click submit button
    await user.click(submit);
    
    // Verify button is disabled during loading
    expect(submit).toBeDisabled();
    
    // Wait for navigation to happen after login completes
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
    
    // Verify login was called with the correct parameters
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret123',
      role: 'tenant' // Default portal type
    });
  });

  it("shows error message when login fails", async () => {
    // Create mock login function that rejects
    const mockLoginError = jest.fn().mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } }
    });
    
    renderWithProviders(<Login />, {
      auth: {
        loading: false,
        user: null,
        isAuthenticated: false,
        login: mockLoginError,
        logout: jest.fn(),
        refresh: jest.fn(),
        error: null
      }
    });
    
    // Fill out the form
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    await user.type(email, 'wrong@example.com');
    await user.type(password, 'wrongpassword');
    
    // Submit form
    const submit = screen.getByRole('button', { name: /(log in|sign in|login)/i });
    await user.click(submit);
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to login/i)).toBeInTheDocument();
    });
  });
});

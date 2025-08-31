// frontend/src/__tests__/auth/Login.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// Import from shared mocks
import { navigateMock } from "../../test/mocks/router";
import { loginMock, isAuthenticatedMock, AuthContextMock } from "../../test/mocks/auth";

// Import after mocks
import Login from "../../pages/Login";

// Helper: find the submit button regardless of label variants
const getSubmitButton = () =>
  screen.getByRole("button", { name: /(sign in|log in|login)/i });

describe("Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations if needed
    isAuthenticatedMock.mockImplementation(() => false);
    AuthContextMock.loading = false;
    AuthContextMock.user = null;
  });

  it("renders the login form", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    loginMock.mockResolvedValueOnce({ success: true });
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Fill in form fields
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    
    // Submit form
    await userEvent.click(getSubmitButton());
    
    // Verify login was called with correct params
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows an error message when login fails", async () => {
    loginMock.mockResolvedValueOnce({ 
      success: false, 
      message: "Invalid credentials" 
    });
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Fill in form fields
    await userEvent.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpassword");
    
    // Submit form
    await userEvent.click(getSubmitButton());
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("redirects to dashboard if already authenticated", () => {
    isAuthenticatedMock.mockImplementation(() => true);
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Verify redirect was triggered
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("disables form submission while loading", async () => {
    AuthContextMock.loading = true;
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Check that button is disabled
    expect(getSubmitButton()).toBeDisabled();
  });
});

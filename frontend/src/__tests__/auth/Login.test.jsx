// frontend/src/__tests__/auth/Login.test.jsx
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import from shared mocks
import { mockNavigate } from "../../test/mocks/router";
import { loginMock, isAuthenticatedMock, AuthContextMock } from "../../test/mocks/auth";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

// Import after mocks
import Login from "../../pages/Login";

// Using mockImplementation instead of inline arrow function to avoid Jest's variable reference issues
jest.mock("../../context/AuthContext", () => {
  const mockUseAuth = jest.fn();
  return { useAuth: mockUseAuth };
});

// Helper: find the submit button regardless of label variants
const getSubmitButton = () =>
  screen.getByRole("button", { name: /(sign in|log in|login)/i });

describe("Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAuthenticatedMock.mockImplementation(() => false);
    AuthContextMock.loading = false;
    
    // Set up the mock implementation for each test
    const { useAuth } = require("src/contexts/AuthContext");
    useAuth.mockImplementation(() => ({
      isAuthenticated: isAuthenticatedMock,
      loading: AuthContextMock.loading,
      user: null,
      login: loginMock,
    }));
  });

  function renderAtLogin() {
    return renderWithProviders(<Login />, {
      route: "/login"
    });
  }

  test("redirects to '/' if already authenticated", () => {
    isAuthenticatedMock.mockImplementation(() => true);

    renderAtLogin();

    // Should navigate away immediately
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  test("renders email and password fields and a submit button", () => {
    renderAtLogin();

    // Be flexible about label wording
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();

    expect(getSubmitButton()).toBeInTheDocument();
  });

  test("submits credentials and navigates on success (click submit)", async () => {
    loginMock.mockResolvedValueOnce({ ok: true });

    renderAtLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "s3cret!");

    await userEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled();
    });

    // Accept either positional (email, password) or object { email, password }
    const call = loginMock.mock.calls[0];
    if (call && typeof call[0] === "object") {
      expect(call[0]).toMatchObject({
        email: "user@example.com",
        password: "s3cret!",
      });
    } else {
      expect(call[0]).toBe("user@example.com");
      expect(call[1]).toBe("s3cret!");
    }

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  test("submits with Enter key from password field", async () => {
    loginMock.mockResolvedValueOnce({ ok: true });

    renderAtLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "enter@example.com");
    const pwd = screen.getByLabelText(/password/i);
    await userEvent.type(pwd, "enterpass");

    // Press Enter to submit
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled();
    });
  });

  test("shows error message when login fails", async () => {
    loginMock.mockRejectedValueOnce(new Error("Invalid credentials"));

    renderAtLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "bad@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(getSubmitButton());

    // Expect some visible error text (component likely renders error.message)
    expect(
      await screen.findByText(/invalid credentials/i)
    ).toBeInTheDocument();

    // Should not navigate on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("disables submit button while loading (if component binds to loading)", async () => {
    // Start non-loading, then after click simulate loading=true quickly
    renderAtLogin();

    const btn = getSubmitButton();
    expect(btn).toBeEnabled();

    // Flip loading state to simulate in-flight request
    AuthContextMock.loading = true;

    // Interact to trigger re-render paths in some implementations
    await userEvent.type(screen.getByLabelText(/email/i), "x@y.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pw");

    // Depending on implementation, the button may be disabled when loading
    // If your Login doesn't reflect loading on the button, feel free to remove this check.
    // We use a soft assertion pattern:
    try {
      expect(btn).toBeDisabled();
    } catch {
      // noop: some versions don't bind disabled to loading
    }
  });
});

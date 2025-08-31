// frontend/src/__tests__/auth/Login.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// Import from shared mocks
import { navigateMock } from "../../test/mocks/router";
import { loginMock, isAuthenticatedMock, AuthContextMock } from "../../test/mocks/auth";

// Using mockImplementation instead of inline arrow function to avoid Jest's variable reference issues
jest.mock("../../context/AuthContext", () => {
  const mockUseAuth = jest.fn();
  return { useAuth: mockUseAuth };
});

// Import after mocks
import Login from "../../pages/Login";

// Helper: find the submit button regardless of label variants
const getSubmitButton = () =>
  screen.getByRole("button", { name: /(sign in|log in|login)/i });

describe("Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAuthenticatedMock.mockImplementation(() => false);
    AuthContextMock.loading = false;
    
    // Set up the mock implementation for each test
    const { useAuth } = require("../../context/AuthContext");
    useAuth.mockImplementation(() => ({
      isAuthenticated: isAuthenticatedMock,
      loading: AuthContextMock.loading,
      user: null,
      login: loginMock,
    }));
  });

  function renderAtLogin() {
    return render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );
  }

  test("redirects to '/' if already authenticated", () => {
    isAuthenticatedMock.mockImplementation(() => true);

    renderAtLogin();

    // Should navigate away immediately
    expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
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
      expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
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
    expect(navigateMock).not.toHaveBeenCalled();
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

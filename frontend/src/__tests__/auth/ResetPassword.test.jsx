// frontend/src/__tests__/auth/PasswordReset.test.jsx
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "src/test/utils/renderWithProviders";

// We assume your component lives at src/pages/ResetPassword.jsx
import ResetPassword from "src/pages/ResetPassword";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => {
    const mock = require("src/test/mocks/router");
    return mock.mockNavigate;
  },
  // Provide a stable token via useSearchParams
  useSearchParams: () => [
    {
      get: (key) => (key === "token" ? "valid-token-123" : null),
    },
  ],
}));

// Simple axios mock
jest.mock("axios");

describe("ResetPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("validates token before showing the form (initial loading UI)", () => {
    // Make token validation hang so we can assert loading state
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    renderWithProviders(<ResetPassword />);

    // Should show a spinner while validating token
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("renders the reset form after token is validated", async () => {
    axios.get.mockResolvedValueOnce({ data: { valid: true } });

    renderWithProviders(<ResetPassword />);

    // After validation, form should appear
    await waitFor(() => {
      expect(
        screen.getByText(/reset your password/i)
      ).toBeInTheDocument();
    });

    // Fields + submit
    expect(
      screen.getAllByLabelText(/new password/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByLabelText(/confirm new password/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset password/i })
    ).toBeInTheDocument();

    // Token validation endpoint was called with token appended in URL
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/validate-reset-token\/.+/)
    );
  });

  test("prevents submit when passwords do not match", async () => {
    axios.get.mockResolvedValueOnce({ data: { valid: true } });

    renderWithProviders(<ResetPassword />);

    await screen.findByText(/reset your password/i);

    const newPw = screen.getAllByLabelText(/new password/i)[0];
    const confirm = screen.getByLabelText(/confirm new password/i);
    await userEvent.type(newPw, "Password123!");
    await userEvent.type(confirm, "Different123!");

    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i })
    );

    // Expect a mismatch message (flexible to different copy)
    await waitFor(() => {
      expect(
        screen.getByText(/passwords.*match/i)
      ).toBeInTheDocument();
    });

    // Should NOT call the reset API
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("blocks submit for clearly too-short passwords (no specific error text required)", async () => {
    axios.get.mockResolvedValueOnce({ data: { valid: true } });

    renderWithProviders(<ResetPassword />);

    await screen.findByText(/reset your password/i);

    const newPw = screen.getAllByLabelText(/new password/i)[0];
    const confirm = screen.getByLabelText(/confirm new password/i);

    // Extremely short to ensure any reasonable validator fails
    await userEvent.type(newPw, "a");
    await userEvent.type(confirm, "a");

    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i })
    );

    // We don't rely on exact error copy—just ensure no API call is made
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  test("successfully resets password and navigates to login", async () => {
    axios.get.mockResolvedValueOnce({ data: { valid: true } });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    jest.useFakeTimers();

    renderWithProviders(<ResetPassword />);

    await screen.findByText(/reset your password/i);

    const newPw = screen.getAllByLabelText(/new password/i)[0];
    const confirm = screen.getByLabelText(/confirm new password/i);

    await userEvent.type(newPw, "ValidPass123!");
    await userEvent.type(confirm, "ValidPass123!");

    await userEvent.click(
      screen.getByRole("button", { name: /reset password/i })
    );

    // API receives token + password
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/auth/reset-password",
        { token: "valid-token-123", password: "ValidPass123!" }
      );
    });

    // A success message should show
    await waitFor(() => {
      expect(
        screen.getByText(/password reset successful/i)
      ).toBeInTheDocument();
    });

    // If your component redirects after a short delay, advance timers
    jest.runAllTimers();

    // We expect navigation to login (adjust if your app uses a different route)
    expect(mockNavigate).toHaveBeenCalledWith("/login");

    jest.useRealTimers();
  });

  test("shows an error when token validation fails", async () => {
    const err = new Error("Invalid token");
    err.response = { data: { message: "Invalid token" } };
    axios.get.mockRejectedValueOnce(err);

    renderWithProviders(<ResetPassword />);

    // Initial spinner
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Error should appear
    const errorEl = await screen.findByText(/invalid|expired/i);
    expect(errorEl).toBeInTheDocument();

    // Verify token validation was attempted
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/validate-reset-token\/.+/)
    );
  });
});

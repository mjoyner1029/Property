// frontend/src/__tests__/auth/LoginSimplified.test.jsx
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { getInputByName } from 'src/test/utils/muiTestUtils';
import { act } from "react-dom/test-utils";

// Import from shared mocks
import { loginMock, isAuthenticatedMock, AuthContextMock } from "../../test/mocks/auth";

// Import after mocks
import Login from "../../pages/Login";

// Mock useAuth instead of mocking AuthContext
jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Create a theme for MUI
const theme = createTheme();

// Helper: find the submit button regardless of label variants
const getSubmitButton = () =>
  screen.getByRole("button", { name: /(sign in|log in|login)/i });

// Simplified render function
const renderLogin = (options = {}) => {
  const { route = "/login" } = options;
  
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <Login />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe("Login page (simplified)", () => {
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

  // Update this test to match what the Login component really does
  test("continues to show login form even when authenticated", async () => {
    isAuthenticatedMock.mockImplementation(() => true);

    await act(async () => {
      renderLogin();
    });
    // Check that we still show login elements
    expect(getSubmitButton()).toBeInTheDocument();
  });

  test("renders email and password fields and a submit button", async () => {
    await act(async () => {
      renderLogin();
    });
    
    expect(getInputByName("email")).toBeInTheDocument();
    expect(getInputByName("password")).toBeInTheDocument();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  test("submits credentials and navigates on success (click submit)", async () => {
    await act(async () => {
      renderLogin();
    });
    
    const emailInput = getInputByName("email");
    const passwordInput = getInputByName("password");
    const submitButton = getSubmitButton();
    
    await act(async () => {
      await userEvent.type(emailInput, "user@example.com");
    });
    
    await act(async () => {
      await userEvent.type(passwordInput, "password123");
    });
    
    await act(async () => {
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled();
      const lastCall = loginMock.mock.lastCall[0];
      expect(lastCall.email).toBe("user@example.com");
      expect(lastCall.password).toBe("password123");
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});

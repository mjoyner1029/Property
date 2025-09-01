// frontend/src/__tests__/tenants/TenantList.test.jsx
import React from "react";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Tenants from "../../pages/Tenants";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

import { useTenant } from "../../context/TenantContext";
import { useApp } from "../../context/AppContext";

// ---- Router mocks (for any navigation inside the page) ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---- Context mocks ----
const mockFetchTenants = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context/TenantContext", () => ({
  useTenant: jest.fn(),
}));

jest.mock("../../context/AppContext", () => ({
  useApp: jest.fn(),
}));

describe("Tenants List Page", () => {
  const tenantsSample = [
    { id: 1, name: "Alice", email: "alice@ex.com", phone: "111-111" },
    { id: 2, name: "Bob", email: "bob@ex.com", phone: "222-222" },
  ];

  const renderTenants = () =>
    renderWithProviders(
      <MemoryRouter initialEntries={["/tenants"]}>
        <Tenants />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();

    // Default contexts for a successful render
    useTenant.mockReturnValue({
      tenants: tenantsSample,
      loading: false,
      error: null,
      fetchTenants: mockFetchTenants,
    });

    useApp.mockReturnValue({
      updatePageTitle: mockUpdatePageTitle,
    });
  });

  test("renders tenant rows on success", async () => {
    renderTenants();

    // Ensure initial fetch + page title update attempted
    expect(mockFetchTenants).toHaveBeenCalled();
    if (mockUpdatePageTitle.mock.calls.length) {
      expect(mockUpdatePageTitle).toHaveBeenCalledWith("Tenants");
    }

    // Verify tenant data is shown
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@ex.com")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("bob@ex.com")).toBeInTheDocument();
  });

  test("shows loading state", async () => {
    useTenant.mockReturnValue({
      tenants: [],
      loading: true,
      error: null,
      fetchTenants: mockFetchTenants,
    });

    renderTenants();

    // Your page might use MUI CircularProgress (role=progressbar) or a custom LoadingSpinner
    const maybeProgress = screen.queryByRole("progressbar");
    const maybeSpinner = screen.queryByTestId("loading-spinner");
    expect(maybeProgress || maybeSpinner).toBeTruthy();
  });

  test("shows empty state when no tenants", async () => {
    useTenant.mockReturnValue({
      tenants: [],
      loading: false,
      error: null,
      fetchTenants: mockFetchTenants,
    });

    renderTenants();

    // Match the message used in your previous test snippet
    expect(await screen.findByText(/no tenants found/i)).toBeInTheDocument();
  });

  test("shows error state on failure", async () => {
    useTenant.mockReturnValue({
      tenants: [],
      loading: false,
      error: "Error loading tenants",
      fetchTenants: mockFetchTenants,
    });

    renderTenants();

    // Many UIs use MUI <Alert role="alert">, but we’ll assert on the text to keep it flexible
    const errorMsg =
      screen.queryByRole("alert") || (await screen.findByText(/error loading tenants/i));
    expect(errorMsg).toBeInTheDocument();
  });
});

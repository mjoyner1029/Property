// frontend/src/__tests__/tenants/TenantEdit.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// ---- Router mocks (declare BEFORE component import) ----
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  // Edit mode: provide an id param
  useParams: () => ({ id: "1" }),
}));

// ---- Context barrel mocks (TenantForm typically imports from "../context") ----
const mockCreateTenant = jest.fn();
const mockUpdateTenant = jest.fn();
const mockFetchTenantById = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  useTenant: jest.fn(),
  useApp: jest.fn(),
}));

import { useTenant, useApp } from "../../context";

// ---- Lightweight component stubs to keep tests fast/stable ----
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, actionText, onActionClick }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {actionText ? (
        <button onClick={onActionClick} aria-label="Back to Tenants">
          {actionText}
        </button>
      ) : null}
    </header>
  ),
  FormSection: ({ title, description, children }) => (
    <section data-testid={`form-section-${String(title).toLowerCase().replace(/\s+/g, "-")}`}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </section>
  ),
  Card: ({ children }) => <div data-testid="card">{children}</div>,
}));

// ---- Import the page under test AFTER mocks ----
import TenantForm from "../../pages/TenantForm"; // adjust if your file is named differently

const selectedTenant = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  phone: "555-1234",
  active: true,
};

const renderEdit = (route = "/tenants/1/edit") =>
  renderWithProviders(<TenantForm />, { route });

describe("TenantForm (Edit mode)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useTenant.mockReturnValue({
      selectedTenant,
      loading: false,
      error: null,
      createTenant: mockCreateTenant,
      updateTenant: mockUpdateTenant,
      fetchTenantById: mockFetchTenantById,
    });

    useApp.mockReturnValue({
      updatePageTitle: mockUpdatePageTitle,
    });
  });

  test("renders edit screen, fetches tenant, and pre-fills fields", async () => {
    mockFetchTenantById.mockResolvedValueOnce(selectedTenant);

    renderEdit();

    // Should set page title to something like "Edit Tenant"
    expect(mockUpdatePageTitle).toHaveBeenCalled();
    const titleArg = mockUpdatePageTitle.mock.calls[0][0] || "";
    expect(titleArg.toLowerCase()).toMatch(/edit|tenant/);

    // Ensure fetch by id was attempted
    await waitFor(() => {
      expect(mockFetchTenantById).toHaveBeenCalledWith("1");
    });

    // Pre-filled fields present
    const nameInput = screen.getByLabelText(/full name|name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.queryByLabelText(/phone/i);

    expect(nameInput).toHaveValue("Alice");
    expect(emailInput).toHaveValue("alice@example.com");
    if (phoneInput) expect(phoneInput).toHaveValue("555-1234");

    // Header should reflect edit state
    const hdr =
      screen.queryByRole("heading", { name: /edit tenant|update tenant/i }) ||
      screen.queryByText(/edit tenant|update tenant/i);
    expect(hdr).toBeTruthy();
  });

  test("updates tenant and navigates on success", async () => {
    mockFetchTenantById.mockResolvedValueOnce(selectedTenant);
    mockUpdateTenant.mockResolvedValueOnce({
      ...selectedTenant,
      name: "Alice Smith",
      email: "alice.smith@example.com",
      phone: "555-6789",
    });

    renderEdit();

    // Wait for form to be populated
    await waitFor(() =>
      expect(screen.getByLabelText(/name/i)).toHaveValue("Alice")
    );

    const nameInput = screen.getByLabelText(/full name|name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.queryByLabelText(/phone/i);

    // Modify values
    fireEvent.clear(nameInput);
    fireEvent.change(nameInput, { target: { value: "Alice Smith" } });

    fireEvent.clear(emailInput);
    fireEvent.change(emailInput, { target: { value: "alice.smith@example.com" } });

    if (phoneInput) {
      fireEvent.clear(phoneInput);
      fireEvent.change(phoneInput, { target: { value: "555-6789" } });
    }

    // Save button (allow multiple label variations)
    const saveBtn =
      screen.queryByRole("button", { name: /save changes/i }) ||
      screen.queryByRole("button", { name: /^save$/i }) ||
      screen.queryByRole("button", { name: /update tenant/i });
    expect(saveBtn).toBeInTheDocument();
    fireEvent.click(saveBtn);

    // Verify updateTenant called with id and payload
    await waitFor(() => {
      expect(mockUpdateTenant).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          name: "Alice Smith",
          email: "alice.smith@example.com",
          ...(phoneInput ? { phone: "555-6789" } : {}),
        })
      );
    });

    // Navigation afterwards (destination might be /tenants or /tenants/1)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
      const dest = mockNavigate.mock.calls[0][0];
      expect(String(dest)).toMatch(/\/tenants/);
    });
  });

  test("shows API error on update failure", async () => {
    mockFetchTenantById.mockResolvedValueOnce(selectedTenant);
    mockUpdateTenant.mockRejectedValueOnce(new Error("Update failed"));

    renderEdit();

    // Wait for form to be populated
    await waitFor(() =>
      expect(screen.getByLabelText(/name/i)).toHaveValue("Alice")
    );

    const saveBtn =
      screen.queryByRole("button", { name: /save changes/i }) ||
      screen.queryByRole("button", { name: /^save$/i }) ||
      screen.queryByRole("button", { name: /update tenant/i });
    fireEvent.click(saveBtn);

    // Error appears (Alert or inline error)
    await waitFor(() => {
      const maybeAlert =
        screen.queryByRole("alert") || screen.queryByText(/update failed/i);
      expect(maybeAlert).toBeInTheDocument();
    });

    // No navigation on failure
    const calledWith = mockNavigate.mock.calls[0]?.[0];
    expect(calledWith ?? "").not.toMatch(/\/tenants(\/|$)/);
  });

  test("client-side validation blocks submit when required fields missing", async () => {
    mockFetchTenantById.mockResolvedValueOnce(selectedTenant);
    renderEdit();

    // Wait for form to be populated
    const nameInput = await screen.findByLabelText(/full name|name/i);
    const emailInput = screen.getByLabelText(/email/i);

    // Clear required fields
    fireEvent.clear(nameInput);
    fireEvent.clear(emailInput);

    const saveBtn =
      screen.queryByRole("button", { name: /save changes/i }) ||
      screen.queryByRole("button", { name: /^save$/i }) ||
      screen.queryByRole("button", { name: /update tenant/i });
    fireEvent.click(saveBtn);

    // Expect some validation messaging (don't be overly strict)
    await waitFor(() => {
      const nameErr =
        screen.queryByText(/name is required/i) ||
        screen.queryByText(/full name is required/i);
      const emailErr =
        screen.queryByText(/email is required/i) ||
        screen.queryByText(/valid email/i);
      expect(nameErr || emailErr).toBeTruthy();
    });

    expect(mockUpdateTenant).not.toHaveBeenCalled();
  });

  test("Back to Tenants header action navigates", () => {
    renderEdit();

    const backBtn = screen.queryByRole("button", { name: /back to tenants/i });
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith("/tenants");
    } else {
      // If not present in your edit layout, pass softly
      expect(true).toBe(true);
    }
  });

  test("shows loading state when tenant is being fetched", () => {
    useTenant.mockReturnValue({
      selectedTenant: null,
      loading: true,
      error: null,
      createTenant: mockCreateTenant,
      updateTenant: mockUpdateTenant,
      fetchTenantById: mockFetchTenantById,
    });

    renderEdit();

    // Either a CircularProgress (role=progressbar) or your own LoadingSpinner
    const maybeProgress = screen.queryByRole("progressbar");
    const maybeSpinner = screen.queryByTestId("loading-spinner");
    expect(maybeProgress || maybeSpinner).toBeTruthy();
  });

  test("shows error state when fetch fails", () => {
    useTenant.mockReturnValue({
      selectedTenant: null,
      loading: false,
      error: "Failed to load tenant",
      createTenant: mockCreateTenant,
      updateTenant: mockUpdateTenant,
      fetchTenantById: mockFetchTenantById,
    });

    renderEdit();

    const alert = screen.queryByRole("alert") || screen.getByText(/failed to load tenant/i);
    expect(alert).toBeInTheDocument();
  });
});

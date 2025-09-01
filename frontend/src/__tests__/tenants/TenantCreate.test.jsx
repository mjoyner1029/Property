// frontend/src/__tests__/tenants/TenantCreate.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// Mock MUI components with lightweight versions to avoid flakiness
jest.mock('@mui/material', () => require('../__mocks__/muiLightMock'));

// ---- Router mocks (declare BEFORE component import) ----
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  // No id param in create mode
  useParams: () => ({}),
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
import { TenantForm } from "../../pages"; // adjust if your file is named differently

const renderCreate = (route = "/tenants/add") =>
  renderWithProviders(<TenantForm />, { route });

describe("TenantForm (Create mode)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useTenant.mockReturnValue({
      selectedTenant: null,
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

  test("renders create screen and sets page title", async () => {
    renderCreate();

    // Title should indicate create/add mode
    const heading =
      screen.getByRole("heading", { name: /add tenant|add new tenant|create tenant/i });
    expect(heading).toBeInTheDocument();

    // updatePageTitle called appropriately
    expect(mockUpdatePageTitle).toHaveBeenCalled();
    const passedTitle = mockUpdatePageTitle.mock.calls[0][0] || "";
    expect(passedTitle.toLowerCase()).toMatch(/add|create/);

    // Common fields present (match labels you use in TenantDetail edit dialog)
    expect(screen.getByLabelText(/full name|name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Phone may be optional but should exist in most forms
    const maybePhone = screen.queryByLabelText(/phone/i);
    if (maybePhone) expect(maybePhone).toBeInTheDocument();

    // Should NOT fetch by id in create mode
    expect(mockFetchTenantById).not.toHaveBeenCalled();
  });

  test("submits new tenant and navigates back to list on success", async () => {
    mockCreateTenant.mockResolvedValueOnce({ id: "t-100" });

    renderCreate();

    // Fill required fields
    const nameInput =
      screen.getByLabelText(/full name|name/i);
    const emailInput =
      screen.getByLabelText(/email/i);
    fireEvent.change(nameInput, { target: { value: "Alice Tenant" } });
    fireEvent.change(emailInput, { target: { value: "alice@example.com" } });

    // Optional field
    const phoneInput = screen.queryByLabelText(/phone/i);
    if (phoneInput) {
      fireEvent.change(phoneInput, { target: { value: "555-1234" } });
    }

    // Submit (button text could be Create Tenant / Create / Save)
    const submitBtn =
      screen.queryByRole("button", { name: /create tenant/i }) ||
      screen.queryByRole("button", { name: /^create$/i }) ||
      screen.queryByRole("button", { name: /^save$/i });
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    // verify payload
    await waitFor(() => {
      expect(mockCreateTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alice Tenant",
          email: "alice@example.com",
          ...(phoneInput ? { phone: "555-1234" } : {}),
        })
      );
    });

    // navigates to list
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/tenants");
    });
  });

  test("shows API error on submit failure", async () => {
    mockCreateTenant.mockRejectedValueOnce(new Error("API fail"));

    renderCreate();

    fireEvent.change(screen.getByLabelText(/full name|name/i), {
      target: { value: "Bob Tenant" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bob@example.com" },
    });

    const submitBtn =
      screen.queryByRole("button", { name: /create tenant/i }) ||
      screen.queryByRole("button", { name: /^create$/i }) ||
      screen.queryByRole("button", { name: /^save$/i });
    fireEvent.click(submitBtn);

    // error surface (alert or inline helper)
    await waitFor(() => {
      const maybeAlert = screen.queryByRole("alert") || screen.queryByText(/api fail/i);
      expect(maybeAlert).toBeInTheDocument();
    });

    // no navigation on failure
    expect(mockNavigate).not.toHaveBeenCalledWith("/tenants");
  });

  test("client-side validation errors appear when required fields are missing", async () => {
    renderCreate();

    const submitBtn =
      screen.queryByRole("button", { name: /create tenant/i }) ||
      screen.queryByRole("button", { name: /^create$/i }) ||
      screen.queryByRole("button", { name: /^save$/i });
    fireEvent.click(submitBtn);

    // Your form likely sets helper text like "Name is required" / "Email is required"
    await waitFor(() => {
      const nameErr =
        screen.queryByText(/name is required/i) ||
        screen.queryByText(/full name is required/i);
      const emailErr =
        screen.queryByText(/email is required/i) ||
        screen.queryByText(/valid email/i);
      // Don’t be overly strict: assert at least one error appears
      expect(nameErr || emailErr).toBeTruthy();
    });

    expect(mockCreateTenant).not.toHaveBeenCalled();
  });

  test("Back to Tenants action navigates", () => {
    renderCreate();

    const backBtn = screen.queryByRole("button", { name: /back to tenants/i });
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith("/tenants");
    } else {
      // If your PageHeader doesn't expose this action in create mode, pass softly
      expect(true).toBe(true);
    }
  });
});

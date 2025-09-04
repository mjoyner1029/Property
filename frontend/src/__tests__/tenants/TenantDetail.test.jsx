// frontend/src/__tests__/tenants/TenantDetail.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import api from 'src/utils/api';

// Import shared mocks
import { updatePageTitleMock } from "../../test/mocks/pageTitle";
import { getTenantMock, updateTenantMock, deleteTenantMock } from "../../test/mocks/services";

import TenantDetail from "src/pages/TenantDetail";

// Mock the app's axios client module
jest.mock('src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock context hooks used by TenantDetail
jest.mock("../../context", () => {
  return {
    useTenant: () => ({
      getTenant: require('src/test/mocks/services').getTenantMock,
      updateTenant: require('src/test/mocks/services').updateTenantMock,
      deleteTenant: require('src/test/mocks/services').deleteTenantMock,
    }),
    useApp: () => ({
      updatePageTitle: require('src/test/mocks/pageTitle').updatePageTitleMock,
    }),
  };
});

// Use real router, but stub useNavigate/useParams to keep test simple
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useNavigate: () => jest.fn(),
  };
});

const sampleTenant = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  phone: "555-1234",
  active: true,
  property: "Sunset Apartments",
  unit: "A-101",
  lease_start: null,
  lease_end: null,
};

describe("TenantDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API mock with mock data
    api.get.mockResolvedValueOnce({ data: mockTenant });
  });

  function renderAtRoute() {
    return render(
      <MemoryRouter initialEntries={["/tenants/1"]}>
        <Routes>
          <Route path="/tenants/:id" element={<TenantDetail />} />
        </Routes>
      </MemoryRouter>
    );
  }

  test("renders tenant details after fetch", async () => {
    getTenantMock.mockResolvedValueOnce(sampleTenant);
    api.get.mockResolvedValueOnce({ data: sampleTenant });

    renderAtRoute();

    // First, wait for API call to be made
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(api.get).toHaveBeenCalled();
    });
    
    // Then verify the getTenant mock was called with expected ID
    expect(getTenantMock).toHaveBeenCalledWith("1");
    
    // Then wait for the tenant details to be displayed
    // Using findBy instead of getBy for async rendering
    const nameElement = await screen.findByText("Alice");
    expect(nameElement).toBeInTheDocument();
    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(await screen.findByText(/555-1234/i)).toBeInTheDocument();

    // Page title update called
    expect(updatePageTitleMock).toHaveBeenCalledWith("Tenant: Alice");
  });

  test("handles edit tenant successfully", async () => {
    getTenantMock.mockResolvedValueOnce(sampleTenant);

    const updated = {
      ...sampleTenant,
      name: "Alice Smith",
      email: "alice.smith@example.com",
      phone: "555-5678",
    };
    updateTenantMock.mockResolvedValueOnce(updated);

    renderAtRoute();

    // Wait initial data
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Open edit dialog
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Fill the form (labels per component: "Full Name", "Email Address", "Phone Number")
    await userEvent.clear(getInputByName(/full name/i));
    await userEvent.type(getInputByName(/full name/i), "Alice Smith");

    await userEvent.clear(getInputByName(/email address/i));
    await userEvent.type(
      getInputByName(/email address/i),
      "alice.smith@example.com"
    );

    await userEvent.clear(getInputByName(/phone number/i));
    await userEvent.type(getInputByName(/phone number/i), "555-5678");

    // Save
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Update called with id + payload
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(updateTenantMock).toHaveBeenCalledWith("1", {
        name: "Alice Smith",
        email: "alice.smith@example.com",
        phone: "555-5678",
      });
    });

    // UI reflects updated info
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("alice.smith@example.com")).toBeInTheDocument();
      expect(screen.getByText("555-5678")).toBeInTheDocument();
    });
  });

  test("shows error on update failure", async () => {
    getTenantMock.mockResolvedValueOnce(sampleTenant);
    // Component shows err.message inside dialog's Alert as "Failed to update tenant" by default fallback,
    // so pass matching message for clarity.
    updateTenantMock.mockRejectedValueOnce(new Error("Failed to update tenant"));

    renderAtRoute();

    // Wait initial data
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Open edit dialog
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Change just the name
    await userEvent.clear(getInputByName(/full name/i));
    await userEvent.type(getInputByName(/full name/i), "New Name");

    // Save -> expect error alert in dialog
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(
        screen.getByText(/failed to update tenant/i)
      ).toBeInTheDocument();
    });
  });
});

// frontend/src/__tests__/tenants/TenantDetail.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// --- Mock context hooks used by TenantDetail ---
const getTenantMock = jest.fn();
const updateTenantMock = jest.fn();
const deleteTenantMock = jest.fn();
const updatePageTitleMock = jest.fn();

jest.mock("../../context", () => ({
  useTenant: jest.fn(() => ({
    getTenant: getTenantMock,
    updateTenant: updateTenantMock,
    deleteTenant: deleteTenantMock,
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: updatePageTitleMock,
  })),
}));

// Use real router, but stub useNavigate/useParams to keep test simple
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useNavigate: () => jest.fn(),
  };
});

import TenantDetail from "../../pages/TenantDetail";

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

    renderAtRoute();

    // Wait for fetched data to render
    await waitFor(() => {
      expect(getTenantMock).toHaveBeenCalledWith("1");
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText(/555-1234/i)).toBeInTheDocument();
    });

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
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Open edit dialog
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Fill the form (labels per component: "Full Name", "Email Address", "Phone Number")
    await userEvent.clear(screen.getByLabelText(/full name/i));
    await userEvent.type(screen.getByLabelText(/full name/i), "Alice Smith");

    await userEvent.clear(screen.getByLabelText(/email address/i));
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "alice.smith@example.com"
    );

    await userEvent.clear(screen.getByLabelText(/phone number/i));
    await userEvent.type(screen.getByLabelText(/phone number/i), "555-5678");

    // Save
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Update called with id + payload
    await waitFor(() => {
      expect(updateTenantMock).toHaveBeenCalledWith("1", {
        name: "Alice Smith",
        email: "alice.smith@example.com",
        phone: "555-5678",
      });
    });

    // UI reflects updated info
    await waitFor(() => {
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
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Open edit dialog
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Change just the name
    await userEvent.clear(screen.getByLabelText(/full name/i));
    await userEvent.type(screen.getByLabelText(/full name/i), "New Name");

    // Save -> expect error alert in dialog
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to update tenant/i)
      ).toBeInTheDocument();
    });
  });
});

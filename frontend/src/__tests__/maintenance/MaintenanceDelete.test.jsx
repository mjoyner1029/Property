// frontend/src/__tests__/maintenance/MaintenanceDelete.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import MaintenanceDetail from "../../pages/MaintenanceDetail";

// ---- Router mocks ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "1" }),
}));

// ---- Context barrel mocks (MaintenanceDetail imports from "../context") ----
const mockFetchRequests = jest.fn();
const mockUpdateRequest = jest.fn();
const mockDeleteRequest = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  useMaintenance: jest.fn(),
  useApp: jest.fn(),
}));

import { useMaintenance, useApp } from "../../context";

// ---- Lightweight MUI overrides (Dialog/Button) for deterministic DOM ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    Button: ({ children, onClick, disabled, ...rest }) => (
      <button onClick={onClick} disabled={disabled} {...rest}>
        {children}
      </button>
    ),
    Dialog: ({ open, children }) => (open ? <div role="dialog">{children}</div> : null),
    DialogTitle: ({ children }) => <h2>{children}</h2>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogActions: ({ children }) => <div>{children}</div>,
    Menu: ({ open, children }) => (open ? <div data-testid="menu">{children}</div> : null),
    MenuItem: ({ onClick, children }) => (
      <div role="menuitem" onClick={onClick}>
        {children}
      </div>
    ),
  };
});

// ---- Fixtures ----
const request = {
  id: "1",
  title: "Leaky faucet",
  description: "Bathroom sink leaking under cabinet",
  status: "open",
  priority: "medium",
  maintenance_type: "plumbing_leaking",
  property_name: "Sunset Apartments",
  unit_number: "A-101",
  reported_by: "John Smith",
  assigned_to: "Tech Mike",
  created_at: "2025-07-10T10:00:00Z",
  updated_at: "2025-07-11T10:00:00Z",
  images: [],
  comments: [],
};

const defaultUseMaintenance = () => ({
  maintenanceRequests: [request],
  stats: { open: 1, inProgress: 0, completed: 0, total: 1 },
  loading: false,
  error: null,
  fetchRequests: mockFetchRequests,
  updateRequest: mockUpdateRequest,
  deleteRequest: mockDeleteRequest,
});

const setContexts = (overrides = {}) => {
  (useMaintenance).mockReturnValue({ ...defaultUseMaintenance(), ...overrides });
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

const renderDetail = () =>
  renderWithProviders(
    <Routes>
      <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
    </Routes>,
    { route: "/maintenance/1" }
  );

describe("MaintenanceDetail — Delete flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setContexts();
  });

  test("opens confirmation dialog and deletes successfully, then navigates", async () => {
    mockDeleteRequest.mockResolvedValueOnce(true);

    renderDetail();

    // Data visible
    await waitFor(() => {
      expect(screen.getByText(/Leaky faucet/i)).toBeInTheDocument();
      expect(screen.getByText(/Bathroom sink leaking/i)).toBeInTheDocument();
    });

    // Open delete confirmation
    const headerDelete = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(headerDelete);

    // Confirm dialog appears
    const confirmBtn = await screen.findByRole("button", { name: /delete request/i });
    fireEvent.click(confirmBtn);

    // Ensure delete called and navigated back to list
    await waitFor(() => {
      expect(mockDeleteRequest).toHaveBeenCalledWith("1");
      expect(mockNavigate).toHaveBeenCalledWith("/maintenance");
    });

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("cancel in dialog does not delete or navigate", async () => {
    renderDetail();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    // No delete & no nav
    expect(mockDeleteRequest).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("shows error view when delete fails and does not navigate", async () => {
    mockDeleteRequest.mockRejectedValueOnce(new Error("boom"));

    renderDetail();

    // Open and confirm delete
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    const confirmBtn = await screen.findByRole("button", { name: /delete request/i });
    fireEvent.click(confirmBtn);

    // Delete attempted
    await waitFor(() => {
      expect(mockDeleteRequest).toHaveBeenCalledWith("1");
    });

    // Component shows error screen (Alert + Back button) and dialog closes
    await waitFor(() => {
      const err =
        screen.queryByRole("alert") ||
        screen.getByText(/failed to delete maintenance request/i);
      expect(err).toBeInTheDocument();
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith("/maintenance");
  });

  test("shows 'Deleting...' while submission is in progress", async () => {
    let resolveDelete;
    mockDeleteRequest.mockImplementation(
      () => new Promise((resolve) => (resolveDelete = resolve))
    );

    renderDetail();

    // Open and confirm delete
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    const confirmBtn = await screen.findByRole("button", { name: /delete request/i });
    fireEvent.click(confirmBtn);

    // Button reflects submitting state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /deleting\.\.\./i })).toBeInTheDocument();
    });

    // Finish request
    resolveDelete(true);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/maintenance");
    });
  });
});

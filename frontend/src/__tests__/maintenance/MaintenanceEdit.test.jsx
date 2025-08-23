// frontend/src/__tests__/maintenance/MaintenanceEdit.test.jsx
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

// ---- Lightweight MUI overrides (Dialog/Select/Menu/Button) for deterministic DOM ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  const toOptions = (children) => {
    const arr = React.Children.toArray(children);
    return arr
      .map((child, idx) => {
        if (!React.isValidElement(child)) return null;
        // Map MenuItem with 'value' to <option>
        if (child.props && "value" in child.props) {
          return (
            <option key={idx} value={child.props.value}>
              {child.props.children}
            </option>
          );
        }
        return null;
      })
      .filter(Boolean);
  };

  return {
    ...actual,
    Button: ({ children, onClick, ...rest }) => (
      <button
        onClick={(e) => onClick && onClick({ ...e, currentTarget: e.currentTarget || {} })}
        {...rest}
      >
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
    // Native-like Select
    Select: ({ name, value, onChange, label, children }) => (
      <select
        aria-label={label || name}
        name={name}
        value={value || ""}
        onChange={(e) =>
          onChange &&
          onChange({
            target: { name: name, value: e.target.value },
          })
        }
        data-testid={`select-${name || label || "unnamed"}`}
      >
        {toOptions(children)}
      </select>
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
  maintenanceRequests: [request], // present so fetchRequests is not required
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

describe("MaintenanceDetail — Edit flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setContexts();
  });

  test("opens Edit dialog, pre-fills, updates successfully, and closes dialog", async () => {
    mockUpdateRequest.mockResolvedValueOnce({
      ...request,
      title: "Leaky kitchen faucet",
      description: "Kitchen faucet leaking at the base",
      priority: "high",
      status: "in_progress",
      maintenance_type: "plumbing_disposal",
    });

    renderDetail();

    // Header + request details visible
    await waitFor(() => {
      expect(screen.getByText(/Leaky faucet/i)).toBeInTheDocument();
      expect(screen.getByText(/Bathroom sink leaking/i)).toBeInTheDocument();
    });

    // Open edit dialog
    const editBtn = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editBtn);

    // Dialog fields are present and prefilled
    const titleInput = await screen.findByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    expect(titleInput).toHaveValue("Leaky faucet");
    expect(descInput).toHaveValue("Bathroom sink leaking under cabinet");

    // Change fields
    fireEvent.clear(titleInput);
    fireEvent.change(titleInput, { target: { value: "Leaky kitchen faucet" } });

    fireEvent.clear(descInput);
    fireEvent.change(descInput, { target: { value: "Kitchen faucet leaking at the base" } });

    // Selects
    const prioritySelect = screen.getByTestId("select-priority");
    fireEvent.change(prioritySelect, { target: { value: "high" } });

    const statusSelect = screen.getByTestId("select-status");
    fireEvent.change(statusSelect, { target: { value: "in_progress" } });

    const typeSelect = screen.getByTestId("select-maintenance_type");
    fireEvent.change(typeSelect, { target: { value: "plumbing_disposal" } });

    // Save
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateRequest).toHaveBeenCalledWith("1", {
        title: "Leaky kitchen faucet",
        description: "Kitchen faucet leaking at the base",
        priority: "high",
        status: "in_progress",
        maintenance_type: "plumbing_disposal",
      });
    });

    // Dialog should close on success
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("client-side validation stops save when title/description missing", async () => {
    renderDetail();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    const titleInput = await screen.findByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);

    // Clear required fields
    fireEvent.clear(titleInput);
    fireEvent.clear(descInput);

    // Try save
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Expect validation text and no API call
    await waitFor(() => {
      const titleErr =
        screen.queryByText(/title is required/i) ||
        screen.queryByText(/required/i);
      const descErr =
        screen.queryByText(/description is required/i) ||
        screen.queryByText(/required/i);
      expect(titleErr || descErr).toBeTruthy();
      expect(mockUpdateRequest).not.toHaveBeenCalled();
    });
  });

  test("sidebar 'Start Work' triggers status update to in_progress", async () => {
    mockUpdateRequest.mockResolvedValueOnce({ ...request, status: "in_progress" });

    renderDetail();

    // Start Work button visible because status is "open"
    const startBtn = screen.getByRole("button", { name: /start work/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockUpdateRequest).toHaveBeenCalledWith("1", expect.objectContaining({ status: "in_progress" }));
    });
  });

  test("sidebar 'Mark as Complete' triggers status update to completed", async () => {
    mockUpdateRequest.mockResolvedValueOnce({ ...request, status: "completed" });

    renderDetail();

    const completeBtn = screen.getByRole("button", { name: /mark as complete/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(mockUpdateRequest).toHaveBeenCalledWith("1", expect.objectContaining({ status: "completed" }));
    });
  });

  test("shows error inside dialog when updateRequest fails and keeps dialog open", async () => {
    mockUpdateRequest.mockRejectedValueOnce(new Error("Failed to update request"));

    renderDetail();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    const titleInput = await screen.findByLabelText(/title/i);

    // Nudge a change so we submit something
    fireEvent.change(titleInput, { target: { value: "Leaky faucet - urgent" } });

    // Save
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Error surfaced and dialog remains
    await waitFor(() => {
      const maybeAlert =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed to update request/i);
      expect(maybeAlert).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("when request is already completed, 'Mark as Complete' button is disabled", async () => {
    // Provide a completed request
    setContexts({
      maintenanceRequests: [{ ...request, status: "completed" }],
    });

    renderDetail();

    const completeBtn = screen.getByRole("button", { name: /mark as complete/i });
    expect(completeBtn).toBeDisabled();
  });
});

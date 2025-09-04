// frontend/src/__tests__/maintenance/MaintenanceCreate.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "src/test/utils/renderWithProviders";
import Maintenance from "src/pages/Maintenance";

// Import mock hooks
import { mockMaintenanceHook, mockAppHook, mockPropertyHook } from 'src/__tests__/__mocks__/contextHooks';

import { useMaintenance, useApp, useProperty } from "src/context";

// Mock MUI components with lightweight versions to avoid flakiness
jest.mock('@mui/material', () => require('src/__tests__/__mocks__/muiLightMock'));

// ---- Router mocks (declare BEFORE component import) ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---- Context barrel mocks (Maintenance imports from "../context") ----
const mockFetchRequests = jest.fn();
const mockCreateRequest = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("src/context", () => ({
  useMaintenance: jest.fn(),
  useApp: jest.fn(),
  useProperty: jest.fn(),
}));

// ---- Lightweight component stubs to keep tests fast/stable ----
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, subtitle, actionText, onActionClick }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {actionText ? (
        <button onClick={onActionClick} aria-label={actionText} data-testid="header-action">
          {actionText}
        </button>
      ) : null}
    </header>
  ),
  MaintenanceRequestCard: () => null,
  Empty: ({ title, message, actionText, onActionClick }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
      {actionText && (
        <button onClick={onActionClick} data-testid="empty-action">{actionText}</button>
      )}
    </div>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  Card: ({ children }) => <div data-testid="card">{children}</div>,
}));

/**
 * MUI Select is a popup; to keep tests simple we mock it as a native <select>.
 * We also provide light mocks for Menu/Dialog so interactions work deterministically.
 */
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  // Helper: map MUI <MenuItem value="x">Label</MenuItem> children to <option>
  const toOptions = (children) => {
    const arr = React.Children.toArray(children);
    return arr
      .map((child, idx) => {
        if (!React.isValidElement(child)) return null;
        // Ignore non-option-like items (e.g., ListSubheader)
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
    Button: ({ children, onClick, type, ...rest }) => {
      const React = require("react");
      return (
        <button
          onClick={(e) => onClick && onClick({ ...e, currentTarget: e.currentTarget || {} })}
          type={type || "button"}
          {...rest}
        >
          {children}
        </button>
      );
    },
    Menu: ({ open, children }) => {
      const React = require("react");
      return open ? <div data-testid="menu">{children}</div> : null;
    },
    MenuItem: ({ children, onClick }) => {
      const React = require("react");
      return (
        <div role="menuitem" onClick={onClick}>
          {children}
        </div>
      );
    },
    Dialog: ({ open, children }) => {
      const React = require("react");
      return open ? <div role="dialog">{children}</div> : null;
    },
    DialogTitle: ({ children }) => {
      const React = require("react");
      return <h2>{children}</h2>;
    },
    DialogContent: ({ children }) => {
      const React = require("react");
      return <div>{children}</div>;
    },
    DialogActions: ({ children }) => {
      const React = require("react");
      return <div>{children}</div>;
    },
    // Native-like Select for easy testing
    Select: ({ name, value, onChange, label, children }) => {
      const React = require("react");
      return (
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
      );
    },
    Alert: ({ severity, children }) => {
      const React = require("react");
      return (
        <div role="alert" data-severity={severity}>
          {children}
        </div>
      );
    },
  };
});

// ---- Fixtures ----
const properties = [
  { id: "p1", name: "Sunset Apartments" },
  { id: "p2", name: "Ocean View" },
];

const defaultUseMaintenance = () => ({
  ...mockMaintenanceHook,
  maintenanceRequests: [
    {
      id: "1",
      title: "Leaky faucet",
      description: "bathroom leak under sink",
      status: "open",
      priority: "medium",
      property_name: "Sunset Apartments",
      created_at: "2025-07-10T10:00:00Z",
    },
  ],
  fetchRequests: mockFetchRequests,
  createRequest: mockCreateRequest,
});

const setContexts = (overrides = {}) => {
  (useMaintenance).mockReturnValue({ ...defaultUseMaintenance(), ...overrides });
  (useApp).mockReturnValue({ ...mockAppHook, updatePageTitle: mockUpdatePageTitle });
  (useProperty).mockReturnValue({ ...mockPropertyHook, properties });
};

const renderPage = () => renderWithProviders(<Maintenance />, { route: "/maintenance" });

describe("Maintenance — Create Request flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setContexts();
  });

  test("opens New Request dialog from header", async () => {
    renderPage();

    // Header action opens dialog
    fireEvent.click(screen.getByTestId("header-action"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Required fields should be present
    expect(getInputByName(/title/i)).toBeInTheDocument();
    expect(getInputByName(/description/i)).toBeInTheDocument();
    expect(screen.getByTestId("select-property_id")).toBeInTheDocument();
    expect(screen.getByTestId("select-maintenance_type")).toBeInTheDocument();
    expect(screen.getByTestId("select-priority")).toBeInTheDocument(); // default 'medium'
  });

  test("client-side validation blocks submit when required fields are missing", async () => {
    renderPage();

    // Open dialog
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");

    // Submit immediately
    fireEvent.click(screen.getByRole("button", { name: /create request/i }));

    // Expect no API call due to validation errors
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockCreateRequest).not.toHaveBeenCalled();
    });
  });

  test("creates a new request successfully", async () => {
    mockCreateRequest.mockResolvedValueOnce({ id: "99" });

    renderPage();

    // Open dialog
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");

    // Fill Title & Description
    fireEvent.change(getInputByName(/title/i), {
      target: { value: "Broken disposal" },
    });
    fireEvent.change(getInputByName(/description/i), {
      target: { value: "Kitchen disposal not working" },
    });

    // Property (native-like select via mock)
    const propertySelect = screen.getByTestId("select-property_id");
    fireEvent.change(propertySelect, { target: { value: "p1" } });

    // Maintenance Type
    const typeSelect = screen.getByTestId("select-maintenance_type");
    fireEvent.change(typeSelect, { target: { value: "plumbing_disposal" } });

    // Priority (optional; default is medium—let’s set high)
    const prioritySelect = screen.getByTestId("select-priority");
    fireEvent.change(prioritySelect, { target: { value: "high" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /create request/i }));

    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockCreateRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Broken disposal",
          description: "Kitchen disposal not working",
          property_id: "p1",
          unit_id: "",
          priority: "high",
          maintenance_type: "plumbing_disposal",
        })
      );
    });

    // Dialog closes on success
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("surface API error when creation fails and keep dialog open", async () => {
    mockCreateRequest.mockRejectedValueOnce(new Error("Failed to create request"));

    renderPage();

    // Open dialog
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");

    // Fill the minimum required fields
    fireEvent.change(getInputByName(/title/i), {
      target: { value: "Outage" },
    });
    fireEvent.change(getInputByName(/description/i), {
      target: { value: "No power in kitchen" },
    });
    fireEvent.change(screen.getByTestId("select-property_id"), {
      target: { value: "p2" },
    });
    fireEvent.change(screen.getByTestId("select-maintenance_type"), {
      target: { value: "electrical_no_power" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /create request/i }));

    // Error message (Alert or inline error)
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      const maybeAlert =
        screen.queryByRole("alert") || screen.queryByText(/failed to create request/i);
      expect(maybeAlert).toBeInTheDocument();
    });

    // Dialog remains open on failure
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("resets form state after closing dialog", async () => {
    mockCreateRequest.mockResolvedValueOnce({ id: "101" });

    renderPage();

    // Open dialog
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");

    // Fill fields and submit successfully
    fireEvent.change(getInputByName(/title/i), {
      target: { value: "Ceiling fan noise" },
    });
    fireEvent.change(getInputByName(/description/i), {
      target: { value: "Strange noise in living room" },
    });
    fireEvent.change(screen.getByTestId("select-property_id"), {
      target: { value: "p1" },
    });
    fireEvent.change(screen.getByTestId("select-maintenance_type"), {
      target: { value: "electrical_fan" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create request/i }));

    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockCreateRequest).toHaveBeenCalled();
    });

    // Dialog should close
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Reopen dialog -> fields should be reset
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");

    expect(getInputByName(/title/i)).toHaveValue("");
    expect(getInputByName(/description/i)).toHaveValue("");
    // property_id and maintenance_type reset to ""
    expect(screen.getByTestId("select-property_id")).toHaveValue("");
    expect(screen.getByTestId("select-maintenance_type")).toHaveValue("");
    // priority should default to "medium"
    expect(screen.getByTestId("select-priority")).toHaveValue("medium");
  });

  test("can open create dialog from empty state CTA", async () => {
    // No requests -> Empty state
    setContexts({ maintenanceRequests: [] });

    renderPage();

    // Empty state visible
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();

    // Click CTA to open dialog
    fireEvent.click(screen.getByTestId("empty-action"));

    // Dialog opens
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

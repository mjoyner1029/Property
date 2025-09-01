// frontend/src/__tests__/maintenance/MaintenanceCreateFixed.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";

// Define mock functions first, at the top level
const mockFetchRequests = jest.fn().mockResolvedValue([]);
const mockCreateRequest = jest.fn().mockImplementation(async (data) => {
  return { id: "new-id", ...data };
});
const mockUpdatePageTitle = jest.fn();
const mockNavigate = jest.fn();

// ---- Router mocks (declare BEFORE component import) ----
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock contexts before importing them
jest.mock("../../context", () => ({
  useMaintenance: jest.fn(),
  useApp: jest.fn(),
  useProperty: jest.fn()
}));

// Import after mocking
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import Maintenance from "../../pages/Maintenance";
import { useMaintenance, useApp, useProperty } from "../../context";

// Setup context values using the mock functions defined above
const maintenanceContextValue = {
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
  stats: { open: 1, inProgress: 0, completed: 0, total: 1 },
  loading: false,
  error: null,
  fetchRequests: mockFetchRequests,
  createRequest: mockCreateRequest,
};

const appContextValue = { 
  updatePageTitle: mockUpdatePageTitle 
};

const propertyContextValue = { 
  properties: [
    { id: "p1", name: "Sunset Apartments" },
    { id: "p2", name: "Ocean View" },
  ]
};

// Set up the context hook implementations
useMaintenance.mockImplementation(() => maintenanceContextValue);
useApp.mockImplementation(() => appContextValue);
useProperty.mockImplementation(() => propertyContextValue);

// ---- Lightweight component stubs to keep tests fast/stable ----
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, subtitle, actionText, onActionClick }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {actionText ? (
        <button 
          onClick={onActionClick} 
          aria-label={actionText} 
          data-testid="header-action"
          id="header-action-button" // Add unique ID
        >
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
        <button 
          onClick={onActionClick} 
          data-testid="empty-action"
          id="empty-action-button" // Add unique ID
        >
          {actionText}
        </button>
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
  
  // Helper function to convert MenuItem children to option elements
  // Defined as a factory function to avoid referencing out-of-scope variables
  const createToOptions = () => {
    const React = require("react");
    
    return (children) => {
      const arr = React.Children.toArray(children);
      return arr
        .map((child, idx) => {
          if (!React.isValidElement(child)) return null;
          // Ignore non-option-like items (e.g., ListSubheader)
          if (child.props && "value" in child.props) {
            return React.createElement(
              'option',
              { key: idx, value: child.props.value },
              child.props.children
            );
          }
          return null;
        })
        .filter(Boolean);
    };
  };

  // Create toOptions function 
  const toOptions = createToOptions();

  return {
    ...actual,
    Button: function Button(props) {
      const React = require('react');
      const { children, onClick, type, "data-testid": testId, ...rest } = props;
      
      return React.createElement(
        'button',
        {
          onClick: (e) => onClick && onClick({ ...e, currentTarget: e.currentTarget || {} }),
          type: type || "button",
          "data-testid": testId,
          ...rest
        },
        children
      );
    },
    Menu: function Menu(props) {
      const React = require('react');
      return props.open ? 
        React.createElement('div', { "data-testid": "menu" }, props.children) : null;
    },
    MenuItem: function MenuItem(props) {
      const React = require('react');
      return React.createElement(
        'div',
        { 
          role: "menuitem", 
          onClick: props.onClick, 
          "data-value": props.value 
        },
        props.children
      );
    },
    Dialog: function Dialog(props) {
      const React = require('react');
      return props.open ? 
        React.createElement(
          'div', 
          { 
            role: "dialog", 
            "aria-label": props["aria-label"] || "dialog" 
          }, 
          props.children
        ) : null;
    },
    DialogTitle: function DialogTitle(props) {
      const React = require('react');
      return React.createElement('h2', null, props.children);
    },
    DialogContent: function DialogContent(props) {
      const React = require('react');
      return React.createElement('div', null, props.children);
    },
    DialogActions: function DialogActions(props) {
      const React = require('react');
      return React.createElement('div', null, props.children);
    },
    // Native-like Select for easy testing
    Select: function Select(props) {
      const React = require('react');
      const { name, value, onChange, label, children, inputProps } = props;
      
      return React.createElement(
        'select',
        {
          'aria-label': label || name,
          name: name,
          value: value || '',
          onChange: (e) => 
            onChange &&
            onChange({
              target: { name: name, value: e.target.value },
            }),
          'data-testid': `select-${name || label || "unnamed"}`,
          ...inputProps
        },
        toOptions(children)
      );
    },
    Alert: function Alert(props) {
      const React = require('react');
      return React.createElement(
        'div',
        {
          role: 'alert',
          'data-severity': props.severity,
          'data-testid': 'alert'
        },
        props.children
      );
    },
    // Handle FormHelperText for error messages
    FormHelperText: function FormHelperText(props) {
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'form-error' }, props.children);
    },
  };
});

// ---- Fixtures already defined in the mock implementations above ----

// Clear any previous renders before starting a new test
const renderPage = () => {
  // Clear any leftover dialogs from previous tests
  document.body.innerHTML = '';
  // Reset our context mocks for each test
  jest.mocked(useMaintenance).mockImplementation(() => maintenanceContextValue);
  jest.mocked(useApp).mockImplementation(() => appContextValue);
  jest.mocked(useProperty).mockImplementation(() => propertyContextValue);
  // Force re-rendering of the component to ensure fresh mocks
  return renderWithProviders(<Maintenance key={Math.random()} />, { route: "/maintenance" });
};

describe("Maintenance — Create Request flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchRequests.mockClear();
    mockCreateRequest.mockClear();
    mockUpdatePageTitle.mockClear();
  });

  test("opens New Request dialog from header", async () => {
    const { container } = renderPage();

    // Header action opens dialog - make sure it's explicitly getting the element by ID
    const headerButton = screen.getByTestId("header-action");
    expect(headerButton).toBeInTheDocument();
    fireEvent.click(headerButton);
    
    // Wait for dialog to appear
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
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Expect no API call due to validation errors
    await waitFor(() => {
      expect(mockCreateRequest).not.toHaveBeenCalled();
    });
    
    // Expect form errors to be displayed
    expect(screen.getAllByTestId("form-error").length).toBeGreaterThan(0);
  });

  test("creates a new request successfully", async () => {
    mockCreateRequest.mockResolvedValueOnce({ id: "new-id", status: "open" });
    mockFetchRequests.mockResolvedValueOnce([]);
    
    renderPage();

    // Open dialog
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");

    // Fill the minimum required fields
    fireEvent.change(getInputByName(/title/i), {
      target: { value: "Broken Window" },
    });
    fireEvent.change(getInputByName(/description/i), {
      target: { value: "Bedroom window won't close properly" },
    });
    fireEvent.change(screen.getByTestId("select-property_id"), {
      target: { value: "p1" },
    });
    fireEvent.change(screen.getByTestId("select-maintenance_type"), {
      target: { value: "window_stuck" },
    });

    // Submit the form
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Wait for the API call
    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith(expect.objectContaining({
        title: "Broken Window",
        description: "Bedroom window won't close properly",
        property_id: "p1",
        maintenance_type: "window_stuck"
      }));
    });

    // Should refresh the list
    expect(mockFetchRequests).toHaveBeenCalled();
    
    // Dialog should close after successful submission
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("surface API error when creation fails and keep dialog open", async () => {
    // Setup mock to reject with error
    const failureError = new Error("Failed to create request");
    mockCreateRequest.mockRejectedValueOnce(failureError);
    
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

    // Submit using specific button selection by testid
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId("submit-error")).toBeInTheDocument();
    });

    // Dialog remains open on failure
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("resets form state after closing dialog", async () => {
    renderPage();

    // Open dialog
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");

    // Fill the form fields
    fireEvent.change(getInputByName(/title/i), {
      target: { value: "Test Title" },
    });
    
    // Close dialog
    const cancelButton = screen.getByTestId("cancel-button");
    fireEvent.click(cancelButton);
    
    // Dialog should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    
    // Reopen dialog
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");
    
    // Form should be reset
    expect(getInputByName(/title/i).value).toBe("");
  });

  test("can open create dialog from empty state CTA", async () => {
    // No requests -> Empty state
    // Override the mock just for this test
    const emptyMaintenanceContext = {
      ...maintenanceContextValue,
      maintenanceRequests: [],
      stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
    };
    jest.mocked(useMaintenance).mockImplementation(() => emptyMaintenanceContext);
    
    renderPage();

    // Empty state visible
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();

    // Click CTA to open dialog
    fireEvent.click(screen.getByTestId("empty-action"));

    // Dialog opens
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

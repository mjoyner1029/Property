// frontend/src/__tests__/maintenance/MaintenanceCreateFixed.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "src/test/utils/renderWithProviders";
import Maintenance from "src/pages/Maintenance";

// ---- Router mocks (declare BEFORE component import) ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Define mock functions first, at the top level
const mockFetchRequests = jest.fn().mockResolvedValue([]);
const mockCreateRequest = jest.fn().mockImplementation(async (data) => {
  return { id: "new-id", ...data };
});
const mockUpdatePageTitle = jest.fn();

// Import after defining mocks
import { useMaintenance, useApp, useProperty } from "src/contexts";

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

jest.mock("../../context", () => {
  const originalModule = jest.requireActual("../../context");
  
  return {
    ...originalModule,
    useMaintenance: jest.fn(() => maintenanceContextValue),
    useApp: jest.fn(() => appContextValue),
    useProperty: jest.fn(() => propertyContextValue),
  };
});

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
    Button: ({ children, onClick, type, "data-testid": testId, ...rest }) => (
      <button
        onClick={(e) => onClick && onClick({ ...e, currentTarget: e.currentTarget || {} })}
        type={type || "button"}
        data-testid={testId}
        {...rest}
      >
        {children}
      </button>
    ),
    Menu: ({ open, children }) => (open ? <div data-testid="menu">{children}</div> : null),
    MenuItem: ({ children, onClick, value }) => (
      <div role="menuitem" onClick={onClick} data-value={value}>
        {children}
      </div>
    ),
    Dialog: ({ open, children, "aria-label": ariaLabel }) => (
      open ? <div role="dialog" aria-label={ariaLabel || "dialog"}>{children}</div> : null
    ),
    DialogTitle: ({ children }) => <h2>{children}</h2>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogActions: ({ children }) => <div>{children}</div>,
    // Native-like Select for easy testing
    Select: ({ name, value, onChange, label, children, inputProps }) => (
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
        {...inputProps}
      >
        {toOptions(children)}
      </select>
    ),
    Alert: ({ severity, children }) => (
      <div role="alert" data-severity={severity} data-testid="alert">
        {children}
      </div>
    ),
    // Handle FormHelperText for error messages
    FormHelperText: ({ children }) => <div data-testid="form-error">{children}</div>,
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
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Broken Window" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
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
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Outage" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
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
    fireEvent.change(screen.getByLabelText(/title/i), {
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
    expect(screen.getByLabelText(/title/i).value).toBe("");
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

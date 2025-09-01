// frontend/src/__tests__/maintenance/MaintenanceCreate.super.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// Import first
import { useMaintenance, useApp, useProperty } from "../../context";
import Maintenance from "../../pages/Maintenance";

// Define mock functions first
const mockNavigate = jest.fn();
const mockFetchRequests = jest.fn().mockResolvedValue([]);
const mockCreateRequest = jest.fn().mockImplementation(async (data) => {
  return { id: "new-id", ...data };
});
const mockUpdatePageTitle = jest.fn();

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Setup context values
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

// Mock the contexts
jest.mock("../../context", () => {
  const originalModule = jest.requireActual("../../context");
  
  return {
    ...originalModule,
    useMaintenance: jest.fn(() => maintenanceContextValue),
    useApp: jest.fn(() => appContextValue),
    useProperty: jest.fn(() => propertyContextValue),
  };
});

// Mock components
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, subtitle, action }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      <div data-testid="header-action-wrapper">{action}</div>
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
        >
          {actionText}
        </button>
      )}
    </div>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock MUI
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  
  return {
    ...actual,
    Button: ({ children, onClick, startIcon, "data-testid": testId, ...rest }) => (
      <button
        onClick={onClick}
        data-testid={testId || "header-action"}
        {...rest}
      >
        {startIcon} {children}
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
    DialogActions: ({ children }) => <div data-testid="dialog-actions">{children}</div>,
    TextField: ({ label, name, value, onChange, multiline, fullWidth, ...rest }) => (
      <div>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          data-testid={`input-${name}`}
          aria-label={label}
          {...rest}
        />
      </div>
    ),
    Select: ({ name, value, onChange, label, children, ...rest }) => (
      <div>
        <label htmlFor={name}>{label}</label>
        <select
          id={name}
          name={name}
          value={value || ""}
          onChange={(e) => onChange && onChange({ target: { name, value: e.target.value } })}
          data-testid={`select-${name}`}
          aria-label={label}
          {...rest}
        >
          {React.Children.toArray(children)
            .filter(child => React.isValidElement(child) && child.props && 'value' in child.props)
            .map((child, idx) => (
              <option key={idx} value={child.props.value}>
                {child.props.children}
              </option>
            ))}
        </select>
      </div>
    ),
    FormControl: ({ children, fullWidth }) => (
      <div style={fullWidth ? { width: '100%' } : {}}>{children}</div>
    ),
    InputLabel: ({ children }) => <span>{children}</span>,
    FormHelperText: ({ children }) => (
      <div data-testid="form-error">{children}</div>
    ),
    Alert: ({ severity, children }) => (
      <div role="alert" data-severity={severity} data-testid="alert">
        {children}
      </div>
    ),
    Box: ({ children, sx }) => <div>{children}</div>,
    Grid: ({ children, container, item, xs, sm, md }) => <div>{children}</div>,
    Typography: ({ children, variant }) => <div>{children}</div>,
    Tabs: ({ children, value, onChange, "data-testid": testId }) => (
      <div data-testid={testId || "status-tabs"}>{children}</div>
    ),
    Tab: ({ label, value, "data-testid": testId }) => (
      <button data-testid={testId} role="tab" aria-selected={value === "all"}>
        {label}
      </button>
    ),
    InputAdornment: ({ children, position }) => <div>{children}</div>,
    ListSubheader: ({ children }) => <div role="heading">{children}</div>,
  };
});

// Mock MUI icons
jest.mock("@mui/icons-material/Add", () => () => "AddIcon");
jest.mock("@mui/icons-material/Search", () => () => "SearchIcon");
jest.mock("@mui/icons-material/FilterList", () => () => "FilterListIcon");
jest.mock("@mui/icons-material/Build", () => () => "BuildIcon");

const renderPage = () => {
  // Clear any leftover dialogs from previous tests
  document.body.innerHTML = '';
  
  // Force re-rendering of the component to ensure fresh mocks
  return renderWithProviders(<Maintenance />, { route: "/maintenance" });
};

describe("Maintenance — Create Request flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchRequests.mockClear();
    mockCreateRequest.mockClear();
    mockUpdatePageTitle.mockClear();
  });

  test("opens New Request dialog from header", async () => {
    renderPage();

    // Find header action button
    const headerButton = screen.getByTestId("header-action");
    expect(headerButton).toBeInTheDocument();
    expect(headerButton).toHaveTextContent(/New Request/i);
    
    // Click to open dialog
    fireEvent.click(headerButton);
    
    // Dialog should appear
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  test("creates a new request successfully", async () => {
    mockCreateRequest.mockResolvedValueOnce({ id: "new-id", status: "open" });
    mockFetchRequests.mockResolvedValueOnce([]);
    
    renderPage();

    // Open dialog
    fireEvent.click(screen.getByTestId("header-action"));
    await screen.findByRole("dialog");

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Broken Window" },
    });
    
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Window won't close" },
    });
    
    fireEvent.change(screen.getByTestId("select-property_id"), {
      target: { value: "p1" },
    });
    
    fireEvent.change(screen.getByTestId("select-maintenance_type"), {
      target: { value: "window_stuck" },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId("submit-button"));

    // API should be called with correct data
    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith(expect.objectContaining({
        title: "Broken Window",
        description: "Window won't close",
        property_id: "p1",
        maintenance_type: "window_stuck",
      }));
    });

    // Dialog should close
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    
    // Should refresh the data
    expect(mockFetchRequests).toHaveBeenCalledTimes(2);
  });
});

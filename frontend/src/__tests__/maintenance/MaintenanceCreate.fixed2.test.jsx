// frontend/src/__tests__/maintenance/MaintenanceCreate.fixed2.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";

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
import { renderWithProviders } from "../../test/utils/renderWithProviders";
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
  updatePageTitle: mockUpdatePageTitle,
  showNotification: jest.fn()
};

const propertyContextValue = { 
  properties: [
    { id: "prop1", name: "Property 1" },
    { id: "prop2", name: "Property 2" },
  ],
  loading: false,
  error: null
};

// Set up the context hook implementations
useMaintenance.mockImplementation(() => maintenanceContextValue);
useApp.mockImplementation(() => appContextValue);
useProperty.mockImplementation(() => propertyContextValue);

// Mock components module
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, subtitle, action }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {action && <div data-testid="header-action">{action}</div>}
    </header>
  ),
  MaintenanceRequestCard: ({ request, onClick }) => (
    <div 
      data-testid={`maintenance-card-${request.id}`} 
      onClick={onClick}
      role="button"
    >
      <h3>{request.title}</h3>
      <p>{request.description}</p>
      <p>{request.status}</p>
      <p>{request.priority}</p>
      <p>{request.property_name}</p>
    </div>
  ),
  Empty: ({ title, description, icon, action, actionLabel, actionTestId }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <button 
          onClick={action} 
          data-testid={actionTestId || "empty-action-button"}
        >
          {actionLabel}
        </button>
      )}
    </div>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Properly mock Material-UI components
jest.mock("@mui/material", () => {
  const originalModule = jest.requireActual("@mui/material");

  return {
    __esModule: true,
    ...originalModule,
    Button: (props) => (
      <button
        onClick={props.onClick}
        data-testid={props["data-testid"]}
        aria-label={props["aria-label"]}
        type={props.type || "button"}
        id={props.id}
        disabled={props.disabled}
      >
        {props.startIcon}
        {props.children}
      </button>
    ),
    TextField: (props) => (
      <div>
        <label htmlFor={props.name || props.label}>{props.label}</label>
        <input
          data-testid={props["data-testid"] || `input-${props.name || props.label}`}
          id={props.name || props.label}
          name={props.name}
          value={props.value || ''}
          onChange={props.onChange}
          aria-label={props.label}
          autoFocus={props.autoFocus}
          {...(props.inputProps || {})}
        />
        {props.error && props.helperText && (
          <div role="alert" data-testid={`${props.name}-error` || 'form-error'}>
            {props.helperText}
          </div>
        )}
      </div>
    ),
    Dialog: (props) => 
      props.open ? (
        <div role="dialog" data-testid="dialog" aria-label={props["aria-label"] || "dialog"}>
          {props.children}
        </div>
      ) : null,
    DialogTitle: (props) => <h2>{props.children}</h2>,
    DialogContent: (props) => <div data-testid="dialog-content">{props.children}</div>,
    DialogActions: (props) => <div data-testid="dialog-actions">{props.children}</div>,
    FormControl: (props) => <div style={{ width: props.fullWidth ? '100%' : 'auto' }}>{props.children}</div>,
    InputLabel: (props) => <span>{props.children}</span>,
    Select: (props) => {
      // Create options array from props.children
      const options = [];
      React.Children.forEach(props.children, (child, i) => {
        if (!child) return;
        if (child.type && child.type.displayName === 'ListSubheader') return;
        if (child.props && child.props.value !== undefined) {
          options.push(
            <option key={child.props.value || i} value={child.props.value}>
              {child.props.children}
            </option>
          );
        }
      });
      
      return (
        <select
          aria-label={props.label || props.name}
          name={props.name}
          value={props.value || ''}
          data-testid={(props.inputProps && props.inputProps["data-testid"]) || `select-${props.name}`}
          id={props.name}
          onChange={(e) => 
            props.onChange &&
            props.onChange({
              target: { name: props.name, value: e.target.value },
            })
          }
        >
          {options}
        </select>
      );
    },
    MenuItem: (props) => <option value={props.value}>{props.children}</option>,
    ListSubheader: (props) => <div role="heading">{props.children}</div>,
    FormHelperText: (props) => <div role="alert" data-testid="form-error">{props.children}</div>,
    Typography: (props) => {
      const Component = props.component || 'span';
      return (
        <Component data-testid={props["data-testid"]} role={props.role} style={{ color: props.color }}>
          {props.children}
        </Component>
      );
    },
    Alert: (props) => (
      <div role="alert" data-severity={props.severity} data-testid={props["data-testid"] || "alert"}>
        {props.children}
      </div>
    ),
  };
});

// Setup global matchMedia mock
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

describe("Maintenance — Create Request flow", () => {
  beforeEach(() => {
    mockFetchRequests.mockClear();
    mockCreateRequest.mockClear();
    mockUpdatePageTitle.mockClear();
    jest.clearAllMocks();
  });

  const renderPage = () => {
    return renderWithProviders(<Maintenance />);
  };

  test("opens New Request dialog when header button is clicked", async () => {
    renderPage();
    
    // Find the button in the header
    const headerAction = screen.getByTestId("header-action");
    const addButton = headerAction.querySelector("button");
    expect(addButton).toBeInTheDocument();
    
    // Click the button
    fireEvent.click(addButton);
    
    // Dialog should appear
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  test("validates required fields before submission", async () => {
    renderPage();

    // Open the dialog
    const headerAction = screen.getByTestId("header-action");
    const addButton = headerAction.querySelector("button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");
    
    // Submit with empty fields
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Expect validation errors (at least one alert with error message)
    await waitFor(() => {
      const errorMessages = screen.getAllByRole("alert");
      expect(errorMessages.length).toBeGreaterThan(0);
    });
    
    // Dialog should still be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    
    // API should not be called
    expect(mockCreateRequest).not.toHaveBeenCalled();
  });

  test("creates new request with valid data", async () => {
    renderPage();

    // Open the dialog
    const headerAction = screen.getByTestId("header-action");
    const addButton = headerAction.querySelector("button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");

    // Fill the form
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    const descriptionInput = screen.getByTestId("description-input");
    fireEvent.change(descriptionInput, { target: { value: "Test Description" } });
    
    const propertySelect = screen.getByTestId("property-select-input");
    fireEvent.change(propertySelect, { target: { value: "prop1" } });
    
    const prioritySelect = screen.getByTestId("priority-select-input");
    fireEvent.change(prioritySelect, { target: { value: "medium" } });

    // Submit the form
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Verify API was called with correct data
    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith(expect.objectContaining({
        title: "Test Request",
        description: "Test Description",
        property_id: "prop1",
        priority: "medium"
      }));
    });

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("shows error when request creation fails", async () => {
    // Override mockCreateRequest to reject
    mockCreateRequest.mockRejectedValueOnce({
      message: "API Error"
    });

    renderPage();

    // Open the dialog
    const headerAction = screen.getByTestId("header-action");
    const addButton = headerAction.querySelector("button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");

    // Fill required fields
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    const propertySelect = screen.getByTestId("property-select-input");
    fireEvent.change(propertySelect, { target: { value: "prop1" } });

    // Submit the form
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Expect error message
    await waitFor(() => {
      const errorMessages = screen.getAllByRole("alert");
      expect(errorMessages.length).toBeGreaterThan(0);
    });
    
    // Dialog should still be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("cancels request creation and closes dialog", async () => {
    renderPage();

    // Open the dialog
    const headerAction = screen.getByTestId("header-action");
    const addButton = headerAction.querySelector("button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");
    
    // Fill part of the form
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    // Click cancel
    const cancelButton = screen.getByTestId("cancel-button");
    fireEvent.click(cancelButton);
    
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    
    // API should not be called
    expect(mockCreateRequest).not.toHaveBeenCalled();
  });
});

// frontend/src/__tests__/maintenance/MaintenanceCreateSimple.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import MaintenanceCreate from "../../pages/maintenance/MaintenanceCreate";

// Mock functions for API calls and navigation
const mockFetchRequests = jest.fn().mockResolvedValue([]);
const mockCreateRequest = jest.fn().mockImplementation(async (data) => {
  return { id: "new-id", ...data };
});
const mockUpdatePageTitle = jest.fn();
const mockNavigate = jest.fn();

// Mock react-router-dom before imports
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock context hooks
jest.mock("../../context", () => ({
  useMaintenance: () => ({
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
    maintenanceTypes: [
      { id: "plumbing", name: "Plumbing" },
      { id: "electrical", name: "Electrical" },
      { id: "hvac", name: "HVAC" },
    ],
  }),
  useApp: () => ({ 
    updatePageTitle: mockUpdatePageTitle,
    showNotification: jest.fn()
  }),
  useProperty: () => ({ 
    properties: [
      { id: "prop1", name: "Property 1" },
      { id: "prop2", name: "Property 2" },
    ],
    loading: false,
    error: null
  })
}));

// Mock components to simplify test
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, subtitle, action }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {action && <div data-testid="header-action-container">{action}</div>}
    </header>
  ),
  MaintenanceRequestCard: ({ request, onClick }) => (
    <div 
      data-testid={`maintenance-card-${request?.id || 'unknown'}`} 
      onClick={onClick}
      role="button"
    >
      {request?.title || 'Unknown Title'} - {request?.status || 'unknown'}
    </div>
  ),
  Empty: ({ title, action, actionLabel }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      {action && (
        <button onClick={action} data-testid="empty-action-button">{actionLabel}</button>
      )}
    </div>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Import component after all mocks are set up
import Maintenance from "../../pages/Maintenance";

// Setup matchMedia mock
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

// Add minimal test to ensure we have at least one test in the file
describe('MaintenanceCreate', () => {
  it('renders', () => {
    const { container } = renderWithProviders(<MaintenanceCreate />);
    expect(container).toBeTruthy();
  });
});

// Simplified Material UI mock components using function declarations
jest.mock("@mui/material", () => {
  // Original module
  const originalModule = jest.requireActual("@mui/material");
  
  // Mock components
  function Button(props) {
    return (
      <button
        onClick={props.onClick}
        data-testid={props["data-testid"]}
        type={props.type || "button"}
        disabled={props.disabled}
      >
        {props.children}
      </button>
    );
  }
  
  function TextField(props) {
    return (
      <div>
        <label htmlFor={props.name}>{props.label}</label>
        <input
          data-testid={props["data-testid"] || `input-${props.name || props.label}`}
          id={props.name}
          name={props.name}
          value={props.value || ''}
          onChange={props.onChange}
        />
      </div>
    );
  }
  
  function Dialog(props) {
    return props.open ? (
      <div role="dialog" data-testid="dialog">
        {props.children}
      </div>
    ) : null;
  }
  
  function DialogTitle(props) {
    return <h2>{props.children}</h2>;
  }
  
  function DialogContent(props) {
    return <div data-testid="dialog-content">{props.children}</div>;
  }
  
  function DialogActions(props) {
    return <div data-testid="dialog-actions">{props.children}</div>;
  }
  
  function FormControl(props) {
    return <div>{props.children}</div>;
  }
  
  function Select(props) {
    // For our test, populate the select options directly
    const optionsMap = {
      'property_id': [
        { value: '', label: 'Select a property' },
        { value: 'prop1', label: 'Property 1' },
        { value: 'prop2', label: 'Property 2' },
      ],
      'maintenance_type': [
        { value: '', label: 'Select maintenance type' },
        { value: 'plumbing', label: 'Plumbing' },
        { value: 'electrical', label: 'Electrical' },
        { value: 'hvac', label: 'HVAC' },
      ],
      'unit_id': [
        { value: '', label: 'None' },
      ],
    };
    
    // Use pre-defined options for certain selects
    const options = optionsMap[props.name] || [];
    
    return (
      <select
        name={props.name}
        value={props.value || ''}
        data-testid={`select-${props.name}`}
        onChange={(e) => props.onChange && props.onChange({ target: { name: props.name, value: e.target.value }})}
      >
        {options.length > 0 ? 
          options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          )) :
          props.children
        }
      </select>
    );
  }
  
  function MenuItem(props) {
    // Simplified implementation - just render the children as string to avoid DOM nesting issues
    return <option value={props.value}>{props.children && typeof props.children === 'object' ? 'Select option' : props.children}</option>;
  }
  
  function FormHelperText(props) {
    return <div role="alert">{props.children}</div>;
  }
  
  function Typography(props) {
    const Tag = props.component || 'span';
    return <Tag data-testid={props["data-testid"]}>{props.children}</Tag>;
  }
  
  function Alert(props) {
    return <div role="alert" data-severity={props.severity}>{props.children}</div>;
  }
  
  // Return all the mocks
  return {
    ...originalModule,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel: (props) => <label>{props.children}</label>,
    Select,
    MenuItem,
    FormHelperText,
    Typography,
    Alert
  };
});

describe("Maintenance Create Request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test("should display page header with add button", () => {
    renderWithProviders(<Maintenance />);
    
    // Check page header
    expect(screen.getByTestId("page-header")).toBeInTheDocument();
    expect(screen.getByTestId("header-action-container")).toBeInTheDocument();
  });
  
  test("should open dialog when add button is clicked", async () => {
    renderWithProviders(<Maintenance />);
    
    // Find and click add button
    const headerAction = screen.getByTestId("header-action-container");
    const addButton = headerAction.querySelector("button");
    fireEvent.click(addButton);
    
    // Dialog should be open
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  test("should show validation errors when submitting empty form", async () => {
    renderWithProviders(<Maintenance />);
    
    // Open dialog
    const headerAction = screen.getByTestId("header-action-container");
    const addButton = headerAction.querySelector("button");
    fireEvent.click(addButton);
    
    // Dialog should appear
    await screen.findByRole("dialog");
    
    // Find and click submit button
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBeGreaterThan(0);
    });
    
    // Dialog should still be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("should create maintenance request with valid data", async () => {
    renderWithProviders(<Maintenance />);
    
    // Open dialog
    const headerAction = screen.getByTestId("header-action-container");
    const addButton = headerAction.querySelector("button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");
    
    // Fill form
    fireEvent.change(screen.getByTestId("title-input"), { 
      target: { value: "Test title" } 
    });
    
    fireEvent.change(screen.getByTestId("description-input"), { 
      target: { value: "Test description" } 
    });
    
    // Select property - this needs to be properly selected
    const propertySelect = screen.getByTestId("select-property_id");
    fireEvent.change(propertySelect, { 
      target: { value: "prop1", name: "property_id" } 
    });
    
    // Select maintenance type - this is required
    const typeSelect = screen.getByTestId("select-maintenance_type");
    fireEvent.change(typeSelect, { 
      target: { value: "plumbing", name: "maintenance_type" } 
    });
    
    // Select priority
    fireEvent.change(screen.getByTestId("select-priority"), { 
      target: { value: "high" } 
    });
    
    // Submit form
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);
    
    // API should be called with form data
    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith(expect.objectContaining({
        title: "Test title",
        description: "Test description",
        property_id: "prop1",
        maintenance_type: "plumbing",
        priority: "high"
      }));
    });
    
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("should close dialog when cancel button is clicked", async () => {
    renderWithProviders(<Maintenance />);
    
    // Open dialog
    const headerAction = screen.getByTestId("header-action-container");
    const addButton = headerAction.querySelector("button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");
    
    // Click cancel button
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

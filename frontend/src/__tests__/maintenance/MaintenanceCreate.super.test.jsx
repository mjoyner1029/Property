// frontend/src/__tests__/maintenance/MaintenanceCreate.super.test.jsx
// Define mock functions first at the top level before any imports
const mockNavigate = jest.fn();
const mockFetchRequests = jest.fn().mockResolvedValue([]);
const mockCreateRequest = jest.fn().mockImplementation(async (data) => {
  return { id: "new-id", ...data };
});
const mockUpdatePageTitle = jest.fn();

// Mock react-router-dom - must be before any imports
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock the context module
jest.mock("../../context", () => ({
  useMaintenance: jest.fn(),
  useApp: jest.fn(),
  useProperty: jest.fn()
}));

// Now import React and testing libraries
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// Import after mocking
import { useMaintenance, useApp, useProperty } from "../../context";
import Maintenance from "../../pages/Maintenance";

// Setup context values after all mocks and functions are defined
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

// Mock MUI components - Avoid referencing React directly in the jest.mock factory
jest.mock("@mui/material", () => {
  // Do not reference React here - must not reference out-of-scope variables
  
  return {
    // Use named function expressions to avoid arrow functions which can't be stringified
    Button: function Button(props) {
      return require('react').createElement(
        'button',
        { 
          onClick: props.onClick,
          'data-testid': props["data-testid"] || "header-action",
          type: props.type,
          variant: props.variant
        },
        props.startIcon, 
        ' ', 
        props.children
      );
    },
    Menu: function Menu(props) {
      const React = require('react');
      return props.open ? React.createElement('div', { 'data-testid': 'menu' }, props.children) : null;
    },
    MenuItem: function MenuItem(props) {
      return require('react').createElement(
        'div', 
        { 
          role: 'menuitem', 
          onClick: props.onClick,
          'data-value': props.value
        }, 
        props.children
      );
    },
    Dialog: function Dialog(props) {
      const React = require('react');
      return props.open ? 
        React.createElement('div', { 
          role: 'dialog', 
          'aria-label': props['aria-label'] || 'dialog' 
        }, props.children) : null;
    },
    DialogTitle: function DialogTitle(props) {
      return require('react').createElement('h2', null, props.children);
    },
    DialogContent: function DialogContent(props) {
      return require('react').createElement('div', null, props.children);
    },
    DialogActions: function DialogActions(props) {
      return require('react').createElement('div', { 'data-testid': 'dialog-actions' }, props.children);
    },
    TextField: function TextField(props) {
      const React = require('react');
      return React.createElement(
        'div', 
        null, 
        React.createElement('label', { htmlFor: props.name }, props.label),
        React.createElement('input', {
          id: props.name,
          name: props.name,
          value: props.value || "",
          onChange: props.onChange,
          'data-testid': `input-${props.name}`,
          'aria-label': props.label,
          placeholder: props.placeholder,
          required: props.required
        })
      );
    },
    Select: function Select(props) {
      const React = require('react');
      // Create a simple select without any complex child processing
      const handleChange = function(e) {
        if (props.onChange) {
          props.onChange({ target: { name: props.name, value: e.target.value } });
        }
      };
      
      return React.createElement(
        'div', 
        null, 
        React.createElement('label', { htmlFor: props.name }, props.label),
        React.createElement(
          'select',
          {
            id: props.name,
            name: props.name,
            value: props.value || "",
            onChange: handleChange,
            'data-testid': `select-${props.name}`,
            'aria-label': props.label
          },
          props.children
        )
      );
    },
    FormControl: function FormControl(props) {
      const React = require('react');
      return React.createElement(
        'div', 
        { style: props.fullWidth ? { width: '100%' } : {} }, 
        props.children
      );
    },
    InputLabel: function InputLabel(props) {
      return require('react').createElement('span', null, props.children);
    },
    FormHelperText: function FormHelperText(props) {
      return require('react').createElement('div', { 'data-testid': 'form-error' }, props.children);
    },
    Alert: function Alert(props) {
      return require('react').createElement(
        'div', 
        { 
          role: 'alert', 
          'data-severity': props.severity, 
          'data-testid': 'alert' 
        }, 
        props.children
      );
    },
    Box: function Box(props) {
      return require('react').createElement('div', null, props.children);
    },
    Grid: function Grid(props) {
      return require('react').createElement('div', null, props.children);
    },
    Typography: function Typography(props) {
      return require('react').createElement('div', null, props.children);
    },
    Tabs: function Tabs(props) {
      return require('react').createElement(
        'div', 
        { 'data-testid': props['data-testid'] || 'status-tabs' }, 
        props.children
      );
    },
    Tab: function Tab(props) {
      return require('react').createElement(
        'button', 
        { 
          'data-testid': props['data-testid'], 
          role: 'tab', 
          'aria-selected': props.value === 'all' 
        }, 
        props.label
      );
    },
    InputAdornment: function InputAdornment(props) {
      return require('react').createElement('div', null, props.children);
    },
    ListSubheader: function ListSubheader(props) {
      return require('react').createElement('div', { role: 'heading' }, props.children);
    },
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
    fireEvent.change(getInputByName(/title/i), {
      target: { value: "Broken Window" },
    });
    
    fireEvent.change(getInputByName(/description/i), {
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

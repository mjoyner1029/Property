// frontend/src/__tests__/maintenance/MaintenanceCreate.final.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import { getInputByName, getSelectByName } from "../../test/utils/muiTestUtils";

// Define mock functions first
const mockFetchRequests = jest.fn().mockResolvedValue([]);
const mockCreateRequest = jest.fn().mockImplementation(async (data) => {
  return { id: "new-id", ...data };
});
const mockUpdatePageTitle = jest.fn();
const mockNavigate = jest.fn();

// Mock react-router-dom - must come before any component imports
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

// Import after mocking
import { useMaintenance, useApp, useProperty } from "../../context";
import Maintenance from "../../pages/Maintenance";

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

// Set up the context hook implementations
useMaintenance.mockImplementation(() => maintenanceContextValue);
useApp.mockImplementation(() => appContextValue);
useProperty.mockImplementation(() => propertyContextValue);

// Mock components
jest.mock("../../components", () => {
  const originalModule = jest.requireActual("../../components");
  return {
    ...originalModule,
    Layout: ({ children }) => <div data-testid="layout">{children}</div>,
    PageHeader: ({ title, subtitle, action }) => (
      <header data-testid="page-header">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {action}
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
            id="empty-action-button"
          >
            {actionText}
          </button>
        )}
      </div>
    ),
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  };
});

// Mock MUI
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  
  return {
    ...actual,
    Button: function Button(props) {
      const React = require('react');
      const { children, onClick, startIcon, "data-testid": testId, ...rest } = props;
      return React.createElement(
        'button',
        {
          onClick: onClick,
          'data-testid': testId,
          ...rest
        },
        startIcon,
        ' ',
        children
      );
    },
    Menu: function Menu(props) {
      const React = require('react');
      return props.open ? 
        React.createElement('div', { 'data-testid': 'menu' }, props.children) : null;
    },
    MenuItem: function MenuItem(props) {
      const React = require('react');
      return React.createElement(
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
        React.createElement(
          'div',
          {
            role: 'dialog',
            'aria-label': props['aria-label'] || 'dialog'
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
      return React.createElement('div', { 'data-testid': 'dialog-actions' }, props.children);
    },
    TextField: function TextField(props) {
      const React = require('react');
      const { label, name, value, onChange, multiline, fullWidth, ...rest } = props;
      
      return React.createElement(
        'div',
        null,
        React.createElement('label', { htmlFor: name }, label),
        React.createElement(
          'input',
          {
            id: name,
            name: name,
            value: value || '',
            onChange: onChange,
            'data-testid': `input-${name}`,
            'aria-label': label,
            ...rest
          }
        )
      );
    },
    Select: function Select(props) {
      const React = require('react');
      const { name, value, onChange, label, children, ...rest } = props;
      
      // Helper function to convert MenuItem children to option elements
      const convertOptions = (children) => {
        return React.Children.toArray(children)
          .filter(child => React.isValidElement(child) && child.props && 'value' in child.props)
          .map((child, idx) => (
            React.createElement(
              'option',
              { key: idx, value: child.props.value },
              child.props.children
            )
          ));
      };
      
      const options = convertOptions(children);
      
      return React.createElement(
        'div',
        null,
        React.createElement('label', { htmlFor: name }, label),
        React.createElement(
          'select',
          {
            id: name,
            name: name,
            value: value || '',
            onChange: (e) => onChange && onChange({ target: { name, value: e.target.value } }),
            'data-testid': `select-${name}`,
            'aria-label': label,
            ...rest
          },
          options
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
      const React = require('react');
      return React.createElement('span', null, props.children);
    },
    FormHelperText: function FormHelperText(props) {
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'form-error' }, props.children);
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
    Box: function Box(props) {
      const React = require('react');
      return React.createElement('div', null, props.children);
    },
    Grid: function Grid(props) {
      const React = require('react');
      return React.createElement('div', null, props.children);
    },
    Typography: function Typography(props) {
      const React = require('react');
      return React.createElement('div', null, props.children);
    },
    Tabs: function Tabs(props) {
      const React = require('react');
      return React.createElement(
        'div',
        { 'data-testid': 'status-tabs' },
        props.children
      );
    },
    Tab: function Tab(props) {
      const React = require('react');
      return React.createElement(
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
      const React = require('react');
      return React.createElement('div', null, props.children);
    },
    ListSubheader: function ListSubheader(props) {
      const React = require('react');
      return React.createElement('div', { role: 'heading' }, props.children);
    },
  };
});

// Mock MUI icons
jest.mock("@mui/icons-material/Add", () => ({
  __esModule: true,
  default: function AddIcon() {
    const React = require('react');
    return React.createElement('span', null, "AddIcon");
  }
}));
jest.mock("@mui/icons-material/Search", () => ({
  __esModule: true,
  default: function SearchIcon() {
    const React = require('react');
    return React.createElement('span', null, "SearchIcon");
  }
}));
jest.mock("@mui/icons-material/FilterList", () => ({
  __esModule: true,
  default: function FilterListIcon() {
    const React = require('react');
    return React.createElement('span', null, "FilterListIcon");
  }
}));
jest.mock("@mui/icons-material/Build", () => ({
  __esModule: true,
  default: function BuildIcon() {
    const React = require('react');
    return React.createElement('span', null, "BuildIcon");
  }
}));

const renderPage = () => {
  // Clear any leftover dialogs from previous tests
  document.body.innerHTML = '';
  
  // Reset our context mocks for each test
  jest.mocked(useMaintenance).mockImplementation(() => maintenanceContextValue);
  jest.mocked(useApp).mockImplementation(() => appContextValue);
  jest.mocked(useProperty).mockImplementation(() => propertyContextValue);
  
  // Force re-rendering of the component to ensure fresh mocks
  return renderWithProviders(<Maintenance />, { route: "/maintenance" });
};

// Helper function to find and click the New Request button
const findNewRequestButton = () => {
  // Try multiple strategies to find the button
  let button;
  
  try {
    // First try to find by test ID
    const headerAction = screen.queryByTestId("header-action");
    if (headerAction) {
      if (headerAction.tagName === 'BUTTON') {
        return headerAction;
      }
      const btn = headerAction.querySelector("button");
      if (btn) return btn;
    }
  } catch (e) {
    console.log("Error finding by test ID:", e);
  }
  
  // Second, try to find by role
  try {
    return screen.getByRole("button", { name: /new request|add request|create request/i });
  } catch (e) {
    console.log("Error finding by role:", e);
  }
  
  // Last resort
  const allButtons = screen.queryAllByRole("button");
  for (const btn of allButtons) {
    if (btn.textContent?.match(/new|add|create/i)) {
      return btn;
    }
  }
  
  throw new Error("Could not find New Request button");
};

describe("Maintenance — Create Request flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchRequests.mockClear();
    mockCreateRequest.mockClear();
    mockUpdatePageTitle.mockClear();
  });

  test("opens New Request dialog from header", () => {
    renderWithProviders(<Maintenance />);

    // Find and click the New Request button
    const newRequestButton = findNewRequestButton();
    fireEvent.click(newRequestButton);
    
    // Dialog should have title and buttons
    expect(screen.getByText(/Create Maintenance Request/i)).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
  });

  test("creates a new request successfully", async () => {
    mockCreateRequest.mockResolvedValueOnce({ id: "new-id", status: "open" });
    mockFetchRequests.mockResolvedValueOnce([]);
    
    renderPage();

    // Open dialog
    const newRequestButton = findNewRequestButton();
    fireEvent.click(newRequestButton);
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

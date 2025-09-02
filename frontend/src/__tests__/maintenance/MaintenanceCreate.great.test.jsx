import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Now we can import our components
import Maintenance from "../../pages/Maintenance";
import MaintenanceCreate from "../../pages/maintenance/MaintenanceCreate";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

// Mock functions FIRST
const mockFetchRequests = jest.fn().mockResolvedValue([]);
const mockCreateRequest = jest.fn().mockResolvedValue({
  id: "new-request-123",
  title: "Test Request",
  description: "Test Description",
  status: "pending",
  priority: "medium",
  created_at: "2023-01-01T00:00:00Z"
});

// Mock dependencies before importing any components
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    Dialog: ({ open, children, ...props }) => {
      const React = require('react');
      return open ? <div role="dialog" data-testid="dialog" {...props}>{children}</div> : null;
    },
    DialogTitle: ({ children }) => {
      const React = require('react');
      return <div data-testid="dialog-title">{children}</div>;
    },
    DialogContent: ({ children }) => {
      const React = require('react');
      return <div data-testid="dialog-content">{children}</div>;
    },
    DialogActions: ({ children }) => {
      const React = require('react');
      return <div data-testid="dialog-actions">{children}</div>;
    },
    Select: ({ value, onChange, children, inputProps, name, label, error, ...rest }) => {
      const React = require('react');
      const testId = inputProps?.["data-testid"] || `${name}-select`;
      return (
        <select 
          data-testid={testId}
          value={value || ""}
          onChange={onChange}
          name={name}
          aria-label={label}
          {...rest}
        >
          {Array.isArray(children) ? children : [children]}
        </select>
      );
    },
    MenuItem: ({ value, children }) => {
      const React = require('react');
      return (
        <option value={value}>{children}</option>
      );
    },
    FormHelperText: ({ children }) => {
      const React = require('react');
      return children ? (
        <div data-testid="form-helper-text" role="alert" className="mui-form-helper-text">
          {children}
        </div>
      ) : null;
    },
  };
});

// Important: mock the contexts before importing components that use them
jest.mock("../../context", () => ({
  useMaintenance: jest.fn(() => ({
    requests: [],
    maintenanceRequests: [],
    loading: false,
    error: null,
    fetchRequests: mockFetchRequests,
    createRequest: mockCreateRequest,
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: jest.fn(),
    showNotification: jest.fn(),
  })),
  useProperty: jest.fn(() => ({
    properties: [
      { id: "prop1", name: "Property 1" },
      { id: "prop2", name: "Property 2" },
    ],
    loading: false,
    error: null,
  })),
}));

// Mock the components
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, action }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {action && <div data-testid="header-action">{action}</div>}
    </div>
  ),
  MaintenanceRequestCard: ({ request, onClick }) => (
    <div 
      data-testid={`maintenance-card-${request.id}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <h3>{request.title}</h3>
      <p>{request.description}</p>
      <p>{request.status}</p>
      <p>{request.priority}</p>
      <p>{request.property?.name}</p>
    </div>
  ),
  Empty: ({ 
    title, 
    description, 
    icon, 
    action, 
    actionLabel, 
    actionTestId 
  }) => (
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

// Setup global matchMedia mock
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

// Minimal test to ensure the file has at least one test
describe("MaintenanceCreate component", () => {
  it('renders', () => {
    const { container } = renderWithProviders(<MaintenanceCreate />);
    expect(container).toBeTruthy();
  });
});

describe("Maintenance — Create Request flow", () => {
  beforeEach(() => {
    mockFetchRequests.mockClear();
    mockCreateRequest.mockClear();
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <MemoryRouter initialEntries={["/maintenance"]}>
        <Routes>
          <Route path="/maintenance" element={<Maintenance />} />
        </Routes>
      </MemoryRouter>
    );
  };
  
  // Helper function to find and click the "New Request" button
  const clickNewRequestButton = () => {
    // Try multiple strategies to find the button
    let addButton;
    
    // Strategy 1: Look for the button by test ID inside the header action
    try {
      const headerAction = screen.getByTestId("header-action");
      const button = headerAction.querySelector("button");
      if (button) {
        addButton = button;
      }
    } catch (e) {
      // Suppress error and try next strategy
    }
    
    // Strategy 2: Look for a button with specific text
    if (!addButton) {
      try {
        addButton = screen.getByRole("button", { name: /new request/i });
      } catch (e) {
        // Suppress error and try next strategy
      }
    }
    
    // Strategy 3: Look for specific test ID directly
    if (!addButton) {
      try {
        addButton = screen.getByTestId("header-action-button");
      } catch (e) {
        // Suppress error
      }
    }
    
    if (!addButton) {
      throw new Error("Could not find the New Request button");
    }
    
    fireEvent.click(addButton);
    return addButton;
  };

  test("opens New Request dialog from header", async () => {
    renderComponent();
    
    // Click the New Request button using our helper
    clickNewRequestButton();
    
    // Verify the dialog opens
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/create maintenance request/i)).toBeInTheDocument();
  });

  test("validates required fields before submission", async () => {
    renderComponent();

    // Open the dialog using our helper
    clickNewRequestButton();
    
    const dialog = await screen.findByRole("dialog");
    
    // Try to submit the form without filling required fields
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Expect validation errors by looking for form helper text elements
    await waitFor(() => {
      expect(screen.getAllByRole("alert")).toHaveLength(2); // We should have at least 2 error messages
    });
    
    // Expect dialog to still be open
    expect(dialog).toBeInTheDocument();
    
    // Expect createRequest not to have been called
    expect(mockCreateRequest).not.toHaveBeenCalled();
  });

  test("creates new request with valid data", async () => {
    renderComponent();

    // Open the dialog using our helper
    clickNewRequestButton();
    
    await screen.findByRole("dialog");

    // Fill out the form
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    const descriptionInput = screen.getByTestId("description-input");
    fireEvent.change(descriptionInput, { target: { value: "Test Description" } });
    
    // Select property using the proper test ID from the component
    const propertySelect = screen.getByTestId("property-select-input");
    fireEvent.change(propertySelect, { target: { value: "prop1" } });
    
    // Select priority using the proper test ID from the component
    const prioritySelect = screen.getByTestId("priority-select-input");
    fireEvent.change(prioritySelect, { target: { value: "medium" } });

    // Submit the form
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Verify API call was made with correct data
    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        title: "Test Request",
        description: "Test Description",
        property_id: "prop1",
        priority: "medium"
      });
    });

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Request list should have been refreshed
    expect(mockFetchRequests).toHaveBeenCalledTimes(2); // Initial load + after creation
  });

  test("shows API error when creation fails", async () => {
    // Override the mock to reject
    mockCreateRequest.mockRejectedValueOnce({
      message: "API Error"
    });

    renderComponent();

    // Open the dialog using our helper
    clickNewRequestButton();
    
    await screen.findByRole("dialog");

    // Fill out the form
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    // Select property using the proper test ID from the component
    const propertySelect = screen.getByTestId("property-select-input");
    fireEvent.change(propertySelect, { target: { value: "prop1" } });

    // Submit the form
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Expect error alert or message to be shown
    await waitFor(() => {
      // Look for either a specific error alert or any error text in the dialog
      const errorElements = screen.queryAllByRole("alert");
      expect(errorElements.length).toBeGreaterThan(0);
      
      // Check that at least one of them contains our error message
      const hasError = errorElements.some(el => 
        el.textContent.toLowerCase().includes('error')
      );
      expect(hasError).toBe(true);
    });

    // Dialog should still be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("cancels request creation and closes dialog", async () => {
    renderComponent();

    // Open the dialog using our helper
    clickNewRequestButton();
    
    await screen.findByRole("dialog");
    
    // Fill out part of the form
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    // Click cancel
    const cancelButton = screen.getByTestId("cancel-button");
    fireEvent.click(cancelButton);
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    
    // API should not be called
    expect(mockCreateRequest).not.toHaveBeenCalled();
  });
});

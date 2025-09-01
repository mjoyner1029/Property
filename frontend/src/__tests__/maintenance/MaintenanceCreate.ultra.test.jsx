import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Now we can import our components
import Maintenance from "../../pages/Maintenance";

// Mock dependencies before importing any components
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    Dialog: ({ open, children, ...props }) => (
      open ? <div role="dialog" data-testid="dialog" {...props}>{children}</div> : null
    ),
    DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
    DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
    DialogActions: ({ children }) => <div data-testid="dialog-actions">{children}</div>,
    Select: ({ value, onChange, children, ...rest }) => (
      <select 
        data-testid="mui-select"
        value={value || ""}
        onChange={onChange}
        {...rest}
      >
        {children}
      </select>
    ),
    MenuItem: ({ value, children }) => (
      <option value={value}>{children}</option>
    ),
  };
});

// Mock all required context providers
const mockFetchRequests = jest.fn().mockResolvedValue([]);
const mockCreateRequest = jest.fn().mockResolvedValue({
  id: "new-request-123",
  title: "Test Request",
  description: "Test Description",
  status: "pending",
  priority: "medium",
  created_at: "2023-01-01T00:00:00Z"
});

// Important: mock the contexts before importing components that use them
jest.mock("../../context/MaintenanceContext", () => ({
  useMaintenanceContext: jest.fn(() => ({
    requests: [],
    loading: false,
    error: null,
    fetchRequests: mockFetchRequests,
    createRequest: mockCreateRequest,
  })),
}));

jest.mock("../../contexts/AppContext", () => ({
  useApp: jest.fn(() => ({
    updatePageTitle: jest.fn(),
    showNotification: jest.fn(),
  })),
}));

jest.mock("../../contexts/PropertiesContext", () => ({
  usePropertiesContext: jest.fn(() => ({
    properties: [
      { id: "prop1", name: "Property 1" },
      { id: "prop2", name: "Property 2" },
    ],
    loading: false,
    error: null,
  })),
}));

// Mock the PageHeader component
jest.mock("../../components/PageHeader", () => ({
  __esModule: true,
  default: ({ title, action }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {action && <div data-testid="header-action">{action}</div>}
    </div>
  ),
}));

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
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/maintenance"]}>
        <Routes>
          <Route path="/maintenance" element={<Maintenance />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test("opens New Request dialog from header", async () => {
    renderComponent();

    // Verify the New Request button is visible in the header
    const addButton = screen.getByTestId("header-action-button");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent(/new request/i);
    
    // Click the button and verify dialog opens
    fireEvent.click(addButton);
    
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toHaveTextContent(/new maintenance request/i);
  });

  test("validates required fields before submission", async () => {
    renderComponent();

    // Open the dialog
    const addButton = screen.getByTestId("header-action-button");
    fireEvent.click(addButton);
    
    const dialog = await screen.findByRole("dialog");
    
    // Try to submit the form without filling required fields
    const submitButton = screen.getByTestId("dialog-action-submit");
    fireEvent.click(submitButton);

    // Expect validation errors
    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(screen.getByTestId("title-error")).toBeInTheDocument();
      expect(screen.getByTestId("property-error")).toBeInTheDocument();
    });
    
    // Expect dialog to still be open
    expect(dialog).toBeInTheDocument();
    
    // Expect createRequest not to have been called
    expect(mockCreateRequest).not.toHaveBeenCalled();
  });

  test("creates new request with valid data", async () => {
    renderComponent();

    // Open the dialog
    const addButton = screen.getByTestId("header-action-button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");

    // Fill out the form
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    const descriptionInput = screen.getByTestId("description-input");
    fireEvent.change(descriptionInput, { target: { value: "Test Description" } });
    
    const propertySelect = screen.getByTestId("property-select");
    fireEvent.change(propertySelect, { target: { value: "prop1" } });
    
    const prioritySelect = screen.getByTestId("priority-select");
    fireEvent.change(prioritySelect, { target: { value: "medium" } });

    // Submit the form
    const submitButton = screen.getByTestId("dialog-action-submit");
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

    // Open the dialog
    const addButton = screen.getByTestId("header-action-button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");

    // Fill out the form
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    const propertySelect = screen.getByTestId("property-select");
    fireEvent.change(propertySelect, { target: { value: "prop1" } });

    // Submit the form
    const submitButton = screen.getByTestId("dialog-action-submit");
    fireEvent.click(submitButton);

    // Expect error alert to be shown
    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(screen.getByTestId("error-alert")).toBeInTheDocument();
      expect(screen.getByTestId("error-alert")).toHaveTextContent(/API Error/i);
    });

    // Dialog should still be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("cancels request creation and closes dialog", async () => {
    renderComponent();

    // Open the dialog
    const addButton = screen.getByTestId("header-action-button");
    fireEvent.click(addButton);
    
    await screen.findByRole("dialog");
    
    // Fill out part of the form
    const titleInput = screen.getByTestId("title-input");
    fireEvent.change(titleInput, { target: { value: "Test Request" } });
    
    // Click cancel
    const cancelButton = screen.getByTestId("dialog-action-cancel");
    fireEvent.click(cancelButton);
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    
    // API should not be called
    expect(mockCreateRequest).not.toHaveBeenCalled();
  });
});

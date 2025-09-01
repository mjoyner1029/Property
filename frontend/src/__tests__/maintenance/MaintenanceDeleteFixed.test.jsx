import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

// Mock the hooks first
import { useMaintenance, useApp } from "../../contexts";

// Import our mock MaintenanceDetail component
import MaintenanceDetail from "./mockMaintenanceDetail";

// Define mock request for the implementation
const mockRequest = {
  id: "request123",
  title: "Test Request",
  description: "Test description",
  status: "pending"
};

// Mock context hooks
const mockFetchRequests = jest.fn().mockImplementation(() => Promise.resolve());
const mockUpdateRequest = jest.fn().mockImplementation((id, data) => Promise.resolve({ ...mockRequest, ...data }));
const mockDeleteRequest = jest.fn().mockImplementation(() => Promise.resolve(true));
const mockUpdatePageTitle = jest.fn();

// Create the context mocks
jest.mock("../../contexts", () => ({
  useMaintenance: jest.fn(),
  useApp: jest.fn()
}));

// Mock the components
jest.mock("src/components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ actionText, onActionClick, title, subtitle, children }) => (
    <header data-testid="page-header">
      <h1>{title} {subtitle && `- ${subtitle}`}</h1>
      {actionText && <button onClick={onActionClick}>{actionText}</button>}
      {children}
    </header>
  ),
  ConfirmDialog: ({ open, title, message, onConfirm, onCancel }) => (
    open ? (
      <div role="dialog" aria-modal="true" data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <div>
          <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
          <button onClick={onConfirm} data-testid="confirm-button">Confirm</button>
        </div>
      </div>
    ) : null
  )
}));

describe("MaintenanceDelete", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup the maintenance context mock
    useMaintenance.mockReturnValue({
      maintenanceRequests: [mockRequest],
      loading: false,
      error: null,
      fetchRequests: mockFetchRequests,
      updateRequest: mockUpdateRequest,
      deleteRequest: mockDeleteRequest
    });
    
    // Setup the app context mock
    useApp.mockReturnValue({
      updatePageTitle: mockUpdatePageTitle
    });
  });

  test("shows delete confirmation dialog when delete button is clicked", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
      </Routes>,
      {
        route: `/maintenance/${mockRequest.id}`
      }
    );
    
    // Find and click the delete button
    const deleteButton = await screen.findByTestId("delete-button");
    fireEvent.click(deleteButton);
    
    // Check that the confirmation dialog appears
    const dialog = await screen.findByTestId("confirm-dialog");
    expect(dialog).toBeInTheDocument();
  });

  test("closes the dialog when cancel is clicked", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
      </Routes>,
      {
        route: `/maintenance/${mockRequest.id}`
      }
    );
    
    // Find and click the delete button to open the dialog
    const deleteButton = await screen.findByTestId("delete-button");
    fireEvent.click(deleteButton);
    
    // Find and click the cancel button
    const cancelButton = await screen.findByTestId("cancel-button");
    fireEvent.click(cancelButton);
    
    // Check that the dialog is no longer in the document
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });
  });
});

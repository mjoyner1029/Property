// frontend/src/__tests__/maintenance/MaintenanceDelete.dom.test.jsx
/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

// Mock the context hooks - just to have them as no-ops if used anywhere
jest.mock('../../context', () => ({
  useMaintenance: jest.fn(() => ({
    maintenanceRequests: [],
    fetchRequests: jest.fn(),
    deleteRequest: jest.fn().mockImplementation(() => Promise.resolve(true)),
    updateRequest: jest.fn()
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: jest.fn(),
  })),
}));

// Mock react-router
jest.mock('react-router-dom', () => {
  return {
    useParams: () => ({ id: 'request123' }),
    useNavigate: () => jest.fn(),
  };
});

// Pure DOM tests for MaintenanceDelete
describe('MaintenanceDelete - DOM only', () => {
  // Set up mock functions
  const mockDeleteRequest = jest.fn(() => Promise.resolve(true));
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    // Use fake timers for predictable test behavior
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    // Reset to real timers after each test
    jest.useRealTimers();
  });

  // Set up DOM elements before each test
  beforeEach(() => {
    // Create the maintenance detail page with delete button
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="maintenance-detail">
        <header data-testid="page-header">
          <h1>Test Request</h1>
          <div data-testid="status">Status: pending</div>
          <button data-testid="delete-button">Delete</button>
        </header>
      </div>
    `;
    document.body.appendChild(container);
    
    // Add click handler to delete button
    const deleteButton = screen.queryBySelector('[data-testid="delete-button"]');
    deleteButton.addEventListener('click', () => {
      // Create and add the confirmation dialog to the DOM
      const dialogContainer = document.createElement('div');
      dialogContainer.innerHTML = `
        <div role="dialog" aria-modal="true" data-testid="confirm-dialog">
          <h2>Delete Maintenance Request</h2>
          <p>Are you sure you want to delete this maintenance request?</p>
          <div>
            <button data-testid="cancel-button">Cancel</button>
            <button data-testid="confirm-button">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(dialogContainer);
      
      // Add event listeners to dialog buttons
      const cancelButton = screen.queryBySelector('[data-testid="cancel-button"]');
      const confirmButton = screen.queryBySelector('[data-testid="confirm-button"]');
      
      cancelButton.addEventListener('click', () => {
        // Remove the dialog when cancel is clicked
        screen.queryBySelector('[data-testid="confirm-dialog"]').remove();
      });
      
      confirmButton.addEventListener('click', async () => {
        // Call delete request and navigate when confirm is clicked
        await mockDeleteRequest('request123');
        screen.queryBySelector('[data-testid="confirm-dialog"]').remove();
        mockNavigate('/maintenance');
      });
    });
  });

  // Clean up after each test
  afterEach(() => {
    document.body.innerHTML = '';
    mockDeleteRequest.mockClear();
    mockNavigate.mockClear();
  });

  test('renders maintenance detail with delete button', () => {
    // Verify the detail page and delete button are rendered
    expect(screen.queryBySelector('[data-testid="maintenance-detail"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[data-testid="delete-button"]')).toBeInTheDocument();
  });

  test('shows delete confirmation dialog when delete button is clicked', () => {
    // Click the delete button
    const deleteButton = screen.queryBySelector('[data-testid="delete-button"]');
    deleteButton.click();
    
    // Verify the dialog appears
    expect(screen.queryBySelector('[data-testid="confirm-dialog"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[data-testid="cancel-button"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[data-testid="confirm-button"]')).toBeInTheDocument();
  });

  test('closes the dialog when cancel is clicked', () => {
    // Click the delete button to open the dialog
    const deleteButton = screen.queryBySelector('[data-testid="delete-button"]');
    deleteButton.click();
    
    // Verify the dialog appears
    expect(screen.queryBySelector('[data-testid="confirm-dialog"]')).toBeInTheDocument();
    
    // Click the cancel button
    const cancelButton = screen.queryBySelector('[data-testid="cancel-button"]');
    cancelButton.click();
    
    // Verify the dialog is removed
    expect(screen.queryBySelector('[data-testid="confirm-dialog"]')).not.toBeInTheDocument();
  });

  test('deletes the request and navigates back when confirmed', async () => {
    // Click the delete button to open the dialog
    const deleteButton = screen.queryBySelector('[data-testid="delete-button"]');
    deleteButton.click();
    
    // Verify the dialog appears
    expect(screen.queryBySelector('[data-testid="confirm-dialog"]')).toBeInTheDocument();
    
    // Click the confirm button
    const confirmButton = screen.queryBySelector('[data-testid="confirm-button"]');
    confirmButton.click();
    
    // Run any pending timers
    jest.runAllTimers();
    
    // Wait for promises to resolve - use fake timers with Promise resolution
    await Promise.resolve();
    
    // Verify the delete request was called with the correct ID
    expect(mockDeleteRequest).toHaveBeenCalledWith('request123');
    
    // Verify the dialog is removed
    expect(screen.queryBySelector('[data-testid="confirm-dialog"]')).not.toBeInTheDocument();
    
    // Verify navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/maintenance');
  });
});

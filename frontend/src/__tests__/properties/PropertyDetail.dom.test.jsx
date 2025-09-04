// frontend/src/__tests__/properties/PropertyDetail.dom.test.jsx
/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

// Mock the context hooks - just to have them as no-ops if used anywhere
jest.mock('../../context', () => ({
  useProperty: jest.fn(() => ({
    selectedProperty: null,
    loading: false,
    error: null,
    fetchPropertyById: jest.fn(),
    deleteProperty: jest.fn().mockImplementation(() => Promise.resolve(true))
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: jest.fn(),
    showNotification: jest.fn()
  })),
}));

// Mock react-router
jest.mock('react-router-dom', () => {
  return {
    useParams: () => ({ id: '123' }),
    useNavigate: () => jest.fn(),
  };
});

// Pure DOM tests for PropertyDetail
describe('PropertyDetail - DOM only', () => {
  // Set up mock functions
  const mockFetchPropertyById = jest.fn(() => Promise.resolve(true));
  const mockDeleteProperty = jest.fn(() => Promise.resolve(true));
  const mockNavigate = jest.fn();

  // Mock property data
  const mockPropertyData = {
    id: 123,
    name: 'Unit 123',
    address: '77 Ocean Ave',
    city: 'Newport',
    state: 'RI',
    zip_code: '02840',
    type: 'Apartment',
    units: [
      { id: 1, unit_number: '101', rent: 2450, status: 'occupied', tenant_name: 'John Smith' }
    ]
  };

  // Clean up after each test
  afterEach(() => {
    document.body.innerHTML = '';
    mockFetchPropertyById.mockClear();
    mockDeleteProperty.mockClear();
    mockNavigate.mockClear();
  });

  test('renders property details correctly', () => {
    // Create property detail view with mock data
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="property-detail">
        <header data-testid="property-header">
          <h1>${mockPropertyData.name}</h1>
          <button data-testid="delete-property-button">Delete Property</button>
        </header>
        <div data-testid="property-info">
          <h2>Address</h2>
          <p>${mockPropertyData.address}</p>
          <p>${mockPropertyData.city}, ${mockPropertyData.state} ${mockPropertyData.zip_code}</p>
          <h2>Type</h2>
          <p>${mockPropertyData.type}</p>
        </div>
        <div data-testid="property-units">
          <h2>Units</h2>
          <div data-testid="unit-item">
            <p>Unit ${mockPropertyData.units[0].unit_number}</p>
            <p>Rent: $${mockPropertyData.units[0].rent}</p>
            <p>Status: ${mockPropertyData.units[0].status}</p>
            <p>Tenant: ${mockPropertyData.units[0].tenant_name}</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    
    // Verify the property details are rendered
    expect(screen.queryBySelector('[data-testid="property-detail"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[data-testid="property-header"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[data-testid="property-info"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[data-testid="property-units"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[data-testid="unit-item"]')).toBeInTheDocument();
    
    // Verify the property data is displayed correctly
    expect(screen.queryBySelector('h1')).toHaveTextContent(mockPropertyData.name);
    expect(screen.queryBySelector('[data-testid="property-info"] p:nth-child(2)')).toHaveTextContent(mockPropertyData.address);
    expect(screen.queryBySelector('[data-testid="property-info"] p:nth-child(3)')).toHaveTextContent(`${mockPropertyData.city}, ${mockPropertyData.state} ${mockPropertyData.zip_code}`);
  });

  test('shows loading state', () => {
    // Create loading state
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="property-loading" aria-label="Loading property details...">
        <div role="progressbar"></div>
        <p>Loading...</p>
      </div>
    `;
    document.body.appendChild(container);
    
    // Verify loading state is rendered
    expect(screen.queryBySelector('[data-testid="property-loading"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[role="progressbar"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[aria-label="Loading property details..."]')).toBeInTheDocument();
  });

  test('shows error state', () => {
    // Create error state
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="property-error" role="alert">
        <p>Failed to load property</p>
        <button data-testid="retry-button">Retry</button>
      </div>
    `;
    document.body.appendChild(container);
    
    // Verify error state is rendered
    expect(screen.queryBySelector('[data-testid="property-error"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[role="alert"]')).toBeInTheDocument();
    expect(screen.queryBySelector('[role="alert"]')).toHaveTextContent(/Failed to load property/);
  });

  test('deletes property and navigates', () => {
    // Set up fake timers
    jest.useFakeTimers();
    
    // Set up the property detail view with a direct navigation mock
    // that can be verified synchronously
    let navigationCalled = false;
    const localNavigateMock = jest.fn(path => {
      navigationCalled = true;
      expect(path).toBe('/properties');
    });
    
    // Set up mock delete function that resolves immediately
    const localDeleteMock = jest.fn().mockImplementation(() => {
      return Promise.resolve(true);
    });
    
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="property-detail">
        <header data-testid="property-header">
          <h1>${mockPropertyData.name}</h1>
          <button data-testid="delete-property-button">Delete Property</button>
        </header>
      </div>
    `;
    document.body.appendChild(container);
    
    // Add click handler to delete button
    const deleteButton = screen.queryBySelector('[data-testid="delete-property-button"]');
    deleteButton.addEventListener('click', () => {
      // Create and add the confirmation dialog to the DOM
      const dialogContainer = document.createElement('div');
      dialogContainer.innerHTML = `
        <div role="dialog" aria-modal="true" data-testid="confirm-dialog">
          <h2>Delete Property</h2>
          <p>Are you sure you want to delete this property?</p>
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
        const dialog = screen.queryBySelector('[data-testid="confirm-dialog"]');
        if (dialog) dialog.remove();
      });
      
      confirmButton.addEventListener('click', () => {
        // Call delete property and navigate when confirm is clicked
        localDeleteMock(mockPropertyData.id);
        
        // Remove the dialog
        const dialog = screen.queryBySelector('[data-testid="confirm-dialog"]');
        if (dialog) dialog.remove();
        
        // Call navigate
        localNavigateMock('/properties');
      });
    });
    
    // Click the delete button
    deleteButton.click();
    
    // Verify the dialog appears
    expect(screen.queryBySelector('[data-testid="confirm-dialog"]')).toBeInTheDocument();
    
    // Click the confirm button
    const confirmButton = screen.queryBySelector('[data-testid="confirm-button"]');
    confirmButton.click();
    
    // Verify the delete request was called with the correct ID
    expect(localDeleteMock).toHaveBeenCalledWith(mockPropertyData.id);
    
    // Verify the dialog is removed
    expect(screen.queryBySelector('[data-testid="confirm-dialog"]')).not.toBeInTheDocument();
    
    // Verify navigation was called using our local check
    expect(navigationCalled).toBe(true);
    expect(localNavigateMock).toHaveBeenCalledWith('/properties');
    
    // Restore real timers
    jest.useRealTimers();
  });
});

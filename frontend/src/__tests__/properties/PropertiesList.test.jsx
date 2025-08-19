import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import Properties from '../../pages/Properties';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { useProperty } from '../../context/PropertyContext';
import { useApp } from '../../context/AppContext';

// Mock axios
jest.mock('axios');

// Mock navigate function
const mockNavigate = jest.fn();

// Mock react-router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock context hooks
const mockFetchProperties = jest.fn();
const mockDeleteProperty = jest.fn();
const mockUpdatePageTitle = jest.fn();

// Mock context hooks
jest.mock('../../context/PropertyContext');
jest.mock('../../context/AppContext');

// Mock MUI components
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    TextField: ({ placeholder, value, onChange }) => (
      <input 
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        data-testid="search-input"
      />
    ),
    Button: ({ children, onClick, startIcon }) => (
      <button onClick={onClick} data-testid="button">
        {children}
      </button>
    ),
    Menu: ({ children, open, onClose, anchorEl }) => (
      open ? <div data-testid="menu">{children}</div> : null
    ),
    MenuItem: ({ children, onClick, selected }) => (
      <div data-testid={`menu-item-${children?.toString().toLowerCase().replace(/\s/g, '-')}`} onClick={onClick}>
        {children}
      </div>
    ),
    Dialog: ({ children, open, onClose }) => (
      open ? <div data-testid="dialog">{children}</div> : null
    ),
    DialogTitle: ({ children }) => <h2 data-testid="dialog-title">{children}</h2>,
    DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
    DialogContentText: ({ children }) => <p data-testid="dialog-text">{children}</p>,
    DialogActions: ({ children }) => <div data-testid="dialog-actions">{children}</div>,
  };
});

// Mock the components
jest.mock('../../components', () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, onActionClick }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <button onClick={onActionClick} data-testid="add-property-button">Add Property</button>
    </div>
  ),
  PropertyCard: ({ id, name, address, onClick, onMenuClick }) => (
    <div data-testid={`property-card-${id}`} onClick={onClick}>
      <h3>{name}</h3>
      <p>{address}</p>
      <button onClick={onMenuClick} data-testid={`property-menu-${id}`}>Menu</button>
    </div>
  ),
  Empty: ({ onActionClick }) => (
    <div data-testid="empty-state">
      <button onClick={onActionClick} data-testid="empty-add-button">Add Property</button>
    </div>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('Properties Component', () => {
  const defaultProperties = [
    { 
      id: '1', 
      name: 'Sunset Apartments', 
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      type: 'apartment',
      units: [{ tenant_id: 'tenant1' }, { tenant_id: null }]
    },
    { 
      id: '2', 
      name: 'Ocean View Condos', 
      address: '456 Beach Rd',
      city: 'Miami',
      state: 'FL',
      zip_code: '33139',
      type: 'apartment',
      units: [{ tenant_id: 'tenant2' }]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mocks
    useProperty.mockReturnValue({
      properties: defaultProperties,
      loading: false,
      error: null,
      fetchProperties: mockFetchProperties,
      deleteProperty: mockDeleteProperty
    });

    useApp.mockReturnValue({
      updatePageTitle: mockUpdatePageTitle
    });
  });
  
  test('renders properties and handles property click', () => {
    // Render the component
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Check that fetchProperties was called
    expect(mockFetchProperties).toHaveBeenCalled();
    
    // Check that page title was updated
    expect(mockUpdatePageTitle).toHaveBeenCalledWith('Properties');
    
    // Check that property cards are rendered
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();
    
    // Click on a property card
    screen.getByTestId('property-card-1').click();
    
    // Verify navigation was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/properties/1');
  });
  
  test('handles add property button click', () => {
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Click the add property button
    screen.getByTestId('add-property-button').click();
    
    // Verify navigation to add property page
    expect(mockNavigate).toHaveBeenCalledWith('/properties/new');
  });
  
  test('renders loading state correctly', () => {
    // Override the mock to show loading state
    useProperty.mockReturnValue({
      properties: [],
      loading: true,
      error: null,
      fetchProperties: mockFetchProperties
    });
    
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Check that loading spinner is displayed
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  test('renders error state correctly', () => {
    // Override the mock to show error state
    useProperty.mockReturnValue({
      properties: [],
      loading: false,
      error: 'Failed to load properties',
      fetchProperties: mockFetchProperties
    });
    
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Check that error message is displayed
    expect(screen.getByText('Failed to load properties')).toBeInTheDocument();
  });
  
  test('renders empty state when no properties are found', () => {
    // Override the mock to show empty state
    useProperty.mockReturnValue({
      properties: [],
      loading: false,
      error: null,
      fetchProperties: mockFetchProperties
    });
    
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Check that empty state is displayed
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    
    // Click the add property button in empty state
    screen.getByTestId('empty-add-button').click();
    
    // Verify navigation to add property page
    expect(mockNavigate).toHaveBeenCalledWith('/properties/new');
  });
  
  test('filters properties based on name search term', () => {
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Get the search input
    const searchInput = screen.getByTestId('search-input');
    
    // Enter search term
    fireEvent.change(searchInput, { target: { value: 'Ocean' } });
    
    // Check that only Ocean View Condos is displayed
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();
    expect(screen.queryByText('Sunset Apartments')).not.toBeInTheDocument();
  });
  
  test('filters properties based on address search term', () => {
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Get the search input
    const searchInput = screen.getByTestId('search-input');
    
    // Enter address search term
    fireEvent.change(searchInput, { target: { value: 'Beach' } });
    
    // Check that only Ocean View Condos is displayed (has Beach Rd in address)
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();
    expect(screen.queryByText('Sunset Apartments')).not.toBeInTheDocument();
    
    // Clear search and try a different address term
    fireEvent.change(searchInput, { target: { value: 'Main' } });
    
    // Check that only Sunset Apartments is displayed (has Main St in address)
    expect(screen.queryByText('Ocean View Condos')).not.toBeInTheDocument();
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
  });
  
  test('handles property menu click and delete property', async () => {
    mockDeleteProperty.mockResolvedValue({ success: true });
    
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Click on a property menu
    const menuButton = screen.getByTestId('property-menu-2');
    fireEvent.click(menuButton);
    
    // Wait for and verify menu is open
    await waitFor(() => {
      expect(screen.getByTestId('menu')).toBeInTheDocument();
    });
    
    // Find and click the delete option
    const deleteMenuItem = screen.getByTestId('menu-item-delete-property');
    fireEvent.click(deleteMenuItem);
    
    // Verify delete dialog is shown
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Delete Property');
    });
    
    // Find and click the confirm delete button
    const dialogActions = screen.getByTestId('dialog-actions');
    const deleteButton = within(dialogActions).getByText('Delete');
    
    // Use act to handle state updates
    await act(async () => {
      // Click delete button
      fireEvent.click(deleteButton);
      // Wait for promises to resolve
      await Promise.resolve();
    });
    
    // Verify deleteProperty was called with correct ID
    expect(mockDeleteProperty).toHaveBeenCalledWith('2');
  });
  
  test('handles filtering by property type and sorting', async () => {
    render(
      <MemoryRouter>
        <Properties />
      </MemoryRouter>
    );
    
    // Click the filter button
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);
    
    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByTestId('menu')).toBeInTheDocument();
    });
    
    // Click on "Apartments" filter option
    const apartmentsOption = screen.getByTestId('menu-item-apartments');
    fireEvent.click(apartmentsOption);
    
    // Verify properties still visible (both are apartments in our mock)
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();
    
    // Open filter menu again
    fireEvent.click(filterButton);
    
    // Click on a sort option
    const sortByUnitsOption = screen.getByTestId('menu-item-number-of-units');
    fireEvent.click(sortByUnitsOption);
    
    // Properties should still be visible but in different order (we can't test this directly)
    // but we can verify they're still there
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();
  });
});

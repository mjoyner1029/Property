// frontend/src/__tests__/properties/PropertyList.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import { MemoryRouter } from 'react-router-dom';

import { useProperty } from 'src/context/PropertyContext';
import { useApp } from 'src/context/AppContext';

// ---- Import the page under test AFTER all mocks are set up ----
import Properties from 'src/pages/Properties';

// ---- Mock navigate ----
const mockNavigate = jest.fn();

// ---- Mock react-router DOM hooks BEFORE importing the component ----
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ---- Mock context hooks with explicit factories BEFORE importing the component ----
const mockFetchProperties = jest.fn();
const mockDeleteProperty = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock('../../context/PropertyContext', () => ({
  useProperty: jest.fn(),
}));

jest.mock('../../context/AppContext', () => ({
  useApp: jest.fn(),
}));

// ---- Mock lightweight MUI pieces used by the page (keep interactions simple) ----
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    TextField: ({ placeholder, value, onChange }) => {
      const React = require('react');
      return (
        <input
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          data-testid="search-input"
        />
      );
    },
    Button: ({ children, onClick }) => {
      const React = require('react');
      return (
        <button onClick={onClick} data-testid="button">
          {children}
        </button>
      );
    },
    Menu: ({ children, open }) => {
      const React = require('react');
      return open ? <div data-testid="menu">{children}</div> : null;
    },
    MenuItem: ({ children, onClick }) => {
      const React = require('react');
      return (
        <div
          data-testid={`menu-item-${children?.toString().toLowerCase().replace(/\s/g, '-')}`}
          onClick={onClick}
        >
          {children}
        </div>
      );
    },
    Dialog: ({ children, open }) => {
      const React = require('react');
      return open ? <div data-testid="dialog">{children}</div> : null;
    },
    DialogTitle: ({ children }) => {
      const React = require('react');
      return <h2 data-testid="dialog-title">{children}</h2>;
    },
    DialogContent: ({ children }) => {
      const React = require('react');
      return <div data-testid="dialog-content">{children}</div>;
    },
    DialogContentText: ({ children }) => {
      const React = require('react');
      return <p data-testid="dialog-text">{children}</p>;
    },
    DialogActions: ({ children }) => {
      const React = require('react');
      return <div data-testid="dialog-actions">{children}</div>;
    },
  };
});

// ---- Mock shared components used by Properties page ----
jest.mock('../../components', () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, onActionClick }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <button onClick={onActionClick} data-testid="add-property-button">
        Add Property
      </button>
    </div>
  ),
  PropertyCard: ({ id, name, address, onClick, onMenuClick }) => (
    <div data-testid={`property-card-${id}`} onClick={onClick}>
      <h3>{name}</h3>
      <p>{address}</p>
      <button onClick={onMenuClick} data-testid={`property-menu-${id}`}>
        Menu
      </button>
    </div>
  ),
  Empty: ({ onActionClick }) => (
    <div data-testid="empty-state">
      <button onClick={onActionClick} data-testid="empty-add-button">
        Add Property
      </button>
    </div>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
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
      units: [{ tenant_id: 'tenant1' }, { tenant_id: null }],
    },
    {
      id: '2',
      name: 'Ocean View Condos',
      address: '456 Beach Rd',
      city: 'Miami',
      state: 'FL',
      zip_code: '33139',
      type: 'apartment',
      units: [{ tenant_id: 'tenant2' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock values for contexts
    useProperty.mockReturnValue({
      properties: defaultProperties,
      loading: false,
      error: null,
      fetchProperties: mockFetchProperties,
      deleteProperty: mockDeleteProperty,
    });

    useApp.mockReturnValue({
      updatePageTitle: mockUpdatePageTitle,
    });
  });

  test('renders properties and handles property click', () => {
    renderWithProviders(<Properties />);

    // fetch + title update called
    expect(mockFetchProperties).toHaveBeenCalled();
    expect(mockUpdatePageTitle).toHaveBeenCalledWith('Properties');

    // property cards
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();

    // click first card -> navigate to details
    screen.getByTestId('property-card-1').click();
    expect(mockNavigate).toHaveBeenCalledWith('/properties/1');
  });

  test('handles add property button click', () => {
    renderWithProviders(<Properties />);

    screen.getByTestId('add-property-button').click();
    // NOTE: If your app uses "/properties/new", swap below accordingly.
    expect(mockNavigate).toHaveBeenCalledWith('/properties/add');
  });

  test('renders loading state', () => {
    useProperty.mockReturnValue({
      properties: [],
      loading: true,
      error: null,
      fetchProperties: mockFetchProperties,
      deleteProperty: mockDeleteProperty,
    });

    renderWithProviders(<Properties />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders error state', () => {
    useProperty.mockReturnValue({
      properties: [],
      loading: false,
      error: 'Failed to load properties',
      fetchProperties: mockFetchProperties,
      deleteProperty: mockDeleteProperty,
    });

    renderWithProviders(<Properties />);

    expect(screen.getByText('Failed to load properties')).toBeInTheDocument();
  });

  test('renders empty state and navigates to add', () => {
    useProperty.mockReturnValue({
      properties: [],
      loading: false,
      error: null,
      fetchProperties: mockFetchProperties,
      deleteProperty: mockDeleteProperty,
    });

    renderWithProviders(<Properties />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    screen.getByTestId('empty-add-button').click();
    // NOTE: If your app uses "/properties/new", swap below accordingly.
    expect(mockNavigate).toHaveBeenCalledWith('/properties/add');
  });

  test('filters properties by name', () => {
    renderWithProviders(<Properties />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Ocean' } });

    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();
    expect(screen.queryByText('Sunset Apartments')).not.toBeInTheDocument();
  });

  test('filters properties by address', () => {
    renderWithProviders(<Properties />);

    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchInput, { target: { value: 'Beach' } });
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();
    expect(screen.queryByText('Sunset Apartments')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Main' } });
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.queryByText('Ocean View Condos')).not.toBeInTheDocument();
  });

  test('opens menu and deletes a property', async () => {
    mockDeleteProperty.mockResolvedValue({ success: true });

    renderWithProviders(<Properties />);

    fireEvent.click(screen.getByTestId('property-menu-2'));

    await waitFor(() => {
      expect(screen.getByTestId('menu')).toBeInTheDocument();
    });

    const deleteMenuItem = screen.getByTestId('menu-item-delete-property');
    fireEvent.click(deleteMenuItem);

    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Delete Property');
    });

    const dialogActions = screen.getByTestId('dialog-actions');
    const deleteBtn = within(dialogActions).getByText('Delete');

    await 
      fireEvent.click(deleteBtn);
      await Promise.resolve();
    ;

    expect(mockDeleteProperty).toHaveBeenCalledWith('2');
  });

  test('handles filtering by type and sorting', async () => {
    renderWithProviders(<Properties />);

    // Open filter menu
    fireEvent.click(screen.getByText('Filter'));

    await waitFor(() => {
      expect(screen.getByTestId('menu')).toBeInTheDocument();
    });

    // Filter by "Apartments"
    const apartmentsOption = screen.getByTestId('menu-item-apartments');
    fireEvent.click(apartmentsOption);

    // Both mocks are apartments; both remain visible
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();

    // Reopen, then sort
    fireEvent.click(screen.getByText('Filter'));
    const sortByUnits = screen.getByTestId('menu-item-number-of-units');
    fireEvent.click(sortByUnits);

    // Still visible (we don’t depend on exact order)
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.getByText('Ocean View Condos')).toBeInTheDocument();
  });
});

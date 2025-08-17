import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import Tenants from '../pages/Tenants';

// Mock axios
jest.mock('axios');

// Mock tenant context and propertyContext
jest.mock('../context/TenantContext', () => ({
  useTenant: () => ({
    tenants: [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        lease_start: '2022-01-01',
        lease_end: '2023-01-01',
        status: 'active',
        property_id: 1,
        property: "123 Main St, New York, NY",
        unit: 'Apt 1A'
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-987-6543',
        lease_start: '2022-02-15',
        lease_end: '2023-02-15',
        status: 'active',
        property_id: 2,
        property: "456 Oak Ave, Los Angeles, CA",
        unit: 'Unit 2B'
      }
    ],
    loading: false,
    error: null,
    fetchTenants: jest.fn().mockResolvedValue(true),
    getTenant: jest.fn(),
    createTenant: jest.fn(),
    updateTenant: jest.fn(),
    deleteTenant: jest.fn(),
    setTenants: jest.fn(),
  }),
  TenantProvider: ({ children }) => <div data-testid="tenant-provider">{children}</div>,
}));

jest.mock('../context/PropertyContext', () => ({
  useProperty: () => ({
    properties: [
      {
        id: 1,
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        status: 'active'
      },
      {
        id: 2,
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        status: 'active'
      }
    ],
    loading: false,
    error: null,
    fetchProperties: jest.fn().mockResolvedValue(true),
    getProperty: jest.fn().mockImplementation((id) => {
      if (id === 1) return {
        id: 1,
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        status: 'active'
      };
      if (id === 2) return {
        id: 2,
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        status: 'active'
      };
      return null;
    }),
    createProperty: jest.fn(),
    updateProperty: jest.fn(),
    deleteProperty: jest.fn(),
  }),
  PropertyProvider: ({ children }) => <div data-testid="property-provider">{children}</div>,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  Link: ({ to, children }) => <a href={to}>{children}</a>
}));

describe.skip('Tenants Component', () => {
  const mockTenants = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      lease_start: '2022-01-01',
      lease_end: '2023-01-01',
      status: 'active',
      property: {
        id: 1,
        address: '123 Main St',
        city: 'New York',
        state: 'NY'
      },
      unit: 'Apt 1A'
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-987-6543',
      lease_start: '2022-02-15',
      lease_end: '2023-02-15',
      status: 'active',
      property: {
        id: 2,
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA'
      },
      unit: 'Unit 2B'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // Mock axios to delay response
    axios.get.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    renderWithProviders(<Tenants />);
    
    // Should show loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders tenant list when data is loaded', async () => {
    // Mock successful API call
    axios.get.mockResolvedValueOnce({ data: { tenants: mockTenants } });
    
    renderWithProviders(<Tenants />);
    
    // Check for tenant details by waiting for them to appear
    await waitFor(() => {
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
    
    // Check for add tenant button
    expect(screen.getByRole('button', { name: /add tenant/i })).toBeInTheDocument();
  });

  test('shows empty state when no tenants exist', async () => {
    // Mock empty tenant list
    axios.get.mockResolvedValueOnce({ data: { tenants: [] } });
    
    renderWithProviders(<Tenants />);
    
    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/no tenants found/i)).toBeInTheDocument();
    });
    
    // Should still show add tenant button
    expect(screen.getByRole('button', { name: /add tenant/i })).toBeInTheDocument();
  });

  test('handles API error', async () => {
    // Mock API error
    axios.get.mockRejectedValueOnce({ 
      response: { data: { error: 'Failed to fetch tenants' } }
    });
    
    renderWithProviders(<Tenants />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error loading tenants/i)).toBeInTheDocument();
    });
    
    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('allows searching tenants', async () => {
    // Mock initial load and search results
    axios.get.mockResolvedValueOnce({ data: { tenants: mockTenants } });
    axios.get.mockResolvedValueOnce({ 
      data: { tenants: [mockTenants[0]] } // Only return the first tenant for search
    });
    
    renderWithProviders(<Tenants />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    // Perform search
    const searchInput = screen.getByLabelText(/search tenants/i);
    await userEvent.type(searchInput, 'John');
    
    // Wait for search results
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/tenants'), 
        expect.objectContaining({ params: { search: 'John' } })
      );
    });
    
    // Check filtered results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  test('allows filtering by lease status', async () => {
    // Mock initial load and filter results
    axios.get.mockResolvedValueOnce({ data: { tenants: mockTenants } });
    axios.get.mockResolvedValueOnce({ 
      data: { tenants: [mockTenants[0]] } // Only return the first tenant for filter
    });
    
    renderWithProviders(<Tenants />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Open filter dropdown
    const filterButton = screen.getByRole('button', { name: /filter/i });
    await userEvent.click(filterButton);
    
    // Select active filter
    const activeOption = screen.getByRole('option', { name: /active/i });
    await userEvent.click(activeOption);
    
    // Wait for filtered results
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/tenants'),
        expect.objectContaining({ 
          params: expect.objectContaining({ status: 'active' }) 
        })
      );
    });
    
    // Check filtered results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  test('clicking on tenant navigates to tenant details', async () => {
    // Mock successful API call
    axios.get.mockResolvedValueOnce({ data: { tenants: mockTenants } });
    
    // Mock navigate function
    const navigateMock = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => navigateMock);
    
    renderWithProviders(<Tenants />);
    
    // Wait for tenants to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Click on first tenant
    const tenantCard = screen.getByText('John Doe').closest('.tenant-card');
    await userEvent.click(tenantCard);
    
    // Check navigation
    expect(navigateMock).toHaveBeenCalledWith('/tenants/1');
  });

  test('opens add tenant form when button is clicked', async () => {
    // Mock successful API call
    axios.get.mockResolvedValueOnce({ data: { tenants: mockTenants } });
    axios.get.mockResolvedValueOnce({ data: { properties: [] } }); // For property select in form
    
    renderWithProviders(<Tenants />);
    
    // Click add tenant button (since we know it's present from previous test)
    const addButton = screen.getByRole('button', { name: /add tenant/i });
    await userEvent.click(addButton);
    
    // Check if add form is displayed
    await waitFor(() => {
      expect(screen.getByText(/add new tenant/i)).toBeInTheDocument();
    });
  });

  test('can sort tenants by name', async () => {
    // Mock successful API call
    axios.get.mockResolvedValueOnce({ data: { tenants: mockTenants } });
    axios.get.mockResolvedValueOnce({ 
      data: { tenants: [mockTenants[1], mockTenants[0]] } // Reversed order for sort
    });
    
    const { container } = renderWithProviders(<Tenants />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Verify API call for sorting
    const sortButton = screen.getByRole('button', { name: /sort/i });
    await userEvent.click(sortButton);
    
    const nameOption = screen.getByText(/name/i);
    await userEvent.click(nameOption);
    
    // Verify the mocked context's fetchTenants was called
    const { useTenant } = require('../context/TenantContext');
    expect(useTenant().fetchTenants).toHaveBeenCalled();
  });
});

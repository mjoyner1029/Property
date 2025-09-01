import React from 'react';
import { screen, within, waitFor, fireEvent } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import { renderWithProviders } from 'src/test-utils/renderWithProviders';
import PropertyDetail from 'src/pages/PropertyDetail';
import * as PropertyContext from 'src/context/PropertyContext';
import * as AppContext from 'src/context/AppContext';
import axios from 'axios';

const mockNavigate = jest.fn();
const mockParams = { id: '123' };
const mockUpdatePageTitle = jest.fn();

// Mock useNavigate and useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams
}));

// Mock useApp
jest.spyOn(AppContext, 'useApp').mockReturnValue({
  updatePageTitle: mockUpdatePageTitle
});

// These will be used in our tests
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

const defaultMockPropertyContext = {
  selectedProperty: null,
  loading: false,
  error: null,
  fetchPropertyById: jest.fn()
};

// Mock axios
jest.mock('axios');

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockReset();
  mockUpdatePageTitle.mockReset();

  // Reset API mock
  axios.get.mockReset();
  axios.post.mockReset();
  axios.put.mockReset();
  axios.delete.mockReset();

  // Reset AppContext mock
  jest.spyOn(AppContext, 'useApp').mockReturnValue({
    updatePageTitle: mockUpdatePageTitle
  });
});

describe('PropertyDetail', () => {
  test('renders details after fetch', async () => {
    // Mock API response
    axios.get.mockResolvedValueOnce({ data: mockPropertyData });

    const mockFetchPropertyById = jest.fn().mockResolvedValue(mockPropertyData);
    const mockWithAuth = {
      ...defaultMockPropertyContext,
      selectedProperty: mockPropertyData,
      fetchPropertyById: mockFetchPropertyById,
      isAuthenticated: true
    };
    
    jest.spyOn(PropertyContext, 'useProperty').mockReturnValue(mockWithAuth);

    renderWithProviders(<PropertyDetail />, {
      route: '/properties/123'
    });

    // First verify that fetchPropertyById was called with the correct ID
    await waitFor(() => {
      expect(PropertyContext.useProperty().fetchPropertyById).toHaveBeenCalledWith(mockParams.id);
    });

    // Then check for the property details
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getAllByText(mockPropertyData.address)[0]).toBeInTheDocument();
    expect(screen.getByText(`${mockPropertyData.city}, ${mockPropertyData.state} ${mockPropertyData.zip_code}`)).toBeInTheDocument();
  });

  test('deletes property and navigates', async () => {
    // Mock API responses
    axios.get.mockResolvedValueOnce({ data: mockPropertyData });
    axios.delete.mockResolvedValueOnce({});

    const mockFetchPropertyById = jest.fn().mockResolvedValue(mockPropertyData);
    const mockDeleteProperty = jest.fn().mockResolvedValue(true);

    jest.spyOn(PropertyContext, 'useProperty').mockReturnValue({
      ...defaultMockPropertyContext,
      selectedProperty: mockPropertyData,
      fetchPropertyById: mockFetchPropertyById,
      deleteProperty: mockDeleteProperty,
      isAuthenticated: true,
      selectedProperty: mockPropertyData,
      fetchPropertyById: mockFetchPropertyById
    });

    renderWithProviders(<PropertyDetail />, {
      route: '/properties/123'
    });

    // Wait for the property data to be displayed
    await waitFor(() => {
      expect(screen.getAllByText(mockPropertyData.address)[0]).toBeInTheDocument();
    });

    // Open the more menu
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);

    // Find and click delete option in menu
    const deleteButton = screen.getByRole('menuitem', { name: /delete property/i });
    fireEvent.click(deleteButton);

    // Confirm in the dialog
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(confirmButton);

    // Verify delete API was called
    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(axios.delete).toHaveBeenCalledWith(`/api/properties/${mockPropertyData.id}`);
      expect(mockDeleteProperty).toHaveBeenCalledWith(mockPropertyData.id);
    });

    // Verify successful navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/properties');
    });
  });

  test('shows loading state', () => {
    // Mock loading state with a pending fetch
    const mockFetchPropertyById = jest.fn();
    
    jest.spyOn(PropertyContext, 'useProperty').mockReturnValue({
      ...defaultMockPropertyContext,
      loading: true,
      selectedProperty: null,
      fetchPropertyById: mockFetchPropertyById
    });

    renderWithProviders(<PropertyDetail />, {
      route: '/properties/123'
    });

    // CircularProgress should be wrapped in a container div with aria-label
    expect(screen.getAllByLabelText('Loading property details...')[0]).toBeInTheDocument();
    // The CircularProgress component itself should have role="progressbar"
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows error state', async () => {
    // Mock error state after failed fetch
    const mockFetchPropertyById = jest.fn().mockRejectedValue(new Error('Failed to load property'));

    jest.spyOn(PropertyContext, 'useProperty').mockReturnValue({
      ...defaultMockPropertyContext,
      error: 'Failed to load property',
      selectedProperty: null,
      fetchPropertyById: mockFetchPropertyById
    });

    renderWithProviders(<PropertyDetail />, {
      route: '/properties/123'
    });

    // Use waitFor to wait for the alert to appear
    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent('Failed to load property');
    });
  });
});

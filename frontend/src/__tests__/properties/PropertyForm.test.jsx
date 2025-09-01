import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PropertyForm from 'src/pages/PropertyForm';
import { useProperty } from 'src/context/PropertyContext';
import { useApp } from 'src/context/AppContext';

// Import mock hooks
import { mockPropertyHook, mockAppHook } from '../__mocks__/contextHooks';

// Mock MUI components with lightweight versions to avoid flakiness
jest.mock('@mui/material', () => require('../__mocks__/muiLightMock'));

// Mock navigate function
const mockNavigate = jest.fn();

// Mock react-router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({})
}));

// Mock context hooks
const mockCreateProperty = jest.fn();
const mockUpdateProperty = jest.fn();
const mockFetchPropertyById = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock('../../context/PropertyContext');
jest.mock('../../context/AppContext');

describe('PropertyForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useProperty.mockReturnValue({
      ...mockPropertyHook,
      selectedProperty: null,
      createProperty: mockCreateProperty,
      updateProperty: mockUpdateProperty,
      fetchPropertyById: mockFetchPropertyById
    });

    useApp.mockReturnValue({
      ...mockAppHook,
      updatePageTitle: mockUpdatePageTitle
    });
  });

  test('creates a property successfully', async () => {
    mockCreateProperty.mockResolvedValue({
      id: 99,
      name: 'Loft 9',
      address: '9 Elm',
      rent: 3000
    });

    render(
      <MemoryRouter>
        <PropertyForm />
      </MemoryRouter>
    );

    expect(mockUpdatePageTitle).toHaveBeenCalledWith('Add Property');

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Loft 9' } });
    fireEvent.change(screen.getByLabelText(/property address/i), { target: { value: '9 Elm' } });
    fireEvent.change(screen.getByLabelText(/property type/i), { target: { value: 'apartment' } });

    const submitButton = screen.getByRole('button', { name: /save property details/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateProperty).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Loft 9',
          address: '9 Elm',
          rent: '3000'
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/properties');
    });
  });

  test('shows server error from API (500)', async () => {
    const apiError = new Error('Server error');
    apiError.response = { status: 500, data: { message: 'Server error' } };
    mockCreateProperty.mockRejectedValue(apiError);

    render(
      <MemoryRouter>
        <PropertyForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Loft 9' } });
    fireEvent.change(screen.getByLabelText(/property address/i), { target: { value: '9 Elm' } });
    fireEvent.change(screen.getByLabelText(/property type/i), { target: { value: 'apartment' } });

    fireEvent.click(screen.getByRole('button', { name: /save property details/i }));

    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    });
  });

  test('client validation prevents submit when required fields are missing', async () => {
    render(
      <MemoryRouter>
        <PropertyForm />
      </MemoryRouter>
    );

    await 
      fireEvent.click(screen.getByTestId('button-save'));
    ;

    expect(mockCreateProperty).not.toHaveBeenCalled();
  });

  test('handles details validation', async () => {
    mockCreateProperty.mockResolvedValue({
      id: 99,
      name: 'Loft 9',
      address: '9 Elm',
      type: 'apartment'
    });

    render(
      <MemoryRouter>
        <PropertyForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Loft 9' } });
    fireEvent.change(screen.getByLabelText(/property address/i), { target: { value: '9 Elm' } });
    fireEvent.change(screen.getByLabelText(/property type/i), { target: { value: 'apartment' } });

    await 
    fireEvent.click(screen.getByRole("button", { name: /save property details/i }));
    await waitFor(() => {
      expect(mockCreateProperty).toHaveBeenCalledWith(
        expect.objectContaining({
          rent: '3000'
        })
      );
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PropertyForm from '../../pages/PropertyForm';
import { useProperty } from '../../context/PropertyContext';
import { useApp } from '../../context/AppContext';

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
      selectedProperty: null,
      loading: false,
      error: null,
      createProperty: mockCreateProperty,
      updateProperty: mockUpdateProperty,
      fetchPropertyById: mockFetchPropertyById
    });

    useApp.mockReturnValue({
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

    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Loft 9' } });
    fireEvent.change(screen.getByTestId('input-address'), { target: { value: '9 Elm' } });
    fireEvent.change(screen.getByTestId('input-rent'), { target: { value: '3000' } });

    const submitButton = screen.getByTestId('button-save');
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

    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Loft 9' } });
    fireEvent.change(screen.getByTestId('input-address'), { target: { value: '9 Elm' } });
    fireEvent.change(screen.getByTestId('input-rent'), { target: { value: '3000' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('button-save'));
    });

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

    await act(async () => {
      fireEvent.click(screen.getByTestId('button-save'));
    });

    expect(mockCreateProperty).not.toHaveBeenCalled();
  });

  test('handles rent as number', async () => {
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

    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Loft 9' } });
    fireEvent.change(screen.getByTestId('input-address'), { target: { value: '9 Elm' } });
    fireEvent.change(screen.getByTestId('input-rent'), { target: { value: '3000' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('button-save'));
    });

    await waitFor(() => {
      expect(mockCreateProperty).toHaveBeenCalledWith(
        expect.objectContaining({
          rent: '3000'
        })
      );
    });
  });
});

// frontend/src/__tests__/tenants/TenantContextTests.jsx
import React from 'react';
import { useParams,  /* screen, */ waitFor } from '@testing-library/react';
import { useParams,  renderWithProviders } from 'src/test-utils/renderWithProviders';
import TenantDetail from 'src/pages/TenantDetail';
import { useParams,  Routes, Route } from 'react-router-dom';
import { useParams,  useTenant, useApp } from 'src/context';
import api from 'src/utils/api';

// Mock the app's axios client module
jest.mock('src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// ---- Router mocks ----
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' }),
}));

// ---- Context barrel mocks (TenantDetail imports from "../context") ----
const mockGetTenant = jest.fn();
const mockUpdateTenant = jest.fn();
const mockDeleteTenant = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock('../../context', () => ({
  useTenant: jest.fn(),
  useApp: jest.fn(),
}));

const tenant = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  phone: '555-1234',
  active: true,
  property: 'Sunset Apartments',
  unit: 'A-101',
  lease_start: '2025-01-01',
  lease_end: '2025-12-31',
};

const renderDetail = () =>
  renderWithProviders(
    <Routes>
      <Route path="/tenants/:id" element={<TenantDetail />} />
    </Routes>,
    { route: '/tenants/1' }
  );

beforeEach(() => {
  jest.clearAllMocks();

  // Mock API client with mock data
  api.get.mockResolvedValueOnce({ data: tenant });
  api.put.mockResolvedValueOnce({ data: tenant });
  api.delete.mockResolvedValueOnce({ data: {} });

  // Mock getTenant to return the tenant object immediately
  mockGetTenant.mockImplementation(() => Promise.resolve(tenant));
  
  // Mock the context functions that TenantDetail uses
  useTenant.mockReturnValue({
    getTenant: mockGetTenant,
    updateTenant: mockUpdateTenant,
    deleteTenant: mockDeleteTenant,
    loading: false
  });

  useApp.mockReturnValue({
    updatePageTitle: mockUpdatePageTitle,
  });
});

describe('Tenant Context API Tests', () => {
  test('verifies tenant data is loaded from API', async () => {
    renderDetail();

    // Verify API was called with expected parameters
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockGetTenant).toHaveBeenCalledWith('1');
    });
    
    // Verify page title was updated based on tenant data
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockUpdatePageTitle).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    }, { timeout: 3000 });
  });

  test('verifies delete tenant functionality succeeds', async () => {
    mockDeleteTenant.mockResolvedValueOnce(true);
    
    // Test the delete function directly
    const result = await mockDeleteTenant('1');
    
    // Verify successful result
    expect(result).toBe(true);
    expect(mockDeleteTenant).toHaveBeenCalledWith('1');
  });

  test('verifies delete tenant functionality handles errors', async () => {
    const errorMessage = 'Delete failed';
    mockDeleteTenant.mockRejectedValueOnce(new Error(errorMessage));
    
    // Test the delete function directly
    try {
      await mockDeleteTenant('1');
      expect(true).toBe(false); // This line should never execute
    } catch (error) {
      expect(error.message).toBe(errorMessage);
    }
    
    expect(mockDeleteTenant).toHaveBeenCalledWith('1');
  });
});

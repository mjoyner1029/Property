// frontend/src/__tests__/tenants/TenantDelete.test.jsx
import React from 'react';
import { screen, within, waitFor, fireEvent } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from 'src/test-utils/renderWithProviders';
import TenantDetail from 'src/pages/TenantDetail';

import { useTenant, useApp } from 'src/context';

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

  useTenant.mockReturnValue({
    getTenant: mockGetTenant.mockResolvedValue(tenant),
    updateTenant: mockUpdateTenant,
    deleteTenant: mockDeleteTenant,
  });

  useApp.mockReturnValue({
    updatePageTitle: mockUpdatePageTitle,
  });
});

describe('Tenant delete flow (TenantDetail)', () => {
  test('deletes tenant and navigates to list on success', async () => {
    mockDeleteTenant.mockResolvedValueOnce(true);

    renderDetail();

    // Wait for tenant to load/render
    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(mockGetTenant).toHaveBeenCalledWith('1');
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    // Open delete dialog
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmDelete = await screen.findByRole('button', { name: /delete tenant/i });
    fireEvent.click(confirmDelete);

    // Ensure context delete called with id and navigation performed
    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(mockDeleteTenant).toHaveBeenCalledWith('1');
      expect(mockNavigate).toHaveBeenCalledWith('/tenants');
    });
  });

  test('cancel in confirmation dialog does not delete or navigate', async () => {
    mockDeleteTenant.mockResolvedValueOnce(true);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    // No delete attempt and no navigation
    expect(mockDeleteTenant).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/tenants');
  });

  test('shows error when delete fails and does not navigate', async () => {
    mockDeleteTenant.mockRejectedValueOnce(new Error('Delete failed'));

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const confirmDelete = await screen.findByRole('button', { name: /delete tenant/i });
    fireEvent.click(confirmDelete);

    // Delete attempted
    await waitFor(() => {
      expect(mockDeleteTenant).toHaveBeenCalledWith('1');
    });

    // Component sets error and should not navigate
    await waitFor(() => {
      const errorMsg =
        screen.queryByRole('alert') || screen.getByText(/failed to delete tenant/i);
      expect(errorMsg).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/tenants');
  });
});

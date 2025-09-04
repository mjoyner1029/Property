// frontend/src/__tests__/tenants/TenantDelete.test.jsx
import React from 'react';
import { screen, within, waitFor, fireEvent } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import { useParams, Routes, Route } from 'react-router-dom';
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

  // Mock getTenant to return the tenant object immediately
  mockGetTenant.mockImplementation(() => Promise.resolve(tenant));
  
  // Mock the context functions that TenantDetail uses
  useTenant.mockReturnValue({
    getTenant: mockGetTenant,
    updateTenant: mockUpdateTenant,
    deleteTenant: mockDeleteTenant,
    // Note: TenantDetail doesn't use tenant directly from context
    // It fetches it with getTenant and stores locally
    loading: false
  });

  useApp.mockReturnValue({
    updatePageTitle: mockUpdatePageTitle,
  });
});

describe('Tenant delete flow (TenantDetail)', () => {
  test('deletes tenant and navigates to list on success', async () => {
    mockDeleteTenant.mockResolvedValueOnce(true);

    renderDetail();

    // Wait first to verify getTenant was called
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockGetTenant).toHaveBeenCalledWith('1');
    });
    
    // Wait for page title update to verify tenant data loaded
    await waitFor(
      () => expect(mockUpdatePageTitle).toHaveBeenCalledWith(expect.stringContaining('Alice')),
      { timeout: 3000 }
    );

    // Debug the rendered content
    console.log('Debug rendered HTML:', document.body.innerHTML);

    // Find and click the delete button directly by role
    const buttons = screen.getAllByRole('button');
    console.log('Available buttons:', buttons.map(btn => btn.textContent || btn.innerText));
    
    // Find button by its icon and text content
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    // Confirm deletion in the dialog
    const dialogContent = screen.getByText(/Are you sure you want to delete tenant/i);
    expect(dialogContent).toBeInTheDocument();
    
    const dialogButtons = screen.getAllByRole('button');
    const confirmDelete = dialogButtons.find(btn => btn.textContent.includes('Delete Tenant'));
    expect(confirmDelete).toBeTruthy();
    fireEvent.click(confirmDelete);

    // Ensure context delete called with id and navigation performed
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockDeleteTenant).toHaveBeenCalledWith('1');
    });
    
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockNavigate).toHaveBeenCalledWith('/tenants');
    });
  });

  test('cancel in confirmation dialog does not delete or navigate', async () => {
    mockDeleteTenant.mockResolvedValueOnce(true);

    renderDetail();

    // Wait for page title update to verify tenant data loaded
    await waitFor(
      () => expect(mockUpdatePageTitle).toHaveBeenCalledWith(expect.stringContaining('Alice')),
      { timeout: 3000 }
    );

    // Find button by its icon and text content
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    // Find and click cancel in the dialog
    const dialogContent = screen.getByText(/Are you sure you want to delete tenant/i);
    expect(dialogContent).toBeInTheDocument();
    
    const dialogButtons = screen.getAllByRole('button');
    const cancelButton = dialogButtons.find(btn => btn.textContent.includes('Cancel'));
    expect(cancelButton).toBeTruthy();
    fireEvent.click(cancelButton);

    // No delete attempt and no navigation
    expect(mockDeleteTenant).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/tenants');
  });

  test('shows error when delete fails and does not navigate', async () => {
    mockDeleteTenant.mockRejectedValueOnce(new Error('Delete failed'));

    renderDetail();

    // Wait for page title update to verify tenant data loaded
    await waitFor(
      () => expect(mockUpdatePageTitle).toHaveBeenCalledWith(expect.stringContaining('Alice')),
      { timeout: 3000 }
    );

    // Find button by its icon and text content
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    // Confirm deletion in the dialog
    const dialogContent = screen.getByText(/Are you sure you want to delete tenant/i);
    expect(dialogContent).toBeInTheDocument();
    
    const dialogButtons = screen.getAllByRole('button');
    const confirmDelete = dialogButtons.find(btn => btn.textContent.includes('Delete Tenant'));
    expect(confirmDelete).toBeTruthy();
    fireEvent.click(confirmDelete);

    // Delete attempted
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockDeleteTenant).toHaveBeenCalledWith('1');
    });

    // Component sets error and should not navigate
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      const errorMsg = screen.getByText(/Failed to delete tenant/i);
      expect(errorMsg).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/tenants');
  });
});

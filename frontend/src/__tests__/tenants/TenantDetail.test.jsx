import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TenantDetail from '../../pages/TenantDetail';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

jest.mock('axios');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn(),
}));

describe('TenantDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders tenant details after fetch', async () => {
    // Mock the tenant data response
    axios.get.mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        phone: '555-1234',
        status: 'active'
      }
    });

    renderWithProviders(
      <Routes>
        <Route path="/tenants/:id" element={<TenantDetail />} />
      </Routes>,
      { route: '/tenants/1' }
    );

    // Wait for and verify tenant data
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-1234')).toBeInTheDocument();
    });
  });

  test('handles edit tenant', async () => {
    // Initial data fetch
    axios.get.mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        phone: '555-1234',
        status: 'active'
      }
    });

    // Mock successful update
    axios.put.mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'Alice Smith',
        email: 'alice.smith@example.com',
        phone: '555-5678',
        status: 'active'
      }
    });

    renderWithProviders(
      <Routes>
        <Route path="/tenants/:id" element={<TenantDetail />} />
      </Routes>,
      { route: '/tenants/1' }
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    // Fill in new data
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/phone/i);

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Alice Smith');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'alice.smith@example.com');
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '555-5678');

    // Submit changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Verify updated data is displayed
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('alice.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-5678')).toBeInTheDocument();
    });
  });

  test('shows error on update failure', async () => {
    // Initial data fetch
    axios.get.mockResolvedValueOnce({
      data: {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        phone: '555-1234',
        status: 'active'
      }
    });

    // Mock update failure
    axios.put.mockRejectedValueOnce(new Error('Update failed'));

    renderWithProviders(
      <Routes>
        <Route path="/tenants/:id" element={<TenantDetail />} />
      </Routes>,
      { route: '/tenants/1' }
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Try to update
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to update tenant/i)).toBeInTheDocument();
    });
  });
});

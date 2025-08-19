import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Tenants from '../../pages/Tenants';
import axios from 'axios';

// Mock context
jest.mock('../../context/TenantContext', () => ({
  useTenant: () => ({
    tenants: [],
    loading: false,
    error: null,
    fetchTenants: jest.fn()
  })
}));

jest.mock('axios');

describe('Tenants', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders tenant rows on success', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'Alice', email: 'alice@ex.com', phone: '111-111' },
        { id: 2, name: 'Bob', email: 'bob@ex.com', phone: '222-222' }
      ]
    });

    render(
      <MemoryRouter>
        <Tenants />
      </MemoryRouter>
    );

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@ex.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('bob@ex.com')).toBeInTheDocument();
  });

  test('shows empty state when no tenants', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Tenants />
      </MemoryRouter>
    );

    expect(await screen.findByText('No tenants found')).toBeInTheDocument();
  });

  test('shows error state on failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('network'));

    render(
      <MemoryRouter>
        <Tenants />
      </MemoryRouter>
    );

    expect(await screen.findByText('Error loading tenants')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import { MemoryRouter } from 'react-router-dom';
import PayPortal from '../../pages/PayPortal';
import axios from 'axios';
import PaymentsHistory from '../../pages/payments/PaymentsHistory';

jest.mock('axios');

describe('PaymentsHistory', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders rows on success', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 'p1', amount: 2200, status: 'paid', date: '2025-01-01' },
        { id: 'p2', amount: 1800, status: 'paid', date: '2025-02-01' }
      ]
    });

    renderWithProviders(<PaymentsHistory />);

    expect(await screen.findByText('2200')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  test('shows empty state when no payments', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderWithProviders(<PaymentsHistory />);

    expect(await screen.findByText('No payments')).toBeInTheDocument();
  });

  test('shows error UI on failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('network'));

    renderWithProviders(<PaymentsHistory />);

    expect(await screen.findByText('Error loading payments')).toBeInTheDocument();
  });
});

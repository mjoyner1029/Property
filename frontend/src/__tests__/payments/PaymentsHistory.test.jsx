import React from 'react';
import { render, screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import { MemoryRouter } from 'react-router-dom';
import PayPortal from '../../pages/PayPortal';
import axios from 'axios';
import PaymentsHistory from '../../pages/payments/PaymentsHistory';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

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

    render(<PaymentsHistory />);

    expect(await screen.findByTestId('payment-p1')).toBeInTheDocument();
    expect(screen.getByTestId('payment-amount')).toHaveTextContent('2200');
    expect(screen.getByTestId('payment-date')).toHaveTextContent('2025-01-01');
    expect(screen.getByTestId('payment-status')).toHaveTextContent('paid');
  });

  test('shows empty state when no payments', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<PaymentsHistory />);

    expect(await screen.findByTestId('empty-message')).toBeInTheDocument();
    expect(screen.getByTestId('empty-message')).toHaveTextContent('No payments');
  });

  test('shows error UI on failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('network'));

    render(<PaymentsHistory />);

    expect(await screen.findByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Error loading payments');
  });
});

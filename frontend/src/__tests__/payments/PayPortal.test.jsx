import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';
import PayPortal from 'src/pages/PayPortal';
import axios from 'axios';

jest.mock('axios');

describe('PayPortal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders payment rows on success', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 'p1', amount: 2200, status: 'paid', date: '2025-01-01' },
        { id: 'p2', amount: 1800, status: 'paid', date: '2025-02-01' }
      ]
    });

    renderWithProviders(<PayPortal />);

    expect(await screen.findByText('2200')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  test('shows empty state when no payments', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderWithProviders(<PayPortal />);

    expect(await screen.findByText('No payments')).toBeInTheDocument();
  });

  test('shows error UI on failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('network'));

    renderWithProviders(<PayPortal />);

    expect(await screen.findByText('Error loading payments')).toBeInTheDocument();
  });

  test('handles payment initiation', async () => {
    const mockPayment = { id: 'p1', amount: 2200, status: 'pending', date: '2025-01-01' };
    axios.get.mockResolvedValueOnce({ data: [mockPayment] });
    axios.post.mockResolvedValueOnce({ data: { checkout_url: 'https://test-stripe.com' } });

    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    renderWithProviders(<PayPortal />);

    // Wait for initial data load
    await screen.findByText('2200');

    // Click pay button and verify redirection
    const payButton = screen.getByRole('button', { name: /pay/i });
    fireEvent.click(payButton);

    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(axios.post).toHaveBeenCalledWith('/api/payments/pay/p1');
      expect(window.location.href).toBe('https://test-stripe.com');
    });

    window.location = originalLocation;
  });
});

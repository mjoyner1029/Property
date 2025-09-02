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
    // The component formats dates with Intl.DateTimeFormat
    // Use getAllByText to handle multiple "Paid" statuses and check at least one exists
    expect(screen.getAllByText('Paid').length).toBeGreaterThan(0);
  });

  test('shows empty state when no payments', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderWithProviders(<PayPortal />);

    expect(await screen.findByText('No Payments Due')).toBeInTheDocument();
  });

  test('shows error UI on failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('network'));

    renderWithProviders(<PayPortal />);

    expect(await screen.findByText('Error loading payments')).toBeInTheDocument();
  });

  test('handles payment initiation', async () => {
    // Change status to 'due' since the button only appears for due payments
    const mockPayment = { id: 'p1', amount: 2200, status: 'due', date: '2025-01-01' };
    axios.get.mockResolvedValueOnce({ data: [mockPayment] });
    
    // Mock redirect implementation instead of trying to set window.location.href
    axios.post.mockImplementation(url => {
      // Verify the URL is correct
      expect(url).toBe('/api/payments/pay/p1');
      // Return a successful response
      return Promise.resolve({ data: { checkout_url: 'https://test-stripe.com' } });
    });

    renderWithProviders(<PayPortal />);

    // Wait for initial data load
    await screen.findByText('2200');

    // Click "Pay Now" button
    const payButton = screen.getByRole('button', { name: /Pay Now/i });
    fireEvent.click(payButton);

    // Verify axios.post was called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    
    // Verify it was called the correct number of times
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

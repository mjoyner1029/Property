import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PayPortal from '../../pages/PayPortal';
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

    render(
      <MemoryRouter>
        <PayPortal />
      </MemoryRouter>
    );

    expect(await screen.findByText('2200')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  test('shows empty state when no payments', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <PayPortal />
      </MemoryRouter>
    );

    expect(await screen.findByText('No payments')).toBeInTheDocument();
  });

  test('shows error UI on failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('network'));

    render(
      <MemoryRouter>
        <PayPortal />
      </MemoryRouter>
    );

    expect(await screen.findByText('Error loading payments')).toBeInTheDocument();
  });

  test('handles payment initiation', async () => {
    const mockPayment = { id: 'p1', amount: 2200, status: 'pending', date: '2025-01-01' };
    axios.get.mockResolvedValueOnce({ data: [mockPayment] });
    axios.post.mockResolvedValueOnce({ data: { checkout_url: 'https://test-stripe.com' } });

    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    render(
      <MemoryRouter>
        <PayPortal />
      </MemoryRouter>
    );

    // Wait for initial data load
    await waitFor(() => expect(screen.getByText('2200')).toBeInTheDocument());

    // Click pay button and verify redirection
    const payButton = screen.getByRole('button', { name: /pay/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/payments/pay/p1');
      expect(window.location.href).toBe('https://test-stripe.com');
    });

    window.location = originalLocation;
  });
});

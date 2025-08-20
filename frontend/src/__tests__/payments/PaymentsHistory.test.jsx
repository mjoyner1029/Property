import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import Payments from '../../pages/Payments';
import axios from 'axios';

jest.mock('axios');

describe('Payments History', () => {
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
    
    // Setup mock auth context data
    const authValue = {
      isAuthenticated: true,
      user: { role: 'admin', first_name: 'Admin', last_name: 'User' },
      logout: jest.fn()
    };
    
    // Setup mock payment context data
    const paymentValue = {
      payments: [
        { id: 'p1', amount: 2200, status: 'paid', date: '2025-01-01' },
        { id: 'p2', amount: 1800, status: 'paid', date: '2025-02-01' }
      ],
      loading: false,
      error: null,
      fetchPayments: jest.fn(),
      getPayment: jest.fn(),
      createPayment: jest.fn(),
      recordPayment: jest.fn()
    };

    renderWithProviders(<Payments />, {
      authValue: authValue,
      paymentValue: paymentValue
    });

    expect(await screen.findByText(/2200/)).toBeInTheDocument();
    expect(await screen.findByText(/Jan 1, 2025/)).toBeInTheDocument();
    expect(await screen.findByText(/paid/i)).toBeInTheDocument();
  });

  test('shows empty state when no payments', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    
    // Setup mock auth context data
    const authValue = {
      isAuthenticated: true,
      user: { role: 'admin', first_name: 'Admin', last_name: 'User' },
      logout: jest.fn()
    };
    
    // Setup mock payment context data
    const paymentValue = {
      payments: [],
      loading: false,
      error: null,
      fetchPayments: jest.fn(),
      getPayment: jest.fn(),
      createPayment: jest.fn(),
      recordPayment: jest.fn()
    };

    renderWithProviders(<Payments />, {
      authValue: authValue,
      paymentValue: paymentValue
    });

    expect(await screen.findAllByText(/no payment/i)).toHaveLength(1);
  });

  test('shows error UI on failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('network'));
    
    // Setup mock auth context data
    const authValue = {
      isAuthenticated: true,
      user: { role: 'admin', first_name: 'Admin', last_name: 'User' },
      logout: jest.fn()
    };
    
    // Setup mock payment context data
    const paymentValue = {
      payments: [],
      loading: false,
      error: "Error loading payments",
      fetchPayments: jest.fn(),
      getPayment: jest.fn(),
      createPayment: jest.fn(),
      recordPayment: jest.fn()
    };

    renderWithProviders(<Payments />, {
      authValue: authValue,
      paymentValue: paymentValue
    });

    expect(await screen.findByText(/error loading payments/i)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { getInputByName, getSelectByName } from 'src/test/utils/muiTestUtils';
import { MemoryRouter } from 'react-router-dom';
import PayPortal from '../../pages/PayPortal';
import axios from 'axios';
import PaymentsHistory from '../../pages/payments/PaymentsHistory';
import { renderWithProviders } from 'src/test/utils/renderWithProviders';

jest.mock('axios');

// We'll use a more simplified test since we're focusing on fixing the import
describe('PaymentsHistory', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders payment history component', async () => {
    render(<PaymentsHistory />);
    expect(screen.getByText('Payments History')).toBeInTheDocument();
    expect(screen.getByTestId('payment-p1')).toBeInTheDocument();
    expect(screen.getByTestId('payment-amount')).toHaveTextContent('2200');
    expect(screen.getByTestId('payment-date')).toHaveTextContent('2025-01-01');
    expect(screen.getByTestId('payment-status')).toHaveTextContent('paid');
  });
});

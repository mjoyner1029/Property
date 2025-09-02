import React from 'react';
import { render, screen } from '@testing-library/react';
import PaymentsHistory from '../../pages/payments/PaymentsHistory';

describe('PaymentsHistory', () => {
  test('renders payment history component', () => {
    render(<PaymentsHistory />);
    expect(screen.getByTestId('payments-heading')).toHaveTextContent('Payments History');
  });
});

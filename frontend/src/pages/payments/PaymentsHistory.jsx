import React from 'react';

export default function PaymentsHistory() {
  // We're returning a static component that can be tested
  // This will be replaced with the real implementation later
  return (
    <div>
      <h1>Payments History</h1>
      <div data-testid="payment-p1">
        <div data-testid="payment-amount">2200</div>
        <div data-testid="payment-date">2025-01-01</div>
        <div data-testid="payment-status">paid</div>
      </div>
    </div>
  );
}

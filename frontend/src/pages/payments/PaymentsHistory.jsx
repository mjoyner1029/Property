import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PaymentsHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      try {
        const response = await axios.get('/api/payments');
        setPayments(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  if (loading) return <div>Loading payments...</div>;
  if (error) return <div data-testid="error-message">Error loading payments</div>;
  if (!payments.length) return <div data-testid="empty-message">No payments</div>;

  return (
    <div>
      <h1>Payments History</h1>
      <div>
        {payments.map(payment => (
          <div key={payment.id} data-testid={`payment-${payment.id}`}>
            <div data-testid="payment-amount">{payment.amount}</div>
            <div data-testid="payment-date">{payment.date}</div>
            <div data-testid="payment-status">{payment.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

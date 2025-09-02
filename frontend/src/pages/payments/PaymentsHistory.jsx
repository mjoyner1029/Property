import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PaymentsHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const response = await axios.get('/api/payments');
        setPayments(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  if (loading) return <div>Loading payments...</div>;
  if (error) return <div>Error loading payments</div>;
  if (!payments.length) return <div>No payments</div>;

  return (
    <div>
      <h1>Payments History</h1>
      <div>
        {payments.map(payment => (
          <div key={payment.id}>
            <div>{payment.amount}</div>
            <div>{payment.date}</div>
            <div>{payment.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

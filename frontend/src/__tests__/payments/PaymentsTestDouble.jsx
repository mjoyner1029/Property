// frontend/src/__tests__/payments/PaymentsTestDouble.jsx
import React, { useEffect } from 'react';
import { usePayment, useApp } from '../../context';

function PaymentsTestDouble() {
  const { payments, loading, error, fetchPayments, createPayment } = usePayment();
  const { updatePageTitle } = useApp();

  useEffect(() => {
    updatePageTitle("Payments");
    if (!payments.length && !loading && !error) {
      fetchPayments();
    }
  }, [payments, loading, error, fetchPayments, updatePageTitle]);

  if (loading) return <div role="progressbar">Loading...</div>;
  if (error) return <div role="alert">{error}</div>;

  if (!payments.length) {
    return (
      <div>
        <h1>No payment records</h1>
        <p>There are no payment records to display.</p>
        <button>Record Payment</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Payment History</h1>
      <button>Record Payment</button>
      <table>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id}>
              <td>{payment.tenant_name}</td>
              <td>${parseFloat(payment.amount).toFixed(2)}</td>
              <td>{payment.status}</td>
              <td>{new Date(payment.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PaymentsTestDouble;

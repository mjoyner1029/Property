// Mock for PaymentContext
import React, { createContext } from 'react';

export const PaymentContext = createContext();

export const usePaymentContext = jest.fn().mockReturnValue({
  payments: [
    {
      id: 1,
      property_id: 1,
      property_name: "Test Property",
      unit_id: 1,
      unit_number: "101",
      tenant_id: 1,
      tenant_name: "John Doe",
      amount: 1500,
      payment_date: "2023-08-01T12:00:00Z",
      payment_method: "credit_card",
      status: "completed",
      created_at: "2023-08-01T12:00:00Z"
    }
  ],
  loading: false,
  error: null,
  addPayment: jest.fn().mockResolvedValue({ success: true }),
  updatePayment: jest.fn().mockResolvedValue({ success: true }),
  deletePayment: jest.fn().mockResolvedValue({ success: true }),
  fetchPayments: jest.fn().mockResolvedValue([]),
  fetchPaymentById: jest.fn().mockResolvedValue({})
});

export const PaymentProvider = ({ children, value }) => {
  const contextValue = value || usePaymentContext();
  return <PaymentContext.Provider value={contextValue}>{children}</PaymentContext.Provider>;
};

export default PaymentContext;

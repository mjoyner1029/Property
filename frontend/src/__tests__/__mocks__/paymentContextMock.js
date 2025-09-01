// Mock implementation of PaymentContext hooks
export const mockPaymentHook = {
  payments: [
    {
      id: 1,
      amount: 1200,
      date: "2025-08-01T10:00:00Z",
      description: "August Rent",
      status: "paid",
      tenant_id: 101
    }
  ],
  selectedPayment: null,
  loading: false,
  error: null,
  stats: {
    totalPaid: 1200,
    totalPending: 0,
    overdue: 0
  },
  fetchPayments: jest.fn().mockResolvedValue([]),
  getPayment: jest.fn().mockImplementation((id) => 
    Promise.resolve({
      id,
      amount: 1200,
      date: "2025-08-01T10:00:00Z",
      description: "August Rent",
      status: "paid",
      tenant_id: 101
    })
  ),
  createPayment: jest.fn().mockResolvedValue({ id: 2 }),
  updatePayment: jest.fn().mockResolvedValue({ id: 1 }),
  deletePayment: jest.fn().mockResolvedValue(true),
  recordPayment: jest.fn().mockResolvedValue({ id: 3 }),
  processStripeSession: jest.fn().mockResolvedValue({ success: true })
};

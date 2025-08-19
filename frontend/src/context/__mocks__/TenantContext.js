// Mock for TenantContext
import React, { createContext } from 'react';

export const TenantContext = createContext();

export const useTenantContext = jest.fn().mockReturnValue({
  tenants: [
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      property_id: 1,
      unit_id: 1,
      unit_number: "101",
      lease_start_date: "2023-01-01T00:00:00Z",
      lease_end_date: "2023-12-31T00:00:00Z",
      rent_amount: 1500,
      status: "active"
    }
  ],
  loading: false,
  error: null,
  addTenant: jest.fn().mockResolvedValue({ success: true }),
  updateTenant: jest.fn().mockResolvedValue({ success: true }),
  deleteTenant: jest.fn().mockResolvedValue({ success: true }),
  fetchTenants: jest.fn().mockResolvedValue([]),
  fetchTenantById: jest.fn().mockResolvedValue({})
});

export const TenantProvider = ({ children, value }) => {
  const contextValue = value || useTenantContext();
  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>;
};

export default TenantContext;

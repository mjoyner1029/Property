// Mock implementation of TenantContext hooks
export const mockTenantHook = {
  tenants: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "555-123-4567",
      leaseStart: "2025-01-01",
      leaseEnd: "2025-12-31",
      property_id: 1,
      unit_id: 101
    }
  ],
  selectedTenant: null,
  loading: false,
  error: null,
  fetchTenants: jest.fn().mockResolvedValue([]),
  fetchTenantById: jest.fn().mockImplementation((id) => 
    Promise.resolve({
      id,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "555-123-4567",
      leaseStart: "2025-01-01",
      leaseEnd: "2025-12-31",
      property_id: 1,
      unit_id: 101
    })
  ),
  createTenant: jest.fn().mockResolvedValue({ id: 2 }),
  updateTenant: jest.fn().mockResolvedValue({ id: 1 }),
  deleteTenant: jest.fn().mockResolvedValue(true)
};

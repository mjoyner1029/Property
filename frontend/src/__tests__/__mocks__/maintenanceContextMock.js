// Mock implementation of MaintenanceContext hooks
export const mockMaintenanceHook = {
  maintenance: [
    {
      id: 1,
      title: "Broken faucet",
      description: "Leaking in kitchen sink",
      status: "pending",
      priority: "medium",
      property_id: 1,
      unit_id: 101,
      created_at: "2025-07-15T09:00:00Z"
    }
  ],
  selectedMaintenance: null,
  loading: false,
  error: null,
  fetchMaintenance: jest.fn().mockResolvedValue([]),
  fetchMaintenanceById: jest.fn().mockImplementation((id) => 
    Promise.resolve({
      id,
      title: "Broken faucet",
      description: "Leaking in kitchen sink",
      status: "pending",
      priority: "medium",
      property_id: 1,
      unit_id: 101,
      created_at: "2025-07-15T09:00:00Z"
    })
  ),
  createMaintenance: jest.fn().mockResolvedValue({ id: 2 }),
  updateMaintenance: jest.fn().mockResolvedValue({ id: 1 }),
  deleteMaintenance: jest.fn().mockResolvedValue(true),
  uploadAttachment: jest.fn().mockResolvedValue({ id: "att-123", url: "https://example.com/file.jpg" })
};

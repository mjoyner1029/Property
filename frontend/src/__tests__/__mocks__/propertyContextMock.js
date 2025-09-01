// Mock implementation of PropertyContext hooks
export const mockPropertyHook = {
  properties: [
    {
      id: 1,
      address: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "90210",
      units: [
        { id: 101, name: "Unit 101", tenant_id: 1 },
        { id: 102, name: "Unit 102", tenant_id: null }
      ]
    }
  ],
  selectedProperty: null,
  loading: false,
  error: null,
  stats: {
    totalProperties: 1,
    totalUnits: 2,
    occupiedUnits: 1,
    vacantUnits: 1,
    occupancyRate: 50
  },
  fetchProperties: jest.fn().mockResolvedValue([]),
  fetchPropertyById: jest.fn().mockImplementation((id) => 
    Promise.resolve({
      id,
      address: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "90210"
    })
  ),
  createProperty: jest.fn().mockResolvedValue({ id: 2 }),
  updateProperty: jest.fn().mockResolvedValue({ id: 1 }),
  deleteProperty: jest.fn().mockResolvedValue(true),
  setSelectedProperty: jest.fn()
};

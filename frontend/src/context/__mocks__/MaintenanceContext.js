// Mock for MaintenanceContext
import React, { createContext } from 'react';

export const MaintenanceContext = createContext();

export const useMaintenanceContext = jest.fn().mockReturnValue({
  maintenanceRequests: [
    {
      id: 1,
      property_id: 1,
      property_name: "Test Property",
      unit_id: 1,
      unit_number: "101",
      title: "Leaking Faucet",
      description: "The bathroom faucet is leaking constantly",
      status: "pending",
      priority: "medium",
      created_at: "2023-08-10T12:00:00Z",
      updated_at: "2023-08-10T12:00:00Z"
    }
  ],
  loading: false,
  error: null,
  addMaintenanceRequest: jest.fn().mockResolvedValue({ success: true }),
  updateMaintenanceRequest: jest.fn().mockResolvedValue({ success: true }),
  deleteMaintenanceRequest: jest.fn().mockResolvedValue({ success: true }),
  fetchMaintenanceRequests: jest.fn().mockResolvedValue([]),
  fetchMaintenanceRequestById: jest.fn().mockResolvedValue({})
});

export const MaintenanceProvider = ({ children, value }) => {
  // Don't call hooks conditionally - create a default value instead
  const defaultValue = {
    maintenanceRequests: [],
    loading: false,
    error: null,
    addMaintenanceRequest: jest.fn(),
    updateMaintenanceRequest: jest.fn(),
    deleteMaintenanceRequest: jest.fn(),
    fetchMaintenanceRequests: jest.fn(),
    fetchMaintenanceRequestById: jest.fn()
  };
  const contextValue = value || defaultValue;
  return <MaintenanceContext.Provider value={contextValue}>{children}</MaintenanceContext.Provider>;
};

export default MaintenanceContext;

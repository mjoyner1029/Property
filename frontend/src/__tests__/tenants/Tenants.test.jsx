// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Tenants.test.jsx
import React from 'react';
import { screen, within, waitFor } from "@testing-library/react";
import Tenants from "src/pages/Tenants";
import { renderWithProviders } from 'src/test-utils/renderWithProviders';

// Mock the app's axios client module
jest.mock('src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));
import api from 'src/utils/api';

describe('Tenants Component', () => {
  const mockTenants = [
    { id: 1, name: "John Smith", email: "john@example.com", property_name: "Sunset Apartments", unit: "101" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com", property_name: "Oakwood Residences", unit: "204" }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValueOnce({ data: mockTenants });
  });

  test("renders tenant list", async () => {
    renderWithProviders(<Tenants />);
    
    // First verify that API client call was made
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
    
    // Then check for tenant names using findBy for async rendering
    const johnElement = await screen.findByText("John Smith");
    expect(johnElement).toBeInTheDocument();
    
    // Once one element is found, the others should be there too
    expect(await screen.findByText("Sarah Johnson")).toBeInTheDocument();
    expect(screen.getByText("Tenants")).toBeInTheDocument();
  });
});
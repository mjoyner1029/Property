// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Tenants.test.jsx
import React from 'react';
import { screen, waitFor } from "@testing-library/react";
import Tenants from "../pages/Tenants";
import axios from "axios";
import { renderWithProviders } from '../test-utils/renderWithProviders';

jest.mock("axios");

describe('Tenants Component', () => {
  const mockTenants = [
    { id: 1, name: "John Smith", email: "john@example.com", property_name: "Sunset Apartments", unit: "101" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com", property_name: "Oakwood Residences", unit: "204" }
  ];

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockTenants });
  });

  test("renders tenant list", async () => {
    renderWithProviders(<Tenants />);
    
    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Sarah Johnson")).toBeInTheDocument();
    });
  });
});
// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Tenants.test.jsx
import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Tenants from "../pages/Tenants";
import axios from "axios";

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
    render(
      <BrowserRouter>
        <AuthProvider>
          <Tenants />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Sarah Johnson")).toBeInTheDocument();
    });
  });
});
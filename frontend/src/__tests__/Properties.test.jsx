// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Properties.test.jsx
import React from 'react';
import { screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import Properties from "../pages/Properties";
import axios from "axios";
import { renderWithProviders } from '../test-utils/renderWithProviders';

jest.mock("axios");

describe('Properties Component', () => {
  const mockProperties = [
    { id: 1, name: "Sunset Apartments", address: "123 Main St", units: 10, image: "/images/property1.jpg" },
    { id: 2, name: "Oakwood Residences", address: "456 Oak Ave", units: 24, image: "/images/property2.jpg" }
  ];

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockProperties });
  });

  test("renders properties list", async () => {
    renderWithProviders(<Properties />);
    
    // Check for heading
    expect(screen.getByText(/Properties/i)).toBeInTheDocument();
    
    // Check for property data
    await waitFor(() => {
      expect(screen.getByText("Sunset Apartments")).toBeInTheDocument();
      expect(screen.getByText("Oakwood Residences")).toBeInTheDocument();
    });
  });

  test("allows filtering properties", async () => {
    renderWithProviders(<Properties />);
    
    await waitFor(() => {
      expect(screen.getByText("Sunset Apartments")).toBeInTheDocument();
    });
    
    // Filter properties
    const searchInput = screen.getByRole('textbox', { name: /search/i }) || screen.getByPlaceholderText(/search/i);
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, "Oak");
    
    // Check filtered results
    expect(screen.queryByText("Sunset Apartments")).not.toBeInTheDocument();
    expect(screen.getByText("Oakwood Residences")).toBeInTheDocument();
  });
});
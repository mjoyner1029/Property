// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Properties.test.jsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Properties from "../pages/Properties";
import axios from "axios";

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
    render(
      <BrowserRouter>
        <AuthProvider>
          <Properties />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Check for heading
    expect(screen.getByText(/Properties/i)).toBeInTheDocument();
    
    // Check for property data
    await waitFor(() => {
      expect(screen.getByText("Sunset Apartments")).toBeInTheDocument();
      expect(screen.getByText("Oakwood Residences")).toBeInTheDocument();
    });
  });

  test("allows filtering properties", async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Properties />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("Sunset Apartments")).toBeInTheDocument();
    });
    
    // Filter properties
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Oak" } });
    
    // Check filtered results
    expect(screen.queryByText("Sunset Apartments")).not.toBeInTheDocument();
    expect(screen.getByText("Oakwood Residences")).toBeInTheDocument();
  });
});
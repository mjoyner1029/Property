// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Dashboard.test.jsx
import React from 'react';
import { screen, waitFor } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import axios from "axios";
import { renderWithProviders } from '../test-utils/renderWithProviders';

jest.mock("axios");

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Mock all API responses needed for dashboard
    axios.get.mockImplementation((url) => {
      if (url.includes('/properties/summary')) {
        return Promise.resolve({ data: { total: 5, vacant: 2 } });
      } else if (url.includes('/maintenance/summary')) {
        return Promise.resolve({ data: { open: 3, in_progress: 2, completed: 10 } });
      } else if (url.includes('/payments/summary')) {
        return Promise.resolve({ data: { pending: 2, total_month: 8500 } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("renders dashboard with summary data", async () => {
    renderWithProviders(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      // Property summary
      expect(screen.getByText(/5/)).toBeInTheDocument(); // Total properties
      expect(screen.getByText(/2/)).toBeInTheDocument(); // Vacant units
      
      // Maintenance summary
      expect(screen.getByText(/3/)).toBeInTheDocument(); // Open requests
      expect(screen.getByText(/2/)).toBeInTheDocument(); // In progress
      
      // Payment summary
      expect(screen.getByText(/\$8,500/)).toBeInTheDocument();
    });
  });
});
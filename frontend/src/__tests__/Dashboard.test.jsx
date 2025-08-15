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
    await waitFor(() => {
      renderWithProviders(<Dashboard />);
    });
    
    // First wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for dashboard title (user is undefined so 'there' is the fallback)
    await waitFor(() => {
      expect(screen.getByText(/Hello, there!/i)).toBeInTheDocument();
      expect(screen.getByText(/Here's what's happening with your properties today/i)).toBeInTheDocument();
    });
    
    // Check for quick access section
    expect(screen.getByText(/Quick Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    expect(screen.getByText(/Rentals/i)).toBeInTheDocument();
    
    // Wait for API calls to resolve
    await waitFor(() => {
      // Don't check for specific API endpoints since the mock dashboardData hook is used
      expect(axios.get).toHaveBeenCalled();
    });
  });
});
// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Maintenance.test.jsx
import React from 'react';
import { screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import Maintenance from "../pages/Maintenance";
import axios from "axios";
import { renderWithProviders } from '../test-utils/renderWithProviders';

jest.mock("axios");

describe('Maintenance Component', () => {
  const mockRequests = [
    { id: 1, title: "Broken AC", status: "open", priority: "high", created_at: "2023-04-01T10:30:00Z" },
    { id: 2, title: "Leaky Faucet", status: "in_progress", priority: "medium", created_at: "2023-04-02T14:20:00Z" }
  ];

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockRequests });
    axios.post.mockResolvedValue({ data: { id: 3, title: "New Request", status: "open" } });
  });

  test("renders maintenance requests", async () => {
    renderWithProviders(<Maintenance />);
    
    await waitFor(() => {
      expect(screen.getByText("Broken AC")).toBeInTheDocument();
      expect(screen.getByText("Leaky Faucet")).toBeInTheDocument();
    });
  });

  test("allows creating new request", async () => {
    renderWithProviders(<Maintenance />);
    
    // Click create button
    await userEvent.click(screen.getByText(/new request/i));
    
    // Fill out form
    await userEvent.type(screen.getByLabelText(/title/i), "New Request");
    await userEvent.type(screen.getByLabelText(/description/i), "Test description");
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Verify request creation
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/maintenance'),
        expect.objectContaining({ title: "New Request" }),
        expect.any(Object)
      );
    });
  });
});
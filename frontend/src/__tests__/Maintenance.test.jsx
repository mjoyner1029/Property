// filepath: /Users/mjoyner/Property/frontend/src/__tests__/Maintenance.test.jsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Maintenance from "../pages/Maintenance";
import axios from "axios";

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
    render(
      <BrowserRouter>
        <AuthProvider>
          <Maintenance />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("Broken AC")).toBeInTheDocument();
      expect(screen.getByText("Leaky Faucet")).toBeInTheDocument();
    });
  });

  test("allows creating new request", async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Maintenance />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Click create button
    fireEvent.click(screen.getByText(/new request/i));
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "New Request" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Test description" } });
    
    // Submit form
    fireEvent.click(screen.getByText(/submit/i));
    
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
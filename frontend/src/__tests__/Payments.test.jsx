import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Payments from "../pages/Payments";
import axios from "axios";

jest.mock("axios");

describe('Payments Component', () => {
  // Sample payment data
  const mockPayments = [
    { id: 1, amount: 1200, status: 'completed', date: '2023-04-01', description: 'April Rent' },
    { id: 2, amount: 1200, status: 'pending', date: '2023-05-01', description: 'May Rent' }
  ];
  
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockPayments });
  });
  
  test("renders payments list", async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Payments />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Check for header
    expect(await screen.findByText(/Payments/i)).toBeInTheDocument();
    
    // Check for payment data
    await waitFor(() => {
      expect(screen.getByText(/April Rent/i)).toBeInTheDocument();
      expect(screen.getByText(/May Rent/i)).toBeInTheDocument();
      expect(screen.getByText(/\$1200/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });
  
  test("displays loading state", async () => {
    // Delay API response
    axios.get.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ data: mockPayments }), 100);
    }));
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <Payments />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Check for loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
  
  test("handles API error", async () => {
    // Mock API error
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch payments'));
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <Payments />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
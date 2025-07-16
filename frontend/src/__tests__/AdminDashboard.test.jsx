import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import AdminDashboard from "../pages/AdminDashboard";
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'landlord' }
];
const mockProperties = [
  { id: 1, name: 'Sunset Apartments', address: '123 Main St' }
];
const mockPayments = [
  { id: 1, amount: 1000, status: 'completed', date: '2023-04-01' }
];

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    // Mock successful API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/admin/users')) {
        return Promise.resolve({ data: mockUsers });
      } else if (url.includes('/admin/properties')) {
        return Promise.resolve({ data: mockProperties });
      } else if (url.includes('/admin/payments')) {
        return Promise.resolve({ data: mockPayments });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test("renders admin dashboard with data", async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    
    // Check for main heading
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    
    // Check for data sections
    expect(screen.getByText(/Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Properties/i)).toBeInTheDocument();
    expect(screen.getByText(/Payments/i)).toBeInTheDocument();
    
    // Check for specific data
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Sunset Apartments/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1000/i)).toBeInTheDocument();
  });
});
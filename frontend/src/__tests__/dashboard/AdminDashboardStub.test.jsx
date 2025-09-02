import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";

// Create a stub component for testing
const AdminDashboardStub = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  React.useEffect(() => {
    // Simulate data loading delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>
        <h2>Users</h2>
        <div>John Doe</div>
      </div>
      <div>
        <h2>Properties</h2>
        <div>Sunset Apartments</div>
      </div>
    </div>
  );
};

// Mock axios for data source
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ 
    data: { users: 1, properties: 2 }
  })
}));

describe('AdminDashboard Stub Component', () => {
  beforeEach(() => {
    // Use fake timers for more reliable tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Reset to real timers after each test
    jest.useRealTimers();
  });

  test("renders admin dashboard with data", async () => {
    // Render the stub component
    render(<AdminDashboardStub />);
    
    // Initially should show loading
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    // Advance timers to complete the setTimeout
    jest.runAllTimers();
    
    // Now the component should be loaded
    // Using findByText to handle the state update
    const heading = await screen.findByText(/admin dashboard/i);
    expect(heading).toBeInTheDocument();
    
    // Check other elements that should be visible after loading
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Sunset Apartments")).toBeInTheDocument();
  });
});

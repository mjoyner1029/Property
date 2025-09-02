import React from 'react';
import { render, screen } from "@testing-library/react";

// Super simple component with no state or effects
const SimpleComponent = () => (
  <div>
    <h1>Admin Dashboard</h1>
  </div>
);

describe('Simple Component Test', () => {
  test("renders heading", () => {
    render(<SimpleComponent />);
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
  });
});

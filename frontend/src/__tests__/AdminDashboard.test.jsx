import { render, screen } from "@testing-library/react";
import AdminDashboard from "../pages/AdminDashboard";

test("renders admin dashboard header", () => {
  render(<AdminDashboard />);
  expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
});
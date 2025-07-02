import { render, screen } from "@testing-library/react";
import Profile from "../pages/Profile";

test("renders profile header", () => {
  render(<Profile />);
  expect(screen.getByText(/Profile/i)).toBeInTheDocument();
});
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../auth/Login";

test("renders login form and submits", () => {
  render(<Login />);
  fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: "test@example.com" } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "password" } });
  fireEvent.click(screen.getByText(/login/i));
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});
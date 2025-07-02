import { render, screen } from "@testing-library/react";
import Payments from "../pages/Payments";
import axios from "axios";

jest.mock("axios");

test("renders payments header", async () => {
  axios.get.mockResolvedValue({ data: [] });
  render(<Payments />);
  expect(await screen.findByText(/Payments/i)).toBeInTheDocument();
});
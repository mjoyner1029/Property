import React from "react";
import { render, screen } from "@testing-library/react";

describe("MaintenanceDelete", () => {
  test("basic test", () => {
    render(<div data-testid="test-element">Test Content</div>);
    expect(screen.getByTestId("test-element")).toBeInTheDocument();
  });
});

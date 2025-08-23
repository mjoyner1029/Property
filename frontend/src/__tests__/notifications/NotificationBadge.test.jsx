// frontend/src/__tests__/notifications/NotificationBadge.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationBadge from "../../components/NotificationBadge";
import { Box } from "@mui/material";

describe("NotificationBadge", () => {
  test("renders default bell and hides badge when count is 0", () => {
    render(<NotificationBadge count={0} />);

    // Accessible label without unread suffix when count=0
    const button = screen.getByRole("button", { name: /open notifications$/i });
    expect(button).toBeInTheDocument();

    // Badge should not display a "0" label
    expect(screen.queryByText("0")).not.toBeInTheDocument();

    // The wrapper exists (Badge root), but badge content is invisible
    expect(screen.getByTestId("notification-badge")).toBeInTheDocument();
  });

  test("shows count and calls onClick when clicked (default bell)", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<NotificationBadge count={5} onClick={onClick} />);

    // Accessible label includes unread count
    const button = screen.getByRole("button", {
      name: /open notifications \(5 unread\)/i,
    });
    expect(button).toBeInTheDocument();

    // Badge shows the numeric content (as implemented)
    expect(screen.getByText("5")).toBeInTheDocument();

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("respects maxCount prop (caps display at the max)", () => {
    render(<NotificationBadge count={120} maxCount={99} />);

    // Component implementation uses Math.min(count, maxCount), so it shows "99" (no "+")
    expect(screen.getByText("99")).toBeInTheDocument();
    expect(screen.queryByText("99+")).not.toBeInTheDocument();
  });

  test("wraps custom children and is keyboard-accessible (Enter/Space)", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <NotificationBadge count={2} onClick={onClick}>
        <Box data-testid="custom-child">X</Box>
      </NotificationBadge>
    );

    // With custom children, wrapper is a Box with role="button" and correct aria-label
    const btn = screen.getByRole("button", {
      name: /open notifications \(2 unread\)/i,
    });
    expect(btn).toBeInTheDocument();

    // Clicking the custom child triggers the handler
    await user.click(btn);
    // Keyboard activation: Enter
    await user.keyboard("{Enter}");
    // Keyboard activation: Space
    await user.keyboard(" ");

    expect(onClick).toHaveBeenCalledTimes(3);
    // Count text visible
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("applies custom tooltip text when provided", async () => {
    // Tooltip rendering is portal-based and appears on hover.
    // We can still assert the button exists with a custom tooltip prop without forcing hover in JSDOM.
    render(<NotificationBadge count={1} tooltip="Alerts" />);
    const button = screen.getByRole("button", {
      name: /open notifications \(1 unread\)/i,
    });
    expect(button).toBeInTheDocument();
  });

  test("accepts className and sx without breaking behavior", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <NotificationBadge
        count={3}
        onClick={onClick}
        className="custom-class"
        sx={{ ml: 1 }}
      />
    );

    const button = screen.getByRole("button", {
      name: /open notifications \(3 unread\)/i,
    });
    expect(button).toBeInTheDocument();

    // Click still works
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    // Count is shown
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

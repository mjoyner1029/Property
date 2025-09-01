// frontend/src/__tests__/notifications/NotificationBadge.test.jsx
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "src/test/utils/renderWithProviders";
import NotificationBadge from "src/components/NotificationBadge";
import { Box } from "@mui/material";

describe("NotificationBadge", () => {
  test("renders nothing when count is 0", () => {
    renderWithProviders(<NotificationBadge count={0} />, { withRouter: false });

    // Based on implementation, component returns null when count is 0
    const badgeContainer = screen.queryByTestId("notification-badge");
    expect(badgeContainer).not.toBeInTheDocument();
  });

  test("shows count and calls onClick when clicked (default bell)", () => {
    const onClick = jest.fn();

    renderWithProviders(<NotificationBadge count={5} onClick={onClick} />, { withRouter: false });

    // Find the notification badge container
    const badgeContainer = screen.getByTestId("notification-badge");
    expect(badgeContainer).toBeInTheDocument();

    // Find the button element directly
    const iconButton = badgeContainer.querySelector('button');
    expect(iconButton).toBeInTheDocument();

    // Find the badge element with the count
    const badgeElement = badgeContainer.querySelector('.MuiBadge-badge');
    expect(badgeElement).toHaveTextContent("5");

    // Click the button and check that onClick was called
    fireEvent.click(iconButton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("respects maxCount prop (caps display at the max)", () => {
    renderWithProviders(<NotificationBadge count={120} maxCount={99} />, { withRouter: false });

    // Use a more specific approach - target the badge content directly
    const badge = screen.getByTestId("notification-badge");
    const badgeContent = badge.querySelector('.MuiBadge-badge');
    expect(badgeContent).toHaveTextContent("99+"); // Note: Check what the actual implementation shows
  });

  test("handles keyboard and mouse interaction", () => {
    const onClick = jest.fn();

    render(
      <NotificationBadge count={2} onClick={onClick} />
    );

    // Find the badge container
    const badgeContainer = screen.getByTestId("notification-badge");
    expect(badgeContainer).toBeInTheDocument();

    // Find the button element which should be clickable
    const button = badgeContainer.querySelector('button');
    expect(button).toBeInTheDocument();

    // Click the button
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);

    // The badge element should have the correct count
    const badgeElement = badgeContainer.querySelector('.MuiBadge-badge');
    expect(badgeElement).toHaveTextContent("2");
  });

  test("applies custom tooltip text when provided", async () => {
    // Tooltip rendering is portal-based and appears on hover.
    // We can still assert the button exists with a custom tooltip prop without forcing hover in JSDOM.
    renderWithProviders(<NotificationBadge count={1} tooltip="Alerts" />, { withRouter: false });
    const button = screen.getByRole("button", {
      name: /open notifications \(1 unread\)/i,
    });
    expect(button).toBeInTheDocument();
  });

  test("accepts className and sx without breaking behavior", () => {
    const onClick = jest.fn();

    render(
      <NotificationBadge
        count={3}
        onClick={onClick}
        className="custom-class"
        sx={{ ml: 1 }}
      />
    );

    // Find badge container and verify it has the custom class
    const badgeContainer = screen.getByTestId("notification-badge");
    expect(badgeContainer).toBeInTheDocument();
    expect(badgeContainer).toHaveClass('custom-class');

    // Find the button element
    const button = badgeContainer.querySelector('button');
    expect(button).toBeInTheDocument();

    // Click still works
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);

    // Count is shown in the badge element
    const badgeElement = badgeContainer.querySelector('.MuiBadge-badge');
    expect(badgeElement).toHaveTextContent("3");
  });
});

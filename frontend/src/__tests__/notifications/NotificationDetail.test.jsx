// frontend/src/__tests__/notifications/NotificationDetail.test.jsx
import React from "react";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import NotificationDetail from "../../pages/NotificationDetail";

// ---- Router mocks ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "1" }),
}));

// ---- Context barrel mocks ----
const mockFetchNotifications = jest.fn();
const mockMarkAsRead = jest.fn();
const mockClearNotification = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  useNotifications: jest.fn(),
  useApp: jest.fn(),
}));

import { useNotifications, useApp } from "../../context";

// ---- Lightweight MUI stubs for deterministic DOM (Dialog/Button/Select/MenuItem) ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  const toOptions = (children) =>
    React.Children.toArray(children)
      .map((child, idx) => {
        if (!React.isValidElement(child)) return null;
        if (child.props && "value" in child.props) {
          return (
            <option key={idx} value={child.props.value}>
              {child.props.children}
            </option>
          );
        }
        return null;
      })
      .filter(Boolean);

  return {
    ...actual,
    Button: ({ children, onClick, disabled, ...rest }) => (
      <button onClick={onClick} disabled={disabled} {...rest}>
        {children}
      </button>
    ),
    IconButton: ({ children, onClick, disabled, "aria-label": ariaLabel, ...rest }) => (
      <button onClick={onClick} disabled={disabled} aria-label={ariaLabel} {...rest}>
        {children}
      </button>
    ),
    Dialog: ({ open, children }) => (open ? <div role="dialog">{children}</div> : null),
    DialogTitle: ({ children }) => <h2>{children}</h2>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogActions: ({ children }) => <div>{children}</div>,
    Menu: ({ open, children }) => (open ? <div role="menu">{children}</div> : null),
    MenuItem: ({ onClick, children }) => (
      <div role="menuitem" onClick={onClick}>
        {children}
      </div>
    ),
    Select: ({ name, value, onChange, label, children }) => (
      <select
        aria-label={label || name}
        name={name}
        value={value || ""}
        onChange={(e) =>
          onChange &&
          onChange({
            target: { name: name, value: e.target.value },
          })
        }
        data-testid={`select-${name || label || "unnamed"}`}
      >
        {toOptions(children)}
      </select>
    ),
    Chip: ({ label, color, ...rest }) => (
      <span role="status" data-color={color} {...rest}>
        {label}
      </span>
    ),
  };
});

// ---- Fixtures & helpers ----
const notificationUnread = {
  id: 1,
  title: "Payment received",
  message: "Rent payment from John Smith",
  read: false,
  created_at: "2025-08-01T10:00:00Z",
  type: "payment",
};

const notificationRead = {
  ...notificationUnread,
  id: 2,
  title: "Maintenance update",
  message: "Work order #42 marked in progress",
  read: true,
  type: "maintenance",
};

const defaultUseNotifications = (overrides = {}) => ({
  notifications: [notificationUnread, notificationRead],
  unreadCount: 1,
  loading: false,
  error: null,
  fetchNotifications: mockFetchNotifications,
  markAsRead: mockMarkAsRead,
  clearNotification: mockClearNotification,
  markAllAsRead: jest.fn(),
  addNotification: jest.fn(),
  ...overrides,
});

const setContexts = (notifOverrides = {}) => {
  (useNotifications).mockReturnValue(defaultUseNotifications(notifOverrides));
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

const renderDetail = () =>
  renderWithProviders(
    <Routes>
      <Route path="/notifications/:id" element={<NotificationDetail />} />
    </Routes>,
    { route: "/notifications/1" }
  );

// ---- Tests ----
describe("NotificationDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches on mount and renders details", async () => {
    setContexts();
    renderDetail();

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalled();
    });

    // Title and message
    expect(screen.getByText(/payment received/i)).toBeInTheDocument();
    expect(screen.getByText(/rent payment from john smith/i)).toBeInTheDocument();

    // Optional chips / status markers (tolerant)
    const status =
      screen.queryByRole("status", { name: /unread/i }) ||
      screen.queryByText(/unread/i) ||
      screen.queryByText(/read/i);
    expect(status).toBeInTheDocument();

    // Back button presence (label tolerant)
    const backBtn =
      screen.queryByRole("button", { name: /back/i }) ||
      screen.queryByRole("button", { name: /back to notifications/i }) ||
      screen.queryByRole("button", { name: /close/i });
    expect(backBtn).toBeInTheDocument();
  });

  test("shows loading state", () => {
    setContexts({ loading: true });
    renderDetail();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("shows error state", () => {
    setContexts({ error: "Failed to load notification" });
    renderDetail();

    const alert =
      screen.queryByRole("alert") || screen.getByText(/failed to load notification/i);
    expect(alert).toBeInTheDocument();
  });

  test("handles not found after fetch", async () => {
    // No notifications returned; fetch still called
    setContexts({ notifications: [], unreadCount: 0 });
    renderDetail();

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalled();
    });

    const notFound =
      screen.queryByText(/not found/i) ||
      screen.queryByText(/could not find/i) ||
      screen.queryByText(/no notification/i);
    expect(notFound).toBeInTheDocument();
  });

  test("mark as read flow for unread notification", async () => {
    setContexts();
    renderDetail();

    await screen.findByText(/payment received/i);

    // A mark-as-read affordance (label tolerant)
    const markBtn =
      screen.queryByRole("button", { name: /mark as read/i }) ||
      screen.queryByRole("button", { name: /read/i }) ||
      screen.queryByRole("menuitem", { name: /mark as read/i });
    expect(markBtn).toBeInTheDocument();
    expect(markBtn).not.toBeDisabled();

    fireEvent.click(markBtn);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith(1);
    });
  });

  test("mark as read is disabled or hidden for read notifications", async () => {
    // Switch params to id=2 (read notification)
    jest.spyOn(require("react-router-dom"), "useParams").mockReturnValue({ id: "2" });
    setContexts();
    renderWithProviders(
      <Routes>
        <Route path="/notifications/:id" element={<NotificationDetail />} />
      </Routes>,
      { route: "/notifications/2" }
    );

    await screen.findByText(/maintenance update/i);

    const markBtn =
      screen.queryByRole("button", { name: /mark as read/i }) ||
      screen.queryByRole("button", { name: /read/i });

    if (markBtn) {
      expect(markBtn).toBeDisabled();
    } else {
      expect(markBtn).toBeFalsy();
    }
  });

  test("delete (clear) confirmation and navigate back", async () => {
    setContexts();
    renderDetail();

    await screen.findByText(/payment received/i);

    // Delete affordance (label tolerant)
    const deleteBtn =
      screen.queryByRole("button", { name: /delete/i }) ||
      screen.queryByRole("button", { name: /clear/i }) ||
      screen.queryByRole("button", { name: /remove/i });
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    // Confirmation dialog
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const confirm =
      within(dialog).queryByRole("button", { name: /delete/i }) ||
      within(dialog).queryByRole("button", { name: /confirm/i }) ||
      within(dialog).getByRole("button");
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(mockClearNotification).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/notifications");
    });
  });

  test("back button navigates to list", async () => {
    setContexts();
    renderDetail();

    await screen.findByText(/payment received/i);

    const backBtn =
      screen.queryByRole("button", { name: /back to notifications/i }) ||
      screen.queryByRole("button", { name: /^back$/i }) ||
      screen.queryByRole("button", { name: /close/i });
    expect(backBtn).toBeInTheDocument();

    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/notifications");
  });
});

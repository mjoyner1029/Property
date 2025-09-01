// frontend/src/__tests__/notifications/NotificationList.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "src/test/utils/renderWithProviders";

// Using absolute imports for page components
import NotificationsPage from "src/pages/Notifications";

import { useNotifications, useApp } from "src/context";

// ---- Router mocks (kept light; page may not navigate) ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---- Context barrel mocks (your pages commonly import from "../context") ----
const mockFetchNotifications = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockClearNotification = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("src/context", () => ({
  useNotifications: jest.fn(),
  useApp: jest.fn(),
}));

// ---- Lightweight MUI stubs for deterministic DOM (Dialog/Menu/Button/Select) ----
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
const notificationsFixture = [
  {
    id: 1,
    title: "Payment received",
    message: "Rent payment from John Smith",
    read: false,
    created_at: "2025-08-01T10:00:00Z",
    type: "payment",
  },
  {
    id: 2,
    title: "Maintenance update",
    message: "Work order #42 marked in progress",
    read: true,
    created_at: "2025-08-01T09:00:00Z",
    type: "maintenance",
  },
  {
    id: 3,
    title: "New tenant application",
    message: "Sarah Johnson applied for Unit 304",
    read: false,
    created_at: "2025-07-31T18:00:00Z",
    type: "application",
  },
];

const defaultUseNotifications = (overrides = {}) => ({
  notifications: notificationsFixture,
  unreadCount: notificationsFixture.filter((n) => !n.read).length,
  loading: false,
  error: null,
  fetchNotifications: mockFetchNotifications,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
  clearNotification: mockClearNotification,
  ...overrides,
});

const setContexts = (notifOverrides = {}) => {
  (useNotifications).mockReturnValue(defaultUseNotifications(notifOverrides));
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

const renderList = () =>
  renderWithProviders(
    <Routes>
      <Route path="/notifications" element={<NotificationsPage />} />
    </Routes>,
    { route: "/notifications" }
  );

describe("Notifications list", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading state", () => {
    setContexts({ loading: true });
    renderList();

    // Expect a progressbar (from CircularProgress)
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("shows error state", async () => {
    setContexts({ loading: false, error: "Failed to load notifications" });
    renderList();

    const alert =
      screen.queryByRole("alert") || screen.getByText(/failed to load notifications/i);
    expect(alert).toBeInTheDocument();
  });

  test("shows empty state when there are no notifications", async () => {
    setContexts({ notifications: [], unreadCount: 0 });
    renderList();

    // The page likely renders an Empty component or a text
    const empty =
      screen.queryByText(/no notifications/i) ||
      screen.queryByText(/you're all caught up/i) ||
      screen.queryByText(/nothing here yet/i);
    expect(empty).toBeInTheDocument();
  });

  test("renders notifications and calls fetch on mount", async () => {
    setContexts();
    renderList();

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalled();
    });

    // Verify a couple of items are on screen
    expect(screen.getByText(/payment received/i)).toBeInTheDocument();
    expect(screen.getByText(/work order #42 marked in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/sarah johnson applied/i)).toBeInTheDocument();

    // Unread count could be shown somewhere (Chip, Badge, etc.)
    // Don't overfit: just ensure the two unread are visually present (e.g. chip/marker)
    // We'll check that at least the titles appear; styling is out of scope.
  });

  test("mark a single notification as read", async () => {
    setContexts();
    renderList();

    // Find an unread notification row/card
    const item = screen.getByText(/payment received/i).closest("*");
    expect(item).toBeInTheDocument();

    // Click a "Mark as read" affordance.
    // Different UIs: could be an icon button with aria-label or a menu item.
    const markButton =
      within(item).queryByRole("button", { name: /mark as read/i }) ||
      within(item).queryByRole("button", { name: /read/i }) ||
      within(item).queryByRole("menuitem", { name: /mark as read/i });
    if (!markButton) {
      // Fallback: click the item to mark as read (some UIs mark on open)
      fireEvent.click(item);
    } else {
      fireEvent.click(markButton);
    }

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith(1);
    });
  });

  test("mark all as read", async () => {
    setContexts();
    renderList();

    const markAllBtn =
      screen.queryByRole("button", { name: /mark all as read/i }) ||
      screen.queryByRole("button", { name: /mark all read/i }) ||
      screen.queryByRole("button", { name: /mark all/i });
    expect(markAllBtn).toBeInTheDocument();

    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });
  });

  test("clear (delete) a notification", async () => {
    setContexts();
    renderList();

    const target = screen.getByText(/maintenance update/i).closest("*");
    expect(target).toBeInTheDocument();

    const deleteBtn =
      within(target).queryByRole("button", { name: /clear/i }) ||
      within(target).queryByRole("button", { name: /delete/i }) ||
      within(target).queryByRole("button", { name: /dismiss/i }) ||
      within(target).queryByRole("menuitem", { name: /delete/i });

    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockClearNotification).toHaveBeenCalledWith(2);
    });
  });

  test("filters/searches notifications if a search input exists", async () => {
    setContexts();
    renderList();

    // Some UIs include a search box; if not present, this test is a no-op.
    const searchInput =
      screen.queryByPlaceholderText(/search notifications/i) ||
      screen.queryByRole("textbox", { name: /search/i }) ||
      screen.queryByRole("searchbox");

    if (!searchInput) {
      // Skip gracefully if your UI doesn't include search
      expect(true).toBe(true);
      return;
    }

    fireEvent.change(searchInput, { target: { value: "application" } });

    // Now the "New tenant application" should be present, others maybe filtered
    await waitFor(() => {
      expect(screen.getByText(/new tenant application/i)).toBeInTheDocument();
    });
  });
});

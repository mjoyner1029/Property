// frontend/src/__tests__/notifications/NotificationDelete.test.jsx
import React from "react";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// Pages under test (adjust if your files are named differently)
import NotificationsPage from "../../pages/Notifications";
import NotificationDetail from "../../pages/NotificationDetail";

// ---- Router mocks ----
const mockNavigate = jest.fn();

// We'll default useParams to { id: "1" } but override within tests as needed
let currentParams = { id: "1" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => currentParams,
}));

// ---- Context barrel mocks ----
const mockFetchNotifications = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockClearNotification = jest.fn();
const mockAddNotification = jest.fn();
const mockCreateNotification = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  useNotifications: jest.fn(),
  useApp: jest.fn(),
}));

import { useNotifications, useApp } from "../../context";

// ---- Lightweight MUI stubs for deterministic DOM (Dialog/Button/Menu/Select) ----
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
  addNotification: mockAddNotification,
  createNotification: mockCreateNotification,
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

const renderDetail = (id = "1") => {
  currentParams = { id };
  return renderWithProviders(
    <Routes>
      <Route path="/notifications/:id" element={<NotificationDetail />} />
    </Routes>,
    { route: `/notifications/${id}` }
  );
};

// Utility to open per-item menu when list uses menus
const tryOpenItemMenu = (container) => {
  const menuBtn =
    within(container).queryByRole("button", { name: /more/i }) ||
    within(container).queryByRole("button", { name: /open menu/i }) ||
    within(container).queryByRole("button", { name: /menu/i }) ||
    within(container).queryByRole("button"); // last resort
  if (menuBtn) fireEvent.click(menuBtn);
};

describe("Notification Delete (List & Detail)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    currentParams = { id: "1" };
  });

  // ---------- LIST PAGE ----------
  test("deletes a notification from the list via delete action + confirmation", async () => {
    setContexts();
    renderList();

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalled();
    });

    // Locate the row/card for "Maintenance update" (id:2) and trigger delete
    const item = screen.getByText(/maintenance update/i).closest("*");
    expect(item).toBeInTheDocument();

    // Many UIs use either a direct delete button OR a menu -> delete item
    let deleteBtn =
      within(item).queryByRole("button", { name: /delete/i }) ||
      within(item).queryByRole("button", { name: /clear/i }) ||
      within(item).queryByRole("button", { name: /dismiss/i });

    if (!deleteBtn) {
      // Try menu flow
      tryOpenItemMenu(item);
      const deleteMenuItem =
        screen.queryByRole("menuitem", { name: /delete/i }) ||
        screen.queryByRole("menuitem", { name: /clear/i }) ||
        screen.queryByRole("menuitem", { name: /dismiss/i });
      expect(deleteMenuItem).toBeInTheDocument();
      fireEvent.click(deleteMenuItem);
    } else {
      fireEvent.click(deleteBtn);
    }

    // Confirmation dialog
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const confirm =
      within(dialog).queryByRole("button", { name: /delete/i }) ||
      within(dialog).queryByRole("button", { name: /confirm/i }) ||
      within(dialog).getByRole("button");
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(mockClearNotification).toHaveBeenCalledWith(2);
    });

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("cancel in delete confirmation on list does not call clearNotification", async () => {
    setContexts();
    renderList();

    await screen.findByText(/payment received/i);

    const item = screen.getByText(/payment received/i).closest("*");
    expect(item).toBeInTheDocument();

    let deleteBtn =
      within(item).queryByRole("button", { name: /delete/i }) ||
      within(item).queryByRole("button", { name: /clear/i }) ||
      within(item).queryByRole("button", { name: /dismiss/i });
    if (!deleteBtn) {
      tryOpenItemMenu(item);
      const deleteMenuItem =
        screen.queryByRole("menuitem", { name: /delete/i }) ||
        screen.queryByRole("menuitem", { name: /clear/i }) ||
        screen.queryByRole("menuitem", { name: /dismiss/i });
      fireEvent.click(deleteMenuItem);
    } else {
      fireEvent.click(deleteBtn);
    }

    const dialog = await screen.findByRole("dialog");
    const cancel =
      within(dialog).queryByRole("button", { name: /cancel/i }) ||
      within(dialog).queryByRole("button", { name: /close/i });
    expect(cancel).toBeInTheDocument();
    fireEvent.click(cancel);

    await waitFor(() => {
      expect(mockClearNotification).not.toHaveBeenCalled();
    });

    // Dialog closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ---------- DETAIL PAGE ----------
  test("deletes a notification from the detail page and navigates back", async () => {
    setContexts();
    renderDetail("1"); // unread "Payment received"

    await screen.findByText(/payment received/i);

    // Delete affordance (label tolerant)
    const deleteBtn =
      screen.queryByRole("button", { name: /delete/i }) ||
      screen.queryByRole("button", { name: /clear/i }) ||
      screen.queryByRole("button", { name: /remove/i });
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);

    // Confirmation
    const dialog = await screen.findByRole("dialog");
    const confirm =
      within(dialog).queryByRole("button", { name: /delete/i }) ||
      within(dialog).queryByRole("button", { name: /confirm/i }) ||
      within(dialog).getByRole("button");
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(mockClearNotification).toHaveBeenCalledWith(1);
    });

    // Navigates back to list
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/notifications");
    });
  });

  test("cancel delete on detail page keeps you on the same page", async () => {
    setContexts();
    renderDetail("2"); // read "Maintenance update"

    await screen.findByText(/maintenance update/i);

    const deleteBtn =
      screen.queryByRole("button", { name: /delete/i }) ||
      screen.queryByRole("button", { name: /clear/i }) ||
      screen.queryByRole("button", { name: /remove/i });
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);

    const dialog = await screen.findByRole("dialog");
    const cancel =
      within(dialog).queryByRole("button", { name: /cancel/i }) ||
      within(dialog).queryByRole("button", { name: /close/i });
    expect(cancel).toBeInTheDocument();
    fireEvent.click(cancel);

    await waitFor(() => {
      expect(mockClearNotification).not.toHaveBeenCalled();
    });

    // Still on detail route; no navigation back
    expect(mockNavigate).not.toHaveBeenCalledWith("/notifications");
    // Dialog closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

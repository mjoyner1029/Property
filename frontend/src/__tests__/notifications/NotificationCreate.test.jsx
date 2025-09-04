// frontend/src/__tests__/notifications/NotificationCreate.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "src/test/utils/renderWithProviders";

// Page under test with absolute path
import NotificationsPage from "src/pages/Notifications";

import { useNotifications, useApp } from "src/context";

// ---- Router mocks ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---- Context barrel mocks ----
const mockFetchNotifications = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockClearNotification = jest.fn();
const mockAddNotification = jest.fn();
const mockCreateNotification = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("src/context", () => ({
  useNotifications: jest.fn(),
  useApp: jest.fn(),
}));

// ---- Lightweight MUI stubs for deterministic DOM ----
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
    // Make Select act like a native select for predictable tests
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
    id: 10,
    title: "Existing Notice",
    message: "Already in the list",
    read: false,
    created_at: "2025-08-01T10:00:00Z",
    type: "system",
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
  addNotification: mockAddNotification,           // some UIs might use this
  createNotification: mockCreateNotification,     // others might use this
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

// ---- Tests ----
describe("Notifications — Create flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const openCreateDialog = async () => {
    // Button label can vary
    const createBtn =
      screen.queryByRole("button", { name: /new notification/i }) ||
      screen.queryByRole("button", { name: /create notification/i }) ||
      screen.queryByRole("button", { name: /add notification/i }) ||
      screen.queryByRole("button", { name: /compose/i });
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    return dialog;
  };

  const fillCreateForm = (dialog, { title, message, type = "system", link = "" }) => {
    // Title input
    const titleInput =
      within(dialog).queryByLabelText(/title/i) ||
      within(dialog).getAllByRole("textbox")[0];
    expect(titleInput).toBeInTheDocument();
    fireEvent.change(titleInput, { target: { value: title } });

    // Message input (textarea)
    const messageInput =
      within(dialog).queryByLabelText(/message/i) ||
      within(dialog).getAllByRole("textbox")[1] ||
      within(dialog).getAllByRole("textbox")[0]; // fallback
    fireEvent.change(messageInput, { target: { value: message } });

    // Type select (if exists)
    const typeSelect =
      within(dialog).queryByTestId("select-type") ||
      within(dialog).queryByTestId("select-notification_type") ||
      within(dialog).queryByRole("combobox");
    if (typeSelect) {
      fireEvent.change(typeSelect, { target: { value: type } });
    }

    // Optional link field
    const linkInput =
      within(dialog).queryByLabelText(/link/i) ||
      within(dialog).queryByLabelText(/url/i);
    if (linkInput) {
      fireEvent.change(linkInput, { target: { value: link } });
    }
  };

  const submitCreateForm = (dialog) => {
    const submitBtn =
      within(dialog).queryByRole("button", { name: /create/i }) ||
      within(dialog).queryByRole("button", { name: /send/i }) ||
      within(dialog).queryByRole("button", { name: /save/i });
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);
  };

  test("opens the create dialog", async () => {
    setContexts();
    renderList();

    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(mockFetchNotifications).toHaveBeenCalled();
    });

    await openCreateDialog();
  });

  test("client-side validation blocks empty submit", async () => {
    setContexts();
    renderList();

    await openCreateDialog();
    const dialog = screen.getByRole("dialog");

    // Submit without filling anything
    submitCreateForm(dialog);

    // Neither API should have been called
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(mockCreateNotification).not.toHaveBeenCalled();
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    // Dialog remains open (proxy for client-side validation)
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // If you display errors, you could assert them here with tolerant text:
    // expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    // expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });

  test("successfully creates a notification (supports createNotification or addNotification)", async () => {
    setContexts();
    renderList();

    await openCreateDialog();
    const dialog = screen.getByRole("dialog");

    // Fill required fields
    const payload = {
      title: "System Notice",
      message: "Scheduled maintenance tonight",
      type: "system",
      link: "https://status.example.com",
    };
    fillCreateForm(dialog, payload);

    // Mock success: component might call createNotification or addNotification
    mockCreateNotification.mockResolvedValueOnce({
      id: 99,
      ...payload,
      read: false,
      created_at: new Date().toISOString(),
    });

    submitCreateForm(dialog);

    // Accept either implementation:
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      const createdCalled = mockCreateNotification.mock.calls.length > 0;
      const addedCalled = mockAddNotification.mock.calls.length > 0;

      expect(createdCalled || addedCalled).toBe(true);
    });

    // Dialog closes on success
    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("API failure shows error and keeps dialog open", async () => {
    setContexts();
    renderList();

    await openCreateDialog();
    const dialog = screen.getByRole("dialog");

    const payload = {
      title: "System Notice",
      message: "Will error",
      type: "system",
    };
    fillCreateForm(dialog, payload);

    // Force error
    const err = new Error("Create failed");
    mockCreateNotification.mockRejectedValueOnce(err);

    submitCreateForm(dialog);

    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      const alert =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed/i) ||
        screen.queryByText(/error/i);
      expect(alert).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("cancel closes the dialog", async () => {
    setContexts();
    renderList();

    await openCreateDialog();
    const dialog = screen.getByRole("dialog");

    const cancelBtn =
      within(dialog).queryByRole("button", { name: /cancel/i }) ||
      within(dialog).queryByRole("button", { name: /close/i });
    expect(cancelBtn).toBeInTheDocument();

    fireEvent.click(cancelBtn);

    await waitFor(() => { // TODO: Fix multiple assertions - extract into separate waitFor calls
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

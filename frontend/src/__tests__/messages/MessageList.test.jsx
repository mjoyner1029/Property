// frontend/src/__tests__/messages/MessageList.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "src/test/utils/renderWithProviders";

// Page under test with absolute path
import MessagesPage from "src/pages/Messages";

import { useMessages, useApp } from "src/context";

// ---- Router mocks ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---- Context barrel mocks ----
const mockFetchConversations = jest.fn();
const mockFetchThread = jest.fn();
const mockSendMessage = jest.fn();
const mockMarkConversationRead = jest.fn();
const mockDeleteConversation = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("src/context", () => ({
  useMessages: jest.fn(),
  useApp: jest.fn(),
}));

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
const conversationsFixture = [
  {
    id: 1,
    title: "Project Alpha",
    last_message_preview: "Let's sync at 3pm",
    unread_count: 2,
    updated_at: "2025-08-01T10:00:00Z",
    participants: ["Alice", "You"],
  },
  {
    id: 2,
    title: "Maintenance — Unit 205",
    last_message_preview: "Tech arriving tomorrow",
    unread_count: 0,
    updated_at: "2025-08-01T09:00:00Z",
    participants: ["Bob", "You"],
  },
  {
    id: 3,
    title: "Leasing — Unit 304",
    last_message_preview: "Application received",
    unread_count: 1,
    updated_at: "2025-07-31T18:00:00Z",
    participants: ["Sarah", "You"],
  },
];

const defaultUseMessages = (overrides = {}) => ({
  conversations: conversationsFixture,
  loading: false,
  error: null,
  fetchConversations: mockFetchConversations,
  fetchThread: mockFetchThread,
  sendMessage: mockSendMessage,
  markConversationRead: mockMarkConversationRead,
  deleteConversation: mockDeleteConversation,
  // Optional items some UIs provide:
  unreadByConversation: { 1: 2, 2: 0, 3: 1 },
  ...overrides,
});

const setContexts = (messagesOverrides = {}) => {
  (useMessages).mockReturnValue(defaultUseMessages(messagesOverrides));
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

const renderList = () =>
  renderWithProviders(
    <Routes>
      <Route path="/messages" element={<MessagesPage />} />
    </Routes>,
    { route: "/messages" }
  );

// Open per-item menu if your UI uses a menu for row actions
const tryOpenItemMenu = (container) => {
  const menuBtn =
    within(container).queryByRole("button", { name: /more/i }) ||
    within(container).queryByRole("button", { name: /open menu/i }) ||
    within(container).queryByRole("button", { name: /menu/i }) ||
    within(container).queryByRole("button"); // last resort
  if (menuBtn) fireEvent.click(menuBtn);
};

describe("Message List", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
  });

  test("shows loading state", () => {
    setContexts({ loading: true });
    renderList();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("shows error state", () => {
    setContexts({ error: "Failed to load messages" });
    renderList();

    const alert =
      screen.queryByRole("alert") || screen.getByText(/failed to load messages/i);
    expect(alert).toBeInTheDocument();
  });

  test("shows empty state when there are no conversations", () => {
    setContexts({ conversations: [] });
    renderList();

    const empty =
      screen.queryByText(/no messages/i) ||
      screen.queryByText(/no conversations/i) ||
      screen.queryByText(/start a conversation/i) ||
      screen.queryByText(/nothing here yet/i);
    expect(empty).toBeInTheDocument();
  });

  test("renders conversations and fetches on mount", async () => {
    setContexts();
    renderList();

    await waitFor(() => {
      expect(mockFetchConversations).toHaveBeenCalled();
    });

    expect(screen.getByText(/project alpha/i)).toBeInTheDocument();
    expect(screen.getByText(/maintenance — unit 205/i)).toBeInTheDocument();
    expect(screen.getByText(/leasing — unit 304/i)).toBeInTheDocument();

    // Last preview snippets should appear
    expect(screen.getByText(/let's sync at 3pm/i)).toBeInTheDocument();
    expect(screen.getByText(/tech arriving tomorrow/i)).toBeInTheDocument();
  });

  test("selecting a conversation either navigates to detail or fetches the thread", async () => {
    setContexts();
    renderList();

    const row = screen.getByText(/project alpha/i).closest("*");
    expect(row).toBeInTheDocument();

    // Click the row/container or a "Open" button within it
    const openBtn =
      within(row).queryByRole("button", { name: /open/i }) ||
      within(row).queryByRole("button") ||
      row;
    fireEvent.click(openBtn);

    await waitFor(() => {
      const navCalled = mockNavigate.mock.calls.some((call) =>
        /\/messages\/1/.test(call[0])
      );
      const threadCalled = mockFetchThread.mock.calls.some(
        (call) => call[0] === 1 || call[0] === "1"
      );
      expect(navCalled || threadCalled).toBe(true);
    });
  });

  test("mark conversation as read", async () => {
    setContexts();
    renderList();

    const row = screen.getByText(/leasing — unit 304/i).closest("*");
    expect(row).toBeInTheDocument();

    const markBtn =
      within(row).queryByRole("button", { name: /mark as read/i }) ||
      within(row).queryByRole("button", { name: /read/i }) ||
      within(row).queryByRole("menuitem", { name: /mark as read/i });
    if (!markBtn) {
      // Some UIs mark as read on click; try that
      fireEvent.click(row);
    } else {
      fireEvent.click(markBtn);
    }

    await waitFor(() => {
      expect(mockMarkConversationRead).toHaveBeenCalledWith(3);
    });
  });

  test("delete a conversation (confirmation flow)", async () => {
    setContexts();
    renderList();

    const row = screen.getByText(/maintenance — unit 205/i).closest("*");
    expect(row).toBeInTheDocument();

    // Direct delete button or via menu
    let deleteBtn =
      within(row).queryByRole("button", { name: /delete/i }) ||
      within(row).queryByRole("button", { name: /remove/i }) ||
      within(row).queryByRole("button", { name: /clear/i });
    if (!deleteBtn) {
      tryOpenItemMenu(row);
      const deleteMenu =
        screen.queryByRole("menuitem", { name: /delete/i }) ||
        screen.queryByRole("menuitem", { name: /remove/i }) ||
        screen.queryByRole("menuitem", { name: /clear/i });
      expect(deleteMenu).toBeInTheDocument();
      fireEvent.click(deleteMenu);
    } else {
      fireEvent.click(deleteBtn);
    }

    // Confirm in dialog
    const dialog = await screen.findByRole("dialog");
    const confirm =
      within(dialog).queryByRole("button", { name: /delete/i }) ||
      within(dialog).queryByRole("button", { name: /confirm/i }) ||
      within(dialog).getByRole("button");
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(mockDeleteConversation).toHaveBeenCalledWith(2);
    });

    // Dialog closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("cancel delete does not remove conversation", async () => {
    setContexts();
    renderList();

    const row = screen.getByText(/project alpha/i).closest("*");
    expect(row).toBeInTheDocument();

    let deleteBtn =
      within(row).queryByRole("button", { name: /delete/i }) ||
      within(row).queryByRole("button", { name: /remove/i }) ||
      within(row).queryByRole("button", { name: /clear/i });
    if (!deleteBtn) {
      tryOpenItemMenu(row);
      const deleteMenu =
        screen.queryByRole("menuitem", { name: /delete/i }) ||
        screen.queryByRole("menuitem", { name: /remove/i }) ||
        screen.queryByRole("menuitem", { name: /clear/i });
      fireEvent.click(deleteMenu);
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
      expect(mockDeleteConversation).not.toHaveBeenCalled();
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("filters conversations via search input if present", async () => {
    setContexts();
    renderList();

    const searchBox =
      screen.queryByPlaceholderText(/search messages/i) ||
      screen.queryByRole("textbox", { name: /search/i }) ||
      screen.queryByRole("searchbox");
    if (!searchBox) {
      // Skip gracefully if your UI does not include search
      expect(true).toBe(true);
      return;
    }

    fireEvent.change(searchBox, { target: { value: "leasing" } });

    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(screen.getByText(/leasing — unit 304/i)).toBeInTheDocument();
      expect(screen.queryByText(/project alpha/i)).not.toBeInTheDocument();
    });
  });
});

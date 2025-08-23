// frontend/src/__tests__/messages/MessageDelete.test.jsx
import React from "react";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// Pages under test (adjust paths if your filenames differ)
import MessagesPage from "../../pages/Messages";
import MessageDetail from "../../pages/MessageDetail";

// ---- Router mocks ----
const mockNavigate = jest.fn();
let currentParams = { id: "1" };
let currentRoute = "/messages";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => currentParams,
}));

// ---- Context barrel mocks ----
const mockFetchConversations = jest.fn();
const mockFetchThread = jest.fn();
const mockDeleteConversation = jest.fn();
const mockMarkConversationRead = jest.fn();
const mockSendMessage = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  useMessages: jest.fn(),
  useApp: jest.fn(),
}));

import { useMessages, useApp } from "../../context";

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
    Button: ({ children, onClick, disabled, type, ...rest }) => (
      <button onClick={onClick} disabled={disabled} type={type} {...rest}>
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
    Select: ({ name, value, onChange, label, children, "data-testid": dtid }) => (
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
        data-testid={dtid || `select-${name || label || "unnamed"}`}
      >
        {toOptions(children)}
      </select>
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
];

const threadFixture = {
  id: 1,
  title: "Project Alpha",
  participants: ["Alice", "You"],
  messages: [
    { id: 101, sender_id: "alice-1", content: "Hi", created_at: "2025-08-01T10:00:00Z" },
    { id: 102, sender_id: "me-123", content: "Hello!", created_at: "2025-08-01T10:01:00Z" },
  ],
  unread_count: 0,
  updated_at: "2025-08-01T10:01:00Z",
};

const defaultUseMessages = (overrides = {}) => ({
  conversations: conversationsFixture,
  thread: threadFixture,
  threadsById: { 1: threadFixture, 2: { ...threadFixture, id: 2, title: "Second" } },
  currentUserId: "me-123",
  loading: false,
  error: null,
  fetchConversations: mockFetchConversations,
  fetchThread: mockFetchThread,
  markConversationRead: mockMarkConversationRead,
  sendMessage: mockSendMessage,
  deleteConversation: mockDeleteConversation,
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

const renderDetail = (id = "1") => {
  currentParams = { id };
  currentRoute = `/messages/${id}`;
  return renderWithProviders(
    <Routes>
      <Route path="/messages/:id" element={<MessageDetail />} />
    </Routes>,
    { route: currentRoute }
  );
};

// Try to open delete from a row (direct delete button or via menu)
const openDeleteFromRow = (row) => {
  let del =
    within(row).queryByRole("button", { name: /delete/i }) ||
    within(row).queryByRole("button", { name: /remove/i }) ||
    within(row).queryByRole("button", { name: /clear/i });
  if (!del) {
    // open row menu first
    const menuBtn =
      within(row).queryByRole("button", { name: /more/i }) ||
      within(row).queryByRole("button", { name: /open menu/i }) ||
      within(row).queryByRole("button", { name: /menu/i }) ||
      within(row).queryByRole("button");
    if (menuBtn) fireEvent.click(menuBtn);
    del =
      screen.queryByRole("menuitem", { name: /delete/i }) ||
      screen.queryByRole("menuitem", { name: /remove/i }) ||
      screen.queryByRole("menuitem", { name: /clear/i });
  }
  expect(del).toBeInTheDocument();
  fireEvent.click(del);
};

describe("Message Delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    currentParams = { id: "1" };
    currentRoute = "/messages";
  });

  test("deletes a conversation from the list (confirm flow)", async () => {
    setContexts();
    renderList();

    // Ensure list rendered
    expect(screen.getByText(/project alpha/i)).toBeInTheDocument();
    const row = screen.getByText(/maintenance — unit 205/i).closest("*");
    expect(row).toBeInTheDocument();

    // Start delete flow
    openDeleteFromRow(row);

    // Confirm dialog
    const dialog = await screen.findByRole("dialog");
    const confirm =
      within(dialog).queryByRole("button", { name: /delete/i }) ||
      within(dialog).queryByRole("button", { name: /confirm/i }) ||
      within(dialog).getByRole("button");
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(mockDeleteConversation).toHaveBeenCalledWith(2);
    });

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("canceling delete from list does not call delete", async () => {
    setContexts();
    renderList();

    const row = screen.getByText(/project alpha/i).closest("*");
    expect(row).toBeInTheDocument();

    openDeleteFromRow(row);

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

  test("deletes a conversation from detail and navigates back to /messages", async () => {
    setContexts();
    renderDetail("1");

    // Ensure thread content is visible
    await screen.findByText(/hello!/i);

    // Trigger delete
    const deleteBtn =
      screen.queryByRole("button", { name: /delete conversation/i }) ||
      screen.queryByRole("button", { name: /delete/i }) ||
      screen.queryByRole("button", { name: /remove/i }) ||
      screen.queryByRole("button", { name: /clear/i });
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);

    const dialog = await screen.findByRole("dialog");
    const confirm =
      within(dialog).queryByRole("button", { name: /delete/i }) ||
      within(dialog).queryByRole("button", { name: /confirm/i }) ||
      within(dialog).getByRole("button");
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(mockDeleteConversation).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/messages");
    });
  });

  test("cancel delete from detail keeps user on detail route", async () => {
    setContexts();
    renderDetail("1");

    await screen.findByText(/hello!/i);

    const deleteBtn =
      screen.queryByRole("button", { name: /delete conversation/i }) ||
      screen.queryByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    const dialog = await screen.findByRole("dialog");
    const cancel =
      within(dialog).queryByRole("button", { name: /cancel/i }) ||
      within(dialog).queryByRole("button", { name: /close/i });
    expect(cancel).toBeInTheDocument();
    fireEvent.click(cancel);

    await waitFor(() => {
      expect(mockDeleteConversation).not.toHaveBeenCalled();
    });

    // Not navigated away
    expect(mockNavigate).not.toHaveBeenCalledWith("/messages");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("delete failure shows an error (list)", async () => {
    setContexts();
    mockDeleteConversation.mockRejectedValueOnce(new Error("Server error"));
    renderList();

    const row = screen.getByText(/project alpha/i).closest("*");
    openDeleteFromRow(row);

    const dialog = await screen.findByRole("dialog");
    const confirm =
      within(dialog).queryByRole("button", { name: /delete/i }) ||
      within(dialog).getByRole("button");
    fireEvent.click(confirm);

    // Expect error surfaced by the UI
    await waitFor(() => {
      const err =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed/i) ||
        screen.queryByText(/error/i);
      expect(err).toBeInTheDocument();
    });

    // Dialog might stay or close depending on implementation; don't assert further
  });

  test("delete failure shows an error (detail)", async () => {
    setContexts();
    mockDeleteConversation.mockRejectedValueOnce(new Error("Server error"));
    renderDetail("1");

    await screen.findByText(/hello!/i);

    const deleteBtn =
      screen.queryByRole("button", { name: /delete conversation/i }) ||
      screen.queryByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    const dialog = await screen.findByRole("dialog");
    const confirm =
      within(dialog).queryByRole("button", { name: /delete/i }) ||
      within(dialog).getByRole("button");
    fireEvent.click(confirm);

    await waitFor(() => {
      const err =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed/i) ||
        screen.queryByText(/error/i);
      expect(err).toBeInTheDocument();
    });

    // Should not navigate on failure
    expect(mockNavigate).not.toHaveBeenCalledWith("/messages");
  });
});


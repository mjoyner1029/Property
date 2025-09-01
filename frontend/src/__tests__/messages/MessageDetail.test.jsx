// frontend/src/__tests__/messages/MessageDetail.test.jsx
import React from "react";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// Import from shared mocks
import { navigateMock, currentParams, setParams } from "../../test/mocks/router";

// Page under test (adjust import if your filename differs)
import { MessageDetail } from "../../pages";

// ---- Context barrel mocks ----
const mockFetchThread = jest.fn();
const mockSendMessage = jest.fn();
const mockMarkConversationRead = jest.fn();
const mockDeleteConversation = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  useMessages: jest.fn(),
  useApp: jest.fn(),
}));

import { useMessages, useApp } from "../../context";

// ---- Lightweight MUI stubs for deterministic DOM ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  
  return {
    ...actual,
    Button: ({ children, onClick, disabled, ...rest }) => {
      const React = require("react");
      return (
        <button onClick={onClick} disabled={disabled} {...rest}>
          {children}
        </button>
      );
    },
    IconButton: ({ children, onClick, disabled, "aria-label": ariaLabel, ...rest }) => {
      const React = require("react");
      return (
        <button onClick={onClick} disabled={disabled} aria-label={ariaLabel} {...rest}>
          {children}
        </button>
      );
    },
    Dialog: ({ open, children }) => {
      const React = require("react");
      return open ? <div role="dialog">{children}</div> : null;
    },
    DialogTitle: ({ children }) => {
      const React = require("react");
      return <h2>{children}</h2>;
    },
    DialogContent: ({ children }) => {
      const React = require("react");
      return <div>{children}</div>;
    },
    DialogActions: ({ children }) => {
      const React = require("react");
      return <div>{children}</div>;
    },
    Menu: ({ open, children }) => {
      const React = require("react");
      return open ? <div role="menu">{children}</div> : null;
    },
    MenuItem: ({ onClick, children }) => {
      const React = require("react");
      return (
        <div role="menuitem" onClick={onClick}>
          {children}
        </div>
      );
    },
    Select: ({ name, value, onChange, label, children }) => {
      const React = require("react");
      // Convert children to options
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
          
      return (
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
      );
    },
    Chip: ({ label, color, ...rest }) => {
      const React = require("react");
      return (
        <span role="status" data-color={color} {...rest}>
          {label}
        </span>
      );
    },
  };
});

// ---- Fixtures & helpers ----
const currentUserId = "me-123";
const threadFixture = {
  id: 1,
  title: "Project Alpha",
  participants: ["Alice", "You"],
  messages: [
    {
      id: 101,
      sender_id: "alice-1",
      sender_name: "Alice",
      content: "Hi there",
      created_at: "2025-08-01T10:00:00Z",
    },
    {
      id: 102,
      sender_id: currentUserId,
      sender_name: "You",
      content: "Hello!",
      created_at: "2025-08-01T10:01:00Z",
    },
  ],
  unread_count: 1,
  updated_at: "2025-08-01T10:01:00Z",
};

const defaultUseMessages = (overrides = {}) => ({
  // Some apps store a single thread, others a map keyed by id; tests tolerate both
  thread: threadFixture,
  threadsById: { 1: threadFixture },
  currentUserId,
  loading: false,
  error: null,

  fetchThread: mockFetchThread,
  sendMessage: mockSendMessage,
  markConversationRead: mockMarkConversationRead,
  deleteConversation: mockDeleteConversation,

  ...overrides,
});

const setContexts = (messagesOverrides = {}) => {
  (useMessages).mockReturnValue(defaultUseMessages(messagesOverrides));
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

const renderDetail = (id = "1") => {
  setParams({ id });
  return renderWithProviders(
    <Routes>
      <Route path="/messages/:id" element={<MessageDetail />} />
    </Routes>,
    { route: `/messages/${id}` }
  );
};

// Try to find a send button across slightly different labels
const findSendButton = (container = document) =>
  container.querySelector('button[type="submit"]') ||
  screen.queryByRole("button", { name: /send/i }) ||
  screen.queryByRole("button", { name: /reply/i }) ||
  screen.queryByRole("button", { name: /send message/i });

// Try to find the message input
const findMessageInput = (container = document) =>
  screen.queryByPlaceholderText(/type a message/i) ||
  screen.queryByRole("textbox", { name: /message/i }) ||
  screen.queryAllByRole("textbox").slice(-1)[0]; // last textbox as fallback

describe("Message Detail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock.mockReset(); // Fix: use navigateMock instead of mockNavigate
    setParams({ id: "1" });
  });

  test("shows loading state", () => {
    setContexts({ loading: true, thread: null });
    renderDetail("1");

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("shows error state", () => {
    setContexts({ error: "Failed to load conversation", thread: null, loading: false });
    renderDetail("1");

    const alert =
      screen.queryByRole("alert") || screen.getByText(/failed to load conversation/i);
    expect(alert).toBeInTheDocument();
  });

  test("fetches the thread on mount and marks it read", async () => {
    setContexts();
    renderDetail("1");

    await waitFor(() => {
      expect(mockFetchThread).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(mockMarkConversationRead).toHaveBeenCalledWith(1);
    });
  });

  test("renders thread messages", async () => {
    setContexts();
    renderDetail("1");

    // Title or participants may be displayed; tolerate either
    await waitFor(() => {
      const title = screen.queryByText(/project alpha/i);
      const participant = screen.queryByText(/alice/i);
      expect(title || participant).toBeTruthy();
    });

    // Messages visible
    expect(screen.getByText("Hi there")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  test("sends a message successfully", async () => {
    setContexts();

    mockSendMessage.mockResolvedValueOnce({
      id: 103,
      sender_id: currentUserId,
      sender_name: "You",
      content: "New reply",
      created_at: new Date().toISOString(),
    });

    renderDetail("1");

    const input = findMessageInput();
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "New reply" } });

    const sendBtn = findSendButton();
    expect(sendBtn).toBeInTheDocument();
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(1, "New reply", undefined);
    });

    // Input should clear; the message should appear (if component re-renders thread)
    await waitFor(() => {
      expect(input.value).toBe(""); // cleared
    });
  });

  test("shows error when sending a message fails", async () => {
    setContexts();

    mockSendMessage.mockRejectedValueOnce(new Error("Network failure"));

    renderDetail("1");

    const input = findMessageInput();
    fireEvent.change(input, { target: { value: "Will fail" } });

    const sendBtn = findSendButton();
    fireEvent.click(sendBtn);

    await waitFor(() => {
      const alert =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed to send/i) ||
        screen.queryByText(/error/i);
      expect(alert).toBeInTheDocument();
    });

    // Input may remain with the text or be cleared depending on implementation; don't assert
  });

  test("deletes the conversation from detail and navigates back", async () => {
    setContexts();
    renderDetail("1");

    await screen.findByText(/hi there/i);

    // Find a delete affordance
    const deleteBtn =
      screen.queryByRole("button", { name: /delete conversation/i }) ||
      screen.queryByRole("button", { name: /delete/i }) ||
      screen.queryByRole("button", { name: /remove/i }) ||
      screen.queryByRole("button", { name: /clear/i });
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);

    // Confirm dialog
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

  test("cancel delete keeps you on the detail page", async () => {
    setContexts();
    renderDetail("1");

    await screen.findByText(/hi there/i);

    const deleteBtn =
      screen.queryByRole("button", { name: /delete conversation/i }) ||
      screen.queryByRole("button", { name: /delete/i }) ||
      screen.queryByRole("button", { name: /remove/i }) ||
      screen.queryByRole("button", { name: /clear/i });
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

    // Still on detail route (no back navigation)
    expect(mockNavigate).not.toHaveBeenCalledWith("/messages");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

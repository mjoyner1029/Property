// frontend/src/__tests__/messages/MessageCreate.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// Import from shared mocks
import { navigateMock, currentSearch, setSearch } from "../../test/mocks/router";

// Page under test (adjust import if your filename differs)
import { MessageCreate } from "../../pages";

// ---- Context barrel mocks ----
const mockCreateConversation = jest.fn();
const mockFetchRecipients = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  useMessages: jest.fn(),
  useApp: jest.fn(),
}));

import { useMessages, useApp } from "../../context";

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
    Chip: ({ label, color, ...rest }) => (
      <span role="status" data-color={color} {...rest}>
        {label}
      </span>
    ),
  };
});

// ---- Fixtures & helpers ----
const recipientsFixture = [
  { id: "1", name: "Alice Tenant" },
  { id: "2", name: "Bob Landlord" },
  { id: "3", name: "Sarah Applicant" },
];

const defaultUseMessages = (overrides = {}) => ({
  recipients: recipientsFixture, // optional if your page fetches recipients
  loading: false,
  error: null,
  createConversation: mockCreateConversation,
  fetchRecipients: mockFetchRecipients,
  ...overrides,
});

const setContexts = (messagesOverrides = {}) => {
  (useMessages).mockReturnValue(defaultUseMessages(messagesOverrides));
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

const renderCreate = () =>
  renderWithProviders(
    <Routes>
      <Route path="/messages/new" element={<MessageCreate />} />
    </Routes>,
    { route: "/messages/new" }
  );

const findRecipientControl = () =>
  // Try common patterns: labeled "To" or "Recipient", or our Select stub
  screen.queryByLabelText(/to/i) ||
  screen.queryByLabelText(/recipient/i) ||
  screen.queryByTestId("select-recipient") ||
  screen.queryByRole("combobox");

const findSubjectInput = () =>
  screen.queryByLabelText(/subject/i) ||
  screen.queryByPlaceholderText(/subject/i) ||
  screen.queryAllByRole("textbox")[0];

const findMessageInput = () =>
  screen.queryByLabelText(/message/i) ||
  screen.queryByPlaceholderText(/type a message|message/i) ||
  screen.queryAllByRole("textbox").slice(-1)[0];

const findSubmitButton = () =>
  screen.queryByRole("button", { name: /send/i }) ||
  screen.queryByRole("button", { name: /create/i }) ||
  screen.queryByRole("button", { name: /start conversation/i }) ||
  screen.querySelector('button[type="submit"]');

describe("Message Create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock.mockReset();
    // Reset search params to default
    setSearch("?q=foo");
  });

  test("renders form fields", () => {
    setContexts();
    renderCreate();

    expect(findRecipientControl()).toBeInTheDocument();
    expect(findSubjectInput()).toBeInTheDocument();
    expect(findMessageInput()).toBeInTheDocument();
    expect(findSubmitButton()).toBeInTheDocument();
  });

  test("client-side validation prevents submit when required fields are missing", async () => {
    setContexts();
    renderCreate();

    const submit = findSubmitButton();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockCreateConversation).not.toHaveBeenCalled();
    });

    // show any error message or alert (copy may vary)
    const error =
      screen.queryByRole("alert") ||
      screen.queryByText(/required/i) ||
      screen.queryByText(/please select/i);
    expect(error).toBeTruthy();
  });

  test("successfully creates a conversation and navigates to detail", async () => {
    setContexts();

    mockCreateConversation.mockResolvedValueOnce({
      id: 42,
      title: "Subject Line",
    });

    renderCreate();

    // Fill recipient (select or input)
    const recipient = findRecipientControl();
    if (recipient && recipient.tagName.toLowerCase() === "select") {
      fireEvent.change(recipient, { target: { value: "2" } });
    } else if (recipient) {
      // Fallback: free-text recipient input (e.g., email)
      fireEvent.change(recipient, { target: { value: "2" } });
    }

    // Subject
    const subject = findSubjectInput();
    fireEvent.change(subject, { target: { value: "Subject Line" } });

    // Message
    const message = findMessageInput();
    fireEvent.change(message, { target: { value: "Hello from tests" } });

    // Submit
    const submit = findSubmitButton();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockCreateConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient_id: "2",
          subject: "Subject Line",
          message: "Hello from tests",
          attachments: expect.any(Array), // if your page includes attachments, it will pass []; harmless to assert
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/messages/42");
    });
  });

  test("shows server error when creation fails", async () => {
    setContexts();

    mockCreateConversation.mockRejectedValueOnce(new Error("Server exploded"));

    renderCreate();

    // Fill minimally required fields
    const recipient = findRecipientControl();
    if (recipient && recipient.tagName.toLowerCase() === "select") {
      fireEvent.change(recipient, { target: { value: "1" } });
    } else if (recipient) {
      fireEvent.change(recipient, { target: { value: "1" } });
    }

    const subject = findSubjectInput();
    fireEvent.change(subject, { target: { value: "Broken" } });

    const message = findMessageInput();
    fireEvent.change(message, { target: { value: "This will error" } });

    const submit = findSubmitButton();
    fireEvent.click(submit);

    await waitFor(() => {
      const alert =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed/i) ||
        screen.queryByText(/error/i);
      expect(alert).toBeInTheDocument();
    });

    // No navigation on failure
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("passes file attachment if user selects one", async () => {
    setContexts();

    mockCreateConversation.mockResolvedValueOnce({ id: 55 });

    renderCreate();

    // Fill required fields
    const recipient = findRecipientControl();
    if (recipient && recipient.tagName.toLowerCase() === "select") {
      fireEvent.change(recipient, { target: { value: "3" } });
    } else if (recipient) {
      fireEvent.change(recipient, { target: { value: "3" } });
    }

    const subject = findSubjectInput();
    fireEvent.change(subject, { target: { value: "With attachment" } });

    const message = findMessageInput();
    fireEvent.change(message, { target: { value: "See file" } });

    // Try to find an <input type="file"> by common labels or fallback to querySelector
    const fileInput =
      screen.queryByLabelText(/attach|attachment|file/i) ||
      document.querySelector('input[type="file"]');

    if (fileInput) {
      const file = new File(["dummy"], "note.txt", { type: "text/plain" });
      // fireEvent.change with files
      Object.defineProperty(fileInput, "files", {
        value: [file],
      });
      fireEvent.change(fileInput);
    }

    const submit = findSubmitButton();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockCreateConversation).toHaveBeenCalled();
      const payload = mockCreateConversation.mock.calls[0][0];
      // attachments may be [] if your UI defers upload; just assert presence if fileInput existed
      if (fileInput) {
        expect(Array.isArray(payload.attachments)).toBe(true);
        expect(payload.attachments.length).toBeGreaterThanOrEqual(1);
      }
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/messages/55");
    });
  });

  test("prefills recipient from query param '?to=<id>' if present", async () => {
    setContexts();
    // Use our new setSearch helper to set the query string
    setSearch("?to=3");
    
    renderCreate();

    // Prefill can be a select value or input value
    const recipient = await waitFor(() => findRecipientControl());
    expect(recipient).toBeInTheDocument();

    if (recipient.tagName.toLowerCase() === "select") {
      // Selected value should be "3"
      expect(recipient.value).toBe("3");
    } else {
      // For text input, it might insert a name/email; allow either id or matching name
      const val = recipient.value || recipient.getAttribute("value") || "";
      expect(val === "3" || /sarah/i.test(val)).toBe(true);
    }
  });
});

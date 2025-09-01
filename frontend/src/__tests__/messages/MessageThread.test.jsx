// frontend/src/__tests__/messages/MessageThread.test.jsx
import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "src/test/utils/renderWithProviders";
import MessageThread from "src/components/MessageThread";

// Mock the scrollIntoView function which isn't implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe("MessageThread", () => {
  const currentUserId = "u1";
  const usersById = {
    u1: { name: "Alice Admin" },
    u2: { name: "Bob Roberts" }, // -> initials "BR"
  };

  // Keep time deterministic for "Today"/"Yesterday" calculations
  const FIXED_NOW = new Date("2025-08-23T12:00:00Z");
  const RealDate = global.Date;

  beforeAll(() => {
    // Freeze system time
    // eslint-disable-next-line no-global-assign
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length) return new RealDate(...args);
        return new RealDate(FIXED_NOW);
      }
      static now() {
        return new RealDate(FIXED_NOW).getTime();
      }
      static parse = RealDate.parse;
      static UTC = RealDate.UTC;
    };
  });

  afterAll(() => {
    // Restore Date
    // eslint-disable-next-line no-global-assign
    global.Date = RealDate;
  });

  test("renders messages grouped by day and shows 'Today' header", () => {
    const msgs = [
      // Yesterday (should group separately)
      {
        id: "m0",
        sender_id: "u2",
        text: "From yesterday",
        created_at: "2025-08-22T10:00:00Z",
      },
      // Today
      {
        id: "m1",
        sender_id: "u2",
        text: "Hello there",
        created_at: "2025-08-23T10:00:00Z",
      },
      {
        id: "m2",
        sender_id: "u1",
        text: "Hi Bob",
        created_at: "2025-08-23T10:01:00Z",
        read_by: ["u2"],
      },
    ];

    renderWithProviders(
      <MessageThread
        messages={msgs}
        currentUserId={currentUserId}
        usersById={usersById}
        height={320}
      />, { withRouter: false }
    );

    // Message contents
    expect(screen.getByText("From yesterday")).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("Hi Bob")).toBeInTheDocument();

    // Day headers: we expect at least "Today"
    expect(screen.getByText(/today/i)).toBeInTheDocument();

    // MUI Divider renders with role="separator"
    const separators = screen.getAllByRole("separator");
    expect(separators.length).toBeGreaterThanOrEqual(2);

    // Caption (sender name) appears for received cluster start
    expect(screen.getByText("Bob Roberts")).toBeInTheDocument();
  });

  test("shows avatar initials for other user's cluster start", () => {
    const msgs = [
      {
        id: "a1",
        sender_id: "u2",
        text: "First from Bob",
        created_at: "2025-08-23T08:00:00Z",
      },
    ];

    renderWithProviders(
      <MessageThread
        messages={msgs}
        currentUserId={currentUserId}
        usersById={usersById}
        height={240}
      />, { withRouter: false }
    );

    // Avatar fallback should render initials from name "Bob Roberts" => "BR"
    expect(screen.getByText("BR")).toBeInTheDocument();
  });

  test("renders pending and error statuses, and calls onRetry for failed message", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    const pendingMsg = {
      id: "p1",
      sender_id: "u1",
      text: "Sending soon",
      created_at: "2025-08-23T09:00:00Z",
      pending: true,
    };
    const failedMsg = {
      id: "f1",
      sender_id: "u1",
      text: "This failed",
      created_at: "2025-08-23T09:05:00Z",
      error: true,
    };

    renderWithProviders(
      <MessageThread
        messages={[pendingMsg, failedMsg]}
        currentUserId={currentUserId}
        usersById={usersById}
        onRetry={onRetry}
        height={260}
      />, { withRouter: false }
    );

    // Pending indicator
    expect(screen.getByText(/sending…/i)).toBeInTheDocument();

    // Error indicator + retry button (JS-safe null guard)
    const failedRow = screen.getByText("This failed").closest("div");
    expect(failedRow).not.toBeNull();
    if (!failedRow) throw new Error("Failed row not found");
    expect(within(failedRow).getByText(/failed/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /retry sending/i });
    await user.click(retryBtn);

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "f1" }));
  });

  test("shows typing indicator text when typingUsers provided", () => {
    const msgs = [
      {
        id: "b1",
        sender_id: "u1",
        text: "Are you there?",
        created_at: "2025-08-23T10:10:00Z",
      },
    ];

    renderWithProviders(
      <MessageThread
        messages={msgs}
        currentUserId={currentUserId}
        usersById={usersById}
        typingUsers={[{ id: "u2", name: "Bob" }]}
        height={240}
      />, { withRouter: false }
    );

    expect(screen.getByText(/bob is typing/i)).toBeInTheDocument();
  });

  test("auto-scrolls to bottom on mount and when new messages arrive", () => {
    const scrollSpy = jest
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {});

    const base = [
      {
        id: "s1",
        sender_id: "u2",
        text: "Old msg",
        created_at: "2025-08-23T07:00:00Z",
      },
    ];

    const { rerender } = renderWithProviders(
      <MessageThread
        messages={base}
        currentUserId={currentUserId}
        usersById={usersById}
        height={200}
      />, { withRouter: false }
    );

    // Called at least once on initial mount
    expect(scrollSpy).toHaveBeenCalled();

    // Append a new message -> should scroll again
    const next = [
      ...base,
      {
        id: "s2",
        sender_id: "u1",
        text: "New incoming",
        created_at: "2025-08-23T12:00:00Z",
      },
    ];

    rerender(
      <MessageThread
        messages={next}
        currentUserId={currentUserId}
        usersById={usersById}
        height={200}
      />
    );

    expect(scrollSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

    scrollSpy.mockRestore();
  });
});

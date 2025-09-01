// frontend/src/__tests__/payments/PaymentList.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "src/test/utils/renderWithProviders";
import Payments from "src/pages/Payments";

import { usePayment, useApp } from "src/context";

// ---- Router mocks (declare BEFORE component import usage) ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---- Context barrel mocks (Payments imports from "../context") ----
const mockFetchPayments = jest.fn();
const mockCreatePayment = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("src/context", () => ({
  usePayment: jest.fn(),
  useApp: jest.fn(),
}));

// ---- Lightweight MUI overrides for deterministic DOM (Dialog/Select/Menu/Button) ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  const toOptions = (children) => {
    const arr = React.Children.toArray(children);
    return arr
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
  };

  return {
    ...actual,
    Button: ({ children, onClick, disabled, ...rest }) => (
      <button onClick={onClick} disabled={disabled} {...rest}>
        {children}
      </button>
    ),
    Dialog: ({ open, children }) => (open ? <div role="dialog">{children}</div> : null),
    DialogTitle: ({ children }) => <h2>{children}</h2>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogActions: ({ children }) => <div>{children}</div>,
    Menu: ({ open, children }) => (open ? <div data-testid="menu">{children}</div> : null),
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
  };
});

// ---- Fixtures ----
const payments = [
  {
    id: "1",
    tenant_id: "t1",
    tenant_name: "Alice",
    amount: 1200,
    status: "paid",
    due_date: "2025-07-10T00:00:00.000Z",
  },
  {
    id: "2",
    tenant_id: "t2",
    tenant_name: "Bob",
    amount: 950,
    status: "pending",
    due_date: "2025-08-01T00:00:00.000Z",
  },
  {
    id: "3",
    tenant_id: "t3",
    tenant_name: "Carol",
    amount: 1025.5,
    status: "overdue",
    due_date: "2025-06-05T00:00:00.000Z",
  },
];

const defaultUsePayment = () => ({
  payments,
  loading: false,
  error: null,
  fetchPayments: mockFetchPayments,
  createPayment: mockCreatePayment,
});

const setContexts = (overrides = {}) => {
  (usePayment).mockReturnValue({ ...defaultUsePayment(), ...overrides });
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

const renderPage = () => renderWithProviders(<Payments />, { route: "/payments" });

describe("Payments List Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setContexts();
  });

  test("updates page title and does not fetch when payments are present", async () => {
    renderPage();

    // Title updated
    expect(mockUpdatePageTitle).toHaveBeenCalledWith("Payments");

    // Because payments are already present (length > 0), fetchPayments should not be called
    expect(mockFetchPayments).not.toHaveBeenCalled();

    // Table header/title
    await waitFor(() => {
      expect(screen.getByText(/Payment History/i)).toBeInTheDocument();
    });

    // Rows rendered
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();

    // Amounts formatted with $ and two decimals
    expect(screen.getByText("$1200.00")).toBeInTheDocument();
    expect(screen.getByText("$950.00")).toBeInTheDocument();
    expect(screen.getByText("$1025.50")).toBeInTheDocument();

    // Status chips text (labels)
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();

    // Date formatting (en-US short month). We assert fragments to keep it robust.
    expect(screen.getByText(/Jul/i)).toBeInTheDocument();
    expect(screen.getByText(/Aug/i)).toBeInTheDocument();
    expect(screen.getByText(/Jun/i)).toBeInTheDocument();
  });

  test("shows loading spinner", () => {
    setContexts({ loading: true, payments: [] });
    renderPage();

    // MUI CircularProgress exposes role="progressbar"
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("shows error alert", () => {
    setContexts({ error: "Failed to load payments", payments: [] });
    renderPage();

    expect(screen.getByText(/Failed to load payments/i)).toBeInTheDocument();
  });

  test("shows empty state when no payments", async () => {
    setContexts({ payments: [] });
    renderPage();

    // When payments.length === 0 and !loading, component triggers fetchPayments
    expect(mockFetchPayments).toHaveBeenCalled();

    // Empty paper content
    expect(await screen.findByText(/No Payment Records/i)).toBeInTheDocument();
    expect(
      screen.getByText(/There are no payment records to display/i)
    ).toBeInTheDocument();
  });

  test("opens 'Record Payment' dialog and validates required fields", async () => {
    renderPage();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    // Submit immediately to trigger validation
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));

    // Because our form has required fields, creation should not be called
    await waitFor(() => {
      expect(mockCreatePayment).not.toHaveBeenCalled();
    });
  });

  test("creates a payment successfully via dialog", async () => {
    mockCreatePayment.mockResolvedValueOnce({ id: "99" });

    renderPage();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    // Fill in required fields
    fireEvent.change(getInputByName(/Tenant ID/i), {
      target: { value: "t7" },
    });
    fireEvent.change(getInputByName(/Amount/i), {
      target: { value: "1234.56" },
    });
    fireEvent.change(getInputByName(/Due Date/i), {
      target: { value: "2025-09-01" },
    });

    // (optional) Description — it defaults to "Rent", but we can keep or change
    // Status select (native via mock)
    const statusSelect = screen.getByTestId("select-status");
    fireEvent.change(statusSelect, { target: { value: "paid" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /^record payment$/i }));

    // Verify payload – amount is parsed to float in component
    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t7",
          amount: 1234.56,
          due_date: "2025-09-01",
          description: "Rent",
          status: "paid",
        })
      );
    });

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("surfaces API error when creation fails and keeps dialog open", async () => {
    mockCreatePayment.mockRejectedValueOnce(new Error("Create failed"));

    renderPage();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    // Fill minimally required
    fireEvent.change(getInputByName(/Tenant ID/i), {
      target: { value: "t9" },
    });
    fireEvent.change(getInputByName(/Amount/i), {
      target: { value: "800" },
    });
    fireEvent.change(getInputByName(/Due Date/i), {
      target: { value: "2025-10-05" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /^record payment$/i }));

    // Error message (Alert or inline)
    await waitFor(() => {
      const maybeAlert =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed to create payment/i);
      expect(maybeAlert).toBeInTheDocument();
    });

    // Dialog remains open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("fetches when there are no payments on mount and not loading", () => {
    setContexts({ payments: [], loading: false });
    renderPage();

    expect(mockFetchPayments).toHaveBeenCalledTimes(1);
  });
});

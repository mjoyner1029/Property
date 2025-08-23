// frontend/src/__tests__/payments/PaymentDetail.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import PaymentDetail from "../../pages/PaymentDetail";

// ---- Router mocks ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "1" }),
}));

// ---- Context barrel mocks (PaymentDetail should import from "../context") ----
const mockGetPayment = jest.fn();
const mockUpdatePayment = jest.fn();
const mockDeletePayment = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  usePayment: jest.fn(),
  useApp: jest.fn(),
}));

import { usePayment, useApp } from "../../context";

// ---- Lightweight MUI overrides for deterministic DOM (Dialog/Select/Button/MenuItem) ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  const toOptions = (children) => {
    const arr = React.Children.toArray(children);
    return arr
      .map((child, idx) => {
        if (!React.isValidElement(child)) return null;
        // Render only items that carry a "value" (skip headers/subheaders)
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
    // Native-like Select for reliable testing
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
const payment = {
  id: "1",
  tenant_id: "t1",
  tenant_name: "Alice Johnson",
  amount: 1200,
  status: "pending",
  due_date: "2025-08-01T00:00:00.000Z",
  description: "August rent",
  created_at: "2025-07-15T10:00:00.000Z",
  updated_at: "2025-07-16T10:00:00.000Z",
};

const defaultUsePayment = () => ({
  loading: false,
  error: null,
  getPayment: mockGetPayment,
  updatePayment: mockUpdatePayment,
  deletePayment: mockDeletePayment,
});

const setContexts = (overrides = {}) => {
  (usePayment).mockReturnValue({ ...defaultUsePayment(), ...overrides });
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

const renderDetail = () =>
  renderWithProviders(
    <Routes>
      <Route path="/payments/:id" element={<PaymentDetail />} />
    </Routes>,
    { route: "/payments/1" }
  );

// Small helper: look for a money depiction like "$1,200.00" or "$1200.00"
const moneyRegex = /\$?\s?1,?200\.00/;

describe("PaymentDetail Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading while fetching, then renders details", async () => {
    // Create a controlled promise for getPayment
    let resolveGet;
    const getPromise = new Promise((resolve) => (resolveGet = resolve));
    mockGetPayment.mockReturnValueOnce(getPromise);

    setContexts();
    renderDetail();

    // Initially a loader from the page (CircularProgress -> role=progressbar)
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Resolve fetch
    resolveGet(payment);

    // Details appear
    await waitFor(() => {
      // Title/name/tenant present
      expect(screen.getByText(/Alice Johnson/i)).toBeInTheDocument();
      // Amount formatted
      expect(screen.getByText(moneyRegex)).toBeInTheDocument();
      // Status and description present
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      expect(screen.getByText(/August rent/i)).toBeInTheDocument();
    });

    // Page title update was attempted
    expect(mockUpdatePageTitle).toHaveBeenCalled();
  });

  test("opens Edit dialog, updates payment successfully, closes dialog", async () => {
    mockGetPayment.mockResolvedValueOnce(payment);
    mockUpdatePayment.mockResolvedValueOnce({
      ...payment,
      amount: 1250.5,
      status: "paid",
      due_date: "2025-08-05T00:00:00.000Z",
      description: "Updated note",
    });

    setContexts();
    renderDetail();

    // Wait for payment to render
    await screen.findByText(/Alice Johnson/i);

    // Open edit dialog
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    await screen.findByRole("dialog");

    // Fill fields. Amount likely a number field (spinbutton)
    const amountInput =
      screen.queryByLabelText(/amount/i) ||
      screen.getAllByRole("spinbutton")[0];

    fireEvent.clear(amountInput);
    fireEvent.change(amountInput, { target: { value: "1250.50" } });

    // Status select (native via mock). Prefer testid, fallback to first combobox.
    const statusSelect =
      screen.queryByTestId("select-status") ||
      screen.getAllByRole("combobox")[0];
    fireEvent.change(statusSelect, { target: { value: "paid" } });

    // Due date
    const dueDateInput =
      screen.queryByLabelText(/due date/i) ||
      screen.getAllByRole("textbox").find((el) => el.type === "date") ||
      screen.getAllByRole("textbox")[0];
    fireEvent.change(dueDateInput, { target: { value: "2025-08-05" } });

    // Description (textbox)
    const descInput =
      screen.queryByLabelText(/description/i) ||
      screen.getAllByRole("textbox").slice(-1)[0];
    fireEvent.clear(descInput);
    fireEvent.change(descInput, { target: { value: "Updated note" } });

    // Save
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdatePayment).toHaveBeenCalledWith("1", {
        amount: 1250.5,
        status: "paid",
        due_date: "2025-08-05",
        description: "Updated note",
      });
    });

    // Dialog should close on success
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Updated bits appear on screen (status "paid")
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
  });

  test("shows error in dialog when update fails and keeps dialog open", async () => {
    mockGetPayment.mockResolvedValueOnce(payment);
    mockUpdatePayment.mockRejectedValueOnce(new Error("Update failed"));

    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    await screen.findByRole("dialog");

    // Ensure we submit something
    const descInput =
      screen.queryByLabelText(/description/i) ||
      screen.getAllByRole("textbox").slice(-1)[0];
    fireEvent.clear(descInput);
    fireEvent.change(descInput, { target: { value: "Another note" } });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const maybeAlert =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed to update/i) ||
        screen.queryByText(/update failed/i);
      expect(maybeAlert).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("delete confirmation → success navigates to list", async () => {
    mockGetPayment.mockResolvedValueOnce(payment);
    mockDeletePayment.mockResolvedValueOnce(true);

    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    // Open delete dialog
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    const confirmBtn =
      (await screen.findByRole("button", { name: /delete payment/i })) ||
      (await screen.findByRole("button", { name: /delete/i }));
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeletePayment).toHaveBeenCalledWith("1");
      expect(mockNavigate).toHaveBeenCalledWith("/payments");
    });
  });

  test("delete confirmation → failure surfaces error and stays", async () => {
    mockGetPayment.mockResolvedValueOnce(payment);
    mockDeletePayment.mockRejectedValueOnce(new Error("boom"));

    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    // Open delete dialog
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    const confirmBtn =
      (await screen.findByRole("button", { name: /delete payment/i })) ||
      (await screen.findByRole("button", { name: /delete/i }));
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      const err =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed to delete/i) ||
        screen.queryByText(/error/i);
      expect(err).toBeInTheDocument();
    });

    // Should not navigate away
    expect(mockNavigate).not.toHaveBeenCalledWith("/payments");
  });

  test("cancel delete closes dialog without deletion", async () => {
    mockGetPayment.mockResolvedValueOnce(payment);

    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    // Open delete dialog
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockDeletePayment).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// frontend/src/__tests__/payments/PaymentRefund.test.jsx
import React from "react";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import PaymentDetail from "../../pages/PaymentDetail";

import { usePayment, useApp } from "../../context";

// ---- Router mocks ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "1" }),
}));

// ---- Context barrel mocks (PaymentDetail should import from "../context") ----
const mockGetPayment = jest.fn();
const mockRefundPayment = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  usePayment: jest.fn(),
  useApp: jest.fn(),
}));

// ---- Lightweight MUI overrides for deterministic DOM (Dialog/Select/Button/MenuItem) ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  const toOptions = (children) => {
    const arr = React.Children.toArray(children);
    return arr
      .map((child, idx) => {
        if (!React.isValidElement(child)) return null;
        // Only render options that carry a "value" prop
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
const paidPayment = {
  id: "1",
  tenant_id: "t1",
  tenant_name: "Alice Johnson",
  amount: 1200,
  status: "paid",
  due_date: "2025-08-01T00:00:00.000Z",
  description: "August rent",
  created_at: "2025-07-15T10:00:00.000Z",
  updated_at: "2025-07-16T10:00:00.000Z",
};

const pendingPayment = {
  ...paidPayment,
  status: "pending",
};

const defaultUsePayment = () => ({
  loading: false,
  error: null,
  getPayment: mockGetPayment,
  refundPayment: mockRefundPayment,
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

describe("PaymentDetail — Refund flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows Refund button for paid payment and opens dialog", async () => {
    mockGetPayment.mockResolvedValueOnce(paidPayment);
    setContexts();

    renderDetail();

    // Wait for details to load
    await screen.findByText(/Alice Johnson/i);

    // Refund button (tolerant to different labels)
    const refundBtn =
      screen.queryByRole("button", { name: /refund/i }) ||
      screen.queryByRole("button", { name: /issue refund/i });
    expect(refundBtn).toBeInTheDocument();

    fireEvent.click(refundBtn);

    // Dialog opens
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Basic fields (be flexible: "Amount", "Refund Amount", etc.)
    const amountInput =
      within(dialog).queryByLabelText(/refund amount/i) ||
      within(dialog).queryByLabelText(/amount/i) ||
      within(dialog).getAllByRole("spinbutton")[0];
    expect(amountInput).toBeInTheDocument();

    // Method select
    const methodSelect =
      within(dialog).queryByTestId("select-method") ||
      within(dialog).queryByTestId("select-refund_method") ||
      within(dialog).queryByRole("combobox");
    expect(methodSelect).toBeInTheDocument();

    // Reason textbox
    const reasonInput =
      within(dialog).queryByLabelText(/reason/i) ||
      within(dialog).getAllByRole("textbox")[0];
    expect(reasonInput).toBeInTheDocument();
  });

  test("validation blocks missing/zero/over-refund amounts", async () => {
    mockGetPayment.mockResolvedValueOnce(paidPayment);
    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    // Open dialog
    const refundBtn =
      screen.queryByRole("button", { name: /refund/i }) ||
      screen.queryByRole("button", { name: /issue refund/i });
    fireEvent.click(refundBtn);
    const dialog = await screen.findByRole("dialog");

    const submitBtn =
      within(dialog).queryByRole("button", { name: /issue refund/i }) ||
      within(dialog).queryByRole("button", { name: /refund/i }) ||
      within(dialog).getByRole("button");

    // Submit with no amount
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockRefundPayment).not.toHaveBeenCalled();
    });

    // Fill zero amount
    const amountInput =
      within(dialog).queryByLabelText(/refund amount/i) ||
      within(dialog).queryByLabelText(/amount/i) ||
      within(dialog).getAllByRole("spinbutton")[0];
    fireEvent.change(amountInput, { target: { value: "0" } });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockRefundPayment).not.toHaveBeenCalled();
    });

    // Over-refund (> 1200)
    fireEvent.change(amountInput, { target: { value: "1300" } });
    fireEvent.click(submitBtn);
    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(mockRefundPayment).not.toHaveBeenCalled();
      // Keep dialog open as proxy for validation
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("partial refund success closes dialog", async () => {
    mockGetPayment.mockResolvedValueOnce(paidPayment);
    mockRefundPayment.mockResolvedValueOnce({
      ...paidPayment,
      refunded_amount: 200,
      status: "paid", // still paid after partial refund
    });
    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    // Open dialog
    const refundBtn =
      screen.queryByRole("button", { name: /refund/i }) ||
      screen.queryByRole("button", { name: /issue refund/i });
    fireEvent.click(refundBtn);
    const dialog = await screen.findByRole("dialog");

    // Fill fields
    const amountInput =
      within(dialog).queryByLabelText(/refund amount/i) ||
      within(dialog).queryByLabelText(/amount/i) ||
      within(dialog).getAllByRole("spinbutton")[0];
    fireEvent.change(amountInput, { target: { value: "200" } });

    const methodSelect =
      within(dialog).queryByTestId("select-method") ||
      within(dialog).queryByTestId("select-refund_method") ||
      within(dialog).queryByRole("combobox");
    fireEvent.change(methodSelect, { target: { value: "original" } });

    const reasonInput =
      within(dialog).queryByLabelText(/reason/i) ||
      within(dialog).getAllByRole("textbox")[0];
    fireEvent.change(reasonInput, { target: { value: "Overpayment" } });

    // Submit
    const submitBtn =
      within(dialog).queryByRole("button", { name: /issue refund/i }) ||
      within(dialog).queryByRole("button", { name: /refund/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRefundPayment).toHaveBeenCalledWith("1", {
        amount: 200,
        method: "original",
        reason: "Overpayment",
      });
    });

    // Dialog closes on success
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("full refund success updates status to 'refunded'", async () => {
    mockGetPayment.mockResolvedValueOnce(paidPayment);
    mockRefundPayment.mockResolvedValueOnce({
      ...paidPayment,
      refunded_amount: 1200,
      status: "refunded",
    });
    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    // Open dialog
    const refundBtn =
      screen.queryByRole("button", { name: /refund/i }) ||
      screen.queryByRole("button", { name: /issue refund/i });
    fireEvent.click(refundBtn);
    const dialog = await screen.findByRole("dialog");

    // Fill full amount
    const amountInput =
      within(dialog).queryByLabelText(/refund amount/i) ||
      within(dialog).queryByLabelText(/amount/i) ||
      within(dialog).getAllByRole("spinbutton")[0];
    fireEvent.change(amountInput, { target: { value: "1200" } });

    // Method & reason (optional)
    const methodSelect =
      within(dialog).queryByTestId("select-method") ||
      within(dialog).queryByTestId("select-refund_method") ||
      within(dialog).queryByRole("combobox");
    fireEvent.change(methodSelect, { target: { value: "original" } });

    const submitBtn =
      within(dialog).queryByRole("button", { name: /issue refund/i }) ||
      within(dialog).queryByRole("button", { name: /refund/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRefundPayment).toHaveBeenCalledWith("1", {
        amount: 1200,
        method: "original",
        reason: "",
      });
    });

    // Status reflected on the page
    await waitFor(() => {
      expect(screen.getByText(/refunded/i)).toBeInTheDocument();
    });
  });

  test("API error surfaces in dialog and keeps it open", async () => {
    mockGetPayment.mockResolvedValueOnce(paidPayment);
    mockRefundPayment.mockRejectedValueOnce(new Error("Refund failed"));
    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    // Open dialog
    const refundBtn =
      screen.queryByRole("button", { name: /refund/i }) ||
      screen.queryByRole("button", { name: /issue refund/i });
    fireEvent.click(refundBtn);
    const dialog = await screen.findByRole("dialog");

    // Fill amount & method
    const amountInput =
      within(dialog).queryByLabelText(/refund amount/i) ||
      within(dialog).queryByLabelText(/amount/i) ||
      within(dialog).getAllByRole("spinbutton")[0];
    fireEvent.change(amountInput, { target: { value: "100" } });

    const methodSelect =
      within(dialog).queryByTestId("select-method") ||
      within(dialog).queryByTestId("select-refund_method") ||
      within(dialog).queryByRole("combobox");
    fireEvent.change(methodSelect, { target: { value: "manual" } });

    // Submit
    const submitBtn =
      within(dialog).queryByRole("button", { name: /issue refund/i }) ||
      within(dialog).queryByRole("button", { name: /refund/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      const err =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed to refund/i) ||
        screen.queryByText(/refund failed/i) ||
        screen.queryByText(/error/i);
      expect(err).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("refund action is disabled or not available for non-paid payments", async () => {
    mockGetPayment.mockResolvedValueOnce(pendingPayment);
    setContexts();
    renderDetail();

    await screen.findByText(/Alice Johnson/i);

    const refundBtn =
      screen.queryByRole("button", { name: /refund/i }) ||
      screen.queryByRole("button", { name: /issue refund/i });

    // Depending on implementation, the button may be disabled or absent
    if (refundBtn) {
      expect(refundBtn).toBeDisabled();
    } else {
      // If it's not rendered at all, that's acceptable
      expect(refundBtn).toBeFalsy();
    }
  });
});

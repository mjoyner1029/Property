// frontend/src/__tests__/payments/PaymentCreate.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

import { usePayment, useApp } from "../../context";

// ---- Import component after mocks ----
import Payments from "../../pages/Payments";

// ---- Router mocks (optional; kept for consistency with other tests) ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---- Context barrel mocks (Payments imports from "../context") ----
const mockFetchPayments = jest.fn();
const mockCreatePayment = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
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

// ---- Helpers ----
const defaultUsePayment = () => ({
  payments: [], // force empty so we exercise the dialog from the page reliably
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

// ---- Tests ----
describe("PaymentCreate — Record Payment dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setContexts();
  });

  test("opens dialog from 'Record Payment' button", async () => {
    renderPage();

    // Open the dialog
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    // Basic fields present
    expect(screen.getByLabelText(/Tenant ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument(); // default "Rent"
    // Status select exists & defaults to pending in component's state
    expect(screen.getByTestId("select-status")).toBeInTheDocument();
  });

  test("client-side validation blocks submit when fields are missing", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    // Submit immediately with all fields empty
    fireEvent.click(screen.getByRole("button", { name: /^record payment$/i }));

    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      // No API call due to validation
      expect(mockCreatePayment).not.toHaveBeenCalled();
      // Error helper texts are rendered by the component;
      // we assert that dialog still remains open as a proxy for validation
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("validation blocks when amount is non-positive", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    // Fill tenant and due date, but set amount <= 0
    fireEvent.change(screen.getByLabelText(/Tenant ID/i), {
      target: { value: "t42" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText(/Due Date/i), {
      target: { value: "2025-09-15" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^record payment$/i }));

    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(mockCreatePayment).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("creates payment successfully with default status 'pending'", async () => {
    mockCreatePayment.mockResolvedValueOnce({ id: "99" });

    renderPage();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    // Fill required fields; leave status untouched so it remains 'pending'
    fireEvent.change(screen.getByLabelText(/Tenant ID/i), {
      target: { value: "t7" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "1234.56" },
    });
    fireEvent.change(screen.getByLabelText(/Due Date/i), {
      target: { value: "2025-09-01" },
    });

    // Optional: change description or leave default "Rent"
    // fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "September Rent" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /^record payment$/i }));

    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t7",
          amount: 1234.56, // parsed to number by component
          due_date: "2025-09-01",
          description: "Rent",
          status: "pending",
        })
      );
    });

    // Dialog closes on success
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("allows choosing status via select before submit", async () => {
    mockCreatePayment.mockResolvedValueOnce({ id: "100" });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Tenant ID/i), {
      target: { value: "t9" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "800" },
    });
    fireEvent.change(screen.getByLabelText(/Due Date/i), {
      target: { value: "2025-10-05" },
    });

    // Change status to "paid"
    const statusSelect = screen.getByTestId("select-status");
    fireEvent.change(statusSelect, { target: { value: "paid" } });

    fireEvent.click(screen.getByRole("button", { name: /^record payment$/i }));

    await waitFor(() => {
      expect(mockCreatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t9",
          amount: 800,
          due_date: "2025-10-05",
          status: "paid",
        })
      );
    });
  });

  test("surfaces API error and keeps dialog open", async () => {
    mockCreatePayment.mockRejectedValueOnce(new Error("Create failed"));

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    // Fill minimally required fields
    fireEvent.change(screen.getByLabelText(/Tenant ID/i), {
      target: { value: "t11" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "500" },
    });
    fireEvent.change(screen.getByLabelText(/Due Date/i), {
      target: { value: "2025-12-01" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^record payment$/i }));

    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      const maybeAlert =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed to create payment/i) ||
        screen.queryByText(/create failed/i);
      expect(maybeAlert).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("form resets to defaults after successful creation (on next open)", async () => {
    mockCreatePayment.mockResolvedValueOnce({ id: "77" });

    renderPage();

    // Open dialog and submit with valid data
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    fireEvent.change(screen.getByLabelText(/Tenant ID/i), {
      target: { value: "t33" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "999.99" },
    });
    fireEvent.change(screen.getByLabelText(/Due Date/i), {
      target: { value: "2025-11-11" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^record payment$/i }));
    await waitFor(() => {
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  
      expect(mockCreatePayment).toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Re-open dialog — fields should be reset to initial values
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));
    await screen.findByRole("dialog");

    const tenantInput = screen.getByLabelText(/Tenant ID/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const dueDateInput = screen.getByLabelText(/Due Date/i);
    const descInput = screen.getByLabelText(/Description/i);
    const statusSelect = screen.getByTestId("select-status");

    expect(tenantInput).toHaveValue("");
    expect(amountInput).toHaveValue(null); // number inputs may be '' or null depending on mock/jsdom
    expect(dueDateInput).toHaveValue("");
    expect(descInput).toHaveValue("Rent");
    expect(statusSelect).toHaveValue("pending");
  });
});

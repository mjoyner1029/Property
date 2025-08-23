// frontend/src/__tests__/payments/Payments.test.jsx
import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// --- Mocks for context hooks used by Payments.jsx ---
const fetchPaymentsMock = jest.fn();
const createPaymentMock = jest.fn();
const updatePageTitleMock = jest.fn();

jest.mock("../../context", () => ({
  usePayment: jest.fn(() => ({
    payments: [],
    loading: false,
    error: null,
    fetchPayments: fetchPaymentsMock,
    createPayment: createPaymentMock,
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: updatePageTitleMock,
  })),
}));

// Use real router utilities (no need to mock useNavigate here)
import Payments from "../../pages/Payments";
import { usePayment } from "../../context";

const samplePayments = [
  {
    id: 1,
    tenant_id: 101,
    tenant_name: "John Smith",
    amount: 1200,
    status: "paid",
    due_date: "2025-07-01",
  },
  {
    id: 2,
    tenant_id: 102,
    tenant_name: "Mary Johnson",
    amount: "950.5",
    status: "pending",
    due_date: "2025-07-15",
  },
  {
    id: 3,
    tenant_id: 103,
    tenant_name: "Chris Lee",
    amount: 800,
    status: "overdue",
    due_date: "2025-06-30",
  },
];

// Helper to render with overridable context values
function renderWithCtx({
  payments = [],
  loading = false,
  error = null,
} = {}) {
  const usePaymentMock = usePayment;
  usePaymentMock.mockReturnValue({
    payments,
    loading,
    error,
    fetchPayments: fetchPaymentsMock,
    createPayment: createPaymentMock,
  });

  return render(
    <MemoryRouter>
      <Payments />
    </MemoryRouter>
  );
}

describe("Payments page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sets page title and fetches on mount when empty", () => {
    renderWithCtx({ payments: [], loading: false });

    expect(updatePageTitleMock).toHaveBeenCalledWith("Payments");
    // fetchPayments should be called because payments is empty and not loading
    expect(fetchPaymentsMock).toHaveBeenCalled();
  });

  test("renders empty state when there are no payments", () => {
    renderWithCtx({ payments: [] });

    expect(screen.getByText(/no payment records/i)).toBeInTheDocument();
    expect(
      screen.getByText(/there are no payment records to display/i)
    ).toBeInTheDocument();
  });

  test("renders payments table when data exists", () => {
    renderWithCtx({ payments: samplePayments });

    // Header
    expect(screen.getByRole("heading", { name: /payment history/i })).toBeInTheDocument();

    // Rows
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("Mary Johnson")).toBeInTheDocument();
    expect(screen.getByText("Chris Lee")).toBeInTheDocument();

    // Amounts (formatted with $ and 2 decimals)
    expect(screen.getByText("$1200.00")).toBeInTheDocument();
    expect(screen.getByText("$950.50")).toBeInTheDocument();
    expect(screen.getByText("$800.00")).toBeInTheDocument();

    // Status chips (text presence)
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();

    // Due dates (Intl 'en-US' short format, e.g., "Jul 15, 2025")
    expect(screen.getByText("Jul 1, 2025")).toBeInTheDocument();
    expect(screen.getByText("Jul 15, 2025")).toBeInTheDocument();
    expect(screen.getByText("Jun 30, 2025")).toBeInTheDocument();
  });

  test("opens create payment dialog and validates required fields", async () => {
    renderWithCtx({ payments: samplePayments });

    // Open dialog
    const openBtn = screen.getByRole("button", { name: /^record payment$/i });
    await userEvent.click(openBtn);

    // Dialog visible
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/record new payment/i)
    ).toBeInTheDocument();

    // Try submitting empty form
    const submitBtn = within(dialog).getByRole("button", {
      name: /^record payment$/i,
    });
    await userEvent.click(submitBtn);

    // Validation messages
    expect(await within(dialog).findByText(/tenant is required/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/valid amount is required/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/due date is required/i)).toBeInTheDocument();
  });

  test("submits a new payment successfully and closes dialog", async () => {
    createPaymentMock.mockResolvedValueOnce({
      id: 10,
      tenant_id: 777,
      tenant_name: "Zach Example",
      amount: 1234.56,
      status: "pending",
      due_date: "2025-08-01",
      description: "Rent",
    });

    renderWithCtx({ payments: samplePayments });

    // Open dialog
    await userEvent.click(
      screen.getByRole("button", { name: /^record payment$/i })
    );
    const dialog = await screen.findByRole("dialog");

    // Fill fields
    const tenantId = within(dialog).getByLabelText(/tenant id/i);
    const amount = within(dialog).getByLabelText(/amount/i);
    const dueDate = within(dialog).getByLabelText(/due date/i);
    const description = within(dialog).getByLabelText(/description/i);
    // Status select defaults to "pending", we can leave it

    await userEvent.type(tenantId, "777");
    await userEvent.type(amount, "1234.56");
    await userEvent.type(dueDate, "2025-08-01");
    // optional: change description
    await userEvent.clear(description);
    await userEvent.type(description, "Rent");

    // Submit
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^record payment$/i })
    );

    await waitFor(() => {
      expect(createPaymentMock).toHaveBeenCalledTimes(1);
    });

    // Verify payload: amount should be parsed to number
    const payload = createPaymentMock.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        tenant_id: "777",
        amount: 1234.56,
        due_date: "2025-08-01",
        description: "Rent",
        status: "pending",
      })
    );

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText(/record new payment/i)).not.toBeInTheDocument();
    });
  });

  test("shows error inside dialog when createPayment fails", async () => {
    createPaymentMock.mockRejectedValueOnce(new Error("Failed to create payment"));

    renderWithCtx({ payments: [] });

    // Open dialog
    await userEvent.click(
      screen.getByRole("button", { name: /^record payment$/i })
    );
    const dialog = await screen.findByRole("dialog");

    // Fill minimal required fields
    await userEvent.type(within(dialog).getByLabelText(/tenant id/i), "55");
    await userEvent.type(within(dialog).getByLabelText(/amount/i), "1000");
    await userEvent.type(within(dialog).getByLabelText(/due date/i), "2025-07-31");

    // Submit
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^record payment$/i })
    );

    // Alert with error message should appear
    expect(
      await within(dialog).findByText(/failed to create payment/i)
    ).toBeInTheDocument();

    // Dialog remains open on error
    expect(within(dialog).getByText(/record new payment/i)).toBeInTheDocument();
  });

  test("shows loading spinner when loading=true", () => {
    renderWithCtx({ payments: [], loading: true });

    // The page shows a centered CircularProgress (not our custom LoadingSpinner)
    // We can simply assert progressbar presence.
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("shows API error alert when error is set", () => {
    renderWithCtx({ payments: [], error: "Oops" });
    expect(screen.getByText("Oops")).toBeInTheDocument();
  });
});

// frontend/src/__tests__/App.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

// --- Mock Auth hook so App treats us as logged in ---
const useAuthMock = jest.fn(() => ({
  isAuthenticated: true,
  user: { firstName: "Sam", full_name: "Sam Example", email: "sam@example.com", role: "landlord" },
}));
jest.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

// --- Mock the barrel context to avoid real network calls from pages ---
const updatePageTitleMock = jest.fn();
const fetchPaymentsMock = jest.fn();
const fetchRequestsMock = jest.fn();
const createPaymentMock = jest.fn();
const createRequestMock = jest.fn();
const fetchPropertyByIdMock = jest.fn();
const updatePropertyMock = jest.fn();
const createPropertyMock = jest.fn();
const getTenantMock = jest.fn();
const updateTenantMock = jest.fn();
const deleteTenantMock = jest.fn();

jest.mock("../context", () => ({
  // App / global
  useApp: () => ({ updatePageTitle: updatePageTitleMock }),

  // Payments page
  usePayment: () => ({
    payments: [],
    loading: false,
    error: null,
    fetchPayments: fetchPaymentsMock,
    createPayment: createPaymentMock,
  }),

  // Maintenance pages
  useMaintenance: () => ({
    maintenanceRequests: [],
    stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
    loading: false,
    error: null,
    fetchRequests: fetchRequestsMock,
    createRequest: createRequestMock,
    updateRequest: jest.fn(),
    deleteRequest: jest.fn(),
  }),

  // Property pages
  useProperty: () => ({
    selectedProperty: null,
    loading: false,
    error: null,
    fetchPropertyById: fetchPropertyByIdMock,
    updateProperty: updatePropertyMock,
    createProperty: createPropertyMock,
    properties: [],
  }),

  // Tenant pages
  useTenant: () => ({
    getTenant: getTenantMock,
    updateTenant: updateTenantMock,
    deleteTenant: deleteTenantMock,
  }),
}));

// --- Stub heavy/visual components used by Dashboard to keep tests lean ---
jest.mock("../components/ChartCard", () => () => (
  <div data-testid="chart-card">Chart</div>
));
jest.mock("../components/StatsCard", () => ({ title, value }) => (
  <div data-testid="stats-card">
    {title}: {value ?? ""}
  </div>
));
jest.mock("../components/PageHeader", () => ({ title, subtitle, action }) => (
  <header>
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
    {action || null}
  </header>
));

// If your App uses a Notifications icon with live counts, it’s fine to leave it real.
// If you need, you can also stub NotificationBadge:
// jest.mock("../components/NotificationBadge", () => ({ count }) => <span>Badge:{count}</span>);

// --- Import the real App after mocks are set up ---
import App from "../App";

function renderAt(route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
}

describe("App routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Dashboard on '/' for authenticated users", () => {
    renderAt("/");

    // Our stubbed PageHeader renders the title directly
    expect(
      screen.getByRole("heading", { name: /hello, sam!/i })
    ).toBeInTheDocument();

    // Dashboard stubbed internals show chart/stat cards
    expect(screen.getAllByTestId("chart-card").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("stats-card").length).toBeGreaterThan(0);
  });

  test("navigates to Maintenance route", () => {
    renderAt("/maintenance");

    // The real Maintenance page uses PageHeader title "Maintenance"
    expect(
      screen.getByRole("heading", { name: /maintenance/i })
    ).toBeInTheDocument();

    // Search box placeholder present
    expect(
      screen.getByPlaceholderText(/search requests/i)
    ).toBeInTheDocument();
  });

  test("navigates to Payments route", () => {
    renderAt("/payments");

    // Payments page shows "Payment History" heading inside the page
    expect(
      screen.getByRole("heading", { name: /payment history/i })
    ).toBeInTheDocument();

    // The Record Payment button exists and opens a dialog
    const openBtn = screen.getByRole("button", { name: /record payment/i });
    expect(openBtn).toBeInTheDocument();
  });

  test("navigates to Profile route", () => {
    renderAt("/profile");

    expect(
      screen.getByRole("heading", { name: /my profile/i })
    ).toBeInTheDocument();

    // Profile form fields
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  test("navigates to Add Property route", async () => {
    renderAt("/properties/add");

    // PropertyForm uses PageHeader with "Add New Property" in create mode
    expect(
      screen.getByRole("heading", { name: /add new property/i })
    ).toBeInTheDocument();

    // A couple of the form fields
    expect(screen.getByLabelText(/property name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
  });

  test("dashboard 'Add Property' action button exists and is clickable", async () => {
    const user = userEvent.setup();
    renderAt("/");

    const addBtn = screen.getByRole("button", { name: /add property/i });
    expect(addBtn).toBeInTheDocument();

    // Clicking it should push a route to /properties/add which our App handles.
    await user.click(addBtn);

    // After navigation, the Add Property header should be visible
    expect(
      screen.getByRole("heading", { name: /add new property/i })
    ).toBeInTheDocument();
  });
});

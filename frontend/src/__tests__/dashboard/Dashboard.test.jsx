// frontend/src/__tests__/dashboard/Dashboard.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ---- Stub heavy visual components to keep tests fast/stable ----
jest.mock("../../components/ChartCard", () => () => (
  <div data-testid="chart-card">Chart</div>
));
jest.mock("../../components/StatsCard", () => ({ title, value }) => (
  <div data-testid="stats-card">
    {title}: {value ?? ""}
  </div>
));

// ---- Make greeting deterministic: no user => "there" ----
jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: null, isAuthenticated: true }),
}));

// Import the real component AFTER mocks
import Dashboard from "../../pages/Dashboard";

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Dashboard waits ~800ms before showing content
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function renderDashboard(route = "/") {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Dashboard />
      </MemoryRouter>
    );
  }

  test("shows loading spinner, then renders main dashboard content", async () => {
    renderDashboard();

    // Initial loading state
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Finish the mock data timeout inside useDashboardData
    jest.runAllTimers();

    // Spinner should disappear
    await waitFor(() =>
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    );

    // Header greeting falls back to "there" when user is null
    expect(
      screen.getByRole("heading", { name: /hello, there!/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/here's what's happening with your properties today/i)
    ).toBeInTheDocument();

    // Quick Access section + items
    expect(screen.getByText(/quick access/i)).toBeInTheDocument();
    expect(screen.getByText(/overview/i)).toBeInTheDocument();
    expect(screen.getByText(/calendar/i)).toBeInTheDocument();
    expect(screen.getByText(/rentals/i)).toBeInTheDocument();

    // Chart/Stats stubs render
    expect(screen.getAllByTestId("chart-card").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("stats-card").length).toBeGreaterThan(0);

    // Recent Activity list (sample items from component)
    expect(screen.getByText(/new maintenance request/i)).toBeInTheDocument();
    expect(screen.getByText(/payment received/i)).toBeInTheDocument();
  });

  test("has an 'Add Property' action button in the header", async () => {
    renderDashboard();

    // Still loading first
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    jest.runAllTimers();

    await waitFor(() =>
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    );

    // Action button exists (route navigation is covered elsewhere)
    const addBtn = screen.getByRole("button", { name: /add property/i });
    expect(addBtn).toBeInTheDocument();
  });
});

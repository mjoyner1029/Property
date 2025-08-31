// frontend/src/__tests__/MaintenanceList.test.jsx
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Import from shared mocks for direct assertions
import { fetchRequestsMock, createRequestMock } from "../../test/mocks/services";

jest.mock("../context", () => ({
  useMaintenance: jest.fn(() => ({
    maintenanceRequests: [],
    stats: { open: 0, inProgress: 0, completed: 0, total: 0 },
    loading: false,
    error: null,
    fetchRequests: require("../../test/mocks/services").fetchRequestsMock,
    createRequest: require("../../test/mocks/services").createRequestMock,
  })),
  useProperty: jest.fn(() => ({
    properties: [],
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: jest.fn(),
  })),
}));

// ---- Lightweight component stubs so the page can render in isolation ----
jest.mock("../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, actionText, onActionClick }) => (
    <div>
      <h1>{title}</h1>
      {actionText && (
        <button onClick={onActionClick}>{actionText}</button>
      )}
    </div>
  ),
  MaintenanceRequestCard: ({
    id,
    title,
    description,
    status,
    priority,
    propertyName,
    onClick,
    onContextMenu,
  }) => (
    <button
      data-testid={`req-${id}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {title} • {status} • {priority} • {propertyName}
      <div>{description}</div>
    </button>
  ),
  Empty: ({ title, message, actionText, onActionClick }) => (
    <div>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionText && <button onClick={onActionClick}>{actionText}</button>}
    </div>
  ),
  LoadingSpinner: () => <div>Loading…</div>,
  Card: ({ children }) => <div>{children}</div>,
}));

// Mock only useNavigate; keep other exports from RRD
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

import Maintenance from "../../pages/Maintenance";
import { useMaintenance } from "../../context";

const sampleRequests = [
  {
    id: 1,
    title: "Leaky faucet",
    description: "Kitchen sink is leaking",
    status: "open",
    priority: "medium",
    property_name: "Sunset Apts",
    created_at: "2025-07-10T10:00:00Z",
  },
  {
    id: 2,
    title: "HVAC not cooling",
    description: "No A/C blowing",
    status: "in_progress",
    priority: "high",
    property_name: "Oak Villas",
    created_at: "2025-07-11T12:00:00Z",
  },
  {
    id: 3,
    title: "Roof repair",
    description: "Shingles missing",
    status: "completed",
    priority: "low",
    property_name: "Pine Place",
    created_at: "2025-07-09T09:00:00Z",
  },
];

function setupWithData({ requests = [], loading = false, error = null } = {}) {
  const useMaintenanceMock = useMaintenance;
  useMaintenanceMock.mockReturnValue({
    maintenanceRequests: requests,
    stats: {
      open: requests.filter((r) => r.status === "open").length,
      inProgress: requests.filter((r) => r.status === "in_progress").length,
      completed: requests.filter((r) => r.status === "completed").length,
      total: requests.length,
    },
    loading,
    error,
    fetchRequests: fetchRequestsMock,
    createRequest: createRequestMock,
  });

  return render(
    <MemoryRouter>
      <Maintenance />
    </MemoryRouter>
  );
}

describe("Maintenance Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls fetchRequests on mount", () => {
    setupWithData({ requests: [] });
    expect(fetchRequestsMock).toHaveBeenCalled();
  });

  test("shows empty state and opens create dialog", () => {
    setupWithData({ requests: [] });

    expect(
      screen.getByRole("heading", { name: /no maintenance requests/i })
    ).toBeInTheDocument();

    // Click "New Request" button from the Empty stub
    fireEvent.click(screen.getByRole("button", { name: /new request/i }));

    // Dialog should appear
    expect(
      screen.getByText(/create maintenance request/i)
    ).toBeInTheDocument();

    // Basic form fields are present
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^description$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/property/i)).toBeInTheDocument();
  });

  test("renders requests and filters by status tabs", () => {
    setupWithData({ requests: sampleRequests });

    // All requests visible initially
    expect(screen.getByTestId("req-1")).toBeInTheDocument();
    expect(screen.getByTestId("req-2")).toBeInTheDocument();
    expect(screen.getByTestId("req-3")).toBeInTheDocument();

    // Click "Completed" tab
    const completedTab = screen.getByRole("tab", { name: /completed/i });
    fireEvent.click(completedTab);

    // Only the completed item should remain
    expect(screen.queryByTestId("req-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("req-2")).not.toBeInTheDocument();
    expect(screen.getByTestId("req-3")).toBeInTheDocument();
  });

  test("search filters the list", () => {
    setupWithData({ requests: sampleRequests });

    const searchBox = screen.getByPlaceholderText(/search requests/i);
    fireEvent.change(searchBox, { target: { value: "kitchen" } });

    // Only the one mentioning kitchen in description should appear
    expect(screen.getByTestId("req-1")).toBeInTheDocument();
    expect(screen.queryByTestId("req-2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("req-3")).not.toBeInTheDocument();
  });
});

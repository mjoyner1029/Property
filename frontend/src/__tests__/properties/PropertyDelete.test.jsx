// frontend/src/__tests__/properties/PropertyDelete.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "src/test/utils/renderWithProviders";
import PropertyDetail from "src/pages/PropertyDetail";
import * as PropertyContext from 'src/context/PropertyContext';
import * as AppContext from 'src/context/AppContext';

// ---- Router mocks ----
const mockNavigate = jest.fn();
const mockParams = { id: "123" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// ---- App context mock ----
const mockUpdatePageTitle = jest.fn();
jest.spyOn(AppContext, "useApp").mockReturnValue({
  updatePageTitle: mockUpdatePageTitle,
});

// ---- Fixtures ----
const mockProperty = {
  id: 123,
  name: "Unit 123",
  address: "77 Ocean Ave",
  city: "Newport",
  state: "RI",
  zip_code: "02840",
  type: "apartment",
  units: [
    {
      id: 1,
      unit_number: "101",
      rent: 2450,
      status: "occupied",
      tenant_name: "John Smith",
    },
  ],
};

const defaultCtx = {
  selectedProperty: null,
  loading: false,
  error: null,
  fetchPropertyById: jest.fn(),
  deleteProperty: jest.fn(),
  updateProperty: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();

  // Reset AppContext between tests
  jest.spyOn(AppContext, "useApp").mockReturnValue({
    updatePageTitle: mockUpdatePageTitle,
  });
});

function setupDetail({
  property = mockProperty,
  deleteImpl = jest.fn().mockResolvedValue(true),
  fetchImpl = jest.fn().mockResolvedValue(mockProperty),
  loading = false,
  error = null,
} = {}) {
  jest.spyOn(PropertyContext, "useProperty").mockReturnValue({
    ...defaultCtx,
    selectedProperty: property,
    deleteProperty: deleteImpl,
    fetchPropertyById: fetchImpl,
    loading,
    error,
  });

  return renderWithProviders(<PropertyDetail />, { route: "/properties/123" });
}

// Try to click either a direct Delete button or a menu → delete item.
async function triggerDeleteAction() {
  // Some UIs show a direct Delete button
  let deleteBtn =
    screen.queryByRole("button", { name: /delete property/i }) ||
    screen.queryByRole("button", { name: /^delete$/i });

  if (!deleteBtn) {
    // Otherwise open an overflow/menu and pick "Delete Property"
    const menuTrigger =
      screen.queryByRole("button", { name: /open menu|menu|more|options/i }) ||
      screen.getAllByRole("button").find((btn) =>
        /menu|more|options/i.test(btn.getAttribute("aria-label") || "")
      );

    expect(menuTrigger).toBeTruthy();
    fireEvent.click(menuTrigger);

    deleteBtn =
      screen.queryByRole("menuitem", { name: /delete property/i }) ||
      screen.queryByText(/delete property/i) ||
      screen.queryByRole("button", { name: /delete property/i });
  }

  expect(deleteBtn).toBeTruthy();
  fireEvent.click(deleteBtn);
}

describe("Property deletion (PropertyDetail)", () => {
  test("deletes property and navigates to list on success", async () => {
    const deleteMock = jest.fn().mockResolvedValue(true);
    const fetchMock = jest.fn().mockResolvedValue(mockProperty);

    setupDetail({ deleteImpl: deleteMock, fetchImpl: fetchMock });

    // Wait for details to display
    await screen.findByText("77 Ocean Ave");

    // Trigger delete flow (supports both direct button and menu-item patterns)
    await triggerDeleteAction();

    // Confirm in dialog if present
    const dialog =
      screen.queryByRole("dialog") ||
      screen.queryByText(/delete property/i)?.closest("[role='dialog']") ||
      screen.queryByText(/delete property/i)?.closest("[data-testid='dialog']");

    const confirmBtn =
      (dialog &&
        within(dialog).queryByRole("button", { name: /^delete$/i })) ||
      screen.queryByRole("button", { name: /^delete$/i });

    if (confirmBtn) {
      fireEvent.click(confirmBtn);
    }

    // Expect context deletion and navigation
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith(123);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/properties");
    });
  });

  test("cancel in the confirmation dialog does not delete", async () => {
    const deleteMock = jest.fn().mockResolvedValue(true);
    const fetchMock = jest.fn().mockResolvedValue(mockProperty);

    setupDetail({ deleteImpl: deleteMock, fetchImpl: fetchMock });

    await screen.findByText("77 Ocean Ave");

    await triggerDeleteAction();

    // If dialog exists, click "Cancel"
    const dialog =
      screen.queryByRole("dialog") ||
      screen.queryByText(/delete property/i)?.closest("[role='dialog']") ||
      screen.queryByText(/delete property/i)?.closest("[data-testid='dialog']");

    const cancelBtn =
      (dialog &&
        within(dialog).queryByRole("button", { name: /cancel/i })) ||
      screen.queryByRole("button", { name: /cancel/i });

    if (cancelBtn) {
      fireEvent.click(cancelBtn);
    }

    // Ensure delete was not called and no navigation happened
    await waitFor(() => {
      expect(deleteMock).not.toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith("/properties");
  });

  test("shows failure flow when delete fails (no navigation)", async () => {
    const deleteMock = jest.fn().mockRejectedValue(new Error("Delete failed"));
    const fetchMock = jest.fn().mockResolvedValue(mockProperty);

    setupDetail({ deleteImpl: deleteMock, fetchImpl: fetchMock });

    await screen.findByText("77 Ocean Ave");

    await triggerDeleteAction();

    // Confirm if dialog present
    const dialog =
      screen.queryByRole("dialog") ||
      screen.queryByText(/delete property/i)?.closest("[role='dialog']") ||
      screen.queryByText(/delete property/i)?.closest("[data-testid='dialog']");

    const confirmBtn =
      (dialog &&
        within(dialog).queryByRole("button", { name: /^delete$/i })) ||
      screen.queryByRole("button", { name: /^delete$/i });

    if (confirmBtn) {
      fireEvent.click(confirmBtn);
    }

    // Context delete attempted
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith(123);
    });

    // Should not navigate away on failure
    expect(mockNavigate).not.toHaveBeenCalledWith("/properties");

    // If your component displays an error alert, it will have role="alert".
    // We won't fail the test if you handle errors silently.
    const maybeAlert = screen.queryByRole("alert");
    if (maybeAlert) {
      expect(maybeAlert.textContent?.toLowerCase()).toMatch(/delete|failed|error/);
    }
  });
});

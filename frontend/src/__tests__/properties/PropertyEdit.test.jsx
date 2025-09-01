// frontend/src/__tests__/properties/PropertyEdit.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Import from shared mocks for direct assertions
import { fetchPropertyByIdMock, updatePropertyMock, createPropertyMock } from "../../test/mocks/services";
import { updatePageTitleMock } from "../../test/mocks/pageTitle";

const mockNavigate = jest.fn();

import PropertyForm from "src/pages/PropertyForm";
import { useProperty } from "../../context";

jest.mock("src/context", () => ({
  useProperty: jest.fn(() => ({
    selectedProperty: null,
    loading: false,
    error: null,
    createProperty: require('src/test/mocks/services').createPropertyMock,
    updateProperty: require('src/test/mocks/services').updatePropertyMock,
    fetchPropertyById: require('src/test/mocks/services').fetchPropertyByIdMock,
  })),
  useApp: jest.fn(() => ({
    updatePageTitle: require('src/test/mocks/pageTitle').updatePageTitleMock,
  })),
}));

// ---- Minimal component stubs so the form can render in isolation ----
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title }) => <h1>{title}</h1>,
  FormSection: ({ title, children }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  FileUpload: () => <div data-testid="file-upload" />,
}));

// Mock router bits: useParams + useNavigate
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "123" }),
    useNavigate: () => {
      const mock = require('src/test/mocks/router');
      return mock.mockNavigate;
    },
  };
});

// Helper to render with overridable context values
function renderWithCtx({
  selectedProperty = null,
  loading = false,
  error = null,
} = {}) {
  const usePropertyMock = useProperty;
  usePropertyMock.mockReturnValue({
    selectedProperty,
    loading,
    error,
    createProperty: createPropertyMock,
    updateProperty: updatePropertyMock,
    fetchPropertyById: fetchPropertyByIdMock,
  });

  return renderWithProviders(<PropertyForm />);
}

const sampleProperty = {
  id: 123,
  name: "Sunset Apartments",
  type: "apartment",
  address: "123 Main St",
  city: "Springfield",
  state: "CA",
  zip_code: "90210",
  description: "Great place with a view",
  year_built: 1990,
  square_feet: 12000,
  amenities: "Pool, Gym",
  images: [{ url: "https://example.com/one.jpg" }],
};

describe("PropertyForm (Edit Mode)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches property by id on mount in edit mode", () => {
    renderWithCtx();
    expect(fetchPropertyByIdMock).toHaveBeenCalledTimes(1);
    expect(fetchPropertyByIdMock).toHaveBeenCalledWith("123");
  });

  test("shows loader while fetching in edit mode", () => {
    renderWithCtx({ loading: true, selectedProperty: null });
    // The loading state returns only the spinner inside Layout
    // so assert Layout is mounted (page content replaced by spinner)
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  test("prefills form fields with existing property data", () => {
    renderWithCtx({ selectedProperty: sampleProperty });

    // Basic fields
    expect(getInputByName(/property name/i)).toHaveValue("Sunset Apartments");
    expect(getInputByName(/description/i)).toHaveValue("Great place with a view");
    expect(getInputByName(/street address/i)).toHaveValue("123 Main St");
    expect(getInputByName(/city/i)).toHaveValue("Springfield");
    expect(getInputByName(/state/i)).toHaveValue("CA");
    expect(getInputByName(/zip code/i)).toHaveValue("90210");

    // Optional details
    expect(getInputByName(/year built/i)).toHaveValue(1990);
    expect(getInputByName(/square footage/i)).toHaveValue(12000);
    expect(getInputByName(/amenities/i)).toHaveValue("Pool, Gym");

    // Image preview hint (from stubbed previews)
    expect(screen.getByTestId("file-upload")).toBeInTheDocument();
  });

  test("submits updated values and navigates back to properties", async () => {
    updatePropertyMock.mockResolvedValueOnce({ ...sampleProperty, name: "Edited Name" });

    renderWithCtx({ selectedProperty: sampleProperty });

    // Change the property name
    const nameInput = getInputByName(/property name/i);
    fireEvent.change(nameInput, { target: { value: "Edited Name" } });

    // Click Save Changes (submit button)
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updatePropertyMock).toHaveBeenCalledTimes(1);
    });

    // Verify payload contains our edited field (allow others to be present)
    const [, payload] = updatePropertyMock.mock.calls[0];
    expect(updatePropertyMock).toHaveBeenCalledWith("123", expect.objectContaining({
      name: "Edited Name",
      type: "apartment",
    }));

    // After success, navigate back to /properties
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/properties");
    });
  });

  test("shows API error returned by updateProperty", async () => {
    updatePropertyMock.mockRejectedValueOnce(new Error("Failed to save property"));

    renderWithCtx({ selectedProperty: sampleProperty });

    // Trigger submit without changing anything
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Error alert should appear
    await waitFor(() => {
      expect(screen.getByText(/failed to save property/i)).toBeInTheDocument();
    });
  });
});

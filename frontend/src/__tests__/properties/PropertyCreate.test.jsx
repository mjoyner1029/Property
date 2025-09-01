// frontend/src/__tests__/properties/PropertyCreate.test.jsx
import React from "react";
import { screen, within, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "src/test/utils/renderWithProviders";

import { useProperty, useApp } from "src/context";

// ---- Import the component under test AFTER mocks ----
import PropertyForm from "src/pages/PropertyForm";

// ---- Router mocks (must be defined before component import) ----
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  // No :id param for create mode
  useParams: () => ({}),
}));

// ---- Context barrel mocks (PropertyForm imports from "../context") ----
const mockCreateProperty = jest.fn();
const mockUpdateProperty = jest.fn();
const mockFetchPropertyById = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("src/context", () => ({
  useProperty: jest.fn(),
  useApp: jest.fn(),
}));

// ---- Mock shared components used by PropertyForm ----
jest.mock("../../components", () => ({
  Layout: ({ children }) => <div data-testid="layout">{children}</div>,
  PageHeader: ({ title, breadcrumbs, actionText, onActionClick }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {actionText ? (
        <button onClick={onActionClick} aria-label="Back to Properties">
          {actionText}
        </button>
      ) : null}
    </header>
  ),
  FormSection: ({ title, description, children }) => (
    <section data-testid={`form-section-${title?.toString().toLowerCase().replace(/\s/g, "-")}`}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </section>
  ),
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  // A very small FileUpload mock that triggers onUpload with a couple of files
  FileUpload: ({ onUpload }) => {
    const handleClick = () => {
      const files = [
        new File(["aaa"], "photo1.png", { type: "image/png" }),
        new File(["bbb"], "photo2.jpg", { type: "image/jpeg" }),
      ];
      onUpload(files);
    };
    return (
      <div data-testid="file-upload">
        <button type="button" onClick={handleClick}>
          Upload Files
        </button>
      </div>
    );
  },
}));

describe("PropertyForm (Create)", () => {
  beforeAll(() => {
    // JSDOM doesn't provide createObjectURL by default
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock returns for contexts in create mode
    useProperty.mockReturnValue({
      selectedProperty: null,
      loading: false,
      error: null,
      createProperty: mockCreateProperty,
      updateProperty: mockUpdateProperty,
      fetchPropertyById: mockFetchPropertyById,
    });

    useApp.mockReturnValue({
      updatePageTitle: mockUpdatePageTitle,
    });
  });

  const renderCreate = (route = "/properties/add") =>
    renderWithProviders(<PropertyForm />, { route });

  test("renders add form and sets page title", async () => {
    renderCreate();

    // Page header shows "Add New Property" in create mode
    expect(
      screen.getByRole("heading", { name: /add new property/i })
    ).toBeInTheDocument();

    // updatePageTitle called with Add Property
    expect(mockUpdatePageTitle).toHaveBeenCalledWith("Add Property");

    // Ensure basic fields exist
    expect(
      getInputByName(/property name/i)
    ).toBeInTheDocument();
    expect(
      getInputByName(/street address/i)
    ).toBeInTheDocument();
    expect(getInputByName(/city/i)).toBeInTheDocument();
    expect(getInputByName(/state/i)).toBeInTheDocument();
    expect(getInputByName(/zip code/i)).toBeInTheDocument();
    expect(getInputByName(/property type/i)).toBeInTheDocument();
  });

  test("submits new property and navigates back to list on success", async () => {
    mockCreateProperty.mockResolvedValueOnce({ id: "999" });

    renderCreate();

    // Fill out required fields
    fireEvent.change(getInputByName(/property name/i), {
      target: { value: "Sunset Apartments" },
    });
    fireEvent.change(getInputByName(/description/i), {
      target: { value: "A lovely multi-unit property." },
    });
    fireEvent.change(getInputByName(/street address/i), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(getInputByName(/^city$/i), {
      target: { value: "San Francisco" },
    });
    fireEvent.change(getInputByName(/^state$/i), {
      target: { value: "CA" },
    });
    fireEvent.change(getInputByName(/zip code/i), {
      target: { value: "94102" },
    });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /create property/i });
    fireEvent.click(submitBtn);

    // The form calls createProperty with the current formData
    await waitFor(() => {
      expect(mockCreateProperty).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sunset Apartments",
          description: "A lovely multi-unit property.",
          address: "123 Main St",
          city: "San Francisco",
          state: "CA",
          zip_code: "94102",
          type: "apartment", // default
        })
      );
    });

    // And navigates back to properties list
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/properties");
    });
  });

  test("shows API error message on submit failure", async () => {
    mockCreateProperty.mockRejectedValueOnce(new Error("API fail"));

    renderCreate();

    // Fill required fields
    fireEvent.change(getInputByName(/property name/i), {
      target: { value: "Test Place" },
    });
    fireEvent.change(getInputByName(/description/i), {
      target: { value: "Desc" },
    });
    fireEvent.change(getInputByName(/street address/i), {
      target: { value: "1 Test St" },
    });
    fireEvent.change(getInputByName(/^city$/i), {
      target: { value: "Testville" },
    });
    fireEvent.change(getInputByName(/^state$/i), {
      target: { value: "TS" },
    });
    fireEvent.change(getInputByName(/zip code/i), {
      target: { value: "12345" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create property/i })
    );

    // Error alert from submitError should display
    await waitFor(() => {
      expect(screen.getByText(/api fail/i)).toBeInTheDocument();
    });

    // No navigation on failure
    expect(mockNavigate).not.toHaveBeenCalledWith("/properties");
  });

  test("handles image upload via FileUpload mock and shows remove buttons", async () => {
    renderCreate();

    // Initially shows placeholder text
    expect(
      screen.getByText(/no images uploaded yet/i)
    ).toBeInTheDocument();

    // Trigger FileUpload mock's upload
    fireEvent.click(screen.getByRole("button", { name: /upload files/i }));

    // Placeholder should disappear after images are added
    await waitFor(() => {
      expect(
        screen.queryByText(/no images uploaded yet/i)
      ).not.toBeInTheDocument();
    });

    // The preview grid renders delete buttons with "✕"
    const deleteButtons = screen.getAllByRole("button", { name: "✕" });
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click one to ensure it's interactable (we don't assert side effects deeply)
    fireEvent.click(deleteButtons[0]);
  });

  test("Back to Properties header action navigates", async () => {
    renderCreate();

    // Our PageHeader mock renders an action button with aria-label "Back to Properties"
    const backBtn = screen.getByRole("button", { name: /back to properties/i });
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/properties");
  });
});

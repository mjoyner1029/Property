// frontend/src/__tests__/maintenance/MaintenanceEdit.test.jsx
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import MaintenanceDetail from "../../pages/MaintenanceDetail";

// Add missing fireEvent.clear function
fireEvent.clear = (element) => {
  fireEvent.change(element, { target: { value: '' } });
};

// ---- Router mocks ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "1" }),
}));

// ---- Context barrel mocks (MaintenanceDetail imports from "../context") ----
const mockFetchRequests = jest.fn();
const mockUpdateRequest = jest.fn();
const mockDeleteRequest = jest.fn();
const mockUpdatePageTitle = jest.fn();

jest.mock("../../context", () => ({
  useMaintenance: jest.fn(),
  useApp: jest.fn(),
}));

import { useMaintenance, useApp } from "../../context";

// ---- Mock components ----
jest.mock("../../components", () => {
  return {
    Layout: ({ children }) => <div data-testid="layout">{children}</div>,
    PageHeader: ({ title, subtitle, actionText, onActionClick }) => (
      <header data-testid="page-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <button aria-label={actionText} onClick={onActionClick}>
          {actionText}
        </button>
      </header>
    ),
  };
});

// ---- MUI overrides (Dialog/Select/Menu/Button) for deterministic DOM ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  const toOptions = (children) => {
    const arr = React.Children.toArray(children);
    const options = [];
    
    arr.forEach((child, idx) => {
      if (!React.isValidElement(child)) return;
      
      // Handle MenuItem directly
      if (child.props && "value" in child.props) {
        options.push(
          <option key={idx} value={child.props.value || ""}>
            {child.props.children}
          </option>
        );
      } 
      // Handle ListSubheader + MenuItems groups
      else if (child.type && child.type === React.Fragment) {
        const fragmentChildren = React.Children.toArray(child.props.children);
        fragmentChildren.forEach((fragChild, fragIdx) => {
          if (React.isValidElement(fragChild) && fragChild.props && "value" in fragChild.props) {
            options.push(
              <option key={`${idx}-${fragIdx}`} value={fragChild.props.value || ""}>
                {fragChild.props.children}
              </option>
            );
          }
        });
      }
    });
    
    return options;
  };

  return {
    ...actual,
    Button: ({ children, onClick, disabled, startIcon, ...rest }) => (
      <button 
        onClick={(e) => onClick && onClick({ ...e, currentTarget: e.currentTarget || {} })}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    ),
    Dialog: ({ open, children }) => (open ? <div role="dialog">{children}</div> : null),
    DialogTitle: ({ children }) => <h2>{children}</h2>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogActions: ({ children }) => <div>{children}</div>,
    Menu: ({ open, children }) => (open ? <div data-testid="menu">{children}</div> : null),
    MenuItem: ({ onClick, value, children }) => (
      <div role="menuitem" onClick={onClick} data-value={value || ""}>
        {typeof children === 'string' && children.trim().startsWith('<em>') 
          ? children.replace(/<\/?em>/g, '')
          : children}
      </div>
    ),
    // Native-like Select with better event handling
    Select: ({ name, value, onChange, label, children }) => {
      // Keep track of the actual DOM value to ensure it's correctly passed in the onChange event
      const [internalValue, setInternalValue] = React.useState(value || "");
      
      React.useEffect(() => {
        setInternalValue(value || "");
      }, [value]);
      
      return (
        <select
          aria-label={label || name}
          name={name}
          value={internalValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInternalValue(newValue);
            if (onChange) {
              onChange({
                target: { 
                  name: name,
                  value: newValue
                },
              });
            }
          }}
          data-testid={`select-${name || label || "unnamed"}`}
        >
          {toOptions(children)}
        </select>
      );
    },
    Paper: ({ children, ...rest }) => <div {...rest}>{children}</div>,
    Grid: ({ children, ...rest }) => <div {...rest}>{children}</div>,
    Box: ({ children, ...rest }) => <div {...rest}>{children}</div>,
    Typography: ({ children, variant, ...rest }) => {
      const Component = variant?.startsWith('h') ? variant : 'p';
      return <Component {...rest}>{children}</Component>;
    },
    Divider: () => <hr />,
    IconButton: ({ children, ...rest }) => <button {...rest}>{children}</button>,
    Chip: ({ label, ...rest }) => <span {...rest}>{label}</span>,
    CircularProgress: () => <div data-testid="loading-spinner">Loading...</div>,
    Alert: ({ severity, children }) => <div role="alert" data-severity={severity}>{children}</div>,
    TextField: ({ label, value, onChange, name, ...rest }) => (
      <input
        aria-label={label}
        name={name}
        value={value || ''}
        onChange={onChange}
        {...rest}
      />
    ),
    FormControl: ({ children, ...rest }) => <div {...rest}>{children}</div>,
    InputLabel: ({ children, ...rest }) => <label {...rest}>{children}</label>,
    ListSubheader: ({ children, ...rest }) => <div {...rest}>{children}</div>,
  };
});

// ---- Fixtures ----
const request = {
  id: "1",
  title: "Leaky faucet",
  description: "Bathroom sink leaking under cabinet",
  status: "open",
  priority: "medium",
  maintenance_type: "plumbing_leaking",
  property_name: "Sunset Apartments",
  unit_number: "A-101",
  reported_by: "John Smith",
  assigned_to: "Tech Mike",
  created_at: "2025-07-10T10:00:00Z",
  updated_at: "2025-07-11T10:00:00Z",
  images: [],
  comments: [],
};

const defaultUseMaintenance = () => ({
  maintenanceRequests: [request], // present so fetchRequests is not required
  stats: { open: 1, inProgress: 0, completed: 0, total: 1 },
  loading: false,
  error: null,
  fetchRequests: mockFetchRequests.mockImplementation(() => Promise.resolve()),
  updateRequest: mockUpdateRequest,
  deleteRequest: mockDeleteRequest,
  quickUpdateStatus: jest.fn().mockResolvedValue({ ...request, status: "completed" }),
});

const setContexts = (overrides = {}) => {
  (useMaintenance).mockReturnValue({ ...defaultUseMaintenance(), ...overrides });
  (useApp).mockReturnValue({ updatePageTitle: mockUpdatePageTitle });
};

// Custom render function specifically for this test suite
const renderDetail = async () => {
  const result = renderWithProviders(
    <Routes>
      <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
    </Routes>,
    { route: "/maintenance/1" }
  );
  
  // Wait for the component to load fully (past the loading state)
  await waitFor(() => {
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });
  
  return result;
};

describe("MaintenanceDetail — Edit flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setContexts();
  });

  test("opens Edit dialog, pre-fills, updates successfully, and closes dialog", async () => {
    mockUpdateRequest.mockResolvedValueOnce({
      ...request,
      title: "Leaky kitchen faucet",
      description: "Kitchen faucet leaking at the base",
      priority: "high",
      status: "in_progress",
      maintenance_type: "plumbing_disposal",
    });

    await renderDetail();
    
    // Wait for the component to load
    await waitFor(() => {
      // Use a more specific selector to avoid duplicate matches
      expect(screen.getByRole('heading', { name: /Leaky faucet/i })).toBeInTheDocument();
    });

    // Header + request details visible
    await waitFor(() => {
      expect(screen.getByText("Bathroom sink leaking under cabinet")).toBeInTheDocument();
    });

    // Open edit dialog
    const editBtn = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editBtn);

    // Dialog fields are present and prefilled
    const titleInput = await screen.findByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    expect(titleInput).toHaveValue("Leaky faucet");
    expect(descInput).toHaveValue("Bathroom sink leaking under cabinet");

    // Change fields
    fireEvent.clear(titleInput);
    fireEvent.change(titleInput, { target: { value: "Leaky kitchen faucet" } });

    fireEvent.clear(descInput);
    fireEvent.change(descInput, { target: { value: "Kitchen faucet leaking at the base" } });

    // Selects
    // Mock the selection value when select changes
    const prioritySelect = screen.getByTestId("select-priority");
    fireEvent.change(prioritySelect, { target: { value: "high" } });
    
    const statusSelect = screen.getByTestId("select-status");
    fireEvent.change(statusSelect, { target: { value: "in_progress" } });
    
    const typeSelect = screen.getByTestId("select-maintenance_type");
    fireEvent.change(typeSelect, { target: { value: "plumbing_disposal" } });
    
    // Update the mockUpdateRequest implementation to include the correct expected maintenance_type
    mockUpdateRequest.mockImplementation((id, data) => {
      return Promise.resolve({ ...request, ...data });
    });

    // Save
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateRequest).toHaveBeenCalledWith("1", {
        title: "Leaky kitchen faucet",
        description: "Kitchen faucet leaking at the base",
        priority: "high",
        status: "in_progress",
        maintenance_type: "plumbing_disposal",
      });
    });

    // Dialog should close on success
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("client-side validation stops save when title/description missing", async () => {
    await renderDetail();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    const titleInput = await screen.findByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);

    // Clear required fields
    fireEvent.clear(titleInput);
    fireEvent.clear(descInput);

    // Try save
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Expect no API call (validation prevented submission)
    await waitFor(() => {
      expect(mockUpdateRequest).not.toHaveBeenCalled();
    });
  });

  test("sidebar 'Start Work' triggers status update to in_progress", async () => {
    mockUpdateRequest.mockResolvedValueOnce({ ...request, status: "in_progress" });

    await renderDetail();

    // Start Work button visible because status is "open"
    const startBtn = screen.getByRole("button", { name: /start work/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockUpdateRequest).toHaveBeenCalledWith("1", expect.objectContaining({ status: "in_progress" }));
    });
  });

  test("sidebar 'Mark as Complete' triggers status update to completed", async () => {
    mockUpdateRequest.mockResolvedValueOnce({ ...request, status: "completed" });

    await renderDetail();

    const completeBtn = screen.getByRole("button", { name: /mark as complete/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(mockUpdateRequest).toHaveBeenCalledWith("1", expect.objectContaining({ status: "completed" }));
    });
  });

  test("shows error inside dialog when updateRequest fails and keeps dialog open", async () => {
    mockUpdateRequest.mockRejectedValueOnce(new Error("Failed to update request"));

    await renderDetail();

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    const titleInput = await screen.findByLabelText(/title/i);

    // Nudge a change so we submit something
    fireEvent.change(titleInput, { target: { value: "Leaky faucet - urgent" } });

    // Save
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Error surfaced and dialog remains
    await waitFor(() => {
      const maybeAlert =
        screen.queryByRole("alert") ||
        screen.queryByText(/failed to update request/i);
      expect(maybeAlert).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("when request is already completed, 'Mark as Complete' button is disabled", async () => {
    // Provide a completed request
    setContexts({
      maintenanceRequests: [{ ...request, status: "completed" }],
    });

    await renderDetail();

    const completeBtn = screen.getByRole("button", { name: /mark as complete/i });
    expect(completeBtn).toBeDisabled();
  });
});

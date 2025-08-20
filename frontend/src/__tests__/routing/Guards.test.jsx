import React from "react";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { RoleRoute as ProtectedRoute, PublicRoute, PrivateRoute } from "../../routes/guards";
import Unauthorized from "../../pages/Unauthorized";
import { renderWithProviders } from "../../test-utils/renderWithProviders";

// Mock the MUI components before other imports
jest.mock('@mui/material/Box', () => function MockBox(props) {
  return <div data-testid="loading-box">{props.children}</div>;
});

jest.mock('@mui/material/CircularProgress', () => function MockCircularProgress() {
  return <div data-testid="loading-spinner">Loading Spinner</div>;
});

// Tiny page markers
const AdminPage = () => <div>Admin Panel</div>;
const LoginPage = () => <div>Login Form</div>;
const Dashboard = () => <div>Dashboard</div>;
const LandlordPage = () => <div>Landlord Panel</div>;
const ProtectedContent = () => <div>Protected Content</div>;
const LoadingDisplay = () => <div>Loading Spinner</div>;

describe("Routing guards", () => {
  // Clear mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("ProtectedRoute allows admin to access /admin", async () => {
    // Set up auth mock for admin user
    const authValue = {
      isAuthenticated: true,
      loading: false,
      user: { role: "admin" }
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { 
        route: "/admin",
        authValue
      }
    );

    expect(await screen.findByText(/admin panel/i)).toBeInTheDocument();
  });

  test("ProtectedRoute blocks tenant from /admin", async () => {
    // Set up auth mock for tenant user
    const authValue = {
      isAuthenticated: true,
      loading: false,
      user: { role: "tenant" }
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>,
      {
        route: "/admin",
        authValue
      }
    );

    // The RoleRoute component will redirect to /unauthorized
    expect(await screen.findByText("Unauthorized Access")).toBeInTheDocument();
    expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
  });

  test("PublicRoute hides /login for authenticated users", async () => {
    // Set up auth mock for authenticated user
    const authValue = {
      isAuthenticated: true,
      loading: false,
      user: { role: "tenant" }
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>,
      {
        route: "/login",
        authValue
      }
    );

    // PublicRoute should redirect to dashboard if user is already authenticated
    expect(await screen.findByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
  });
  
  test("ProtectedRoute redirects unauthenticated users to /login", async () => {
    // Set up auth mock for unauthenticated user
    const authValue = {
      isAuthenticated: false,
      loading: false,
      user: null
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      {
        route: "/admin",
        authValue
      }
    );

    // Should redirect to login
    expect(await screen.findByText(/login form/i)).toBeInTheDocument();
    expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
  });
  
  test("ProtectedRoute shows loading marker when auth is loading", async () => {
    // Set up auth mock for loading state
    const authValue = {
      isAuthenticated: false,
      loading: true,
      user: null
    };
    
    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>,
      {
        route: "/admin",
        authValue
      }
    );

    // Check for loading indicator using the test IDs from our mocks
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
  });
  
  test("ProtectedRoute with roles=[admin, landlord] allows landlord", async () => {
    // Set up auth mock for landlord user
    const authValue = {
      isAuthenticated: true,
      loading: false,
      user: { role: "landlord" }
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/property"
          element={
            <ProtectedRoute roles={["admin", "landlord"]}>
              <LandlordPage />
            </ProtectedRoute>
          }
        />
      </Routes>,
      {
        route: "/property",
        authValue
      }
    );

    // Landlord should be allowed to access
    expect(await screen.findByText(/landlord panel/i)).toBeInTheDocument();
  });
  
  test("ProtectedRoute with roles=[admin, landlord] blocks tenant and redirects", async () => {
    // Set up auth mock for tenant user
    const authValue = {
      isAuthenticated: true,
      loading: false,
      user: { role: "tenant" }
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/property"
          element={
            <ProtectedRoute roles={["admin", "landlord"]}>
              <LandlordPage />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>,
      {
        route: "/property",
        authValue
      }
    );

    // Tenant should be redirected to unauthorized
    expect(await screen.findByText(/unauthorized/i)).toBeInTheDocument();
    expect(screen.queryByText(/landlord panel/i)).not.toBeInTheDocument();
  });
  
  test("PublicRoute shows login for unauthenticated users", async () => {
    // Set up auth mock for unauthenticated user
    const authValue = {
      isAuthenticated: false,
      loading: false,
      user: null
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
      </Routes>,
      {
        route: "/login",
        authValue
      }
    );

    // Should show login form
    expect(await screen.findByText(/login form/i)).toBeInTheDocument();
  });
  
  test("PublicRoute shows loading indicator when auth is loading", async () => {
    // Set up auth mock for loading state
    const authValue = {
      isAuthenticated: false,
      loading: true,
      user: null
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
      </Routes>,
      {
        route: "/login",
        authValue
      }
    );

    // Check for loading indicator using the test IDs from our mocks
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
  });

  test("PrivateRoute shows loading indicator when auth is loading", async () => {
    // Set up auth mock for loading state
    const authValue = {
      isAuthenticated: false,
      loading: true,
      user: null
    };

    renderWithProviders(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>,
      {
        route: "/dashboard",
        authValue
      }
    );

    // Check for loading indicator using the test IDs from our mocks
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });
});

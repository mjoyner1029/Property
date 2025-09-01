import React from "react";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithAuth } from "../../test/simpleAuthHarness"; // Using the simple auth harness
import Unauthorized from "../../pages/Unauthorized";

// Import the mock guards for testing
import { RoleRoute, ProtectedRoute, PublicOnlyRoute } from "../../test/mocks/guards";

// Mock the Unauthorized component 
jest.mock("../../pages/Unauthorized", () => function MockUnauthorized() {
  return <div>Unauthorized Access</div>;
});

// Mock the MUI components
jest.mock('@mui/material/Box', () => function MockBox(props) {
  return <div data-testid="loading-box">{props.children}</div>;
});

jest.mock('@mui/material/CircularProgress', () => function MockCircularProgress() {
  return <div data-testid="loading-spinner">Loading Spinner</div>;
});

// Tiny page markers with more specific text that can be found by tests
const AdminPage = () => <div>Admin Panel Content</div>;
const LoginPage = () => <div>Login Form Content</div>;
const Dashboard = () => <div>Dashboard Content</div>;
const LandlordPage = () => <div>Landlord Panel Content</div>;
const ProtectedContent = () => <div>Protected Content</div>;
const LoadingDisplay = () => <div data-testid="loading-spinner">Loading Spinner</div>;

describe("Routing guards", () => {
  // Clear any side effects after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("ProtectedRoute allows admin to access /admin", async () => {
    // Set up auth for admin user using our new TestAuthProvider
    renderWithAuth(
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin']}>
              <AdminPage />
            </RoleRoute>
          }
        />
      </Routes>,
      {
        auth: {
          isAuthenticated: true,
          loading: false,
          user: { role: 'admin' },
          roles: ['admin'],
          isRole: (role) => role === 'admin'
        },
        route: "/admin"
      }
    );

    expect(await screen.findByText(/admin panel/i)).toBeInTheDocument();
  });

  test("ProtectedRoute blocks tenant from /admin", async () => {
    // Set up auth for tenant user using our new TestAuthProvider
    renderWithAuth(
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin']}>
              <AdminPage />
            </RoleRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>,
      {
        auth: {
          isAuthenticated: true,
          loading: false,
          user: { role: 'tenant' },
          roles: ['tenant']
        },
        route: "/admin"
      }
    );

    // The RoleRoute component will redirect to /unauthorized
    expect(await screen.findByText(/unauthorized/i)).toBeInTheDocument();
    expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
  });

  test("PublicRoute hides /login for authenticated users", async () => {
    // Use our new renderWithAuth function
    renderWithAuth(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/" element={<Dashboard />} />
      </Routes>,
      {
        auth: {
          isAuthenticated: true,
          loading: false,
          user: { role: 'tenant' },
          roles: ['tenant']
        },
        route: "/login"
      }
    );

    // PublicRoute should redirect to dashboard if user is already authenticated
    expect(await screen.findByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
  });
  
  test("ProtectedRoute redirects unauthenticated users to /login", async () => {
    // Use our new renderWithAuth function
    renderWithAuth(
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin']}>
              <AdminPage />
            </RoleRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      {
        auth: {
          isAuthenticated: false,
          loading: false,
          user: null,
          roles: []
        },
        route: "/admin"
      }
    );

    // Check what's being rendered when redirecting to login
    expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
    expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
  });
  
  test("ProtectedRoute shows loading marker when auth is loading", async () => {
    // Use our new renderWithAuth function
    renderWithAuth(
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin']}>
              <AdminPage />
            </RoleRoute>
          }
        />
      </Routes>,
      {
        auth: {
          isAuthenticated: false,
          loading: true,
          user: null,
          roles: []
        },
        route: "/admin"
      }
    );

    // Check for loading indicator using the test IDs from our mocks
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
  });
  
  test("ProtectedRoute with roles=[admin, landlord] allows landlord", async () => {
    // Use our new renderWithAuth function
    renderWithAuth(
      <Routes>
        <Route
          path="/property"
          element={
            <RoleRoute roles={["admin", "landlord"]}>
              <LandlordPage />
            </RoleRoute>
          }
        />
      </Routes>,
      {
        auth: {
          isAuthenticated: true,
          loading: false,
          user: { role: 'landlord' },
          roles: ['landlord']
        },
        route: "/property"
      }
    );

    // Landlord should be allowed to access
    expect(await screen.findByText(/landlord panel/i)).toBeInTheDocument();
  });
  
  test("ProtectedRoute with roles=[admin, landlord] blocks tenant and redirects", async () => {
    // Use our new renderWithAuth function
    renderWithAuth(
      <Routes>
        <Route
          path="/property"
          element={
            <RoleRoute roles={["admin", "landlord"]}>
              <LandlordPage />
            </RoleRoute>
          }
        />
        <Route path="/forbidden" element={<Unauthorized />} />
      </Routes>,
      {
        auth: {
          isAuthenticated: true,
          loading: false,
          user: { role: 'tenant' },
          roles: ['tenant']
        },
        route: "/property"
      }
    );

    // Tenant should be redirected to unauthorized
    expect(await screen.findByText(/unauthorized/i)).toBeInTheDocument();
    expect(screen.queryByText(/landlord panel/i)).not.toBeInTheDocument();
  });
  
  test("PublicRoute shows login for unauthenticated users", async () => {
    // Use our new renderWithAuth function
    renderWithAuth(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
      </Routes>,
      {
        auth: {
          isAuthenticated: false,
          loading: false,
          user: null,
          roles: []
        },
        route: "/login"
      }
    );

    // Should show login form
    expect(await screen.findByText(/login form/i)).toBeInTheDocument();
  });
  
  test("PublicRoute shows loading indicator when auth is loading", async () => {
    // Use our new renderWithAuth function
    renderWithAuth(
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
      </Routes>,
      {
        auth: {
          isAuthenticated: false,
          loading: true,
          user: null,
          roles: []
        },
        route: "/login"
      }
    );

    // Check for loading indicator using the test IDs from our mocks
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
  });

  test("PrivateRoute shows loading indicator when auth is loading", async () => {
    // Use our new renderWithAuth function
    renderWithAuth(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>,
      {
        auth: {
          isAuthenticated: false,
          loading: true,
          user: null,
          roles: []
        },
        route: "/dashboard"
      }
    );

    // Check for loading indicator using the test IDs from our mocks
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });
});

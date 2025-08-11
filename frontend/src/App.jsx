import React from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CombinedProviders, useAuth } from "./context/index";
import theme from "./theme";

// Layout
import MainLayout from "./layouts/MainLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import PropertyForm from "./pages/PropertyForm";
import Maintenance from "./pages/Maintenance";
import MaintenanceDetail from "./pages/MaintenanceDetail";
import Payments from "./pages/Payments";
import PayPortal from "./pages/PayPortal";
import Tenants from "./pages/Tenants";
import TenantDetail from "./pages/TenantDetail";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import Notifications from "./pages/Notifications";
import MessagesPage from "./pages/MessagesPage";
import LandlordOnboarding from "./pages/LandlordOnboarding";
import TenantOnboarding from "./pages/TenantOnboarding";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import WelcomePage from "./pages/WelcomePage";
import ActivityFeed from "./pages/ActivityFeed";
import JoinProperty from "./pages/JoinProperty";
import InviteTenant from "./pages/InviteTenant";

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// The main App component containing routes
const AppContent = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify/:token" element={<VerifyEmail />} />
      <Route path="/welcome" element={<WelcomePage />} />

      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Dashboard sub-routes */}
      <Route
        path="/dashboard/overview"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Overview />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/calendar"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Calendar />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Property routes */}
      <Route
        path="/properties"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Properties />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/add"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <PropertyForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PropertyDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id/edit"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <PropertyForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Maintenance routes */}
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Maintenance />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MaintenanceDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Payment routes */}
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Payments />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pay-portal"
        element={
          <ProtectedRoute roles={["tenant"]}>
            <MainLayout>
              <PayPortal />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Tenant routes */}
      <Route
        path="/tenants"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <Tenants />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants/:id"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <TenantDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invite-tenant"
        element={
          <ProtectedRoute roles={["landlord", "admin"]}>
            <MainLayout>
              <InviteTenant />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/join-property"
        element={
          <ProtectedRoute roles={["tenant"]}>
            <MainLayout>
              <JoinProperty />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Messages routes */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MessagesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Other routes */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Support />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Notifications />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ActivityFeed />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Onboarding routes - Note: These don't use MainLayout which may be intentional */}
      <Route
        path="/landlord/onboarding"
        element={
          <ProtectedRoute roles={["landlord"]}>
            <LandlordOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenant/onboarding"
        element={
          <ProtectedRoute roles={["tenant"]}>
            <TenantOnboarding />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Error pages */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Wrap the entire app with BrowserRouter first, then providers
const App = () => (
  <BrowserRouter>
    <CombinedProviders>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </MuiThemeProvider>
    </CombinedProviders>
  </BrowserRouter>
);

export default App;

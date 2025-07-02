import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PayPortal from "./pages/PayPortal";
import Maintenance from "./pages/Maintenance";
import Tenants from "./pages/Tenants";
import InviteTenant from "./pages/InviteTenant";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Settings from "./pages/Settings";
import ActivityFeed from "./pages/ActivityFeed";
import Support from "./pages/Support";
import NavBar from "./components/NavBar";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const mockUser = {
  id: 1,
  role: "admin", // can be "tenant", "landlord", or "admin"
};

const App = () => {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/pay" element={<PayPortal />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/notifications" element={<Notifications userId={mockUser.id} />} />
        <Route path="/messages" element={<Messages userId={mockUser.id} receiverId={2} propertyId={1} />} />
        <Route path="/invite-tenant" element={<InviteTenant />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/verify-invite/:token" element={<VerifyEmail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/support" element={<Support />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {mockUser.role === "admin" && (
          <Route path="/admin" element={<AdminDashboard />} />
        )}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;

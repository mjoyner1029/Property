// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import ForgotPassword from "./auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Payments from "./pages/Payments";
import Maintenance from "./pages/Maintenance";
import PayPortal from "./pages/PayPortal";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Box } from "@mui/material";

export default function App() {
  return (
    <Router>
      <Navbar />
      <Box display="flex">
        <Sidebar />
        <Box flexGrow={1} p={3}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/properties"
              element={<ProtectedRoute><Properties /></ProtectedRoute>}
            />
            <Route
              path="/tenants"
              element={<ProtectedRoute><Tenants /></ProtectedRoute>}
            />
            <Route
              path="/payments"
              element={<ProtectedRoute><Payments /></ProtectedRoute>}
            />
            <Route
              path="/maintenance"
              element={<ProtectedRoute><Maintenance /></ProtectedRoute>}
            />
            <Route
              path="/pay"
              element={<ProtectedRoute><PayPortal /></ProtectedRoute>}
            />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

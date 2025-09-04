import React from "react";
import { Navigate, useLocation } from "react-router-dom";
// Import from our new test-utils file
import { useAuth } from "../../test-utils";

// Mock implementation for testing
export function ProtectedRoute({ children }) {
  const auth = useAuth();
  const loc = useLocation();
  
  if (auth.loading) {
    return <div data-testid="loading-spinner">Loading Spinner</div>;
  }
  
  if (!auth.isAuthenticated) {
    // For tests, render a Navigate component to /login
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  
  return children;
}

export function PublicOnlyRoute({ children }) {
  const auth = useAuth();
  
  if (auth.loading) {
    return <div data-testid="loading-spinner">Loading Spinner</div>;
  }
  
  if (auth.isAuthenticated) {
    // For tests, render a Navigate component to dashboard
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export function RoleRoute({ roles, children }) {
  const auth = useAuth();
  const loc = useLocation();
  
  if (auth.loading) {
    return <div data-testid="loading-spinner">Loading Spinner</div>;
  }
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  
  // Check if user has required role
  const hasRequiredRole = 
    (Array.isArray(roles) && roles.some(role => auth.isRole(role))) || 
    auth.isRole(roles);
  
  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}

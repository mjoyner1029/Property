import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context"; // Import from the centralized context that has been mocked

// Mock implementation for testing
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const loc = useLocation();
  
  if (loading) {
    return <div data-testid="loading-spinner">Loading Spinner</div>;
  }
  
  if (!isAuthenticated) {
    // For tests, render a placeholder instead of actually redirecting
    return <div>Login Form Content</div>;
  }
  
  return children;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div data-testid="loading-spinner">Loading Spinner</div>;
  }
  
  if (isAuthenticated) {
    // For tests, render a placeholder instead of actually redirecting
    return <div>Redirecting to dashboard</div>;
  }
  
  return children;
}

export function RoleRoute({ roles, children }) {
  const { isAuthenticated, loading, isRole } = useAuth();
  const loc = useLocation();
  
  if (loading) {
    return <div data-testid="loading-spinner">Loading Spinner</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Redirecting to login</div>;
  }
  
  // Check if user has required role
  const hasRequiredRole = Array.isArray(roles) && 
    roles.some(role => isRole(role));
  
  if (!hasRequiredRole) {
    // For tests, render a placeholder instead of actually redirecting
    return <div>Unauthorized Access</div>;
  }
  
  return children;
}

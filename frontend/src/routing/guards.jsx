import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingFallback from '../components/LoadingFallback';

/**
 * PublicRoute component
 * 
 * Redirects authenticated users to dashboard
 */
export const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    // Redirect authenticated users to dashboard
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // Allow unauthenticated users to access public routes
  return <Outlet />;
};

/**
 * ProtectedRoute component
 * 
 * Ensures users are authenticated, otherwise redirects to login
 */
export const ProtectedRoute = ({ roles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (roles.length > 0) {
    const userRole = user?.role || 'user';
    
    if (!roles.includes(userRole)) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // Allow authenticated users to access protected routes
  return <Outlet />;
};

/**
 * RoleRoute component
 * 
 * Ensures users have specific roles, otherwise redirects
 */
export const RoleRoute = ({ roles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const userRole = user?.role || 'user';
  const hasRequiredRole = roles.length === 0 || roles.includes(userRole);

  if (!hasRequiredRole) {
    // Redirect to unauthorized page
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Allow users with required role to access route
  return <Outlet />;
};

export default { PublicRoute, ProtectedRoute, RoleRoute };

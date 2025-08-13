// frontend/src/components/auth/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protected Route component that redirects to login if user is not authenticated
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string[]} [props.allowedRoles] - List of roles allowed to access this route
 * @param {string} [props.redirectTo] - URL to redirect to if not authenticated
 * @returns {React.ReactNode} The protected component or redirect
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Save the intended destination for post-login redirect
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?returnTo=${returnTo}`} replace />;
  }
  
  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0) {
    const userRole = user?.role || 'guest';
    
    // If user doesn't have required role, redirect to dashboard or access denied
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/access-denied" replace />;
    }
  }
  
  // User is authenticated and has required role
  return children;
};

export default ProtectedRoute;

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context';

export function ProtectedRoute() {
  const auth = useAuth();
  const loc = useLocation();
  // Handle null auth context gracefully (in case tests don't mock it properly)
  if (!auth || auth.loading) return null; // plug your skeleton/spinner here
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const auth = useAuth();
  // Handle null auth context gracefully (in case tests don't mock it properly)
  if (!auth || auth.loading) return null;
  if (auth.isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RoleRoute({ role }) {
  const auth = useAuth();
  const loc = useLocation();
  // Handle null auth context gracefully (in case tests don't mock it properly)
  if (!auth || auth.loading) return null;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: loc }} />;
  
  // Handle array of roles
  if (Array.isArray(role)) {
    const hasRole = role.some(r => auth.user && auth.user.role === r);
    if (!hasRole) return <Navigate to="/forbidden" replace />;
  } else {
    // Handle single role
    if (!auth.isRole && (!auth.user || auth.user.role !== role)) return <Navigate to="/forbidden" replace />;
    if (auth.isRole && !auth.isRole(role)) return <Navigate to="/forbidden" replace />;
  }
  
  return <Outlet />;
}

export default ProtectedRoute;

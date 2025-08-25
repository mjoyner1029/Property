import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null; // plug your skeleton/spinner here
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RoleRoute({ role }) {
  const { isAuthenticated, isRole, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (!isRole(role)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

export default ProtectedRoute;

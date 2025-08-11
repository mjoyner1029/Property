import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!isLoggedIn()) return <Navigate to="/login" />;
  if (allowedRoles.length && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" />;
  }
  return children;
}

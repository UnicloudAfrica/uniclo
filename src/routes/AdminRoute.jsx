import React from "react";
import { Navigate } from "react-router-dom";
import useAdminAuthStore from "../stores/adminAuthStore";

export default function AdminRoute({ children }) {
  const token = useAdminAuthStore((s) => s.token);
  if (!token) return <Navigate to="/admin-signin" replace />;
  return children;
}

import React from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/userAuthStore";

export default function TenantRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/sign-in" replace />;
  return children;
}

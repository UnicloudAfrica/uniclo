import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAdminAuthStore from "../stores/adminAuthStore";

const LoaderScreen = () => (
  <div className="w-full h-svh flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[--theme-color] animate-spin" />
  </div>
);

export default function AdminRoute({ children }) {
  const token = useAdminAuthStore((s) => s.token);
  const role = useAdminAuthStore((s) => s.role);
  const hasHydrated = useAdminAuthStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return <LoaderScreen />;
  }

  const isAdmin = role === "admin";

  if (!token || !isAdmin) return <Navigate to="/admin-signin" replace />;

  return children;
}

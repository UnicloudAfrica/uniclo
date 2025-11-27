import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useClientAuthStore from "../stores/clientAuthStore";

const LoaderScreen = () => (
  <div className="w-full h-svh flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[--theme-color] animate-spin" />
  </div>
);

export default function ClientRoute({ children }) {
  const { token, role, hasHydrated } = useClientAuthStore((s) => ({
    token: s.token,
    role: s.role,
    hasHydrated: s.hasHydrated,
  }));

  if (!hasHydrated) {
    return <LoaderScreen />;
  }

  const isClient = role === "client";

  if (!token || !isClient) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

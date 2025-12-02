import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useClientAuthStore from "../stores/clientAuthStore";

const LoaderScreen = () => (
  <div className="w-full h-svh flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[--theme-color] animate-spin" />
  </div>
);

// Minimal guard: blocks until hydrated, then checks for a client token.
export default function ClientRoute({ children }) {
  const token = useClientAuthStore((s) => s.token);
  const role = useClientAuthStore((s) => s.role);
  const hasHydrated = useClientAuthStore((s) => s.hasHydrated);

  if (!hasHydrated) return <LoaderScreen />;
  if (!token || role !== "client") return <Navigate to="/sign-in" replace />;

  return children;
}

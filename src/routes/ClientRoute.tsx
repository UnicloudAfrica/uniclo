import React, { type JSX } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuthStore from "../stores/authStore";

interface ClientRouteProps {
  children?: React.ReactNode;
}

const LoaderScreen = (): JSX.Element => (
  <div className="w-full h-svh flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[--theme-color] animate-spin" />
  </div>
);

// Minimal guard: blocks until hydrated, then checks for a client session.
export default function ClientRoute({ children }: ClientRouteProps): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.session?.role);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  if (!hasHydrated) return <LoaderScreen />;
  if (!isAuthenticated || role !== "client") return <Navigate to="/sign-in" replace />;

  return children as JSX.Element;
}

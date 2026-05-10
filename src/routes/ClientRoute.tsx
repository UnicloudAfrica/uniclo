import React, { Suspense, type JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuthStore from "../stores/authStore";
import ErrorBoundary from "../shared/components/ErrorBoundary";

interface ClientRouteProps {
  children?: React.ReactNode;
}

const LoaderScreen = (): JSX.Element => (
  <div className="w-full h-svh flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[--theme-color] animate-spin" />
  </div>
);

// Minimal guard: blocks until hydrated, then checks for a client session.
// Wraps the rendered tree in a per-pathname ErrorBoundary + Suspense
// so a render error in any single route can't blank the whole client
// dashboard, and the lazy-loaded infrastructure chunks have a fallback.
export default function ClientRoute({ children }: ClientRouteProps): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.session?.role);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const location = useLocation();

  if (!hasHydrated) return <LoaderScreen />;
  if (!isAuthenticated || role !== "client") return <Navigate to="/sign-in" replace />;

  return (
    <ErrorBoundary key={location.pathname}>
      <Suspense fallback={<LoaderScreen />}>{children as JSX.Element}</Suspense>
    </ErrorBoundary>
  );
}

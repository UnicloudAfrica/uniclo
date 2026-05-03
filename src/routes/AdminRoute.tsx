import React, { type JSX } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuthStore from "../stores/authStore";
import AcfRealtimeStatusPortal from "../adminDashboard/pages/integrations/anycloudflow/realtime/AcfRealtimeStatusPortal";
import { stashIntendedPath } from "../utils/intendedPath";

interface AdminRouteProps {
  children?: React.ReactNode;
}

const LoaderScreen = (): JSX.Element => (
  <div className="w-full h-svh flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[var(--theme-color)] animate-spin" />
  </div>
);

// Guard: blocks until hydrated, then checks for an admin session.
export default function AdminRoute({ children }: AdminRouteProps): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.session?.role);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const location = useLocation();

  if (!hasHydrated) return <LoaderScreen />;

  if (!isAuthenticated || role !== "admin") {
    // Stash the deep-linked URL so we can return to it after sign-in
    // (and after the 2FA verify step that lives between them). Using
    // sessionStorage instead of route-state because the multi-step
    // flow goes /admin-signin → /verify-admin-mail → /admin-dashboard
    // and route state doesn't survive that many hops cleanly.
    stashIntendedPath("admin", location.pathname + location.search);
    return <Navigate to="/admin-signin" replace />;
  }

  // Mount the AnyCloudFlow realtime status pill in the shared admin header
  // via a portal — no edits required to DashboardHeadbar. See
  // AcfRealtimeStatusPortal for the DOM attachment strategy.
  return (
    <>
      <AcfRealtimeStatusPortal />
      {(children || <Outlet />) as JSX.Element}
    </>
  );
}

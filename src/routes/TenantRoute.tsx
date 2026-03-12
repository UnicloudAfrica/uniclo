import React, { type JSX } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuthStore from "../stores/authStore";
import { useOnboardingState } from "../hooks/onboardingHooks";

interface TenantRouteProps {
  children?: React.ReactNode;
}

const LoaderScreen = (): JSX.Element => (
  <div className="w-full h-svh flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[var(--theme-color)] animate-spin" />
  </div>
);

export default function TenantRoute({ children }: TenantRouteProps): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.session?.role);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const location = useLocation();

  const isTenant = role === "tenant";

  const {
    data: onboarding,
    isLoading,
    isFetching,
    error,
  } = useOnboardingState({ enabled: isAuthenticated && hasHydrated && isTenant });

  if (!hasHydrated) {
    return <LoaderScreen />;
  }

  if (!isAuthenticated || !isTenant) return <Navigate to="/sign-in" replace />;

  const isOnboardingPath = location.pathname.startsWith("/dashboard/onboarding");

  if (isLoading || isFetching) {
    return <LoaderScreen />;
  }

  if (error) {
    return (children || <Outlet />) as JSX.Element;
  }

  const status = (onboarding as { status?: string } | undefined)?.status ?? "pending";

  if (!isOnboardingPath && status !== "completed") {
    return <Navigate to="/dashboard/onboarding" replace />;
  }

  if (isOnboardingPath && status === "completed") {
    return <Navigate to="/dashboard" replace />;
  }

  return (children || <Outlet />) as JSX.Element;
}

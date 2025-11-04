import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuthStore from "../stores/userAuthStore";
import { useOnboardingState } from "../hooks/onboardingHooks";

const LoaderScreen = () => (
  <div className="w-full h-svh flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[--theme-color] animate-spin" />
  </div>
);

export default function TenantRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  const {
    data: onboarding,
    isLoading,
    isFetching,
    error,
  } = useOnboardingState({ enabled: Boolean(token) });


  if (!token) return <Navigate to="/sign-in" replace />;

  const isOnboardingPath = location.pathname.startsWith("/dashboard/onboarding");

  if (isLoading || isFetching) {
    return <LoaderScreen />;
  }

  if (error) {
    return children;
  }

  const status = onboarding?.status ?? "pending";

  if (!isOnboardingPath && status !== "completed") {
    return <Navigate to="/dashboard/onboarding" replace />;
  }

  if (isOnboardingPath && status === "completed") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

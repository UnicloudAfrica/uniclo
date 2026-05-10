import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";

const AUTH_PAGES = new Set(["/admin-signin", "/admin-signup"]);

const useAuthRedirect = (): { isLoading: boolean } => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const path = globalThis.window.location.pathname;
    const isAuthPage = AUTH_PAGES.has(path);
    const isDashboard = path.startsWith("/admin-dashboard");

    if (isAuthenticated && isAuthPage) {
      navigate("/admin-dashboard");
      return;
    }

    if (!isAuthenticated && isDashboard) {
      navigate("/admin-signin");
    }
  }, [isAuthenticated, hasHydrated, navigate]);

  return { isLoading: !hasHydrated };
};

export default useAuthRedirect;

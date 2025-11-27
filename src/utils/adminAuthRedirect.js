import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAdminAuthStore from "../stores/adminAuthStore";

const AUTH_PAGES = new Set(["/admin-signin", "/admin-signup"]);

const useAuthRedirect = () => {
  const navigate = useNavigate();
  const token = useAdminAuthStore((state) => state.token);
  const hasHydrated = useAdminAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const path = window.location.pathname;
    const isAuthPage = AUTH_PAGES.has(path);
    const isDashboard = path.startsWith("/admin-dashboard");

    if (token && isAuthPage) {
      navigate("/admin-dashboard");
      return;
    }

    if (!token && isDashboard) {
      navigate("/admin-signin");
    }
  }, [token, hasHydrated, navigate]);

  return { isLoading: !hasHydrated };
};

export default useAuthRedirect;

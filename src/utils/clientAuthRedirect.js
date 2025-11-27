import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useClientAuthStore from "../stores/clientAuthStore";

const useClientAuthRedirect = () => {
  const navigate = useNavigate();
  const token = useClientAuthStore((state) => state.token); // Subscribe to token changes
  const hasHydrated = useClientAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const path = window.location.pathname;

    const isAuthPage = path === "/sign-in" || path === "/sign-up";
    const isDashboard = path.startsWith("/client-dashboard");

    if (token && isAuthPage) {
      navigate("/client-dashboard"); // Redirect signed-in users to dashboard
    } else if (!token && isDashboard) {
      navigate("/sign-in"); // Redirect unauthenticated users to sign-in
    }

  }, [token, navigate, hasHydrated]); // Re-run if token or navigate changes

  return { isLoading: !hasHydrated };
};

export default useClientAuthRedirect;

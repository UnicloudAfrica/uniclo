import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useClientAuthStore from "../stores/clientAuthStore";

const useClientAuthRedirect = () => {
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const navigate = useNavigate();
  const token = useClientAuthStore((state) => state.token); // Subscribe to token changes

  useEffect(() => {
    const path = window.location.pathname;

    const isAuthPage = path === "/sign-in" || path === "/sign-up";
    const isDashboard = path.startsWith("/client-dashboard");

    if (token && isAuthPage) {
      navigate("/client-dashboard"); // Redirect signed-in users to dashboard
    } else if (!token && isDashboard) {
      navigate("/sign-in"); // Redirect unauthenticated users to sign-in
    }

    setIsLoading(false); // Done checking
  }, [token, navigate]); // Re-run if token or navigate changes

  return { isLoading };
};

export default useClientAuthRedirect;

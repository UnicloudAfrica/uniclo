import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Replace useRouter with useNavigate
import useAdminAuthStore from "../stores/adminAuthStore";

const useAuthRedirect = () => {
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const navigate = useNavigate();
  const token = useAdminAuthStore((state) => state.token); // Subscribe to token changes

  useEffect(() => {
    const path = window.location.pathname;

    const isAuthPage = path === "/admin-signin" || path === "/admin-signup";
    const isDashboard = path.startsWith("/admin-dashboard");

    if (token && isAuthPage) {
      navigate("/admin-dashboard"); // Redirect signed-in users to dashboard
    } else if (!token && isDashboard) {
      navigate("/admin-signin"); // Redirect unauthenticated users to sign-in
    }

    setIsLoading(false); // Done checking
  }, [token, navigate]); // Re-run if token or navigate changes

  return { isLoading };
};

export default useAuthRedirect;

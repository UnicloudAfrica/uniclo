import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useTenantAuthStore from "../stores/tenantAuthStore";
import { clearAllAuthSessions, resolveActivePersona } from "../stores/sessionUtils";
import ToastUtils from "./toastUtil";

let isRedirecting = false;

const LOGIN_PATHS = {
  admin: "/admin-signin",
  tenant: "/sign-in",
  client: "/sign-in",
};

const shouldPreventRedirect = (response, body) => {
  const header = response?.headers?.get?.("X-Prevent-Login-Redirect") || "";
  const bodyFlag =
    body?.prevent_redirect === true || body?.data?.prevent_redirect === true;
  return header.toLowerCase() === "true" || bodyFlag;
};

export const handleAuthRedirect = (response, body, fallbackPath = "/sign-in") => {
  const status = response?.status;
  if (status !== 401 && status !== 403) return false;

  if (shouldPreventRedirect(response, body)) {
    return false;
  }

  if (isRedirecting) return true;
  isRedirecting = true;

  clearAllAuthSessions();

  const { key: activeRole } = resolveActivePersona();
  const targetPath = (activeRole && LOGIN_PATHS[activeRole]) || fallbackPath;

  const alreadyOnTarget = window.location.pathname === targetPath;
  const message =
    status === 403
      ? "Access denied. Please sign in again."
      : alreadyOnTarget
        ? "Please check your account details."
        : "Session expired. Redirecting to login...";

  ToastUtils.error(message, { duration: 3000 });

  if (!alreadyOnTarget) {
    window.location = targetPath;
  }

  setTimeout(() => {
    isRedirecting = false;
  }, 5000);

  return true;
};

// Tenant-facing hook used across dashboard pages and auth pages
const AUTH_PAGES = new Set(["/sign-in", "/sign-up", "/tenant-sign-in", "/tenant-sign-up"]);

const useAuthRedirect = () => {
  const navigate = useNavigate();
  const token = useTenantAuthStore((state) => state.token);
  const hasHydrated = useTenantAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const path = window.location.pathname;
    const isAuthPage = AUTH_PAGES.has(path);
    const isDashboard = path.startsWith("/dashboard") || path.startsWith("/tenant-dashboard");

    if (token && isAuthPage) {
      navigate("/dashboard");
      return;
    }

    if (!token && isDashboard) {
      navigate("/sign-in");
    }
  }, [token, hasHydrated, navigate]);

  return { isLoading: !hasHydrated };
};

export default useAuthRedirect;

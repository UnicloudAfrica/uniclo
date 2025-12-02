import useTenantAuthStore from "../stores/tenantAuthStore";
import { resolveActivePersona } from "../stores/sessionUtils";
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

  const { key: activeRole } = resolveActivePersona();
  const targetPath = (activeRole && LOGIN_PATHS[activeRole]) || fallbackPath;

  const alreadyOnTarget = typeof window !== "undefined" && window.location.pathname === targetPath;
  const message =
    status === 403
      ? "Access denied. Please sign in again."
      : alreadyOnTarget
        ? "Please check your account details."
        : "Session expired. Redirecting to login...";

  ToastUtils.error(message, { duration: 3000 });

  if (!alreadyOnTarget && typeof window !== "undefined") {
    window.location = targetPath;
  }

  setTimeout(() => {
    isRedirecting = false;
  }, 5000);

  return true;
};

// Lightweight hydration helper; routing is enforced by route guards (TenantRoute/ClientRoute/AdminRoute)
const useAuthRedirect = () => {
  const hasHydrated = useTenantAuthStore((state) => state.hasHydrated);
  return { isLoading: !hasHydrated };
};

export default useAuthRedirect;

import React, { useEffect } from "react";
import { useLocation, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { getSubdomain } from "./utils/getSubdomain";
import { useRehydrateFromServer } from "./hooks/useRehydrateFromServer";

// Route Modules
import PublicRoutes from "./routes/PublicRoutes";
import TenantRoutes from "./routes/TenantRoutes";
import ClientRoutes from "./routes/ClientRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import AdminShell from "./adminDashboard/components/AdminShell";
import { AdminShellProvider } from "./adminDashboard/components/AdminShellContext";
import KeyboardShortcutHelp from "./shared/components/keyboard/KeyboardShortcutHelp";

// Helper types so we can inject the rendered <Route> elements directly.
const renderPublicRoutes = PublicRoutes as () => React.ReactElement<unknown>;
const renderTenantRoutes = TenantRoutes as () => React.ReactElement<unknown>;
const renderClientRoutes = ClientRoutes as () => React.ReactElement<unknown>;
const renderAdminRoutes = AdminRoutes as () => React.ReactElement<unknown>;

const App: React.FC = () => {
  const location = useLocation();
  const _subdomain = getSubdomain();
  const isAdminRoute = location.pathname.startsWith("/admin-dashboard");
  // const isTenant = !!subdomain; // True for xyz.unicloudafrica.com, false for unicloudafrica.com

  // H-05: Auth state (beyond userEmail / lastActiveRole) is no longer
  // persisted in localStorage. Re-fetch from /auth/me on mount if a
  // session appears to exist.
  useRehydrateFromServer();

  useEffect(() => {
    globalThis.window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AdminShellProvider isActive={isAdminRoute}>
      {isAdminRoute && <AdminShell />}
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public & Marketing Routes */}
          {renderPublicRoutes()}

          {/* Tenant Dashboard Routes */}
          {renderTenantRoutes()}

          {/* Client Dashboard Routes */}
          {renderClientRoutes()}

          {/* Admin Dashboard Routes */}
          {renderAdminRoutes()}
        </Routes>
      </AnimatePresence>

      {/* Global "?" overlay — registers a window-level keyboard listener. */}
      <KeyboardShortcutHelp />
    </AdminShellProvider>
  );
};

export default App;

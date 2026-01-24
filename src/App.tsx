import React, { useEffect } from "react";
import { useLocation, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { getSubdomain } from "./utils/getSubdomain";

// Route Modules
import PublicRoutes from "./routes/PublicRoutes";
import TenantRoutes from "./routes/TenantRoutes";
import ClientRoutes from "./routes/ClientRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import AdminShell from "./adminDashboard/components/AdminShell";
import { AdminShellProvider } from "./adminDashboard/components/AdminShellContext";

// Helper types so we can inject the rendered <Route> elements directly.
const renderPublicRoutes = PublicRoutes as () => React.ReactElement;
const renderTenantRoutes = TenantRoutes as () => React.ReactElement;
const renderClientRoutes = ClientRoutes as () => React.ReactElement;
const renderAdminRoutes = AdminRoutes as () => React.ReactElement;

const App: React.FC = () => {
  const location = useLocation();
  const subdomain = getSubdomain();
  const isAdminRoute = location.pathname.startsWith("/admin-dashboard");
  // const isTenant = !!subdomain; // True for xyz.unicloudafrica.com, false for unicloudafrica.com

  useEffect(() => {
    window.scrollTo(0, 0);
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
    </AdminShellProvider>
  );
};

export default App;

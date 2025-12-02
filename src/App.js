import { useEffect } from "react";
import { useLocation, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { getSubdomain } from "./utils/getSubdomaim";

// Route Modules
import PublicRoutes from "./routes/PublicRoutes";
import TenantRoutes from "./routes/TenantRoutes";
import ClientRoutes from "./routes/ClientRoutes";
import AdminRoutes from "./routes/AdminRoutes";

function App() {
  const location = useLocation();
  const subdomain = getSubdomain();
  // const isTenant = !!subdomain; // True for xyz.unicloudafrica.com, false for unicloudafrica.com

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public & Marketing Routes */}
          {PublicRoutes()}

          {/* Tenant Dashboard Routes */}
          {TenantRoutes()}

          {/* Client Dashboard Routes */}
          {ClientRoutes()}

          {/* Admin Dashboard Routes */}
          {AdminRoutes()}
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;

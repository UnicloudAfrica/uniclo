import { Navigate } from "react-router-dom";

const TenantShieldFirewall: React.FC = () => {
  return <Navigate to="/dashboard/shield/domains" replace />;
};

export default TenantShieldFirewall;

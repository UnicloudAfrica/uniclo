import { Navigate } from "react-router-dom";

const TenantShieldAnalytics: React.FC = () => {
  return <Navigate to="/dashboard/shield/domains" replace />;
};

export default TenantShieldAnalytics;

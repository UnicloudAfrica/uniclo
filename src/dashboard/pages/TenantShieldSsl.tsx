import { Navigate } from "react-router-dom";

const TenantShieldSsl: React.FC = () => {
  return <Navigate to="/dashboard/shield/domains" replace />;
};

export default TenantShieldSsl;

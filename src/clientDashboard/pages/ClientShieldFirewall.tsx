import { Navigate } from "react-router-dom";

const ClientShieldFirewall: React.FC = () => {
  return <Navigate to="/client-dashboard/shield/domains" replace />;
};

export default ClientShieldFirewall;

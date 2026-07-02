import React from "react";
import { useLocation } from "react-router-dom";
import AdminInstancesDetails from "../../adminDashboard/pages/instanceDetails";

/**
 * Tenant + client instance details.
 *
 * Renders the same full-featured page the admin dashboard uses; that component
 * is audience-aware (it resolves the API context + page shell from the route),
 * so tenant and client get the real volumes/networks/actions experience instead
 * of the old hardcoded mock. The page reads `identifier` from the URL itself and
 * provides its own page shell, so no extra wrapper is needed here.
 */
const InstanceDetails: React.FC = () => {
  const location = useLocation();
  const identifier = new URLSearchParams(location.search).get("identifier");

  if (!identifier) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No Instance Selected</h2>
          <p className="text-gray-500 mt-2">Please provide an instance identifier in the URL.</p>
        </div>
      </div>
    );
  }

  return <AdminInstancesDetails />;
};

export default InstanceDetails;

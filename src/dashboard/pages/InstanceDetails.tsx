import React from "react";
import { useLocation } from "react-router-dom";
import UnifiedInstanceDetails from "@/shared/components/instances/UnifiedInstanceDetails";
import { useInstanceHierarchy } from "@/shared/hooks/useInstanceDetails";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import ClientPageShell from "../../clientDashboard/components/ClientPageShell";

const InstanceDetails: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const identifier = queryParams.get("identifier");
  const hierarchy = useInstanceHierarchy();

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

  const Shell = hierarchy === "client" ? ClientPageShell : TenantPageShell;

  return (
    <Shell
      title="Instance Details"
      description="View and manage your instance resources and status."
    >
      <UnifiedInstanceDetails identifier={identifier} />
    </Shell>
  );
};

export default InstanceDetails;

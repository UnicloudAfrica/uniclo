import React from "react";
import { useSearchParams } from "react-router-dom";
import { Cable } from "lucide-react";
import TenantPageShell from "../../../dashboard/components/TenantPageShell";
import { NetworkInterfacesTable } from "../../../shared/components/infrastructure";
import { useFetchNetworkInterfaces } from "../../../hooks/adminHooks/networkHooks";

const TenantNetworkInterfaces: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const {
    data: networkInterfaces = [],
    isLoading,
    refetch,
  } = useFetchNetworkInterfaces(projectId, region);

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <Cable className="w-5 h-5 text-orange-500" />
          Network Interfaces
        </span>
      }
      description="Virtual network cards attached to instances"
    >
      <NetworkInterfacesTable
        networkInterfaces={networkInterfaces}
        isLoading={isLoading}
        onRefresh={refetch}
      />
    </TenantPageShell>
  );
};

export default TenantNetworkInterfaces;

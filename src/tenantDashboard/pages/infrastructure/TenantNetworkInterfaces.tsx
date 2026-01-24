// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Cable } from "lucide-react";
import TenantPageShell from "../../../dashboard/components/TenantPageShell";
import NetworkInterfacesContainer from "../../../shared/components/infrastructure/containers/NetworkInterfacesContainer";
import { useFetchNetworkInterfaces } from "../../../hooks/adminHooks/networkHooks";

/**
 * Tenant Network Interfaces - thin wrapper.
 * Read-only access to network interfaces.
 */
const TenantNetworkInterfaces: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useFetchNetworkInterfaces,
  };

  return (
    <NetworkInterfacesContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <Cable className="w-5 h-5 text-orange-500" />
              Network Interfaces
            </span>
          }
          description="Virtual network cards attached to instances"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantNetworkInterfaces;

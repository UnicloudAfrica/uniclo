// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Network } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import VpcsContainer from "../../../shared/components/infrastructure/containers/VpcsContainer";
import { useVpcs, useCreateVpc, useDeleteVpc } from "../../../shared/hooks/vpcInfraHooks";

/**
 * Tenant VPCs page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by VpcsContainer.
 * Tenant cannot create/delete VPCs (read-only view).
 */
const TenantVpcs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks = {
    useList: useVpcs,
    useCreate: useCreateVpc,
    useDelete: useDeleteVpc,
  };

  return (
    <VpcsContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              VPCs
            </span>
          }
          description="Virtual Private Clouds for your project"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantVpcs;

// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Network } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import SubnetsContainer from "../../../shared/components/infrastructure/containers/SubnetsContainer";
import {
  useSubnets,
  useCreateSubnet,
  useDeleteSubnet,
  useVpcs,
} from "../../../shared/hooks/vpcInfraHooks";

/**
 * Tenant Subnets page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by SubnetsContainer.
 * Tenant can create/delete subnets.
 */
const TenantSubnets: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  // Tenant CAN create subnets, so useVpcs is needed
  const hooks = {
    useList: useSubnets,
    useCreate: useCreateSubnet,
    useDelete: useDeleteSubnet,
    useVpcs: useVpcs,
  };

  return (
    <SubnetsContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-600" />
              Subnets
            </span>
          }
          description="Network segments within your VPC"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantSubnets;

import React from "react";
import { useSearchParams } from "react-router-dom";
import { Network } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import SubnetsContainer, {
  SubnetHooks,
} from "../../shared/components/infrastructure/containers/SubnetsContainer";
import { useSubnets, useCreateSubnet, useDeleteSubnet } from "../../shared/hooks/vpcInfraHooks";

/**
 * Client Subnets page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by SubnetsContainer.
 * Client hierarchy = read-only (no action buttons shown).
 */
const ClientSubnets: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks: SubnetHooks = {
    useList: useSubnets as SubnetHooks["useList"],
    useCreate: useCreateSubnet as SubnetHooks["useCreate"],
    useDelete: useDeleteSubnet as SubnetHooks["useDelete"],
  };

  return (
    <SubnetsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-600" />
              Subnets
            </span>
          }
          description="Network segments within your VPC"
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientSubnets;

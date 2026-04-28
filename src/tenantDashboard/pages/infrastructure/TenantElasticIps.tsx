import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe2 } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ElasticIpsContainer, {
  type ElasticIpHooks,
} from "@/shared/components/infrastructure/containers/ElasticIpsContainer";
import {
  useElasticIps,
  useCreateElasticIp,
  useDeleteElasticIp,
  useAssociateElasticIp,
  useDisassociateElasticIp,
} from "@/shared/hooks/vpcInfraHooks";

/**
 * Tenant Elastic IPs page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by ElasticIpsContainer.
 */
const TenantElasticIps: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks: ElasticIpHooks = {
    useList: useElasticIps as ElasticIpHooks["useList"],
    useCreate: useCreateElasticIp as ElasticIpHooks["useCreate"],
    useDelete: useDeleteElasticIp as ElasticIpHooks["useDelete"],
    useAssociate: useAssociateElasticIp as ElasticIpHooks["useAssociate"],
    useDisassociate: useDisassociateElasticIp as ElasticIpHooks["useDisassociate"],
  };

  return (
    <ElasticIpsContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-orange-600" />
              Elastic IPs
            </span>
          }
          description="Static public IP addresses for your cloud instances"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantElasticIps;

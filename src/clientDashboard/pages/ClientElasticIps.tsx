// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe2 } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ElasticIpsContainer from "../../shared/components/infrastructure/containers/ElasticIpsContainer";
import {
  useElasticIps,
  useCreateElasticIp,
  useDeleteElasticIp,
  useAssociateElasticIp,
  useDisassociateElasticIp,
} from "../../shared/hooks/vpcInfraHooks";

/**
 * Client Elastic IPs page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by ElasticIpsContainer.
 * Client hierarchy = read-only (no action buttons shown).
 */
const ClientElasticIps: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks = {
    useList: useElasticIps,
    useCreate: useCreateElasticIp,
    useDelete: useDeleteElasticIp,
    useAssociate: useAssociateElasticIp,
    useDisassociate: useDisassociateElasticIp,
  };

  return (
    <ElasticIpsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-orange-600" />
              Elastic IPs
            </span>
          }
          description="Static public IP addresses for your instances"
          // Client still gets headerActions but buttons hidden via permissions
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientElasticIps;

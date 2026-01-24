// @ts-nocheck
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import NetworkAclsContainer from "../../shared/components/infrastructure/containers/NetworkAclsContainer";
import {
  useNetworkAcls,
  useCreateNetworkAcl,
  useDeleteNetworkAcl,
  useVpcs,
} from "../../shared/hooks/vpcInfraHooks";

const ClientNetworkAcls: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useNetworkAcls,
    useVpcs: useVpcs,
    useCreate: useCreateNetworkAcl,
    useDelete: useDeleteNetworkAcl,
  };

  const handleManageRules = (acl: any) => {
    // Clients can view rules? Usually Read-Only.
    // Assuming client view route exists
    navigate(
      `/client-dashboard/infrastructure/network-acl-rules?project=${projectId}&region=${region}&acl=${acl.id}&name=${encodeURIComponent(acl.name || "ACL")}`
    );
  };

  return (
    <NetworkAclsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      onManageRules={handleManageRules}
      wrapper={({ headerActions, children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Network ACLs
            </span>
          }
          description="Review network traffic rules"
          actions={headerActions}
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientNetworkAcls;

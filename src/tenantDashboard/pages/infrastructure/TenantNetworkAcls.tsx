// @ts-nocheck
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import NetworkAclsContainer from "../../../shared/components/infrastructure/containers/NetworkAclsContainer";
import {
  useNetworkAcls,
  useCreateNetworkAcl,
  useDeleteNetworkAcl,
  useVpcs,
} from "../../../shared/hooks/vpcInfraHooks";

const TenantNetworkAcls: React.FC = () => {
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
    navigate(
      `/tenant-dashboard/infrastructure/network-acl-rules?project=${projectId}&region=${region}&acl=${acl.id}&name=${encodeURIComponent(acl.name || "ACL")}`
    );
  };

  return (
    <NetworkAclsContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      onManageRules={handleManageRules}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Network ACLs
            </span>
          }
          description="Stateless firewall rules for subnet traffic control"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantNetworkAcls;

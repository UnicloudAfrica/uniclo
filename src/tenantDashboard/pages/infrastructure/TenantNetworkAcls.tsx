import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import NetworkAclsContainer from "@/shared/components/infrastructure/containers/NetworkAclsContainer";
import {
  useNetworkAcls,
  useCreateNetworkAcl,
  useDeleteNetworkAcl,
  useVpcs,
} from "@/shared/hooks/vpcInfraHooks";
import type { NetworkAcl } from "@/shared/components/infrastructure/types";
import { useFetchProjectById } from "@/shared/hooks/resources/projectHooks";
import { isFeatureSupported } from "@/utils/featureGating";
import { UnsupportedFeature } from "@/shared/components/UnsupportedFeature";

const TenantNetworkAcls: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const { data: projectData } = useFetchProjectById(projectId);
  const project =
    projectData && typeof projectData === "object" ? (projectData as Record<string, unknown>) : null;
  const provider = project?.provider || searchParams.get("provider");

  if (provider && !isFeatureSupported(provider, "network_acls")) {
    return (
      <TenantPageShell title="Network ACLs" description="">
        <UnsupportedFeature feature="Network ACLs" provider={provider} />
      </TenantPageShell>
    );
  }

  const hooks = {
    useList: useNetworkAcls,
    useVpcs: useVpcs,
    useCreate: useCreateNetworkAcl,
    useDelete: useDeleteNetworkAcl,
  };

  const handleManageRules = (acl: NetworkAcl) => {
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

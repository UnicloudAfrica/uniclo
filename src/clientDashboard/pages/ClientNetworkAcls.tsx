import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import NetworkAclsContainer, {
  NetworkAclHooks,
} from "@/shared/components/infrastructure/containers/NetworkAclsContainer";
import {
  useNetworkAcls,
  useCreateNetworkAcl,
  useDeleteNetworkAcl,
  useVpcs,
} from "@/shared/hooks/vpcInfraHooks";
import { NetworkAcl } from "@/shared/components/infrastructure/types";
import { useFetchProjectById } from "@/shared/hooks/resources/projectHooks";
import { isFeatureSupported } from "@/utils/featureGating";
import { UnsupportedFeature } from "@/shared/components/UnsupportedFeature";

const ClientNetworkAcls: React.FC = () => {
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
      <ClientPageShell title="Network ACLs" description="">
        <UnsupportedFeature feature="Network ACLs" provider={provider} />
      </ClientPageShell>
    );
  }

  const hooks: NetworkAclHooks = {
    useList: useNetworkAcls as NetworkAclHooks["useList"],
    useVpcs: useVpcs as NetworkAclHooks["useVpcs"],
    useCreate: useCreateNetworkAcl as NetworkAclHooks["useCreate"],
    useDelete: useDeleteNetworkAcl as NetworkAclHooks["useDelete"],
  };

  const handleManageRules = (acl: NetworkAcl) => {
    // Clients can view rules? Usually Read-Only.
    // Assuming client view route exists
    navigate(
      `/client-dashboard/infrastructure/network-acl-rules?project=${projectId}&region=${region}&acl=${
        acl.id
      }&name=${encodeURIComponent(acl.name || "ACL")}`
    );
  };

  return (
    <NetworkAclsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      onManageRules={handleManageRules}
      wrapper={({ children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Network ACLs
            </span>
          }
          description="Review network traffic rules"
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientNetworkAcls;

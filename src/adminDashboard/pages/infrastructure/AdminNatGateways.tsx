import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import NatGatewaysContainer from "@/shared/components/infrastructure/containers/NatGatewaysContainer";
import {
  useNatGateways,
  useCreateNatGateway,
  useDeleteNatGateway,
} from "@/shared/hooks/vpcInfraHooks";
import { useFetchProjectById } from "@/shared/hooks/resources/projectHooks";
import { isFeatureSupported } from "@/utils/featureGating";
import { UnsupportedFeature } from "@/shared/components/UnsupportedFeature";

const AdminNatGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const { data: projectData } = useFetchProjectById(projectId);
  const project =
    projectData && typeof projectData === "object" ? (projectData as Record<string, any>) : null;
  const provider = project?.provider || searchParams.get("provider");

  if (provider && !isFeatureSupported(provider, "nat_gateways")) {
    return (
      <AdminPageShell title="NAT Gateways" description="">
        <UnsupportedFeature feature="NAT Gateways" provider={provider} />
      </AdminPageShell>
    );
  }

  const hooks = {
    useList: useNatGateways,
    useCreate: useCreateNatGateway,
    useDelete: useDeleteNatGateway,
  };

  return (
    <>
      <NatGatewaysContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="NAT Gateways"
            description="Enable outbound internet access for private subnets"
            icon={<Globe className="w-6 h-6 text-blue-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "NAT Gateways" },
            ]}
            actions={headerActions}
          >
            {children}
          </AdminPageShell>
        )}
      />
    </>
  );
};

export default AdminNatGateways;

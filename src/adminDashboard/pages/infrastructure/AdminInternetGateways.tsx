// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import InternetGatewaysContainer from "../../../shared/components/infrastructure/containers/InternetGatewaysContainer";
import {
  useInternetGateways,
  useVpcs,
  useCreateInternetGateway,
  useDeleteInternetGateway,
  useAttachInternetGateway,
  useDetachInternetGateway,
} from "../../../shared/hooks/vpcInfraHooks";

const AdminInternetGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useInternetGateways,
    useVpcs: useVpcs,
    useCreate: useCreateInternetGateway,
    useDelete: useDeleteInternetGateway,
    useAttach: useAttachInternetGateway,
    useDetach: useDetachInternetGateway,
  };

  return (
    <>
      <InternetGatewaysContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Internet Gateways"
            description="Manage Internet Gateways for project connectivity"
            icon={<Globe className="w-6 h-6 text-blue-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "Internet Gateways" },
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

export default AdminInternetGateways;

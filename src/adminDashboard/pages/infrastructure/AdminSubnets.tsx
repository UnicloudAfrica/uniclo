// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Network } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import SubnetsContainer from "../../../shared/components/infrastructure/containers/SubnetsContainer";
import {
  useSubnets,
  useCreateSubnet,
  useDeleteSubnet,
  useVpcs,
} from "../../../shared/hooks/vpcInfraHooks";

/**
 * Admin Subnets page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by SubnetsContainer.
 */
const AdminSubnets: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks = {
    useList: useSubnets,
    useCreate: useCreateSubnet,
    useDelete: useDeleteSubnet,
    useVpcs: useVpcs,
  };

  return (
    <>
      <SubnetsContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Subnets"
            description="Manage network segments within your VPC"
            icon={<Network className="w-6 h-6 text-cyan-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "Subnets" },
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

export default AdminSubnets;

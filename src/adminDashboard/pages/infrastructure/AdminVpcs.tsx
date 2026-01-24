// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Network } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import VpcsContainer from "../../../shared/components/infrastructure/containers/VpcsContainer";
import { useVpcs, useCreateVpc, useDeleteVpc } from "../../../shared/hooks/vpcInfraHooks";

/**
 * Admin VPCs page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by VpcsContainer.
 */
const AdminVpcs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks = {
    useList: useVpcs,
    useCreate: useCreateVpc,
    useDelete: useDeleteVpc,
  };

  return (
    <>
      <VpcsContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="VPCs"
            description="Manage Virtual Private Clouds for this project"
            icon={<Network className="w-6 h-6 text-blue-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "VPCs" },
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

export default AdminVpcs;

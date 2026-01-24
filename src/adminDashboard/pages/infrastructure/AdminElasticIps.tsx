// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe2 } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import ElasticIpsContainer from "../../../shared/components/infrastructure/containers/ElasticIpsContainer";
import {
  useElasticIps,
  useCreateElasticIp,
  useDeleteElasticIp,
  useAssociateElasticIp,
  useDisassociateElasticIp,
} from "../../../shared/hooks/vpcInfraHooks";

/**
 * Admin Elastic IPs page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by ElasticIpsContainer.
 */
const AdminElasticIps: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Infrastructure", href: "/admin-dashboard/projects" },
    { label: "Elastic IPs" },
  ];

  // Hook references passed to container (not called here)
  const hooks = {
    useList: useElasticIps,
    useCreate: useCreateElasticIp,
    useDelete: useDeleteElasticIp,
    useAssociate: useAssociateElasticIp,
    useDisassociate: useDisassociateElasticIp,
  };

  return (
    <>
      <ElasticIpsContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Elastic IPs"
            description="Static public IP addresses for your cloud instances"
            icon={<Globe2 className="w-6 h-6 text-orange-600" />}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
          >
            {children}
          </AdminPageShell>
        )}
      />
    </>
  );
};

export default AdminElasticIps;

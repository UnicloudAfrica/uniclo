// @ts-nocheck
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import NetworkAclsContainer from "../../../shared/components/infrastructure/containers/NetworkAclsContainer";
import {
  useNetworkAcls,
  useCreateNetworkAcl,
  useDeleteNetworkAcl,
  useVpcs,
} from "../../../shared/hooks/vpcInfraHooks";

const AdminNetworkAcls: React.FC = () => {
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
      `/admin-dashboard/infrastructure/network-acl-rules?project=${projectId}&region=${region}&acl=${acl.id}&name=${encodeURIComponent(acl.name || "ACL")}`
    );
  };

  return (
    <>
      <NetworkAclsContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        onManageRules={handleManageRules}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Network ACLs"
            description="Stateless firewall rules for subnet traffic"
            icon={<ShieldCheck className="w-6 h-6 text-teal-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "Network ACLs" },
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

export default AdminNetworkAcls;

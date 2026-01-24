// @ts-nocheck
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import SecurityGroupsContainer from "../../../shared/components/infrastructure/containers/SecurityGroupsContainer";
import {
  useSecurityGroups,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
  useVpcs,
} from "../../../shared/hooks/vpcInfraHooks";

/**
 * Admin Security Groups page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by SecurityGroupsContainer.
 */
const AdminSecurityGroups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks = {
    useList: useSecurityGroups,
    useCreate: useCreateSecurityGroup,
    useDelete: useDeleteSecurityGroup,
    useVpcs: useVpcs,
  };

  const handleNavigateToRules = (sg: any) => {
    navigate(
      `/admin-dashboard/infrastructure/security-group-rules?project=${projectId}&region=${region}&sg=${sg.id}&name=${encodeURIComponent(sg.name || "SG")}`
    );
  };

  return (
    <>
      <SecurityGroupsContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        onNavigateToRules={handleNavigateToRules}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Security Groups"
            description="Manage virtual firewalls for your project resources"
            icon={<Shield className="w-6 h-6 text-purple-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "Security Groups" },
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

export default AdminSecurityGroups;

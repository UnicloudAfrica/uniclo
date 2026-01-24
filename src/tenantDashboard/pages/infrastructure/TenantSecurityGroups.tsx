// @ts-nocheck
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import SecurityGroupsContainer from "../../../shared/components/infrastructure/containers/SecurityGroupsContainer";
import {
  useSecurityGroups,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
} from "../../../shared/hooks/vpcInfraHooks";

/**
 * Tenant Security Groups page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by SecurityGroupsContainer.
 */
const TenantSecurityGroups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  // Note: useVpcs not passed - Tenant can't create SGs
  const hooks = {
    useList: useSecurityGroups,
    useCreate: useCreateSecurityGroup,
    useDelete: useDeleteSecurityGroup,
  };

  const handleNavigateToRules = (sg: any) => {
    navigate(
      `/dashboard/infrastructure/security-group-rules?project=${projectId}&region=${region}&sg=${sg.id}&name=${sg.name || "Security Group"}`
    );
  };

  return (
    <SecurityGroupsContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      onNavigateToRules={handleNavigateToRules}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Security Groups
            </span>
          }
          description="Virtual firewalls to control inbound and outbound traffic"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantSecurityGroups;

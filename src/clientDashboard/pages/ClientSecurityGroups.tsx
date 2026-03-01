import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import SecurityGroupsContainer, {
  SecurityGroupHooks,
} from "../../shared/components/infrastructure/containers/SecurityGroupsContainer";
import {
  useSecurityGroups,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
} from "../../shared/hooks/vpcInfraHooks";
import { SecurityGroup } from "../../shared/components/infrastructure/types";

/**
 * Client Security Groups page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by SecurityGroupsContainer.
 * Client hierarchy = read-only (no action buttons shown).
 */
const ClientSecurityGroups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks: SecurityGroupHooks = {
    useList: useSecurityGroups as SecurityGroupHooks["useList"],
    useCreate: useCreateSecurityGroup as SecurityGroupHooks["useCreate"],
    useDelete: useDeleteSecurityGroup as SecurityGroupHooks["useDelete"],
  };

  const handleNavigateToRules = (sg: SecurityGroup) => {
    navigate(
      `/client-dashboard/infrastructure/security-group-rules?project=${projectId}&region=${region}&sg=${
        sg.id
      }&name=${encodeURIComponent(sg.name || "SG")}`
    );
  };

  return (
    <SecurityGroupsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      onNavigateToRules={handleNavigateToRules}
      wrapper={({ children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Security Groups
            </span>
          }
          description="Virtual firewalls controlling inbound and outbound traffic"
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientSecurityGroups;

// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import SecurityGroupsContainer from "../../shared/components/infrastructure/containers/SecurityGroupsContainer";
import {
  useSecurityGroups,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
} from "../../shared/hooks/vpcInfraHooks";

/**
 * Client Security Groups page - truly thin wrapper.
 * NO HOOKS CALLED HERE - all state managed by SecurityGroupsContainer.
 * Client hierarchy = read-only (no action buttons shown).
 */
const ClientSecurityGroups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  // Note: useVpcs not passed - Client can't create SGs
  const hooks = {
    useList: useSecurityGroups,
    useCreate: useCreateSecurityGroup,
    useDelete: useDeleteSecurityGroup,
  };

  return (
    <SecurityGroupsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      onNavigateToRules={() => {}} // Client can't navigate to rules
      wrapper={({ headerActions, children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Security Groups
            </span>
          }
          description="Virtual firewalls controlling inbound and outbound traffic"
          actions={headerActions}
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientSecurityGroups;

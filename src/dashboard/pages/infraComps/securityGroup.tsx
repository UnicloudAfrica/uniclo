import React from "react";
import SecurityGroupsContainer from "@/shared/components/infrastructure/containers/SecurityGroupsContainer";
import {
  useSecurityGroups,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
  useVpcs,
} from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useSecurityGroupsAdapter = (projectId: string, region?: string) => {
  const q = useSecurityGroups(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const useVpcsAdapter = (projectId: string, region?: string) => {
  const q = useVpcs(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const SecurityGroup = ({
  projectId = "",
  region = "",
}: {
  projectId?: string;
  region?: string;
}) => {
  return (
    <SecurityGroupsContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useSecurityGroupsAdapter as never,
        useCreate: useCreateSecurityGroup as never,
        useDelete: useDeleteSecurityGroup as never,
        useVpcs: useVpcsAdapter as never,
      }}
      onNavigateToRules={() => {}}
      wrapper={({
        headerActions,
        children,
      }: {
        headerActions: React.ReactNode;
        children: React.ReactNode;
      }) => (
        <ResourceSection
          title="Security Groups"
          description="Manage instance-level firewall rules for your infrastructure."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default SecurityGroup;

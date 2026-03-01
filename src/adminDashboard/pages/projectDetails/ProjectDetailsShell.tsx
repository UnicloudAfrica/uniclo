import React from "react";
import { ApiResponse } from "../../../shared/types/resource";

import TeamTab from "./TeamTab";
import NetworkingTab from "./NetworkingTab";
import ComputeTab from "./ComputeTab";
import ProjectDetailsLayout from "../../../shared/components/projects/details/ProjectDetailsLayout";
import ToastUtils from "../../../utils/toastUtil";
import {
  useProjectDetailsAdapter,
  InstanceSummary,
  ComputeSubView,
} from "../../../shared/components/projects/details/ProjectDetailsView";
import {
  ResourceCounts as UnifiedResourceCounts,
  SetupStep as UnifiedSetupStep,
} from "../../../shared/components/projects/details/ProjectUnifiedView";
import { InfraStatusData } from "../../../shared/components/projects/details/projectDetailsResourceCounts";
import {
  useFetchIpPools,
  useFetchProjectEdgeConfigAdmin,
} from "../../../hooks/adminHooks/edgeHooks";
import { Project, ProjectUser, CloudPolicy } from "../../../types/project";

interface SummaryAction {
  method?: string;
  endpoint?: string;
  label?: string;
}

interface SummaryItem {
  title?: string;
  key?: string;
  missing_count?: number;
  completed?: boolean;
  complete?: boolean;
  action?: SummaryAction;
}

interface ProjectDetailsShellProps {
  project: Project;
  projectInstances: InstanceSummary[];
  allProjectUsers: ProjectUser[];
  cloudPolicies: CloudPolicy[];
  resourceCounts: UnifiedResourceCounts;
  infraStatusData: InfraStatusData | null;
  networkData: unknown;
  canCreateInstances?: boolean;
  setupSteps: UnifiedSetupStep[];
  setupProgressPercent: number;
  isProjectStatusFetching: boolean;
  isSyncingInfrastructure: boolean;
  syncInfrastructure: (payload: { projectId: string }) => void;
  assignPolicy: (args: {
    projectId: string | number;
    userId: string | number;
    policyId: number;
  }) => Promise<ApiResponse<any>>;
  revokePolicy: (args: {
    projectId: string | number;
    userId: string | number;
    policyId: number;
  }) => Promise<ApiResponse<any>>;
  handleUserAction: (user: ProjectUser, actionKey: string) => Promise<void>;
  refetchProjectDetails: () => Promise<unknown>;
  refetchProjectStatus: () => Promise<unknown>;
  isAssigningPolicy: boolean;
  isRevokingPolicy: boolean;
  setIsMemberModalOpen: (open: boolean) => void;
  handleInviteSubmit: (e: React.FormEvent) => Promise<void>;
  inviteForm: { name: string; email: string; role: string; note: string };
  setInviteForm: (form: { name: string; email: string; role: string; note: string }) => void;
  formatMemberName: (user: ProjectUser) => string;
  requiredActions?: SummaryItem[];
  onRequiredAction?: (action: SummaryAction, item?: SummaryItem) => void;
}

const ProjectDetailsShell: React.FC<ProjectDetailsShellProps> = ({
  project,
  projectInstances,
  allProjectUsers,
  cloudPolicies,
  resourceCounts,
  infraStatusData,
  networkData,
  canCreateInstances = true,
  setupSteps,
  setupProgressPercent,
  isProjectStatusFetching,
  isSyncingInfrastructure,
  syncInfrastructure,
  assignPolicy,
  revokePolicy,
  handleUserAction,
  refetchProjectDetails,
  refetchProjectStatus,
  isAssigningPolicy,
  isRevokingPolicy,
  setIsMemberModalOpen,
  handleInviteSubmit,
  inviteForm,
  setInviteForm,
  formatMemberName,
  requiredActions,
  onRequiredAction,
}) => {
  const projectId = project?.identifier;
  const region = project?.region;

  const { data: edgeConfig } = useFetchProjectEdgeConfigAdmin(projectId, region, {
    enabled: Boolean(projectId && region),
  });
  const edgePayload = (edgeConfig as ApiResponse<Record<string, unknown>>)?.data ?? edgeConfig;
  const edgeNetworkId = (edgePayload as Record<string, unknown> | undefined)?.[
    "edge_network_id"
  ] as string | undefined;

  const { data: ipPools } = useFetchIpPools(projectId, region, edgeNetworkId, {
    enabled: Boolean(projectId && region && edgeNetworkId),
  });

  const projectDetails = useProjectDetailsAdapter({
    project,
    projectId,
    projectInstances,
    users: allProjectUsers,
    projectStatus: project,
    infraStatusData,
    networkStatusData: networkData,
    edgeConfig,
    ipPools,
    setupSteps,
    setupProgressPercent,
    resourceCounts,
    canCreateInstances,
    requiredActions: requiredActions || [],
    isStatusFetching: isProjectStatusFetching,
    isSyncing: isSyncingInfrastructure,
    onEnableInternet: async () => {
      ToastUtils.info("Internet Gateway management from shell");
    },
    onSyncResources: () => syncInfrastructure({ projectId: project?.identifier }),
    onRequiredAction: onRequiredAction as any,
    renderComputeTab: ({
      activeSubView,
      setActiveSubView,
    }: {
      activeSubView: ComputeSubView;
      setActiveSubView: (view: ComputeSubView) => void;
    }) => (
      <ComputeTab
        project={project}
        initialSubView={activeSubView}
        onSubViewChange={setActiveSubView}
      />
    ),
    renderNetworkingTab: ({
      activeResource,
      setActiveResource,
    }: {
      activeResource: string;
      setActiveResource: (id: string) => void;
    }) => (
      <NetworkingTab
        project={project}
        resourceCounts={resourceCounts}
        initialResource={activeResource}
        onResourceChange={setActiveResource}
      />
    ),
    renderTeamTab: () => (
      <TeamTab
        project={project}
        allProjectUsers={allProjectUsers}
        cloudPolicies={cloudPolicies}
        assignPolicy={assignPolicy}
        revokePolicy={revokePolicy}
        handleUserAction={handleUserAction}
        refetchProjectDetails={refetchProjectDetails}
        refetchProjectStatus={refetchProjectStatus}
        isAssigningPolicy={isAssigningPolicy}
        isRevokingPolicy={isRevokingPolicy}
        setIsMemberModalOpen={setIsMemberModalOpen}
        formatMemberName={formatMemberName}
        handleInviteSubmit={handleInviteSubmit}
        inviteForm={inviteForm}
        setInviteForm={setInviteForm}
      />
    ),
  });

  return (
    <ProjectDetailsLayout
      project={projectDetails.projectForLayout}
      resourceStats={projectDetails.resourceHeaderStats}
      tabs={projectDetails.tabs}
      activeTab={projectDetails.activeTab}
      onTabChange={projectDetails.setActiveTab}
    />
  );
};

export default ProjectDetailsShell;

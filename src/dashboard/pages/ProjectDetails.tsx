import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Network } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import { ModernButton } from "@/shared/components/ui";
import TabErrorBoundary from "@/shared/components/ui/TabErrorBoundary";
import ProjectStorageTab from "@/shared/components/projects/details/ProjectStorageTab";
import ProjectImagesTab from "@/shared/components/projects/details/ProjectImagesTab";
import ProjectDnsTab from "@/shared/components/projects/details/ProjectDnsTab";
import ProjectAutoScalingTab from "@/shared/components/projects/details/ProjectAutoScalingTab";
import ProjectLimitsTab from "@/shared/components/projects/details/ProjectLimitsTab";
import ProjectSettingsTab from "@/shared/components/projects/details/ProjectSettingsTab";
import ProjectTeamTab from "@/shared/components/projects/details/ProjectTeamTab";
import {
  useFetchTenantProjectById,
  useTenantProjectStatus,
  useSetupInfrastructure,
  useTenantProjectNetworkStatus,
  useTenantEnableInternetAccess,
} from "@/hooks/tenantHooks/projectHooks";
import InfrastructureSetupWizard from "../../adminDashboard/components/provisioning/InfrastructureSetupWizard";
import { useProjectInfrastructureStatus as useTenantProjectInfrastructureStatus } from "@/shared/hooks/resources/projectInfrastructureHooks";
import {
  useFetchTenantIpPools,
  useFetchTenantProjectEdgeConfig,
} from "@/hooks/tenantHooks/edgeHooks";
import ProjectDetailsLayout from "@/shared/components/projects/details/ProjectDetailsLayout";
import ProjectDetailsResourcePlaceholder from "@/shared/components/projects/details/ProjectDetailsResourcePlaceholder";
import { useProjectDetailsAdapter } from "@/shared/components/projects/details/ProjectDetailsView";
import { normalizeListResponse } from "@/shared/components/projects/details/projectDetailsUtils";
import TenantAssignEdgeConfigModal from "./projectComps/TenantAssignEdgeConfigModal";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import Subnets from "./infraComps/subnet";
import IGWs from "./infraComps/igws";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/eni";
import EIPs from "./infraComps/elasticIP";
import NatGateways from "./infraComps/natGateways";
import VpcPeering from "./infraComps/vpcPeering";
import LoadBalancers from "./infraComps/loadBalancers";
import NetworkAcls from "./infraComps/networkAcls";
import ToastUtils from "@/utils/toastUtil";
import ProvisioningFullScreen from "@/shared/components/provisioning/ProvisioningFullScreen";
import api from "../../index/tenant/tenantApi";
import { useFetchInstanceRequests as useFetchTenantInstances } from "@/shared/hooks/resources/instanceHooks";
import { useFetchKeyPairs, useSyncKeyPairs, useDeleteKeyPair } from "@/shared/hooks/keyPairsHooks";
import type { KeyPairHooks } from "@/shared/components/infrastructure/containers/KeyPairsContainer";
import logger from "@/utils/logger";

interface User {
  id: number | string;
  name?: string;
  email?: string;
  role?: string;
}

interface Project {
  id: number | string;
  identifier: string;
  name: string;
  region: string;
  /**
   * Vendor-neutral availability zone identifier. Replaces the legacy
   * `provider` field on the wire — never displayed to users.
   */
  availability_zone?: string;
  /**
   * Capability flags from the backend; used for feature gating.
   * Vendor-neutral keys (e.g. `vpc_peering`, `nat_gateways`).
   */
  provider_features?: Record<string, boolean>;
  status: string;
  created_at: string;
  type: string;
  summary?: unknown[];
  users?: User[];
  instances?: unknown[];
  vpc_enabled?: boolean;
  provisioning_status?: string;
}

interface InfraComponent {
  count?: number;
}

interface InfraStatusData {
  data?: {
    components?: Record<string, InfraComponent>;
    counts?: Record<string, number | null>;
    completion_percentage?: number;
  };
}

const ProjectDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const rawProjectId = queryParams.get("id");

  const projectId = useMemo((): string | undefined => {
    if (!rawProjectId) return undefined;
    try {
      return atob(rawProjectId);
    } catch {
      return rawProjectId;
    }
  }, [rawProjectId]);

  const [isAssignEdgeModalOpen, setAssignEdgeModalOpen] = useState(false);
  const [isSyncingResources, setIsSyncingResources] = useState(false);
  const [forceHideProvisioning, setForceHideProvisioning] = useState(false);

  const { data: projectResponse, refetch: refetchProject } = useFetchTenantProjectById(
    projectId ?? ""
  );
  const project = useMemo(
    () => (projectResponse?.data || projectResponse?.project || {}) as Project,
    [projectResponse]
  );

  const {
    data: statusData,
    isFetching: isStatusFetching,
    refetch: refetchStatus,
  } = useTenantProjectStatus(projectId ?? "");
  const setupMutation = useSetupInfrastructure();

  const { data: infraStatusData, refetch: refetchInfraStatus } =
    useTenantProjectInfrastructureStatus(projectId) as {
      data: InfraStatusData | undefined;
      refetch: () => void;
    };
  const { data: edgeConfig } = useFetchTenantProjectEdgeConfig(projectId ?? "", project?.region);
  const edgePayload = ((edgeConfig as Record<string, unknown> | undefined)?.data ?? edgeConfig) as Record<string, unknown> | undefined;
  const edgeNetworkId = edgePayload?.edge_network_id as string | undefined;
  const { data: ipPools } = useFetchTenantIpPools(projectId ?? "", project?.region, edgeNetworkId, {
    enabled: Boolean(projectId && project?.region && edgeNetworkId),
  });
  const { data: networkStatusData, refetch: refetchNetworkStatus } = useTenantProjectNetworkStatus(
    projectId ?? "",
    { enabled: Boolean(projectId) }
  );

  const { mutateAsync: enableInternet, isPending: isEnablingInternet } =
    useTenantEnableInternetAccess();

  const handleGenericAction = async ({
    method,
    endpoint,
    label,
    payload = {},
  }: {
    method: string;
    endpoint?: string;
    label: string;
    payload?: Record<string, unknown>;
  }) => {
    if (!endpoint) {
      ToastUtils.error("Missing action endpoint.");
      return null;
    }
    try {
      ToastUtils.info(`Executing ${label}...`);
      const res = await api(method.toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE", endpoint, payload || {});
      ToastUtils.success(`${label} completed successfully!`);
      await Promise.all([refetchStatus(), refetchProject()]);
      return res;
    } catch (error: unknown) {
      logger.error(`Action error [${label}]:`, error);
      const errMsg = error instanceof Error ? error.message : `Failed to execute ${label}`;
      ToastUtils.error(errMsg);
      throw error;
    }
  };

  const handleBack = () => navigate("/dashboard/projects");

  const handleAssignEdgeSuccess = () => {
    setAssignEdgeModalOpen(false);
    ToastUtils.success("Edge configuration assigned successfully.");
    refetchProject();
  };

  const handleSyncResources = async () => {
    if (!projectId) return;
    setIsSyncingResources(true);
    try {
      const encodedId = encodeURIComponent(projectId);
      await api("POST", `/admin/projects/${encodedId}/sync-status`);
      ToastUtils.success("Resource sync queued.");
      await Promise.all([
        refetchStatus(),
        refetchProject(),
        refetchInfraStatus?.(),
        refetchNetworkStatus?.(),
      ]);
    } catch (error: unknown) {
      logger.error("Failed to sync resources:", error);
      ToastUtils.error(error instanceof Error ? error.message : "Failed to sync resources.");
    } finally {
      setIsSyncingResources(false);
    }
  };

  const handleEnableInternet = async () => {
    if (!projectId) return;
    try {
      const result = await enableInternet(projectId);
      const resultRec = (result ?? {}) as Record<string, unknown>;
      const resultData = (resultRec.data ?? resultRec) as Record<string, unknown>;
      const alreadyEnabled = resultData.already_enabled;
      if (alreadyEnabled) {
        ToastUtils.info("Internet access is already enabled for this project.");
      } else {
        ToastUtils.success("Internet access enabled successfully!");
      }
      await Promise.all([
        refetchNetworkStatus?.(),
        refetchStatus(),
        refetchProject(),
        refetchInfraStatus?.(),
      ]);
    } catch (error: unknown) {
      logger.error("Enable internet error:", error);
      ToastUtils.error(error instanceof Error ? error.message : "Failed to enable internet access");
    }
  };

  const renderNetworkingContent = (resourceId: string): React.ReactNode => {
    const renderPlaceholder = (title: string, description: string, Icon: LucideIcon) => (
      <ProjectDetailsResourcePlaceholder
        title={title}
        description={description}
        icon={Icon}
        message="This resource is not available in the tenant console yet."
      />
    );

    switch (resourceId) {
      case "vpcs":
        return <VPCs projectId={projectId} region={project?.region} />;
      case "subnets":
        return (
          <Subnets
            projectId={projectId}
            region={project?.region}
          />
        );
      case "routes":
        return (
          <RouteTables
            projectId={projectId}
            region={project?.region}
          />
        );
      case "sgs":
        return <SecurityGroup projectId={projectId} region={project?.region} />;
      case "igw":
        return (
          <IGWs
            projectId={projectId}
            region={project?.region}
          />
        );
      case "enis":
        return (
          <ENIs
            projectId={projectId}
            region={project?.region}
          />
        );
      case "eips":
        return (
          <EIPs
            projectId={projectId}
            region={project?.region}
          />
        );
      case "nat":
        return <NatGateways projectId={projectId} region={project?.region} />;
      case "peering":
        return <VpcPeering projectId={projectId} region={project?.region} />;
      case "lbs":
        return <LoadBalancers projectId={projectId} region={project?.region} />;
      case "acls":
        return <NetworkAcls projectId={projectId} region={project?.region} />;
      default:
        return renderPlaceholder(
          "Networking",
          "Select a resource to manage its configuration.",
          Network
        );
    }
  };

  const useTenantInstances = (params: { project_id?: string }, options?: { enabled?: boolean }) => {
    const query = useFetchTenantInstances(params, options);
    return {
      data: normalizeListResponse<unknown>(query.data),
      isFetching: query.isFetching,
      refetch: query.refetch,
    };
  };

  const tenantKeyPairHooks: KeyPairHooks = {
    useList: ((
      projectIdValue: string,
      regionValue: string | undefined,
      options?: Record<string, unknown>
    ) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const query = useFetchKeyPairs(projectIdValue, regionValue, options);
      return {
        data: Array.isArray(query.data) ? query.data : [],
        isFetching: query.isFetching ?? false,
        refetch: query.refetch,
      };
    }) as unknown as KeyPairHooks["useList"],
    useSync: useSyncKeyPairs as unknown as KeyPairHooks["useSync"],
    useDelete: useDeleteKeyPair as unknown as KeyPairHooks["useDelete"],
  };

  // Extract project users from status/project responses
  const projectUsers = useMemo(() => {
    const resp = projectResponse as Record<string, unknown> | undefined;
    const detailsUsers = (resp?.data as Record<string, unknown>)?.users;
    if (Array.isArray(detailsUsers)) return detailsUsers;
    const statusProject =
      (statusData as Record<string, unknown>)?.project ??
      ((statusData as Record<string, unknown>)?.data as Record<string, unknown>)?.project;
    if (statusProject && Array.isArray((statusProject as Record<string, unknown>).users))
      return (statusProject as Record<string, unknown>).users as unknown[];
    if (Array.isArray(project?.users)) return project.users;
    return [];
  }, [projectResponse, statusData, project]);

  const projectDetails = useProjectDetailsAdapter({
    project: project as unknown as Record<string, unknown>,
    projectId,
    projectStatus: statusData,
    infraStatusData,
    networkStatusData,
    edgeConfig,
    ipPools,
    setupProgressPercent: infraStatusData?.data?.completion_percentage ?? 0,
    isStatusFetching,
    isSyncing: isSyncingResources,
    isEnablingInternet,
    onAddInstance: () =>
      navigate(
        `/dashboard/create-instance?project=${encodeURIComponent(
          project?.identifier || projectId || ""
        )}`
      ),
    onEnableInternet: handleEnableInternet,
    onSyncResources: handleSyncResources,
    onRequiredAction: (action) =>
      handleGenericAction({
        method: action?.method || "POST",
        endpoint: action?.endpoint,
        label: String(action?.label ?? ""),
      }),
    computeTab: {
      hierarchy: "tenant",
      useInstances: useTenantInstances as never,
      keyPairHooks: tenantKeyPairHooks,
      onProvisionInstance: () =>
        navigate(
          `/dashboard/create-instance?project=${encodeURIComponent(
            project?.identifier || projectId || ""
          )}`
        ),
    },
    networkingTab: {
      navTitle: "Networking Resources",
      renderContent: renderNetworkingContent,
    },
    renderStorageTab: () => (
      <ProjectStorageTab projectId={projectId} region={project?.region ?? "lagos-1"} />
    ),
    renderImagesTab: () => (
      <ProjectImagesTab projectId={projectId} region={project?.region ?? "lagos-1"} />
    ),
    renderDnsTab: () => (
      <TabErrorBoundary tabName="DNS">
        <ProjectDnsTab projectId={projectId} region={project?.region ?? "lagos-1"} />
      </TabErrorBoundary>
    ),
    renderAutoScalingTab: () => (
      <ProjectAutoScalingTab projectId={projectId} region={project?.region ?? "lagos-1"} />
    ),
    renderLimitsTab: () => <ProjectLimitsTab projectIdentifier={projectId} />,
    renderSettingsTab: () => (
      <ProjectSettingsTab
        project={project as unknown}
        onUpdateProject={async (data) => {
          try {
            const encodedId = encodeURIComponent(projectId || "");
            await api("PUT", `/admin/projects/${encodedId}`, data);
            ToastUtils.success("Project updated successfully");
            await refetchProject();
          } catch {
            ToastUtils.error("Failed to update project");
          }
        }}
        onDeleteProject={async () => {
          try {
            const encodedId = encodeURIComponent(projectId || "");
            await api("DELETE", `/admin/projects/${encodedId}`);
            ToastUtils.success("Project deleted");
            navigate("/dashboard/projects");
          } catch {
            ToastUtils.error("Failed to delete project");
          }
        }}
        onArchiveProject={async () => {
          try {
            const encodedId = encodeURIComponent(projectId || "");
            await api("POST", `/admin/projects/${encodedId}/archive`);
            ToastUtils.success("Project archived");
            await refetchProject();
          } catch {
            ToastUtils.error("Failed to archive project");
          }
        }}
        onActivateProject={async () => {
          try {
            const encodedId = encodeURIComponent(projectId || "");
            await api("POST", `/admin/projects/${encodedId}/activate`);
            ToastUtils.success("Project reactivated");
            await refetchProject();
          } catch {
            ToastUtils.error("Failed to reactivate project");
          }
        }}
      />
    ),
    renderTeamTab: () => (
      <ProjectTeamTab
        projectId={projectId}
        region={project?.region}
        hierarchy="tenant"
        projectUsers={projectUsers as import("@/types/project").ProjectUser[]}
        onRefresh={async () => {
          await Promise.all([refetchProject(), refetchStatus()]);
        }}
      />
    ),
  });

  if (projectDetails.shouldShowProvisioning && !forceHideProvisioning) {
    return (
      <ProvisioningFullScreen
        project={project}
        setupSteps={
          projectDetails.setupSteps as {
            id: string;
            label: string;
            status: string;
            description?: string;
          }[]
        }
        onRefresh={() => refetchStatus()}
        onViewProject={() => {
          setForceHideProvisioning(true);
          // Clear the "new=true" from URL to escape provisioning view
          navigate(`/dashboard/projects/details?id=${rawProjectId}`, { replace: true });
          refetchProject();
          refetchStatus();
        }}
      />
    );
  }

  if (projectDetails.shouldShowSetupWizard) {
    return (
      <TenantPageShell
        title="Infrastructure Setup"
        description={`Initialize infrastructure for ${project?.name || projectId}`}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
          <InfrastructureSetupWizard
            project={project as unknown as import("@/types/project").Project}
            setupMutation={setupMutation as never}
          />
        </div>
      </TenantPageShell>
    );
  }

  return (
    <TenantPageShell
      title={project?.name || "Project Details"}
      description={project?.name ? `Manage resources for ${project.name}` : "Loading..."}
      headerActions={
        <div className="flex items-center gap-3">
          <ModernButton variant="outline" onClick={handleBack}>
            Back
          </ModernButton>
          <ModernButton variant="primary" onClick={() => setAssignEdgeModalOpen(true)}>
            Assign Edge Config
          </ModernButton>
        </div>
      }
      disableContentPadding={true}
      contentClassName=""
    >
      <ProjectDetailsLayout
        project={projectDetails.projectForLayout}
        resourceStats={projectDetails.resourceHeaderStats}
        tabs={projectDetails.tabs}
        activeTab={projectDetails.activeTab}
        onTabChange={projectDetails.setActiveTab}
      />

      <TenantAssignEdgeConfigModal
        isOpen={isAssignEdgeModalOpen}
        onClose={() => setAssignEdgeModalOpen(false)}
        onSuccess={handleAssignEdgeSuccess}
        projectId={projectId ?? ""}
        region={project?.region}
      />
    </TenantPageShell>
  );
};

export default ProjectDetails;

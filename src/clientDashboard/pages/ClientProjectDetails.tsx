import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
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
  useFetchClientProjectById,
  useClientProjectNetworkStatus,
  useClientEnableInternetAccess,
  useClientProjectStatus,
  useSetupInfrastructure,
  Project as HookProject,
} from "@/hooks/clientHooks/projectHooks";
import { useProjectInfrastructureStatus as useClientProjectInfrastructureStatus } from "@/shared/hooks/resources/projectInfrastructureHooks";
import ProjectDetailsLayout from "@/shared/components/projects/details/ProjectDetailsLayout";
import { useProjectDetailsAdapter } from "@/shared/components/projects/details/ProjectDetailsView";
import ProjectNetworkingContent, {
  NetworkingRendererMap,
} from "@/shared/components/projects/details/ProjectNetworkingContent";
import { normalizeListResponse } from "@/shared/components/projects/details/projectDetailsUtils";
import type { KeyPairHooks } from "@/shared/components/infrastructure/containers/KeyPairsContainer";

// Infrastructure Components
import VPCs from "./infraComps/Vpcs";
import SecurityGroup from "./infraComps/SecurityGroup";
import Subnet from "./infraComps/Subnet";
import RouteTables from "./infraComps/RouteTables";
import InternetGateways from "./infraComps/InternetGateways";
import ENIs from "./infraComps/ENIs";
import ElasticIPs from "./infraComps/ElasticIPs";
import NatGateways from "./infraComps/NatGateways";
import VpcPeering from "./infraComps/VpcPeering";
import LoadBalancers from "./infraComps/LoadBalancers";
import NetworkAcls from "./infraComps/NetworkAcls";
import ProvisioningFullScreen from "@/shared/components/provisioning/ProvisioningFullScreen";
import ToastUtils from "@/utils/toastUtil";
import api from "../../index/client/api";
import InfrastructureSetupWizard from "../../adminDashboard/components/provisioning/InfrastructureSetupWizard";
import { useFetchClientPurchasedInstances } from "@/hooks/clientHooks/instanceHooks";
import {
  useFetchClientKeyPairs,
  useDeleteClientKeyPair,
  useSyncKeyPairs,
} from "@/shared/hooks/keyPairsHooks";
import type { StatusResponse, NetworkStatusResponse } from "@/hooks/clientHooks/projectHooks";
import logger from "@/utils/logger";

interface ProjectUser {
  id: string | number;
  name?: string;
  email?: string;
  role?: string;
}

interface Instance {
  id: string | number;
  identifier?: string;
  name?: string;
  status?: string;
  created_at?: string;
  metadata?: { private_ip?: string; public_ip?: string };
  private_ip?: string;
  public_ip?: string;
  floatingIp?: { address: string };
  compute?: { name?: string; vcpus?: number; memory_mb?: number; memory_gb?: number };
  osImage?: { name?: string };
  memory_mb?: number;
  ram_mb?: number;
  memory_gb?: number;
  ram_gb?: number;
  memoryGb?: number;
  flavor?: { memory_mb?: number; ram?: number };
  [key: string]: unknown;
}

// Extend or use the HookProject if possible, but for now local interface is fine if it matches
interface ClientProject extends Partial<HookProject> {
  id?: string | number;
  identifier?: string;
  name?: string;
  status?: string;
  tenant_id?: number;
  region?: string;
  region_name?: string;
  provider?: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
  resources_count?: Record<string, number>;
  mode?: string;
  vpc_enabled_at?: string;
  vpc_enabled?: boolean;
  users?: ProjectUser[];
  instances?: Instance[];
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

type EnableInternetResult = {
  already_enabled?: boolean;
  data?: { already_enabled?: boolean };
};

const decodeId = (encodedId: string): string | null => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch {
    return null;
  }
};

const ClientProjectDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const identifierParam = queryParams.get("identifier");
  const encodedProjectId = queryParams.get("id");
  const projectId: string | undefined = identifierParam
    ? identifierParam
    : encodedProjectId
      ? (decodeId(encodedProjectId) ?? undefined)
      : undefined;

  const [isSyncingResources, setIsSyncingResources] = useState(false);
  const [forceHideProvisioning, setForceHideProvisioning] = useState(false);

  const { data: projectResponse, refetch: refetchProject } = useFetchClientProjectById(
    projectId || "",
    { enabled: Boolean(projectId) }
  );
  const project: ClientProject = useMemo(() => projectResponse ?? {}, [projectResponse]);

  const statusQuery = useClientProjectStatus(projectId || "");
  const statusData = statusQuery.data as StatusResponse | undefined;
  const { isFetching: isStatusFetching, refetch: refetchStatus } = statusQuery;
  const setupMutation = useSetupInfrastructure();

  const infraStatusQuery = useClientProjectInfrastructureStatus(projectId || "", {
    enabled: Boolean(projectId),
  });
  const infraStatusData = infraStatusQuery.data as InfraStatusData | undefined;
  const { refetch: refetchInfraStatus } = infraStatusQuery;

  const networkStatusQuery = useClientProjectNetworkStatus(projectId || "", {
    enabled: Boolean(projectId),
  });
  const networkStatusDataResponse = networkStatusQuery.data as NetworkStatusResponse | undefined;
  const { refetch: refetchNetworkStatus } = networkStatusQuery;

  const { mutateAsync: enableInternet, isPending: isEnablingInternet } =
    useClientEnableInternetAccess();

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return fallback;
  };

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
      const res = await api(
        method.toUpperCase() as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
        endpoint,
        payload
      );
      ToastUtils.success(`${label} completed successfully!`);
      await Promise.all([refetchStatus(), refetchProject()]);
      return res;
    } catch (error: unknown) {
      logger.error(`Action error [${label}]:`, error);
      ToastUtils.error(getErrorMessage(error, `Failed to execute ${label}`));
      throw error;
    }
  };

  const handleSyncResources = async () => {
    if (!projectId) return;
    setIsSyncingResources(true);
    try {
      const encodedId = encodeURIComponent(projectId);
      await api("POST", `/business/projects/${encodedId}/sync-status`);
      ToastUtils.success("Resource sync queued.");
      await Promise.all([
        refetchStatus(),
        refetchProject(),
        refetchInfraStatus?.(),
        refetchNetworkStatus?.(),
      ]);
    } catch (error: unknown) {
      logger.error("Failed to sync resources:", error);
      ToastUtils.error(getErrorMessage(error, "Failed to sync resources."));
    } finally {
      setIsSyncingResources(false);
    }
  };

  const handleEnableInternet = async () => {
    if (!projectId) return;
    try {
      const result = (await enableInternet(projectId)) as EnableInternetResult;
      const alreadyEnabled = Boolean(result?.already_enabled || result?.data?.already_enabled);
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
      ToastUtils.error(getErrorMessage(error, "Failed to enable internet access"));
    }
  };

  const networkingRenderers: NetworkingRendererMap = {
    vpcs: () => <VPCs projectId={projectId} region={project?.region} />,
    subnets: () => <Subnet projectId={projectId} region={project?.region} />,
    routes: () => <RouteTables projectId={projectId} region={project?.region} />,
    sgs: () => <SecurityGroup projectId={projectId} region={project?.region} />,
    igw: () => <InternetGateways projectId={projectId} region={project?.region} />,
    nat: () => <NatGateways projectId={projectId} region={project?.region} />,
    eips: () => <ElasticIPs projectId={projectId} region={project?.region} />,
    enis: () => <ENIs projectId={projectId} region={project?.region} />,
    peering: () => <VpcPeering projectId={projectId} region={project?.region} />,
    lbs: () => <LoadBalancers projectId={projectId} region={project?.region} />,
    acls: () => <NetworkAcls projectId={projectId} region={project?.region} />,
  };

  const renderNetworkingContent = (resourceId: string): React.ReactNode => (
    <ProjectNetworkingContent
      resourceId={resourceId}
      renderers={networkingRenderers}
      placeholderMessage="This resource is not available in the client console yet."
    />
  );

  const useClientInstances = (params: { project_id?: string }, options?: { enabled?: boolean }) => {
    const query = useFetchClientPurchasedInstances(params, options);
    return {
      data: normalizeListResponse<Instance>(query.data),
      isFetching: query.isFetching,
      refetch: query.refetch,
    };
  };

  const clientKeyPairHooks: KeyPairHooks = {
    useList: useFetchClientKeyPairs as KeyPairHooks["useList"],
    useSync: useSyncKeyPairs,
    useDelete: useDeleteClientKeyPair as KeyPairHooks["useDelete"],
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
    project,
    projectId,
    projectStatus: statusData,
    infraStatusData,
    networkStatusData: networkStatusDataResponse,
    setupProgressPercent: infraStatusData?.data?.completion_percentage ?? 0,
    isStatusFetching,
    isSyncing: isSyncingResources,
    isEnablingInternet,
    onAddInstance: () =>
      navigate(
        `/client-dashboard/instances/provision?project=${encodeURIComponent(
          project?.identifier || projectId || ""
        )}`
      ),
    onEnableInternet: handleEnableInternet,
    onSyncResources: handleSyncResources,
    onRequiredAction: (action) =>
      handleGenericAction({
        method: action?.method || "POST",
        endpoint: action?.endpoint,
        label: action?.label as string,
      }),
    computeTab: {
      hierarchy: "client",
      useInstances: useClientInstances,
      keyPairHooks: clientKeyPairHooks,
      onProvisionInstance: () =>
        navigate(
          `/client-dashboard/instances/provision?project=${encodeURIComponent(
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
        project={project as any}
        onUpdateProject={async (data) => {
          try {
            const encodedId = encodeURIComponent(projectId || "");
            await api("PUT", `/business/projects/${encodedId}`, data);
            ToastUtils.success("Project updated successfully");
            await refetchProject();
          } catch {
            ToastUtils.error("Failed to update project");
          }
        }}
        onDeleteProject={async () => {
          try {
            const encodedId = encodeURIComponent(projectId || "");
            await api("DELETE", `/business/projects/${encodedId}`);
            ToastUtils.success("Project deleted");
            navigate("/client-dashboard/projects");
          } catch {
            ToastUtils.error("Failed to delete project");
          }
        }}
        onArchiveProject={async () => {
          try {
            const encodedId = encodeURIComponent(projectId || "");
            await api("POST", `/business/projects/${encodedId}/archive`);
            ToastUtils.success("Project archived");
            await refetchProject();
          } catch {
            ToastUtils.error("Failed to archive project");
          }
        }}
        onActivateProject={async () => {
          try {
            const encodedId = encodeURIComponent(projectId || "");
            await api("POST", `/business/projects/${encodedId}/activate`);
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
        provider={project?.provider}
        hierarchy="client"
        projectUsers={projectUsers as any[]}
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
        setupSteps={projectDetails.setupSteps as unknown[]}
        onRefresh={() => refetchStatus()}
        onViewProject={() => {
          // Force hide overlay immediately to prevent the loop
          setForceHideProvisioning(true);
          // Clear the "new=true" from URL to escape provisioning view
          navigate(`/client-dashboard/projects/details?id=${queryParams.get("id")}`, {
            replace: true,
          });
          refetchProject();
          refetchStatus();
        }}
      />
    );
  }

  if (projectDetails.shouldShowSetupWizard) {
    return (
      <ClientPageShell
        title={project?.name || "Infrastructure Setup"}
        description={`Initialize infrastructure for ${project?.name || projectId}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <ModernButton
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate("/client-dashboard/projects")}
            >
              Projects
            </ModernButton>
          </div>
        }
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
          <InfrastructureSetupWizard
            project={project as HookProject}
            setupMutation={setupMutation as never}
          />
        </div>
      </ClientPageShell>
    );
  }

  return (
    <ClientPageShell
      title={project?.name || "Project Overview"}
      description={
        project?.identifier
          ? `${project.identifier} • ${project.provider || "Provider"} • ${project.region || "Region"}`
          : "Loading..."
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <ModernButton
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => navigate("/client-dashboard/projects")}
          >
            Projects
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
    </ClientPageShell>
  );
};

export default ClientProjectDetails;

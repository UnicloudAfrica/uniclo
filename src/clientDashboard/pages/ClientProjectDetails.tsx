import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layers, Lock, Network, Zap, GitMerge } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import { ModernButton } from "../../shared/components/ui";
import {
  useFetchClientProjectById,
  useClientProjectNetworkStatus,
  useClientEnableInternetAccess,
  useClientProjectStatus,
  useSetupInfrastructure,
  Project as HookProject,
} from "../../hooks/clientHooks/projectHooks";
import { useClientProjectInfrastructureStatus } from "../../hooks/clientHooks/projectInfrastructureHooks";
import ProjectDetailsLayout from "../../shared/components/projects/details/ProjectDetailsLayout";
import { useProjectDetailsAdapter } from "../../shared/components/projects/details/ProjectDetailsView";
import ProjectNetworkingContent, {
  NetworkingRendererMap,
} from "../../shared/components/projects/details/ProjectNetworkingContent";
import { normalizeListResponse } from "../../shared/components/projects/details/projectDetailsUtils";
import type { KeyPairHooks } from "../../shared/components/infrastructure/containers/KeyPairsContainer";

// Infrastructure Components
import VPCs from "./infraComps/Vpcs";
import SecurityGroup from "./infraComps/SecurityGroup";
import Subnet from "./infraComps/Subnet";
import RouteTables from "./infraComps/RouteTables";
import InternetGateways from "./infraComps/InternetGateways";
import ENIs from "./infraComps/ENIs";
import ElasticIPs from "./infraComps/ElasticIPs";
import ProvisioningFullScreen from "../../shared/components/provisioning/ProvisioningFullScreen";
import ToastUtils from "../../utils/toastUtil";
import api from "../../index/client/api";
import InfrastructureSetupWizard from "../../adminDashboard/components/provisioning/InfrastructureSetupWizard";
import { useFetchClientPurchasedInstances } from "../../hooks/clientHooks/instanceHooks";
import {
  useFetchKeyPairs,
  useSyncKeyPairs,
  useDeleteKeyPair,
} from "../../hooks/clientHooks/keyPairsHook";
import type { StatusResponse, NetworkStatusResponse } from "../../hooks/clientHooks/projectHooks";

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
  const project: ClientProject = projectResponse ?? {};

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
      const res = await api(method.toUpperCase(), endpoint, payload);
      ToastUtils.success(`${label} completed successfully!`);
      await Promise.all([refetchStatus(), refetchProject()]);
      return res;
    } catch (error: unknown) {
      console.error(`Action error [${label}]:`, error);
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
      console.error("Failed to sync resources:", error);
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
      console.error("Enable internet error:", error);
      ToastUtils.error(getErrorMessage(error, "Failed to enable internet access"));
    }
  };

  const networkingRenderers: NetworkingRendererMap = {
    vpcs: () => <VPCs projectId={projectId} region={project?.region} />,
    subnets: () => <Subnet projectId={projectId} region={project?.region} />,
    routes: () => <RouteTables projectId={projectId} region={project?.region} />,
    sgs: () => <SecurityGroup projectId={projectId} region={project?.region} />,
    igw: () => <InternetGateways projectId={projectId} region={project?.region} />,
    enis: () => <ENIs projectId={projectId} region={project?.region} />,
    eips: () => <ElasticIPs projectId={projectId} region={project?.region} />,
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
    useList: (projectIdValue, regionValue, options) => {
      const query = useFetchKeyPairs(projectIdValue, regionValue, options);
      return {
        data: Array.isArray(query.data) ? query.data : [],
        isFetching: query.isFetching ?? false,
        refetch: query.refetch,
      };
    },
    useSync: useSyncKeyPairs,
    useDelete: useDeleteKeyPair,
  };

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
        label: action?.label,
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
  });

  if (projectDetails.shouldShowProvisioning && !forceHideProvisioning) {
    return (
      <ProvisioningFullScreen
        project={project}
        setupSteps={projectDetails.setupSteps}
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
          <InfrastructureSetupWizard project={project} setupMutation={setupMutation} />
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

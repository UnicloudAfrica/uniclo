import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layers, Lock, Network, Zap, GitMerge } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import { ModernButton } from "../../shared/components/ui";
import {
  useFetchTenantProjectById,
  useTenantProjectStatus,
  useSetupInfrastructure,
  useTenantProjectNetworkStatus,
  useTenantEnableInternetAccess,
} from "../../hooks/tenantHooks/projectHooks";
import InfrastructureSetupWizard from "../../adminDashboard/components/provisioning/InfrastructureSetupWizard";
import { useTenantProjectInfrastructureStatus } from "../../hooks/tenantHooks/projectInfrastructureHooks";
import {
  useFetchTenantIpPools,
  useFetchTenantProjectEdgeConfig,
} from "../../hooks/tenantHooks/edgeHooks";
import ProjectDetailsLayout from "../../shared/components/projects/details/ProjectDetailsLayout";
import ProjectDetailsResourcePlaceholder from "../../shared/components/projects/details/ProjectDetailsResourcePlaceholder";
import { useProjectDetailsAdapter } from "../../shared/components/projects/details/ProjectDetailsView";
import { normalizeListResponse } from "../../shared/components/projects/details/projectDetailsUtils";
import TenantAssignEdgeConfigModal from "./projectComps/TenantAssignEdgeConfigModal";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import Subnets from "./infraComps/subnet";
import IGWs from "./infraComps/igws";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/eni";
import EIPs from "./infraComps/elasticIP";
import ToastUtils from "../../utils/toastUtil";
import ProvisioningFullScreen from "../../shared/components/provisioning/ProvisioningFullScreen";
import api from "../../index/tenant/tenantApi";
import { useFetchTenantInstances } from "../../hooks/tenantHooks/instancesHook";
import {
  useFetchKeyPairs,
  useSyncKeyPairs,
  useDeleteKeyPair,
} from "../../hooks/tenantHooks/keyPairsHook";
import type { KeyPairHooks } from "../../shared/components/infrastructure/containers/KeyPairsContainer";
import logger from "../../utils/logger";

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
  provider: string;
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
    projectId as any
  );
  const project = (projectResponse?.data || projectResponse?.project || {}) as Project;

  const {
    data: statusData,
    isFetching: isStatusFetching,
    refetch: refetchStatus,
  } = useTenantProjectStatus(projectId as any);
  const setupMutation = useSetupInfrastructure();

  const { data: infraStatusData, refetch: refetchInfraStatus } =
    useTenantProjectInfrastructureStatus(projectId) as {
      data: InfraStatusData | undefined;
      refetch: () => void;
    };
  const { data: edgeConfig } = useFetchTenantProjectEdgeConfig(projectId as any, project?.region);
  const edgePayload = (edgeConfig as any)?.data ?? edgeConfig;
  const edgeNetworkId = edgePayload?.edge_network_id;
  const { data: ipPools } = useFetchTenantIpPools(
    projectId as any,
    project?.region,
    edgeNetworkId,
    {
      enabled: Boolean(projectId && project?.region && edgeNetworkId),
    }
  );
  const { data: networkStatusData, refetch: refetchNetworkStatus } = useTenantProjectNetworkStatus(
    projectId as any,
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
      const res = await api(method.toUpperCase() as any, endpoint, payload || {});
      ToastUtils.success(`${label} completed successfully!`);
      await Promise.all([refetchStatus(), refetchProject()]);
      return res;
    } catch (error: any) {
      logger.error(`Action error [${label}]:`, error);
      ToastUtils.error(error?.message || `Failed to execute ${label}`);
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
    } catch (error: any) {
      logger.error("Failed to sync resources:", error);
      ToastUtils.error(error?.message || "Failed to sync resources.");
    } finally {
      setIsSyncingResources(false);
    }
  };

  const handleEnableInternet = async () => {
    if (!projectId) return;
    try {
      const result = await enableInternet(projectId);
      const alreadyEnabled = result?.already_enabled || (result as any)?.data?.already_enabled;
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
    } catch (error: any) {
      logger.error("Enable internet error:", error);
      ToastUtils.error(error?.message || "Failed to enable internet access");
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
            actionRequest={null}
            onActionHandled={() => {}}
            onStatsUpdate={() => {}}
          />
        );
      case "routes":
        return (
          <RouteTables
            projectId={projectId}
            region={project?.region}
            actionRequest={null}
            onActionHandled={() => {}}
            onStatsUpdate={() => {}}
          />
        );
      case "sgs":
        return <SecurityGroup projectId={projectId} region={project?.region} />;
      case "igw":
        return (
          <IGWs
            projectId={projectId}
            region={project?.region}
            actionRequest={null}
            onActionHandled={() => {}}
            onStatsUpdate={() => {}}
          />
        );
      case "enis":
        return (
          <ENIs
            projectId={projectId}
            region={project?.region}
            actionRequest={null}
            onActionHandled={() => {}}
            onStatsUpdate={() => {}}
          />
        );
      case "eips":
        return (
          <EIPs
            projectId={projectId}
            region={project?.region}
            actionRequest={null}
            onActionHandled={() => {}}
            onStatsUpdate={() => {}}
          />
        );
      case "nat":
        return renderPlaceholder("NAT Gateways", "Outbound access for private subnets", Zap);
      case "peering":
        return renderPlaceholder("VPC Peering", "Private connectivity across VPCs", GitMerge);
      case "lbs":
        return renderPlaceholder("Load Balancers", "Distribute traffic across instances", Layers);
      case "acls":
        return renderPlaceholder("Network ACLs", "Subnet-level stateless filters", Lock);
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
    useList: ((projectIdValue: string, regionValue: string | undefined, options: any) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const query = useFetchKeyPairs(projectIdValue, regionValue, options);
      return {
        data: Array.isArray(query.data) ? query.data : [],
        isFetching: query.isFetching ?? false,
        refetch: query.refetch,
      };
    }) as any,
    useSync: useSyncKeyPairs,
    useDelete: useDeleteKeyPair,
  };

  const projectDetails = useProjectDetailsAdapter({
    project: project as any,
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
        label: action?.label as any,
      }),
    computeTab: {
      hierarchy: "tenant",
      useInstances: useTenantInstances as any,
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
  });

  if (projectDetails.shouldShowProvisioning && !forceHideProvisioning) {
    return (
      <ProvisioningFullScreen
        project={project}
        setupSteps={projectDetails.setupSteps as any}
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
            project={project as any}
            setupMutation={setupMutation as any}
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
        projectId={projectId as any}
        region={project?.region}
      />
    </TenantPageShell>
  );
};

export default ProjectDetails;

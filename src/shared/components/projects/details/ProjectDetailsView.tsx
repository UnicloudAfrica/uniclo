import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Database,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Network,
  Settings,
  Shield,
  Users,
  Workflow,
} from "lucide-react";
import ProjectDetailsLayout from "./ProjectDetailsLayout";
import ProjectDetailsOverview from "./ProjectDetailsOverview";
import ProjectArchitectureTab from "./ProjectArchitectureTab";
import ProjectComputeTab from "./ProjectComputeTab";
import { ResourceSplitLayout } from "./ResourceLayout";
import type { ResourceNavItem } from "./ResourceLayout";
import ProjectDetailsTeamAccess, { ProjectTeamMember } from "./ProjectDetailsTeamAccess";
import { deriveIpPoolStats, getProjectRamLabel, type IpPool } from "./resourceStats";
import { buildNetworkingItems } from "./projectDetailsNetworking";
import { buildProjectResourceCounts, type InfraStatusData } from "./projectDetailsResourceCounts";
import { useProjectBroadcasting } from "@/hooks/useProjectBroadcasting";
import type { ProjectDetailsResourceStats, ProjectDetailsTab } from "./types";
import type {
  NetworkStatus as UnifiedNetworkStatus,
  ProjectData as UnifiedProjectData,
  ResourceCounts as UnifiedResourceCounts,
  SetupStep as UnifiedSetupStep,
} from "./ProjectUnifiedView";
import type { Project as ProjectRecord } from "@/types/project";
import type { KeyPairHooks } from "../../infrastructure/containers/KeyPairsContainer";
import { DEFAULT_PRESETS } from "../../network/NetworkPresetSelector";

// Local helper: capability check from a vendor-neutral provider_features map.
// Missing flags fail open (treated as supported).
const supports = (
  providerFeatures: Record<string, boolean> | undefined,
  feature: string
): boolean => providerFeatures?.[feature] ?? true;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type ProjectUser = ProjectTeamMember;

export interface InstanceSummary {
  id?: string | number;
  name?: string;
  status?: string;
  identifier?: string;
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

// InfraStatusData imported from projectDetailsResourceCounts

type ProvisioningProgressItem = {
  id?: string;
  label?: string;
  status?: string;
  updated_at?: string;
};

export type ComputeSubView = "instances" | "keypairs";

interface ComputeTabConfig {
  hierarchy: "admin" | "tenant" | "client";
  useInstances: (
    params: { project_id?: string },
    options?: { enabled?: boolean }
  ) => {
    data?: { data: InstanceSummary[] } | InstanceSummary[];
    isFetching?: boolean;
    refetch?: () => void;
  };
  keyPairHooks: KeyPairHooks;
  onProvisionInstance?: () => void;
  projectId?: string;
  region?: string;
}

interface NetworkingTabConfig {
  navTitle?: string;
  items?: ResourceNavItem[];
  renderContent: (resourceId: string) => React.ReactNode;
}

interface TeamTabConfig {
  members?: ProjectUser[];
  disableManageButton?: boolean;
  manageLabel?: string;
}

export interface ProjectDetailsAdapterConfig {
  project?: Partial<ProjectRecord> &
    Partial<UnifiedProjectData> & {
      instances?: InstanceSummary[];
      users?: ProjectUser[];
      summary?: SummaryItem[];
      provisioning_progress?: ProvisioningProgressItem[];
      provisioning_status?: string;
    };
  projectId?: string | number;
  projectIdentifier?: string;
  projectInstances?: InstanceSummary[];
  users?: ProjectUser[];
  projectStatus?: unknown;
  infraStatusData?: InfraStatusData | null;
  networkStatusData?: unknown;
  edgeConfig?: unknown;
  ipPools?: unknown;
  setupSteps?: UnifiedSetupStep[];
  requiredActions?: SummaryItem[];
  setupProgressPercent?: number;
  resourceCounts?: UnifiedResourceCounts;
  edgeNetworkConnected?: boolean;
  edgeNetworkName?: string;
  canCreateInstances?: boolean;
  isStatusFetching?: boolean;
  isSyncing?: boolean;
  isEnablingInternet?: boolean;

  onAddInstance?: () => void;
  onEnableInternet?: () => Promise<void>;
  onSyncResources?: () => void | Promise<void>;
  onRequiredAction?: (action: SummaryAction, item?: SummaryItem) => void;
  onManageMembers?: () => void;
  onViewUsers?: () => void;

  computeTab?: ComputeTabConfig;
  renderComputeTab?: (ctx: {
    activeSubView: ComputeSubView;
    setActiveSubView: (view: ComputeSubView) => void;
  }) => React.ReactNode;
  networkingTab?: NetworkingTabConfig;
  renderNetworkingTab?: (ctx: {
    activeResource: string;
    setActiveResource: (id: string) => void;
    items: ResourceNavItem[];
  }) => React.ReactNode;
  teamTab?: TeamTabConfig;
  renderTeamTab?: () => React.ReactNode;
  renderStorageTab?: () => React.ReactNode;
  renderImagesTab?: () => React.ReactNode;
  renderDnsTab?: () => React.ReactNode;
  renderAutoScalingTab?: () => React.ReactNode;
  renderLimitsTab?: () => React.ReactNode;
  renderSettingsTab?: () => React.ReactNode;

  showMemberManagement?: boolean;
  showSyncButton?: boolean;
  showHero?: boolean;
}

export interface ProjectDetailsAdapterResult {
  projectForLayout: ProjectRecord;
  tabs: ProjectDetailsTab[];
  resourceHeaderStats: ProjectDetailsResourceStats;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  activeNetworkingResource: string;
  setActiveNetworkingResource: (id: string) => void;
  activeComputeSubView: ComputeSubView;
  setActiveComputeSubView: (view: ComputeSubView) => void;
  setupSteps: UnifiedSetupStep[];
  requiredActions: SummaryItem[];
  networkData?: UnifiedNetworkStatus;
  instanceStats: { total: number; running: number; provisioning: number; paymentPending: number };
  resourceCounts: UnifiedResourceCounts;
  ipPoolStats: { used: number; total: number };
  projectIdentifier: string;
  projectIdValue: string | number;
  shouldShowProvisioning: boolean;
  shouldShowSetupWizard: boolean;
}

const normalizeSummaryItems = (value: unknown): SummaryItem[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SummaryItem => {
    if (!isRecord(item)) return false;
    const action = item["action"];
    return !action || isRecord(action);
  });
};

const normalizeProjectStatus = (status: unknown): UnknownRecord | undefined => {
  if (!isRecord(status)) return undefined;
  const projectValue = status["project"];
  if (isRecord(projectValue)) return projectValue;
  const dataValue = status["data"];
  if (isRecord(dataValue) && isRecord(dataValue["project"])) {
    return dataValue["project"];
  }
  return status;
};

const normalizeNetworkStatus = (status: unknown): UnifiedNetworkStatus | undefined => {
  if (!status) return undefined;
  if (!isRecord(status)) return status as UnifiedNetworkStatus;
  const networkValue = status["network"];
  if (isRecord(networkValue)) return networkValue as UnifiedNetworkStatus;
  const dataValue = status["data"];
  if (isRecord(dataValue) && isRecord(dataValue["network"])) {
    return dataValue["network"] as UnifiedNetworkStatus;
  }
  return status as UnifiedNetworkStatus;
};

const normalizeProvisioningSteps = (value: unknown): ProvisioningProgressItem[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ProvisioningProgressItem => isRecord(item));
};

const normalizeSetupStatus = (status?: string): UnifiedSetupStep["status"] => {
  if (
    status === "completed" ||
    status === "pending" ||
    status === "not_started" ||
    status === "failed"
  ) {
    return status;
  }
  if (status === "in_progress") return "pending";
  return "pending";
};

export const useProjectDetailsAdapter = (
  config: ProjectDetailsAdapterConfig
): ProjectDetailsAdapterResult => {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeNetworkingResource, setActiveNetworkingResource] = useState("vpcs");
  const [activeComputeSubView, setActiveComputeSubView] = useState<ComputeSubView>("instances");
  const [isInProvisioningMode, setIsInProvisioningMode] = useState(false);

  const project = config.project ?? {};
  const projectIdValue = project?.id ?? config.projectId ?? project?.identifier ?? "";
  const projectIdentifier =
    config.projectIdentifier ||
    project?.identifier ||
    (typeof projectIdValue === "string" ? projectIdValue : String(projectIdValue ?? ""));

  // Real-time updates via broadcasting
  useProjectBroadcasting(project?.id || projectIdValue);

  const projectName = project?.name || "Project";
  const projectStatusValue = project?.status || "unknown";
  const projectTenantId = typeof project?.tenant_id === "number" ? project.tenant_id : 0;
  const projectCreatedAt = project?.created_at || "";
  const projectUpdatedAt = project?.updated_at || projectCreatedAt;

  const projectForLayout: ProjectRecord = {
    id: projectIdValue,
    identifier: projectIdentifier,
    name: projectName,
    status: projectStatusValue,
    tenant_id: projectTenantId,
    created_at: projectCreatedAt,
    updated_at: projectUpdatedAt,
    ...(project?.region !== undefined ? { region: project.region } : {}),
    ...(project?.availability_zone !== undefined
      ? { availability_zone: project.availability_zone }
      : {}),
    ...(project?.provider_id !== undefined ? { provider_id: project.provider_id } : {}),
    ...(project?.provider_features !== undefined
      ? { provider_features: project.provider_features }
      : {}),
    ...(project?.description !== undefined ? { description: project.description } : {}),
    ...(project?.resources_count !== undefined ? { resources_count: project.resources_count } : {}),
  };

  const projectProviderFeatures = project?.provider_features as
    | Record<string, boolean>
    | undefined;

  const unifiedProject: UnifiedProjectData = {
    ...projectForLayout,
    ...(project?.region_name !== undefined ? { region_name: project.region_name } : {}),
    ...(project?.mode !== undefined ? { mode: project.mode } : {}),
    ...(project?.vpc_enabled_at !== undefined ? { vpc_enabled_at: project.vpc_enabled_at } : {}),
  };

  const projectStatus = useMemo(
    () => normalizeProjectStatus(config.projectStatus),
    [config.projectStatus]
  );

  const summaryItems = useMemo(() => {
    if (Array.isArray(config.requiredActions)) return config.requiredActions;
    const statusSummary =
      projectStatus?.["summary"] ??
      (isRecord(projectStatus?.["data"])
        ? (projectStatus?.["data"] as UnknownRecord)["summary"]
        : undefined);
    const projectSummary = project?.summary;
    return normalizeSummaryItems(statusSummary ?? projectSummary);
  }, [config.requiredActions, projectStatus, project?.summary]);

  const requiredActions = useMemo(
    () => summaryItems.filter((item) => !item?.completed && !item?.complete && item?.action),
    [summaryItems]
  );

  const projectInstances = useMemo<InstanceSummary[]>(() => {
    if (Array.isArray(config.projectInstances)) return config.projectInstances;
    if (Array.isArray(config.project?.instances)) return config.project.instances;
    if (Array.isArray(project?.instances)) return project.instances as InstanceSummary[];
    return [];
  }, [config.projectInstances, config.project?.instances, project?.instances]);

  const networkData = useMemo(
    () => normalizeNetworkStatus(config.networkStatusData),
    [config.networkStatusData]
  );

  const instanceStats = useMemo(() => {
    const base = { total: projectInstances.length, running: 0, provisioning: 0, paymentPending: 0 };
    projectInstances.forEach((instance) => {
      const normalized = (instance.status || "").toLowerCase();
      if (["running", "active", "ready"].includes(normalized)) base.running += 1;
      else if (
        ["pending", "processing", "provisioning", "initializing", "creating"].some((token) =>
          normalized.includes(token)
        )
      ) {
        base.provisioning += 1;
      } else if (
        ["payment_pending", "awaiting_payment", "payment_required"].some((token) =>
          normalized.includes(token)
        )
      ) {
        base.paymentPending += 1;
      }
    });
    return base;
  }, [projectInstances]);

  const resourceCounts = useMemo(() => {
    const args: Parameters<typeof buildProjectResourceCounts>[0] = {
      infraStatusData: config.infraStatusData ?? null,
    };
    if (config.resourceCounts) {
      args.fallback = config.resourceCounts;
    }
    const usersCount = config.users?.length ?? project?.users?.length;
    if (typeof usersCount === "number") {
      args.usersCount = usersCount;
    }
    return buildProjectResourceCounts(args);
  }, [config.resourceCounts, config.infraStatusData, config.users?.length, project?.users?.length]);

  const edgePayload = useMemo(() => {
    if (!config.edgeConfig) return undefined;
    if (!isRecord(config.edgeConfig)) return undefined;
    const data = (config.edgeConfig as UnknownRecord)["data"];
    return isRecord(data) ? data : (config.edgeConfig as UnknownRecord);
  }, [config.edgeConfig]);

  const edgeNetworkConnected =
    config.edgeNetworkConnected ?? Boolean(edgePayload?.["edge_network_id"]);
  const edgeNetworkName =
    config.edgeNetworkName ||
    (typeof edgePayload?.["edge_network_name"] === "string"
      ? edgePayload["edge_network_name"]
      : undefined);

  const ipPoolStats = useMemo(
    () =>
      deriveIpPoolStats({
        edgeConfig: config.edgeConfig,
        ipPools: Array.isArray(config.ipPools) ? config.ipPools : undefined,
        networkStatus: networkData as { ip_pool?: IpPool; public_ip_pool?: IpPool } | undefined,
      }),
    [config.edgeConfig, config.ipPools, networkData]
  );

  const ramLabel = useMemo(() => getProjectRamLabel(projectInstances), [projectInstances]);

  const projectStatusProvisioningProgress = projectStatus?.["provisioning_progress"];
  const setupSteps = useMemo<UnifiedSetupStep[]>(() => {
    if (Array.isArray(config.setupSteps)) return config.setupSteps;
    const statusSteps = normalizeProvisioningSteps(projectStatusProvisioningProgress);
    const projectSteps = normalizeProvisioningSteps(project?.provisioning_progress);
    const steps = statusSteps.length > 0 ? statusSteps : projectSteps;
    return steps.map((step, index) => {
      const normalizedStatus = normalizeSetupStatus(step.status);
      const label = step.label || "Step";
      const baseStep = {
        id: step.id || label.toLowerCase().replace(/\s+/g, "_") || `step_${index + 1}`,
        label,
        status: normalizedStatus,
        description: normalizedStatus === "completed" ? "Completed" : "Action in progress",
      };
      return typeof step.updated_at === "string"
        ? { ...baseStep, updated_at: step.updated_at }
        : baseStep;
    });
  }, [config.setupSteps, projectStatusProvisioningProgress, project?.provisioning_progress]);

  const allStepsComplete =
    setupSteps.length > 0 && setupSteps.every((step) => step.status === "completed");

  useEffect(() => {
    if (project?.status === "provisioning" && !isInProvisioningMode) {
      setIsInProvisioningMode(true);
    }
    if (isInProvisioningMode && (project?.status === "active" || allStepsComplete)) {
      const timer = setTimeout(() => setIsInProvisioningMode(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [project?.status, allStepsComplete, isInProvisioningMode]);

  const shouldShowProvisioning = isInProvisioningMode || project?.status === "provisioning";
  const shouldShowSetupWizard =
    project?.status === "created" || project?.provisioning_status === "created";

  const resourceHeaderStats: ProjectDetailsResourceStats = {
    vCPUs: (instanceStats.total || 0) * 2,
    ram: ramLabel,
    volumes: resourceCounts.volumes || 0,
    images: resourceCounts.images || 0,
    snapshots: resourceCounts.snapshots || 0,
    ipPoolUsed: ipPoolStats.used,
    ipPoolTotal: ipPoolStats.total,
    edgeNetworkConnected,
    edgeNetworkName,
  };

  const setupProgressPercent =
    typeof config.setupProgressPercent === "number"
      ? config.setupProgressPercent
      : (config.infraStatusData?.data?.completion_percentage ?? 0);

  const networkingItems = useMemo(
    () =>
      config.networkingTab?.items ?? buildNetworkingItems(resourceCounts, projectProviderFeatures),
    [config.networkingTab?.items, resourceCounts, projectProviderFeatures]
  );

  const canCreateInstances = config.canCreateInstances ?? project?.status === "active";

  const onAddInstance =
    config.onAddInstance ??
    (() => {
      setActiveComputeSubView("instances");
      setActiveTab("compute");
    });
  const onEnableInternet = config.onEnableInternet ?? (async () => {});
  const onSyncResources = config.onSyncResources ?? (() => {});
  const onManageMembers = config.onManageMembers ?? (() => setActiveTab("team"));
  const onViewUsers = config.onViewUsers ?? (() => setActiveTab("team"));

  const onViewResource = (resourceId: string) => {
    setActiveNetworkingResource(resourceId);
    setActiveTab("networking");
  };

  // Derive the network blueprint display name from project metadata
  const networkBlueprintName = useMemo(() => {
    const presetId = (
      isRecord(project?.metadata)
        ? (project.metadata as UnknownRecord)["network_preset"]
        : undefined
    ) as string | undefined;
    if (!presetId) return undefined;
    const matched = DEFAULT_PRESETS.find((p) => p.id === presetId);
    if (matched) {
      // Build a readable label, e.g. "Standard (Public subnet, Internet Gateway, SSH/HTTP/HTTPS ports)"
      const featureSummary =
        matched.features.length > 0 ? ` (${matched.features.join(" + ")})` : "";
      return `${matched.name}${featureSummary}`;
    }
    // Fallback: capitalize the raw preset id
    return presetId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }, [project?.metadata]);

  const unifiedViewProps = {
    project: unifiedProject,
    instanceStats: {
      total: instanceStats.total,
      running: instanceStats.running,
      stopped: instanceStats.total - instanceStats.running - instanceStats.provisioning,
      provisioning: instanceStats.provisioning,
    },
    resourceCounts,
    canCreateInstances,
    setupSteps,
    setupProgressPercent,
    edgeNetworkConnected,
    ...(networkBlueprintName !== undefined ? { networkBlueprintName } : {}),
    ...(networkData !== undefined ? { networkStatus: networkData } : {}),
    ...(edgeNetworkName !== undefined ? { edgeNetworkName } : {}),
    instances: projectInstances,
    onAddInstance,
    onEnableInternet,
    onManageMembers,
    onSyncResources,
    onViewNetworkDetails: () => onViewResource("vpcs"),
    onViewAllResources: () => onViewResource("vpcs"),
    onViewRouteTables: () => onViewResource("routes"),
    onViewElasticIps: () => onViewResource("eips"),
    onViewNetworkInterfaces: () => onViewResource("enis"),
    onViewVpcs: () => onViewResource("vpcs"),
    onViewSubnets: () => onViewResource("subnets"),
    onViewSecurityGroups: () => onViewResource("sgs"),
    onViewInternetGateways: () => onViewResource("igw"),
    onViewNatGateways: () => onViewResource("nat"),
    onViewNetworkAcls: () => onViewResource("acls"),
    onViewVpcPeering: () => onViewResource("peering"),
    onViewLoadBalancers: () => onViewResource("lbs"),
    onViewUsers,
    onViewCompute: () => setActiveTab("compute"),
    isEnablingInternet: config.isEnablingInternet ?? false,
    isSyncing: config.isSyncing ?? false,
    isProvisioning: config.isStatusFetching ?? false,
    showMemberManagement: config.showMemberManagement ?? true,
    showSyncButton: config.showSyncButton ?? true,
    showHero: config.showHero ?? true,
  };

  const computeTabRegion = config.computeTab?.region ?? project?.region;
  const computeContent =
    config.renderComputeTab?.({
      activeSubView: activeComputeSubView,
      setActiveSubView: setActiveComputeSubView,
    }) ??
    (config.computeTab ? (
      <ProjectComputeTab
        projectId={config.computeTab.projectId ?? projectIdentifier}
        hierarchy={config.computeTab.hierarchy}
        useInstances={config.computeTab.useInstances}
        keyPairHooks={config.computeTab.keyPairHooks}
        initialSubView={activeComputeSubView}
        onSubViewChange={setActiveComputeSubView}
        {...(computeTabRegion !== undefined ? { region: computeTabRegion } : {})}
        {...(config.computeTab.onProvisionInstance
          ? { onProvisionInstance: config.computeTab.onProvisionInstance }
          : {})}
      />
    ) : null);

  const networkingContent =
    config.renderNetworkingTab?.({
      activeResource: activeNetworkingResource,
      setActiveResource: setActiveNetworkingResource,
      items: networkingItems,
    }) ??
    (config.networkingTab ? (
      <ResourceSplitLayout
        navTitle={config.networkingTab.navTitle || "Networking Resources"}
        items={networkingItems}
        activeId={activeNetworkingResource}
        onSelect={setActiveNetworkingResource}
      >
        {config.networkingTab.renderContent(activeNetworkingResource)}
      </ResourceSplitLayout>
    ) : null);

  const teamContent =
    config.renderTeamTab?.() ??
    (config.teamTab ? (
      <ProjectDetailsTeamAccess {...config.teamTab} />
    ) : (
      <ProjectDetailsTeamAccess members={config.users ?? project?.users ?? []} />
    ));

  const tabs: ProjectDetailsTab[] = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      tooltip: "Project health, resource summary, and quick actions",
      content: (
        <ProjectDetailsOverview
          requiredActions={requiredActions}
          onRequiredAction={config.onRequiredAction}
          unifiedViewProps={unifiedViewProps}
          onNavigateToTab={setActiveTab}
        />
      ),
    },
    {
      id: "architecture",
      label: "Architecture",
      icon: Workflow,
      tooltip: "Visual map of every resource in this project and how they connect",
      content: <ProjectArchitectureTab unifiedViewProps={unifiedViewProps} />,
    },
  ];

  if (computeContent) {
    tabs.push({
      id: "compute",
      label: "Compute",
      icon: Activity,
      tooltip: "Launch and manage virtual servers (instances) and SSH key pairs",
      content: computeContent,
    });
  }
  if (networkingContent) {
    tabs.push({
      id: "networking",
      label: "Networking",
      icon: Network,
      tooltip: "Manage VPCs, subnets, security groups, and other network resources",
      content: networkingContent,
      hidden: !supports(projectProviderFeatures, "vpcs"),
    });
  }
  const storageContent = config.renderStorageTab?.() ?? undefined;
  const imagesContent = config.renderImagesTab?.() ?? undefined;
  const dnsContent = config.renderDnsTab?.() ?? undefined;
  const autoScalingContent = config.renderAutoScalingTab?.() ?? undefined;
  const limitsContent = config.renderLimitsTab?.() ?? undefined;
  const settingsContent = config.renderSettingsTab?.() ?? undefined;

  tabs.push(
    {
      id: "storage",
      label: "Storage",
      icon: Database,
      tooltip: "Create and manage virtual hard drives (volumes) and snapshots",
      content: storageContent,
    },
    {
      id: "images",
      label: "Images",
      icon: ImageIcon,
      tooltip: "Browse available operating system templates for new servers",
      content: imagesContent,
    },
    {
      id: "dns",
      label: "DNS",
      icon: Globe,
      tooltip: "Map domain names (like myapp.com) to your server IP addresses",
      content: dnsContent,
      hidden: !supports(projectProviderFeatures, "dns"),
    },
    {
      id: "autoscaling",
      label: "Auto-Scaling",
      icon: Layers,
      tooltip: "Automatically add or remove servers based on demand",
      content: autoScalingContent,
      hidden: !supports(projectProviderFeatures, "autoscaling"),
    },
    {
      id: "team",
      label: "Identity & Access",
      icon: Users,
      tooltip: "Manage project members, roles, and access policies",
      content: teamContent,
    },
    {
      id: "limits",
      label: "Limits",
      icon: Shield,
      tooltip: "View resource usage vs. your quota limits",
      content: limitsContent,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      tooltip: "Project name, description, provider details, and danger zone",
      content: settingsContent,
    }
  );

  return {
    projectForLayout,
    tabs,
    resourceHeaderStats,
    activeTab,
    setActiveTab,
    activeNetworkingResource,
    setActiveNetworkingResource,
    activeComputeSubView,
    setActiveComputeSubView,
    setupSteps,
    requiredActions,
    ...(networkData !== undefined ? { networkData } : {}),
    instanceStats,
    resourceCounts,
    ipPoolStats,
    projectIdentifier,
    projectIdValue,
    shouldShowProvisioning,
    shouldShowSetupWizard,
  };
};

export type ProjectDetailsViewProps = ProjectDetailsAdapterConfig;

const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = (props) => {
  const adapter = useProjectDetailsAdapter(props);
  return (
    <ProjectDetailsLayout
      project={adapter.projectForLayout}
      resourceStats={adapter.resourceHeaderStats}
      tabs={adapter.tabs}
      activeTab={adapter.activeTab}
      onTabChange={adapter.setActiveTab}
    />
  );
};

export default ProjectDetailsView;

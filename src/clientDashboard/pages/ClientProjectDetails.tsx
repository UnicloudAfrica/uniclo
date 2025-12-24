// @ts-nocheck
import React, { useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  CheckCircle,
  Clock,
  Layers,
  MapPin,
  Server,
  Shield,
  Wifi,
  Route,
  User,
  LucideIcon,
} from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import { ModernButton } from "../../shared/components/ui";
import { useFetchClientProjectById } from "../../hooks/clientHooks/projectHooks";
import { useClientProjectInfrastructureStatus } from "../../hooks/clientHooks/projectInfrastructureHooks";
import { ModernCard } from "../../shared/components/ui";

// Shared Components
import ProjectDetailsHero from "../../shared/components/projects/details/ProjectDetailsHero";
import ProjectInstancesOverview from "../../shared/components/projects/details/ProjectInstancesOverview";
import ProjectInfrastructureJourney from "../../shared/components/projects/details/ProjectInfrastructureJourney";
import ProjectQuickStatus from "../../shared/components/projects/details/ProjectQuickStatus";

// Infrastructure Components
import VPCs from "./infraComps/Vpcs";
import Networks from "./infraComps/Networks";
import SecurityGroup from "./infraComps/SecurityGroup";
import Subnet from "./infraComps/Subnet";
import KeyPairs from "./infraComps/KeyPairs";
import RouteTables from "./infraComps/RouteTables";
import InternetGateways from "./infraComps/InternetGateways";
import ENIs from "./infraComps/ENIs";
import ElasticIPs from "./infraComps/ElasticIPs";
import SetupProgressCard from "../../shared/components/projects/details/SetupProgressCard";
import ToastUtils from "../../utils/toastUtil";
import api from "../../index/client/api";
import { useClientProjectStatus } from "../../hooks/clientHooks/projectHooks";

interface StatusVariant {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

interface ProjectUser {
  id: string | number;
  name?: string;
  email: string;
  role?: string;
}

interface Instance {
  id: string | number;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

interface SummaryItem {
  title?: string;
  key?: string;
  completed?: boolean;
  complete?: boolean;
}

interface Project {
  identifier?: string;
  name?: string;
  status?: string;
  type?: string;
  region?: string;
  provider?: string;
  created_at?: string;
  vpc_enabled?: boolean;
  users?: ProjectUser[];
  instances?: Instance[];
  summary?: SummaryItem[];
  [key: string]: any;
}

interface InfraComponent {
  status?: string;
  count?: number;
}

interface InfraStatusData {
  data?: {
    components?: Record<string, InfraComponent>;
    counts?: Record<string, number>;
  };
}

interface InfrastructureSection {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface MetadataItem {
  label: string;
  value: string;
}

interface SummaryMetric {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
}

interface QuickStatusItem {
  label: string;
  active: boolean;
  tone: string;
}

const decodeId = (encodedId: string): string | null => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch {
    return null;
  }
};

const formatDate = (value: string | Date | undefined): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const toTitleCase = (input: string = ""): string =>
  input
    .toString()
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getProjectStatusVariant = (status: string = ""): StatusVariant => {
  const normalized = status.toString().toLowerCase();
  switch (normalized) {
    case "active":
      return {
        label: "Active",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "pending":
    case "processing":
    case "provisioning":
      return {
        label:
          normalized === "pending"
            ? "Pending"
            : normalized === "processing"
              ? "Processing"
              : "Provisioning",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "inactive":
      return {
        label: "Inactive",
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
      };
    case "failed":
    case "error":
      return {
        label: normalized === "failed" ? "Failed" : "Error",
        bg: "bg-rose-50",
        text: "text-rose-700",
        dot: "bg-rose-500",
      };
    default:
      return {
        label: toTitleCase(normalized || "Unknown"),
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
      };
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

  const [activeSection, setActiveSection] = useState("vpcs");
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    data: projectResponse,
    isLoading,
    isError,
    refetch: refetchProject,
  } = useFetchClientProjectById(projectId, { enabled: Boolean(projectId) }) as {
    data: Project | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };
  const project: Project = projectResponse || {};

  const {
    data: statusData,
    isFetching: isStatusFetching,
    refetch: refetchStatus,
  } = useClientProjectStatus(projectId);
  const projectStatus = statusData?.project || statusData?.data?.project || statusData;

  const handleGenericAction = async ({ method, endpoint, label, payload = {} }) => {
    try {
      ToastUtils.info(`Executing ${label}...`);
      const res = await api(method.toUpperCase(), endpoint, payload);
      ToastUtils.success(`${label} completed successfully!`);
      await Promise.all([refetchStatus(), refetchProject()]);
      return res;
    } catch (error: any) {
      console.error(`Action error [${label}]:`, error);
      ToastUtils.error(error?.message || `Failed to execute ${label}`);
      throw error;
    }
  };

  const { data: infraStatusData } = useClientProjectInfrastructureStatus(projectId, {
    enabled: Boolean(projectId),
  }) as {
    data: InfraStatusData | undefined;
  };

  const handleSectionClick = (key: string) => {
    setActiveSection(key);
  };

  const summary = project?.summary ?? [];

  const normalizeSummaryKey = (value: string = ""): string =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const summaryStatusMap = useMemo(() => {
    const map = new Map<string, SummaryItem>();
    summary.forEach((item: any) => {
      if (item?.title) {
        map.set(normalizeSummaryKey(item.title), item);
      }
      if (item?.key) {
        map.set(normalizeSummaryKey(item.key), item);
      }
    });
    return map;
  }, [summary]);

  const summaryCompleted = (...labels: string[]): boolean | undefined => {
    for (const label of labels) {
      const normalized = normalizeSummaryKey(label);
      if (summaryStatusMap.has(normalized)) {
        const item = summaryStatusMap.get(normalized);
        return item?.completed ?? item?.complete ?? false;
      }
    }
    return undefined;
  };

  const infrastructureSections: InfrastructureSection[] = [
    { key: "user-provisioning", label: "Team Access", icon: <User size={16} /> },
    { key: "vpcs", label: "Virtual Private Cloud", icon: <Server size={16} /> },
    { key: "networks", label: "Networks", icon: <Wifi size={16} /> },
    { key: "subnets", label: "Subnets", icon: <Layers size={16} /> },
    { key: "igws", label: "Internet Gateways", icon: <MapPin size={16} /> },
    { key: "route-tables", label: "Route Tables", icon: <Route size={16} /> },
    { key: "security-groups", label: "Security Groups", icon: <Shield size={16} /> },
    { key: "keypairs", label: "Key Pairs", icon: <Activity size={16} /> },
    { key: "edge", label: "Edge Network", icon: <Wifi size={16} /> },
    { key: "enis", label: "Network Interfaces", icon: <Server size={16} /> },
    { key: "eips", label: "Elastic IPs", icon: <MapPin size={16} /> },
  ];

  const getStatusForSection = (sectionKey: string): boolean => {
    const checkInfraStatus = (key: string): boolean | null => {
      const components = infraStatusData?.data?.components;
      if (!components) return null;
      const comp = components[key];
      if (!comp) return false;
      return (
        comp.status === "active" ||
        comp.status === "completed" ||
        (comp.count !== undefined && comp.count > 0)
      );
    };

    const resourceCounts = infraStatusData?.data?.counts || {};

    switch (sectionKey) {
      case "setup":
        return true;
      case "user-provisioning":
        return (project?.users?.length ?? 0) > 0;
      case "vpcs": {
        if (infraStatusData?.data?.components?.vpc) {
          return (infraStatusData.data.components.vpc.count ?? 0) > 0;
        }
        const summaryFlag = summaryCompleted(
          "vpc",
          "vpcs",
          "virtualprivatecloud",
          "vpcprovisioned"
        );
        if (summaryFlag === true) return true;
        if (project?.vpc_enabled) return true;
        return (resourceCounts.vpcs ?? 0) > 0;
      }
      case "networks": {
        const infraStatus = checkInfraStatus("networks");
        if (infraStatus !== null) return infraStatus;
        if ((resourceCounts.subnets ?? 0) > 0) return true;
        const summaryFlag = summaryCompleted("network", "networks", "subnet", "subnets");
        if (summaryFlag === true) return true;
        return summaryFlag ?? false;
      }
      case "subnets": {
        const infraStatus = checkInfraStatus("subnets");
        if (infraStatus !== null) return infraStatus;
        if ((resourceCounts.subnets ?? 0) > 0) return true;
        const summaryFlag = summaryCompleted("subnet", "subnets");
        if (summaryFlag === true) return true;
        return summaryFlag ?? false;
      }
      case "security-groups": {
        const infraStatus = checkInfraStatus("security_groups");
        if (infraStatus !== null) return infraStatus;
        if ((resourceCounts.security_groups ?? 0) > 0) return true;
        const summaryFlag = summaryCompleted("securitygroup", "securitygroups");
        if (summaryFlag === true) return true;
        return summaryFlag ?? false;
      }
      case "keypairs": {
        const infraStatus = checkInfraStatus("keypairs");
        if (infraStatus !== null) return infraStatus;
        if ((resourceCounts.keypairs ?? 0) > 0) return true;
        const summaryFlag = summaryCompleted("keypair", "keypairs", "createkeypair");
        if (summaryFlag === true) return true;
        return summaryFlag ?? false;
      }
      case "igws": {
        const infraStatus = checkInfraStatus("internet_gateways");
        if (infraStatus !== null) return infraStatus;
        return (resourceCounts.internet_gateways ?? 0) > 0;
      }
      case "route-tables": {
        const infraStatus = checkInfraStatus("route_tables");
        if (infraStatus !== null) return infraStatus;
        return (resourceCounts.route_tables ?? 0) > 0;
      }
      case "edge": {
        const infraStatus = checkInfraStatus("edge_networks");
        if (infraStatus !== null) return infraStatus;
        const summaryFlag = summaryCompleted("edge", "edge network", "edge_network");
        if (summaryFlag === true) return true;
        return false;
      }
      case "enis": {
        const infraStatus = checkInfraStatus("network_interfaces");
        if (infraStatus !== null) return infraStatus;
        return (resourceCounts.network_interfaces ?? 0) > 0;
      }
      case "eips": {
        const infraStatus = checkInfraStatus("elastic_ips");
        if (infraStatus !== null) return infraStatus;
        return (resourceCounts.elastic_ips ?? 0) > 0;
      }
      default:
        return false;
    }
  };

  const renderSectionContent = (): React.ReactNode => {
    switch (activeSection) {
      case "user-provisioning":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Team Access</h3>
              <ModernButton size="sm" variant="outline" isDisabled>
                Manage Team
              </ModernButton>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {project?.users && project.users.length > 0 ? (
                    project.users.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role || "Member"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        No team members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "vpcs":
        return <VPCs {...({ projectId, region: project?.region } as any)} />;
      case "networks":
        return (
          <Networks {...({ projectId, region: project?.region, onStatsUpdate: () => {} } as any)} />
        );
      case "keypairs":
        return (
          <KeyPairs {...({ projectId, region: project?.region, onStatsUpdate: () => {} } as any)} />
        );
      case "security-groups":
        return (
          <SecurityGroup
            {...({ projectId, region: project?.region, onStatsUpdate: () => {} } as any)}
          />
        );
      case "edge":
        return (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
            Edge Network configuration is managed by your administrator.
          </div>
        );
      case "subnets":
        return <Subnet {...({ projectId, region: project?.region } as any)} />;
      case "igws":
        return <InternetGateways {...({ projectId, region: project?.region } as any)} />;
      case "route-tables":
        return <RouteTables {...({ projectId, region: project?.region } as any)} />;
      case "enis":
        return <ENIs {...({ projectId, region: project?.region } as any)} />;
      case "eips":
        return <ElasticIPs {...({ projectId, region: project?.region } as any)} />;
      default:
        return null;
    }
  };

  // Instance Stats Calculation
  const projectInstances = useMemo<Instance[]>(() => {
    return Array.isArray(project?.instances) ? project.instances : [];
  }, [project]);

  const instanceStats = useMemo(() => {
    const base = { total: projectInstances.length, running: 0, provisioning: 0, paymentPending: 0 };
    projectInstances.forEach((instance: any) => {
      const normalized = (instance.status || "").toLowerCase();
      if (["running", "active", "ready"].includes(normalized)) base.running += 1;
      else if (
        ["pending", "processing", "provisioning", "initializing", "creating"].some((token) =>
          normalized.includes(token)
        )
      )
        base.provisioning += 1;
      else if (
        ["payment_pending", "awaiting_payment", "payment_required"].some((token) =>
          normalized.includes(token)
        )
      )
        base.paymentPending += 1;
    });
    return base;
  }, [projectInstances]);

  const recentInstances = useMemo<Instance[]>(() => {
    return [...projectInstances]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [projectInstances]);

  const projectStatusVariant = getProjectStatusVariant(project?.status);
  const healthPercent = 0;
  const infrastructureStepLabel = "0/0 infra steps";

  const metadataItems = useMemo<MetadataItem[]>(
    () => [
      {
        label: "Project Identifier",
        value: project?.identifier || "—",
      },
      {
        label: "Project Type",
        value: toTitleCase(project?.type || "Unknown"),
      },
      {
        label: "Created",
        value: formatDate(project?.created_at),
      },
      {
        label: "Instances",
        value: `${projectInstances.length} tracked`,
      },
    ],
    [project, projectInstances.length]
  );

  const summaryMetrics = useMemo<SummaryMetric[]>(
    () => [
      {
        label: "Project Type",
        value: toTitleCase(project?.type),
        helper: "Deployment model for workloads",
        icon: Layers,
      },
      {
        label: "Region",
        value: (project?.region || "Region").toUpperCase(),
        helper: "Deployment location",
        icon: MapPin,
      },
      {
        label: "Instances",
        value: projectInstances.length,
        helper: "Compute resources attached",
        icon: Server,
      },
      {
        label: "Created",
        value: formatDate(project?.created_at),
        helper: "Project inception date",
        icon: Clock,
      },
    ],
    [project, projectInstances.length]
  );

  const quickStatusItems: QuickStatusItem[] = [
    {
      label: "Provisioning ready",
      active: project?.status === "active",
      tone: project?.status === "active" ? "success" : "neutral",
    },
    {
      label: "Edge configuration synced",
      active: false,
      tone: "neutral",
    },
    {
      label: "Team access ready",
      active: (project?.users?.length ?? 0) > 0,
      tone: (project?.users?.length ?? 0) > 0 ? "success" : "neutral",
    },
    {
      label: "Instance prerequisites ready",
      active: true,
      tone: "success",
    },
  ];

  if (!projectId) {
    return (
      <ClientPageShell
        title="Project Not Found"
        description="No project ID provided."
        actions={
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => navigate("/client-dashboard/projects")}
          >
            Back to Projects
          </ModernButton>
        }
      >
        <div className="p-8 text-center text-gray-500">Please select a project from the list.</div>
      </ClientPageShell>
    );
  }

  if (isLoading) {
    return (
      <ClientPageShell title="Loading Project..." description="Please wait...">
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </ClientPageShell>
    );
  }

  if (isError || !project.identifier) {
    return (
      <ClientPageShell
        title="Project Not Found"
        description={`Could not load project details for ID: ${projectId}`}
        actions={
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => navigate("/client-dashboard/projects")}
          >
            Back to Projects
          </ModernButton>
        }
      >
        <div className="p-8 text-center text-red-500">
          The requested project could not be found or you do not have permission to view it.
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
    >
      <div className="space-y-6 animate-in fade-in duration-500" ref={contentRef}>
        {projectStatus?.summary?.some((i) => !i.completed && i.action) && (
          <ModernCard className="border-l-4 border-l-yellow-400 bg-yellow-50/30 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-yellow-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Required Actions</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectStatus.summary
                .filter((i) => !i.completed && i.action)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-lg border border-yellow-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1">{item.title}</div>
                      {item.missing_count && (
                        <div className="text-xs text-red-500 mb-2">
                          {item.missing_count} missing
                        </div>
                      )}
                    </div>
                    <ModernButton
                      size="sm"
                      variant="primary"
                      className="w-full mt-3"
                      onClick={() =>
                        handleGenericAction({
                          method: item.action.method,
                          endpoint: item.action.endpoint,
                          label: item.action.label,
                        })
                      }
                    >
                      {item.action.label}
                    </ModernButton>
                  </div>
                ))}
            </div>
          </ModernCard>
        )}

        <ProjectDetailsHero
          project={project as any}
          projectStatusVariant={projectStatusVariant}
          healthPercent={healthPercent}
          metadataItems={metadataItems}
          summaryMetrics={summaryMetrics as any}
          canCreateInstances={false}
          missingInstancePrereqs={[]}
          onAddInstance={() => {}}
          onManageEdge={() => {}}
          infrastructureStepLabel={infrastructureStepLabel}
        />

        <ProjectInstancesOverview
          instanceStats={instanceStats}
          recentInstances={recentInstances as any}
          projectInstances={projectInstances as any}
          resolvedProjectId={projectId}
          onViewAllInstances={() => navigate("/client-dashboard/instances")}
          onAddInstance={() => navigate("/client-dashboard/instances/create")} // Or appropriate path
          onViewInstance={(instance: any) =>
            navigate(`/client-dashboard/instances/details?id=${instance.identifier}`)
          }
          canCreateInstances={true}
        />

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <ModernCard variant="outlined" padding="lg" className="space-y-6">
              <ProjectQuickStatus quickStatusItems={quickStatusItems as any} />
              <ProjectInfrastructureJourney
                infrastructureSections={infrastructureSections as any}
                activeSection={activeSection}
                onSectionClick={handleSectionClick}
                getStatusForSection={getStatusForSection}
              />
            </ModernCard>

            <SetupProgressCard
              steps={
                Array.isArray(projectStatus?.provisioning_progress)
                  ? projectStatus.provisioning_progress.map((step: any) => ({
                      id: step.id || step.label?.toLowerCase()?.replace(/\s+/g, "_") || "step",
                      label: step.label || "Step",
                      status: step.status as any,
                      updated_at: step.updated_at,
                    }))
                  : []
              }
              isLoading={isStatusFetching}
            />
          </div>

          <div className="space-y-6">
            <ModernCard variant="outlined" padding="lg">
              {renderSectionContent()}
            </ModernCard>
          </div>
        </div>
      </div>
    </ClientPageShell>
  );
};

export default ClientProjectDetails;

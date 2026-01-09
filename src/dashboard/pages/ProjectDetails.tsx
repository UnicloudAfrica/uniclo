import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  CheckCircle,
  Clock,
  Layers,
  MapPin,
  Route,
  Server,
  Shield,
  Wifi,
} from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import { ModernButton } from "../../shared/components/ui";
import {
  useFetchTenantProjectById,
  useTenantProjectStatus,
  useEnableTenantVpc,
  useSetupInfrastructure,
} from "../../hooks/tenantHooks/projectHooks";
import InfrastructureSetupWizard from "../../adminDashboard/components/provisioning/InfrastructureSetupWizard";
import { useTenantProjectInfrastructureStatus } from "../../hooks/tenantHooks/projectInfrastructureHooks";
import { useFetchTenantProjectEdgeConfig } from "../../hooks/tenantHooks/edgeHooks";
import ProjectDetailsHero from "../../shared/components/projects/details/ProjectDetailsHero";
import ProjectInstancesOverview from "../../shared/components/projects/details/ProjectInstancesOverview";
import ProjectInfrastructureJourney from "../../shared/components/projects/details/ProjectInfrastructureJourney";
import ProjectQuickStatus from "../../shared/components/projects/details/ProjectQuickStatus";
import TenantAssignEdgeConfigModal from "./projectComps/TenantAssignEdgeConfigModal";
import KeyPairs from "./infraComps/keyPairs";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import Networks from "./infraComps/networks";
import Subnets from "./infraComps/subnet";
import IGWs from "./infraComps/igws";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/eni";
import EIPs from "./infraComps/elasticIP";
import ToastUtils from "../../utils/toastUtil";
import SetupProgressCard from "../../shared/components/projects/details/SetupProgressCard";
import ProvisioningFullScreen from "../../shared/components/provisioning/ProvisioningFullScreen";
import api from "../../index/tenant/tenantApi";
import { ModernCard } from "../../shared/components/ui";

// Interfaces
interface User {
  id: number | string;
  name?: string;
  email: string;
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
  summary?: any[];
  users?: User[];
  instances?: any[];
  vpc_enabled?: boolean;
  provisioning_status?: string;
}

const formatDate = (value: string | undefined): string => {
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

const toTitleCase = (input: string | undefined = ""): string =>
  input
    .toString()
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getProjectStatusVariant = (status: string = "") => {
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

const ProjectDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const rawProjectId = queryParams.get("id");

  const projectId = useMemo((): string | undefined => {
    if (!rawProjectId) return undefined;
    try {
      return atob(rawProjectId);
    } catch (e) {
      return rawProjectId;
    }
  }, [rawProjectId]);

  const [isAssignEdgeModalOpen, setAssignEdgeModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("vpcs");
  const [isInProvisioningMode, setIsInProvisioningMode] = useState(false);

  const { data: projectResponse, refetch: refetchProject } = useFetchTenantProjectById(projectId);
  const project = (projectResponse?.data || projectResponse?.project || {}) as Project;

  const {
    data: statusData,
    isFetching: isStatusFetching,
    refetch: refetchStatus,
  } = useTenantProjectStatus(projectId);
  const projectStatus = statusData?.project || statusData;

  const handleGenericAction = async ({
    method,
    endpoint,
    label,
    payload = {},
  }: {
    method: string;
    endpoint: string;
    label: string;
    payload?: any;
  }) => {
    try {
      ToastUtils.info(`Executing ${label}...`);
      const res = await api(method.toUpperCase(), endpoint, payload || {});
      ToastUtils.success(`${label} completed successfully!`);
      await Promise.all([refetchStatus(), refetchProject()]);
      return res;
    } catch (error: any) {
      console.error(`Action error [${label}]:`, error);
      ToastUtils.error(error?.message || `Failed to execute ${label}`);
      throw error;
    }
  };
  const { data: infraStatusData } = useTenantProjectInfrastructureStatus(projectId) as {
    data: any;
  };
  const { data: edgeConfig } = useFetchTenantProjectEdgeConfig(projectId, project?.region);

  const { mutate: enableVpc, isPending: isVpcEnabling } = useEnableTenantVpc();

  const handleEnableVpc = () => {
    if (!projectId) return;
    enableVpc(projectId, {
      onSuccess: () => {
        ToastUtils.success("VPC enablement initiated successfully.");
        refetchProject();
      },
      onError: (error: any) => {
        ToastUtils.error(`Failed to enable VPC: ${error.message}`);
      },
    });
  };

  const handleBack = () => navigate("/dashboard/projects");

  const handleAssignEdgeSuccess = () => {
    setAssignEdgeModalOpen(false);
    ToastUtils.success("Edge configuration assigned successfully.");
    refetchProject();
  };

  const handleSectionClick = (key: string) => {
    setActiveSection(key);
  };

  const summary = project?.summary ?? [];

  const normalizeSummaryKey = (value: string = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const summaryStatusMap = useMemo(() => {
    const map = new Map();
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

  const summaryCompleted = (...labels: string[]) => {
    for (const label of labels) {
      const normalized = normalizeSummaryKey(label);
      if (summaryStatusMap.has(normalized)) {
        const item = summaryStatusMap.get(normalized);
        return item?.completed ?? item?.complete ?? false;
      }
    }
    return undefined;
  };

  const infrastructureSections = [
    { key: "user-provisioning", label: "Team Access", icon: <Shield size={16} /> },
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

  const getStatusForSection = (sectionKey: string) => {
    const checkInfraStatus = (key: string) => {
      const components = infraStatusData?.data?.components;
      if (!components) return null;
      const comp = components[key];
      if (!comp) return false;
      return (
        comp.status === "active" || comp.status === "completed" || (comp.count && comp.count > 0)
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
        // Check edgeConfig if available
        if (
          edgeConfig &&
          (Array.isArray(edgeConfig) ? edgeConfig.length > 0 : Object.keys(edgeConfig).length > 0)
        )
          return true;
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

  const renderSectionContent = () => {
    switch (activeSection) {
      case "user-provisioning":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Team Access</h3>
              <ModernButton size="sm" variant="outline" disabled>
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
                    project.users.map((user) => (
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
        return <VPCs projectId={projectId} region={project?.region} />;
      case "networks":
        return <Networks projectId={projectId} region={project?.region} onStatsUpdate={() => {}} />;
      case "keypairs":
        return <KeyPairs projectId={projectId} region={project?.region} onStatsUpdate={() => {}} />;
      case "security-groups":
        return <SecurityGroup projectId={projectId} region={project?.region} />;
      case "edge":
        return (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
            Edge Network configuration is managed via "Assign Edge Config".
          </div>
        );
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
      case "igws":
        return (
          <IGWs
            projectId={projectId}
            region={project?.region}
            actionRequest={null}
            onActionHandled={() => {}}
            onStatsUpdate={() => {}}
          />
        );
      case "route-tables":
        return (
          <RouteTables
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
      default:
        return null;
    }
  };

  // Instance Stats Calculation
  const projectInstances = useMemo(() => {
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

  const recentInstances = useMemo(() => {
    return [...projectInstances]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [projectInstances]);

  // Hero Props Calculation
  const projectStatusVariant = getProjectStatusVariant(project?.status);
  const instanceCount = Array.isArray(project?.instances) ? project.instances.length : 0;

  // Placeholder for health percent until we implement full checks
  const healthPercent = 0;

  // Placeholder for infrastructure step label
  const infrastructureStepLabel = "0/0 infra steps";

  const metadataItems = useMemo(
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
        value: `${instanceCount} tracked`,
      },
    ],
    [project, instanceCount]
  );

  const summaryMetrics = useMemo(
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
        value: instanceCount,
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
    [project, instanceCount]
  );

  // Compute setupSteps for provisioning screen
  const setupSteps = useMemo(() => {
    if (Array.isArray(projectStatus?.provisioning_progress)) {
      return projectStatus.provisioning_progress.map((step: any) => ({
        id: step.id || step.label?.toLowerCase()?.replace(/\s+/g, "_") || "step",
        label: step.label || "Step",
        status: step.status as any,
        description: step.status === "completed" ? "Completed" : "Action in progress",
        updated_at: step.updated_at,
      }));
    }
    return [];
  }, [projectStatus?.provisioning_progress]);

  // Sticky provisioning mode
  const allStepsComplete =
    setupSteps.length > 0 && setupSteps.every((s: any) => s.status === "completed");

  useEffect(() => {
    if (project?.status === "provisioning" && !isInProvisioningMode) {
      setIsInProvisioningMode(true);
    }
    if (isInProvisioningMode && (project?.status === "active" || allStepsComplete)) {
      const timer = setTimeout(() => {
        setIsInProvisioningMode(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [project?.status, allStepsComplete, isInProvisioningMode]);

  // Phase 8: Dedicated Provisioning Screen
  if (isInProvisioningMode || project?.status === "provisioning") {
    return (
      <ProvisioningFullScreen
        project={project}
        setupSteps={setupSteps}
        onRefresh={() => refetchStatus()}
      />
    );
  }

  // Infra Studio: Project created but not provisioned
  const setupMutation = useSetupInfrastructure();

  if (project?.status === "created" || project?.provisioning_status === "created") {
    return (
      <TenantPageShell
        title="Infrastructure Setup"
        description={`Initialize infrastructure for ${project?.name || projectId}`}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
          <InfrastructureSetupWizard project={project} setupMutation={setupMutation} />
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
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        {projectStatus?.summary?.some((i: any) => !i.completed && i.action) && (
          <ModernCard className="border-l-4 border-l-yellow-400 bg-yellow-50/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-yellow-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Required Actions</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectStatus.summary
                .filter((i: any) => !i.completed && i.action)
                .map((item: any, idx: number) => (
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
          project={project}
          projectStatusVariant={projectStatusVariant}
          healthPercent={healthPercent}
          metadataItems={metadataItems}
          summaryMetrics={summaryMetrics}
          canCreateInstances={false}
          missingInstancePrereqs={[]}
          onAddInstance={() => {}}
          onManageEdge={() => setAssignEdgeModalOpen(true)}
          infrastructureStepLabel={infrastructureStepLabel}
        />

        <ProjectInstancesOverview
          instanceStats={instanceStats}
          recentInstances={recentInstances}
          projectInstances={projectInstances}
          onViewInstance={(instance) => console.log("View instance", instance)}
          onAddInstance={() => navigate("/dashboard/multi-instance-creation")}
          onViewAllInstances={() => navigate("/dashboard/instances")}
          canCreateInstances={false}
          resolvedProjectId={projectId}
        />

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <ProjectQuickStatus
                quickStatusItems={[
                  {
                    label: "Provisioning ready",
                    active: project?.status === "active",
                    tone: project?.status === "active" ? "success" : "neutral",
                  },
                  {
                    label: "Edge configuration synced",
                    active: false, // Todo: Check edge status
                    tone: "neutral",
                  },
                  {
                    label: "Team access ready",
                    active: (project?.users?.length ?? 0) > 0,
                    tone: (project?.users?.length ?? 0) > 0 ? "success" : "neutral",
                  },
                  {
                    label: "Instance prerequisites ready",
                    active: true, // Simplified
                    tone: "success",
                  },
                ]}
              />
              <ProjectInfrastructureJourney
                infrastructureSections={infrastructureSections}
                activeSection={activeSection}
                onSectionClick={handleSectionClick}
                getStatusForSection={getStatusForSection}
              />
            </div>

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

          <div className="space-y-6">{renderSectionContent()}</div>
        </div>
      </div>

      <TenantAssignEdgeConfigModal
        isOpen={isAssignEdgeModalOpen}
        onClose={() => setAssignEdgeModalOpen(false)}
        onSuccess={handleAssignEdgeSuccess}
        projectId={projectId}
        region={project?.region}
      />
    </TenantPageShell>
  );
};

export default ProjectDetails;

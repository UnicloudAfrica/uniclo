// @ts-nocheck
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import { ModernButton } from "../../shared/components/ui";
import {
  useFetchClientProjectById,
  useClientProjectNetworkStatus,
  useClientEnableInternetAccess,
} from "../../hooks/clientHooks/projectHooks";
import { useClientProjectInfrastructureStatus } from "../../hooks/clientHooks/projectInfrastructureHooks";
import { ModernCard } from "../../shared/components/ui";

// Shared Components
import ProjectUnifiedView from "../../shared/components/projects/details/ProjectUnifiedView";

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
import ProvisioningFullScreen from "../../shared/components/provisioning/ProvisioningFullScreen";
import ToastUtils from "../../utils/toastUtil";
import api from "../../index/client/api";
import {
  useClientProjectStatus,
  useSetupInfrastructure,
} from "../../hooks/clientHooks/projectHooks";
import InfrastructureSetupWizard from "../../adminDashboard/components/provisioning/InfrastructureSetupWizard";

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

  const [activeSection, setActiveSection] = useState("vpcs");
  const [isInProvisioningMode, setIsInProvisioningMode] = useState(false);
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
  const setupMutation = useSetupInfrastructure();

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

  const { data: infraStatusData, refetch: refetchInfraStatus } =
    useClientProjectInfrastructureStatus(projectId, {
      enabled: Boolean(projectId),
    }) as {
      data: InfraStatusData | undefined;
      refetch: () => void;
    };
  const { data: networkStatusData, refetch: refetchNetworkStatus } =
    useClientProjectNetworkStatus(projectId, { enabled: Boolean(projectId) });

  const networkData = useMemo(() => {
    if (!networkStatusData) return undefined;
    return networkStatusData.network || networkStatusData?.data?.network || networkStatusData;
  }, [networkStatusData]);

  const { mutateAsync: enableInternet, isPending: isEnablingInternet } =
    useClientEnableInternetAccess();

  const [isSyncingResources, setIsSyncingResources] = useState(false);

  const handleSectionClick = (key: string) => {
    setActiveSection(key);
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
    } catch (error) {
      console.error("Failed to sync resources:", error);
      ToastUtils.error(error?.message || "Failed to sync resources.");
    } finally {
      setIsSyncingResources(false);
    }
  };

  const handleEnableInternet = async () => {
    if (!projectId) return;
    try {
      const result = await enableInternet(projectId);
      const alreadyEnabled = result?.already_enabled || result?.data?.already_enabled;
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
    } catch (error) {
      console.error("Enable internet error:", error);
      ToastUtils.error(error?.message || "Failed to enable internet access");
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

  const resourceCounts = useMemo(() => {
    const counts = infraStatusData?.data?.counts || {};
    const components = infraStatusData?.data?.components || {};
    return {
      vpcs: counts.vpcs ?? components?.vpc?.count ?? 0,
      subnets: counts.subnets ?? components?.subnets?.count ?? 0,
      security_groups: counts.security_groups ?? components?.security_groups?.count ?? 0,
      key_pairs: counts.keypairs ?? components?.keypairs?.count ?? 0,
      route_tables: counts.route_tables ?? components?.route_tables?.count ?? 0,
      elastic_ips: counts.elastic_ips ?? components?.elastic_ips?.count ?? 0,
      network_interfaces: counts.network_interfaces ?? components?.network_interfaces?.count ?? 0,
      internet_gateways: counts.internet_gateways ?? components?.internet_gateways?.count ?? 0,
      users: project?.users?.length ?? 0,
    };
  }, [infraStatusData, project?.users?.length]);

  const canCreateInstances = project?.status === "active";

  const edgeNetworkConnected = Boolean(
    infraStatusData?.data?.components?.edge_networks?.count
  );
  const edgeNetworkName = undefined;

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

  if (project?.status === "created" || project?.provisioning_status === "created") {
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

        <ProjectUnifiedView
          project={{
            id: project?.id || projectId || "",
            identifier: project?.identifier || projectId || "",
            name: project?.name || "Project",
            status: project?.status || "unknown",
            region: project?.region,
            region_name: project?.region_name,
            provider: project?.provider,
            created_at: project?.created_at,
          }}
          instanceStats={{
            total: instanceStats.total,
            running: instanceStats.running,
            stopped: instanceStats.total - instanceStats.running - instanceStats.provisioning,
            provisioning: instanceStats.provisioning,
          }}
          resourceCounts={resourceCounts}
          canCreateInstances={canCreateInstances}
          networkStatus={networkData}
          setupSteps={setupSteps}
          setupProgressPercent={infraStatusData?.data?.completion_percentage ?? 0}
          edgeNetworkConnected={edgeNetworkConnected}
          edgeNetworkName={edgeNetworkName}
          instances={projectInstances as any}
          onAddInstance={() =>
            navigate(
              `/client-dashboard/instances/provision?project=${encodeURIComponent(
                project?.identifier || projectId || ""
              )}`
            )
          }
          onEnableInternet={handleEnableInternet}
          onManageMembers={() => handleSectionClick("user-provisioning")}
          onSyncResources={handleSyncResources}
          onViewNetworkDetails={() => handleSectionClick("networks")}
          onViewAllResources={() => handleSectionClick("vpcs")}
          onViewKeyPairs={() => handleSectionClick("keypairs")}
          onViewRouteTables={() => handleSectionClick("route-tables")}
          onViewElasticIps={() => handleSectionClick("eips")}
          onViewNetworkInterfaces={() => handleSectionClick("enis")}
          onViewVpcs={() => handleSectionClick("vpcs")}
          onViewSubnets={() => handleSectionClick("subnets")}
          onViewSecurityGroups={() => handleSectionClick("security-groups")}
          onViewInternetGateways={() => handleSectionClick("igws")}
          onViewUsers={() => handleSectionClick("user-provisioning")}
          isEnablingInternet={isEnablingInternet}
          isSyncing={isSyncingResources}
          isProvisioning={isStatusFetching}
          showMemberManagement={true}
          showSyncButton={true}
        />

        <ModernCard variant="outlined" padding="lg">
          {renderSectionContent()}
        </ModernCard>

      </div>
    </ClientPageShell>
  );
};

export default ClientProjectDetails;

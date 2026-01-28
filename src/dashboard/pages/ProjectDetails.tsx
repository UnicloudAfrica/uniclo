import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
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
import { useFetchTenantProjectEdgeConfig } from "../../hooks/tenantHooks/edgeHooks";
import ProjectUnifiedView from "../../shared/components/projects/details/ProjectUnifiedView";
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
  const setupMutation = useSetupInfrastructure();

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
  const { data: infraStatusData, refetch: refetchInfraStatus } =
    useTenantProjectInfrastructureStatus(projectId) as {
      data: any;
      refetch: () => void;
    };
  const { data: edgeConfig } = useFetchTenantProjectEdgeConfig(projectId, project?.region);
  const { data: networkStatusData, refetch: refetchNetworkStatus } =
    useTenantProjectNetworkStatus(projectId, { enabled: Boolean(projectId) });

  const networkData = useMemo(() => {
    if (!networkStatusData) return undefined;
    return networkStatusData.network || networkStatusData?.data?.network || networkStatusData;
  }, [networkStatusData]);

  const { mutateAsync: enableInternet, isPending: isEnablingInternet } =
    useTenantEnableInternetAccess();

  const [isSyncingResources, setIsSyncingResources] = useState(false);

  const handleBack = () => navigate("/dashboard/projects");

  const handleAssignEdgeSuccess = () => {
    setAssignEdgeModalOpen(false);
    ToastUtils.success("Edge configuration assigned successfully.");
    refetchProject();
  };

  const handleSectionClick = (key: string) => {
    setActiveSection(key);
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

  const edgePayload = edgeConfig?.data ?? edgeConfig;
  const edgeNetworkConnected = Boolean(edgePayload?.edge_network_id);
  const edgeNetworkName = edgePayload?.edge_network_name;

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
          instances={projectInstances}
          onAddInstance={() =>
            navigate(
              `/dashboard/create-instance?project=${encodeURIComponent(
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

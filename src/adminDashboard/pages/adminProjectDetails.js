import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Network,
  Key,
  Shield,
  Route,
  Wifi,
  Globe,
  GitBranch,
  Radio
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernCard from "../components/ModernCard";
import { useProjectStatus } from "../../hooks/adminHooks/projectHooks";
import { useProjectInfrastructureStatus } from "../../hooks/adminHooks/projectInfrastructureHooks";
import KeyPairs from "./infraComps/keyPairs";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import Networks from "./infraComps/networks";
import { useFetchNetworks } from "../../hooks/adminHooks/networkHooks";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import Subnets from "./infraComps/subNet";
import IGWs from "./infraComps/igw";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/enis";
import EIPs from "./infraComps/eips";
import AssignEdgeConfigModal from "./projectComps/assignEdgeConfig";
import { designTokens } from "../../styles/designTokens";
import ToastUtils from "../../utils/toastUtil";
import api from "../../index/admin/api";
import { syncProjectEdgeConfigAdmin } from "../../hooks/adminHooks/edgeHooks";
import useCloudAccess from "../../hooks/useCloudAccess";

const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null;
  }
};

export default function AdminProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("setup");
  const [isAssignEdgeOpen, setIsAssignEdgeOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // Track which checklist action is loading
  const [userActionLoading, setUserActionLoading] = useState(null); // Track per-user provisioning actions
  const [isEdgeSyncing, setIsEdgeSyncing] = useState(false);
  const contentRef = useRef(null);
  const { hasAbility } = useCloudAccess();

  const abilityFromEndpoint = useCallback((endpoint = "") => {
    const normalized = endpoint.toLowerCase();

    if (normalized.includes("enable-vpc")) {
      return "project.enable_vpc";
    }
    if (
      normalized.includes("assign-user-policies") ||
      normalized.includes("aws-policies") ||
      normalized.includes("strato-policies")
    ) {
      return "project.assign_policy";
    }
    if (
      normalized.includes("roles/tenant_admin") ||
      normalized.includes("assign-tenant-admin")
    ) {
      return "project.assign_role";
    }
    if (
      normalized.includes("/users/") && normalized.includes("/sync")
    ) {
      return "project.assign_role";
    }
    if (normalized.includes("authenticate-all-users")) {
      return "project.assign_role";
    }
    if (normalized.includes("repair-cloud-link")) {
      return "project.assign_role";
    }
    if (
      normalized.includes("project-infrastructure") ||
      normalized.includes("/domain")
    ) {
      return "project.create";
    }
    if (normalized.includes("edge-config")) {
      return "infra.manage";
    }
    if (
      normalized.includes("key-pairs") ||
      normalized.includes("security-groups") ||
      normalized.includes("networks") ||
      normalized.includes("subnets") ||
      normalized.includes("route-tables") ||
      normalized.includes("elastic-ip") ||
      normalized.includes("edge") ||
      normalized.includes("sync")
    ) {
      return "infra.manage";
    }

    return "infra.manage";
  }, []);

  const ensureAbility = useCallback(
    (abilityKey) => {
      if (!abilityKey) {
        return true;
      }
      if (hasAbility(abilityKey)) {
        return true;
      }
      ToastUtils.error("You do not have permission to perform this action.");
      return false;
    },
    [hasAbility]
  );

  const canPerformAction = useCallback(
    (action) => {
      if (!action) {
        return true;
      }
      const abilityKey = abilityFromEndpoint(action.endpoint ?? "");
      return hasAbility(abilityKey);
    },
    [abilityFromEndpoint, hasAbility]
  );

  const canAssignTenantAdmin = hasAbility("project.assign_role");
  const canManageInfra = hasAbility("infra.manage");

  const queryParams = new URLSearchParams(location.search);
  const identifierParam = queryParams.get("identifier");
  const encodedProjectId = queryParams.get("id");
  const projectId = identifierParam
    ? identifierParam
    : encodedProjectId
      ? decodeId(encodedProjectId)
      : null;

  const {
    data: projectStatusData,
    isFetching: isProjectStatusFetching,
    refetch: refetchProjectStatus,
  } = useProjectStatus(projectId);

  const {
    data: infraStatusData,
  } = useProjectInfrastructureStatus(projectId, { enabled: Boolean(projectId) });

  const infrastructureComponents = infraStatusData?.data?.components;
  const vpcComponent = infrastructureComponents?.vpc;
  const keypairComponent = infrastructureComponents?.keypairs ?? infrastructureComponents?.keypair;
  const edgeComponent = infrastructureComponents?.edge_networks ?? infrastructureComponents?.edge;

  const project = projectStatusData?.project;

  // Fetch networks data to check if any exist (after project is defined)
  const { data: networksData } = useFetchNetworks(
    project?.identifier,
    project?.region,
    { enabled: Boolean(project?.identifier && project?.region) }
  );

  // Fetch key pairs data to check if any exist
  const { data: keyPairsData } = useFetchKeyPairs(
    project?.identifier,
    project?.region,
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const summary = project?.summary ?? [];
  const resolvedProjectId = project?.identifier || projectId;
  const tenantAdminMissingUsers = project?.users?.tenant_admin_missing ?? [];

  const normalizeSummaryKey = (value = "") =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const summaryStatusMap = useMemo(() => {
    const map = new Map();
    summary.forEach((item) => {
      if (item?.title) {
        map.set(normalizeSummaryKey(item.title), item);
      }
      if (item?.key) {
        map.set(normalizeSummaryKey(item.key), item);
      }
    });
    return map;
  }, [summary]);

  const summaryCompleted = (...labels) => {
    for (const label of labels) {
      const normalized = normalizeSummaryKey(label);
      if (summaryStatusMap.has(normalized)) {
        const item = summaryStatusMap.get(normalized);
        return item?.completed ?? item?.complete ?? false;
      }
    }
    return undefined;
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSectionClick = (sectionKey) => {
    setActiveSection(sectionKey);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleEdgeSync = async () => {
    if (!resolvedProjectId || !project?.region) {
      ToastUtils.error("Project and region are required to sync edge configuration");
      return;
    }
    if (isEdgeSyncing) return;

     if (!ensureAbility('infra.manage')) {
       return;
     }

    try {
      setIsEdgeSyncing(true);
      await syncProjectEdgeConfigAdmin({
        project_id: resolvedProjectId,
        region: project.region,
      });
      ToastUtils.success("Edge network configuration synced successfully");
      await refetchProjectStatus();
    } catch (error) {
      console.error("Edge sync failed:", error);
      ToastUtils.error(error?.message || "Failed to sync edge configuration");
    } finally {
      setIsEdgeSyncing(false);
    }
  };

  // Handle action button clicks for provisioning checklist
  const handleSummaryAction = async (action, actionKey) => {
    if (!action || !action.endpoint || actionLoading) return;

    const method = (action.method || 'POST').toUpperCase();
    const endpoint = action.endpoint;
    const abilityKey = abilityFromEndpoint(endpoint);
    if (!ensureAbility(abilityKey)) {
      return;
    }

    try {
      setActionLoading(actionKey);
      await api(method, endpoint);
      ToastUtils.success('Action completed successfully');
      await refetchProjectStatus();
    } catch (error) {
      console.error('Action failed:', error);
      ToastUtils.error(error?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignTenantAdmins = async () => {
    if (!tenantAdminMissingUsers.length || actionLoading) {
      return;
    }

    if (!ensureAbility('project.assign_role')) {
      return;
    }

    try {
      setActionLoading("tenant_admin_bulk");
      for (const entry of tenantAdminMissingUsers) {
        const method = (entry.method || "POST").toUpperCase();
        if (!entry.assign_endpoint) {
          continue;
        }
        await api(method, entry.assign_endpoint, entry.assign_payload || null);
      }
      ToastUtils.success("Tenant admin role assigned to missing users");
      await refetchProjectStatus();
    } catch (error) {
      console.error("Bulk tenant admin assignment failed:", error);
      ToastUtils.error(error?.message || "Failed to assign tenant admin role");
    } finally {
      setActionLoading(null);
    }
  };

  const projectUsers = project?.users?.local ?? [];
  const userActionOrder = [
    "link_provider_user",
    "reset_provider_password",
    "authenticate",
    "sync",
    "assign_aws_policy",
    "assign_symp_policy",
    "assign_tenant_admin",
  ];

  const handleUserAction = async (user, actionKey) => {
    const action = user?.actions?.[actionKey];
    if (!action || !action.endpoint) return;

    const method = (action.method || "POST").toUpperCase();
    const endpoint = action.endpoint;
    const payload = action.payload_defaults || null;
    const hasPayload =
      payload && typeof payload === "object" && Object.keys(payload).length > 0;
    const body = hasPayload ? payload : null;
    const loadingKey = `${user.id}-${actionKey}`;

    const abilityKey = abilityFromEndpoint(endpoint);
    if (!ensureAbility(abilityKey)) {
      return;
    }

    try {
      setUserActionLoading(loadingKey);
      await api(method, endpoint, body);
      ToastUtils.success(`${action.label} completed`);
      await refetchProjectStatus();
    } catch (error) {
      console.error("User action failed:", error);
      ToastUtils.error(error?.message || "Action failed");
    } finally {
      setUserActionLoading(null);
    }
  };

  const renderStatusChip = (label, isActive) => (
    <span
      key={label}
      className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
      style={{
        backgroundColor: isActive
          ? designTokens.colors.success[50]
          : designTokens.colors.error[50],
        color: isActive
          ? designTokens.colors.success[600]
          : designTokens.colors.error[600],
      }}
    >
      {isActive ? "✔" : "✖"} {label}
    </span>
  );

  const providerLabel =
    project?.region_name || project?.region || "Provider";

  // Define infrastructure sections with icons
  const infrastructureSections = [
    {
      key: "setup",
      label: "Setup",
      icon: <CheckCircle size={16} />,
    },
    {
      key: "vpcs",
      label: "VPCs",
      icon: <Network size={16} />,
    },
    {
      key: "networks",
      label: "Networks",
      icon: <Wifi size={16} />,
    },
    {
      key: "keypairs",
      label: "Create Key Pair",
      icon: <Key size={16} />,
    },
    {
      key: "edge",
      label: "Configure Edge Network",
      icon: <Wifi size={16} />,
    },
    {
      key: "security-groups",
      label: "Create Security Groups",
      icon: <Shield size={16} />,
    },
    {
      key: "subnets",
      label: "Manage Subnets",
      icon: <GitBranch size={16} />,
    },
    {
      key: "igws",
      label: "Configure IGW",
      icon: <Globe size={16} />,
    },
    {
      key: "route-tables",
      label: "Route Tables",
      icon: <Route size={16} />,
    },
    {
      key: "enis",
      label: "ENIs",
      icon: <Radio size={16} />,
    },
    {
      key: "eips",
      label: "EIPs",
      icon: <Wifi size={16} />,
    },
  ];

  // Setup is complete only when ALL summary items are complete
  const areAllSummaryItemsComplete = summary.length > 0 && summary.every(item => item.completed === true);

  const getStatusForSection = (sectionKey) => {
    switch (sectionKey) {
      case "setup":
        return areAllSummaryItemsComplete;
      case "vpcs":
        {
          const summaryFlag = summaryCompleted(
            "vpc",
            "vpcs",
            "virtualprivatecloud",
            "vpcprovisioned"
          );

          if (summaryFlag === true) {
            return true;
          }

          if (project?.vpc_enabled) {
            return true;
          }

          if (vpcComponent) {
            if (vpcComponent.status === "completed") {
              return true;
            }

            if (Array.isArray(vpcComponent.details) && vpcComponent.details.length > 0) {
              return true;
            }
          }

          return summaryFlag ?? false;
        }
      case "networks":
        {
          // Check if we have actual networks data fetched
          if (Array.isArray(networksData) && networksData.length > 0) {
            return true;
          }

          const summaryFlag = summaryCompleted(
            "network",
            "networks",
            "subnet",
            "subnets"
          );

          if (summaryFlag === true) {
            return true;
          }

          // Check if networks component exists in infrastructure status
          const networksComponent = infrastructureComponents?.networks;
          if (networksComponent) {
            if (networksComponent.status === "completed") {
              return true;
            }

            if (Array.isArray(networksComponent.details) && networksComponent.details.length > 0) {
              return true;
            }

            if (typeof networksComponent.count === "number" && networksComponent.count > 0) {
              return true;
            }
          }

          return summaryFlag ?? false;
        }
      case "keypairs":
        {
          // Check if we have actual key pairs data fetched
          if (Array.isArray(keyPairsData) && keyPairsData.length > 0) {
            return true;
          }

          const summaryFlag = summaryCompleted("keypair", "keypairs", "createkeypair");

          if (summaryFlag === true) {
            return true;
          }

          if (keypairComponent) {
            if (keypairComponent.status === "completed") {
              return true;
            }

            if (Array.isArray(keypairComponent.details) && keypairComponent.details.length > 0) {
              return true;
            }

            if (typeof keypairComponent.count === "number" && keypairComponent.count > 0) {
              return true;
            }
          }

          return summaryFlag ?? false;
        }
      case "edge":
        {
          const summaryFlag = summaryCompleted(
            "edgenetwork",
            "edge network",
            "edge"
          );

          if (summaryFlag === true) {
            return true;
          }

          if (edgeComponent) {
            if (edgeComponent.status === "completed") {
              return true;
            }

            const details = edgeComponent.details;
            if (details) {
              if (Array.isArray(details) && details.length > 0) {
                return true;
              }
              if (!Array.isArray(details) && Object.keys(details).length > 0) {
                return true;
              }
            }

            if (typeof edgeComponent.count === "number" && edgeComponent.count > 0) {
              return true;
            }
          }

          return summaryFlag ?? false;
        }
      case "security-groups":
        return summaryCompleted(
          "securitygroup",
          "securitygroups",
          "create security groups"
        ) ?? false;
      case "subnets":
        return summaryCompleted("subnet", "subnets", "manage subnets") ?? false;
      case "igws":
        return summaryCompleted(
          "igw",
          "igws",
          "internetgateway",
          "internet gateways",
          "configure igw"
        ) ?? false;
      case "route-tables":
        return summaryCompleted("routetable", "routetables") ?? false;
      case "enis":
        return summaryCompleted(
          "eni",
          "enis",
          "networkinterface",
          "networkinterfaces"
        ) ?? false;
      case "eips":
        return summaryCompleted(
          "eip",
          "eips",
          "elasticip",
          "elasticips",
          "elastic ip"
        ) ?? false;
      default:
        return false;
    }
  };

  // Section content rendering function
  const renderSectionContent = () => {
    switch (activeSection) {
      case "setup":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
              Project Setup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>Project ID</div>
                <div className="text-lg font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                  {project?.identifier || projectId}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>Project Name</div>
                <div className="text-lg font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                  {project?.name || "N/A"}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>Region</div>
                <div className="text-lg font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                  {project?.region || "N/A"}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>Provider</div>
                <div className="text-lg font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                  {project?.provider || "N/A"}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold mb-3" style={{ color: designTokens.colors.neutral[800] }}>Provisioning Checklist</h4>
              <div className="space-y-2">
                {summary.map((item, index) => {
                  const isComplete = item?.completed ?? item?.complete ?? false;
                  const actionKey = `action-${index}`;
                  const isThisActionLoading = actionLoading === actionKey;
                  const normalizedTitle = normalizeSummaryKey(item?.title || "");
                  const tenantAdminSummaryKey = normalizeSummaryKey("Tenant Admin Role Assigned");
                  const showBulkAssign =
                    normalizedTitle === tenantAdminSummaryKey &&
                    tenantAdminMissingUsers.length > 0;
                  const isBulkLoading = actionLoading === "tenant_admin_bulk";
                  const summaryActionAllowed = canPerformAction(item.action);

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: designTokens.colors.neutral[50] }}
                    >
                      {isComplete ? (
                        <CheckCircle size={18} style={{ color: designTokens.colors.success[500] }} />
                      ) : (
                        <XCircle size={18} style={{ color: designTokens.colors.error[500] }} />
                      )}
                      <div className="flex-1">
                        <span style={{ color: designTokens.colors.neutral[700] }}>{item.title}</span>
                        {item.count !== undefined && (
                          <span className="ml-2 text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                            ({item.count})
                          </span>
                        )}
                        {item.missing_count !== undefined && item.missing_count > 0 && (
                          <span className="ml-2 text-xs" style={{ color: designTokens.colors.warning[600] }}>
                            ({item.missing_count} missing)
                          </span>
                        )}
                      </div>
                      {item.action && (
                        <button
                          className="px-3 py-1 rounded text-xs font-medium text-white transition-opacity flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: designTokens.colors.primary[600] }}
                          onClick={() => handleSummaryAction(item.action, actionKey)}
                          disabled={actionLoading !== null || !summaryActionAllowed}
                          title={summaryActionAllowed ? undefined : "Insufficient permissions"}
                        >
                          {isThisActionLoading && <Loader2 size={12} className="animate-spin" />}
                          {item.action.label}
                        </button>
                      )}
                      {!item.action && showBulkAssign && (
                        <button
                          className="px-3 py-1 rounded text-xs font-medium text-white transition-opacity flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: designTokens.colors.primary[600] }}
                          onClick={handleAssignTenantAdmins}
                          disabled={isBulkLoading || !canAssignTenantAdmin}
                          title={canAssignTenantAdmin ? undefined : "Insufficient permissions"}
                        >
                          {isBulkLoading && <Loader2 size={12} className="animate-spin" />}
                          Assign Tenant Admin
                        </button>
                      )}
                      {showBulkAssign && (
                        <div className="ml-4 text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                          Needs elevation:&nbsp;
                          {tenantAdminMissingUsers
                            .map((entry) => entry.name || entry.identifier || entry.id)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {projectUsers.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4
                  className="font-semibold"
                  style={{ color: designTokens.colors.neutral[800] }}
                >
                  User Provisioning
                </h4>
                <div className="space-y-3">
                  {projectUsers.map((user) => {
                    const statusEntries = [
                      {
                        label: `${providerLabel} Account`,
                        value: user?.status?.provider_account,
                      },
                      {
                        label: "Storage Policy",
                        value: user?.status?.aws_policy,
                      },
                      {
                        label: "Network Policy",
                        value: user?.status?.symp_policy,
                      },
                      {
                        label: "Tenant Admin",
                        value: user?.status?.tenant_admin,
                      },
                    ];

                    const visibleActions = userActionOrder.filter(
                      (key) => user?.actions?.[key]?.show
                    );

                    return (
                      <div
                        key={user.id}
                        className="p-4 rounded-lg border"
                        style={{
                          borderColor: designTokens.colors.neutral[200],
                          backgroundColor: designTokens.colors.neutral[50],
                        }}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div
                              className="text-sm font-semibold"
                              style={{ color: designTokens.colors.neutral[900] }}
                            >
                              {user.name}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: designTokens.colors.neutral[600] }}
                            >
                              {user.email}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {statusEntries.map(({ label, value }) =>
                              renderStatusChip(label, Boolean(value))
                            )}
                          </div>
                        </div>
                        {visibleActions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {visibleActions.map((actionKey) => {
                              const action = user.actions[actionKey];
                              const loadingKey = `${user.id}-${actionKey}`;
                              const isLoading =
                                userActionLoading === loadingKey;
                              const actionAllowed = canPerformAction(action);
                              return (
                                <button
                                  key={actionKey}
                                  className="px-3 py-1.5 rounded text-xs font-medium text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    backgroundColor:
                                      designTokens.colors.primary[600],
                                  }}
                                  onClick={() => handleUserAction(user, actionKey)}
                                  disabled={userActionLoading !== null || !actionAllowed}
                                  title={actionAllowed ? undefined : "Insufficient permissions"}
                                >
                                  {isLoading && (
                                    <Loader2 size={12} className="animate-spin" />
                                  )}
                                  {action.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      case "vpcs":
        return (
          <VPCs
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      case "networks":
        return (
          <Networks
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      case "keypairs":
        return (
          <KeyPairs
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      case "edge":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                Configure Edge Network
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEdgeSync}
                  disabled={
                    isEdgeSyncing ||
                    !resolvedProjectId ||
                    !project?.region ||
                    !canManageInfra
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed border"
                  style={{
                    backgroundColor: designTokens.colors.neutral[50],
                    color: designTokens.colors.primary[700],
                    borderColor: designTokens.colors.primary[200],
                  }}
                >
                  <RefreshCw size={16} className={isEdgeSyncing ? "animate-spin" : ""} />
                  {isEdgeSyncing ? "Syncing..." : "Sync Edge Config"}
                </button>
                <button
                  onClick={() => setIsAssignEdgeOpen(true)}
                  className="px-4 py-2 rounded-lg font-medium text-white"
                  style={{ backgroundColor: designTokens.colors.primary[600] }}
                  disabled={!canManageInfra}
                  title={canManageInfra ? undefined : "Insufficient permissions"}
                >
                  Assign Edge Config
                </button>
              </div>
            </div>
            <p style={{ color: designTokens.colors.neutral[600] }}>
              Configure edge network settings for enhanced connectivity and performance.
            </p>
          </div>
        );
      case "security-groups":
        return (
          <SecurityGroup
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      case "subnets":
        return (
          <Subnets
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      case "igws":
        return (
          <IGWs
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      case "route-tables":
        return (
          <RouteTables
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      case "enis":
        return (
          <ENIs
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      case "eips":
        return (
          <EIPs
            projectId={resolvedProjectId}
            region={project?.region}
            provider={project?.provider}
          />
        );
      default:
        return <div>Select a section from the menu</div>;
    }
  };

  if (isProjectStatusFetching && !project) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2
          className="w-12 animate-spin"
          style={{ color: designTokens.colors.primary[500] }}
        />
      </div>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin-dashboard/projects")}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: designTokens.colors.primary[600] }}
              >
                <ChevronLeft size={20} />
                Back to Projects
              </button>
            </div>
            <button
              onClick={() => refetchProjectStatus()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: designTokens.colors.neutral[100],
                color: designTokens.colors.neutral[700]
              }}
              disabled={isProjectStatusFetching}
            >
              <RefreshCw size={16} className={isProjectStatusFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Overview Block */}
          <ModernCard>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: designTokens.colors.neutral[900] }}>
                {project?.name || "Project Details"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>
                    Project ID
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                    {project?.identifier || projectId}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>
                    Region
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                    {project?.region || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>
                    Provider
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                    {project?.provider || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>
                    Status
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: designTokens.colors.success[600] }}>
                    Active
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - 25% */}
            <div className="lg:col-span-1">
              <ModernCard>
                <div className="p-4">
                  <h3 className="font-semibold mb-4" style={{ color: designTokens.colors.neutral[900] }}>
                    Infrastructure Setup
                  </h3>
                  <div className="space-y-1">
                    {infrastructureSections.map((section) => {
                      const isComplete = getStatusForSection(section.key);
                      const isActive = activeSection === section.key;
                      return (
                        <button
                          key={section.key}
                          onClick={() => handleSectionClick(section.key)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                          style={{
                            backgroundColor: isActive
                              ? designTokens.colors.primary[50]
                              : "transparent",
                            color: isActive
                              ? designTokens.colors.primary[700]
                              : designTokens.colors.neutral[700]
                          }}
                        >
                          {isComplete ? (
                            <span style={{ color: designTokens.colors.success[500] }}>✅</span>
                          ) : (
                            <span style={{ color: designTokens.colors.error[500] }}>❌</span>
                          )}
                          <span className="flex-1 text-sm font-medium">{section.label}</span>
                          {React.cloneElement(section.icon, {
                            style: { color: isActive ? designTokens.colors.primary[600] : designTokens.colors.neutral[400] }
                          })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ModernCard>
            </div>

            {/* Right Content - 75% */}
            <div className="lg:col-span-3" ref={contentRef}>
              <ModernCard>
                <div className="p-6">
                  {renderSectionContent()}
                </div>
              </ModernCard>
            </div>
          </div>
        </div>
      </main>

      {/* Assign Edge Config Modal */}
      {isAssignEdgeOpen && (
        <AssignEdgeConfigModal
          isOpen={isAssignEdgeOpen}
          onClose={() => setIsAssignEdgeOpen(false)}
          projectId={resolvedProjectId}
          onSuccess={() => {
            refetchProjectStatus();
            setIsAssignEdgeOpen(false);
          }}
        />
      )}
    </>
  );
}

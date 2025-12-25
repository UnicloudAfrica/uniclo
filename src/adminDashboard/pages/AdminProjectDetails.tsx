// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Server,
  Shield,
  XCircle,
  Wifi,
  Route,
  ArrowLeft,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
import ModernTable from "../../shared/components/ui/ModernTable";
import PaymentModal from "../../shared/components/ui/PaymentModal";
import config from "../../config";
import {
  useFetchProjectById,
  useProjectStatus,
  useProjectMembershipSuggestions,
  useUpdateProject,
  useEnableVpc,
  useProjectNetworkStatus,
  useEnableInternetAccess,
  useProvisionProject,
} from "../../hooks/adminHooks/projectHooks";
import { useProjectInfrastructureStatus } from "../../hooks/adminHooks/projectInfrastructureHooks";
import KeyPairs from "./infraComps/keyPairs";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import Networks from "./infraComps/networks";
import { useFetchNetworks, useFetchNetworkInterfaces } from "../../hooks/adminHooks/networkHooks";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import { useFetchSecurityGroups } from "../../hooks/adminHooks/securityGroupHooks";
import { useFetchSubnets } from "../../hooks/adminHooks/subnetHooks";
import { useFetchIgws } from "../../hooks/adminHooks/igwHooks";
import { useFetchRouteTables } from "../../hooks/adminHooks/routeTableHooks";
import { useFetchElasticIps } from "../../hooks/adminHooks/eipHooks";
import { useFetchVpcs } from "../../hooks/adminHooks/vcpHooks";
import Subnets from "./infraComps/subNet";
import IGWs from "./infraComps/igw";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/enis";
import EIPs from "./infraComps/eips";
import AssignEdgeConfigModal from "./projectComps/assignEdgeConfig";
import { designTokens } from "../../styles/designTokens";
import ToastUtils from "../../utils/toastUtil";
import {
  useFetchProjectEdgeConfigAdmin,
  syncProjectEdgeConfigAdmin,
} from "../../hooks/adminHooks/edgeHooks";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { useProjectBroadcasting } from "../../hooks/useProjectBroadcasting";
import api, { adminSilentApi as silentApi } from "../../index/admin/api";

import ProjectMemberManagerModal from "../../shared/components/projects/ProjectMemberManagerModal";

// Shared Components
import ProjectDetailsHero from "../../shared/components/projects/details/ProjectDetailsHero";
import ProjectInstancesOverview from "../../shared/components/projects/details/ProjectInstancesOverview";
import ProjectInfrastructureJourney from "../../shared/components/projects/details/ProjectInfrastructureJourney";
import ProjectQuickStatus from "../../shared/components/projects/details/ProjectQuickStatus";
import ProjectUnifiedView from "../../shared/components/projects/details/ProjectUnifiedView";

// Types
interface User {
  id: number | string;
  name?: string;
  full_name?: string;
  first_name?: string;
  firstName?: string;
  middle_name?: string;
  middleName?: string;
  last_name?: string;
  lastName?: string;
  email: string;
  roles?: string[];
  role?: string;
  status?: {
    tenant_admin?: boolean;
    provider_account?: boolean;
    aws_policy?: boolean;
    symp_policy?: boolean;
    role?: string;
  };
}

interface Project {
  id: number | string;
  identifier: string;
  name: string;
  region: string;
  region_name?: string;
  provider: string;
  status: string;
  created_at: string;
  type: string;
  tenant_id?: string;
  client_id?: string;
  assignment_scope?: string;
  summary?: any[];
  users?: {
    local?: User[];
  };
  tenant?: {
    id: string;
  };
  clients?: {
    id: string;
  }[];
  instances?: any[];
  pending_instances?: any[];
  vpc_enabled?: boolean;
}

interface InviteForm {
  name: string;
  email: string;
  role: string;
  note: string;
}

const decodeId = (encodedId: string | null): string | null => {
  if (!encodedId) return null;
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null;
  }
};

const isTenantAdmin = (user: User | null): boolean => {
  if (!user) return false;
  if (
    Array.isArray(user.roles) &&
    user.roles.some((role) => role === "tenant_admin" || role === "tenant-admin")
  ) {
    return true;
  }
  if (typeof user.role === "string") {
    const role = user.role.toLowerCase();
    if (role.includes("tenant_admin") || role.includes("tenant-admin")) return true;
  }
  if (user?.status?.tenant_admin) return true;
  return false;
};

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
    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatMemberName = (user: User = { email: "", id: "" }): string => {
  if (user.name) return user.name;
  if (user.full_name) return user.full_name;
  const parts = [
    user.first_name || user.firstName || null,
    user.middle_name || user.middleName || null,
    user.last_name || user.lastName || null,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (parts) return parts;
  return user.email || (user.id ? `User #${user.id}` : "Unknown user");
};

const INVITE_FORM_DEFAULT: InviteForm = {
  name: "",
  email: "",
  role: "member",
  note: "",
};

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

export default function AdminProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adminToken = useAdminAuthStore((state) => state.token);

  const [activeSection, setActiveSection] = useState("overview");
  const [isAssignEdgeOpen, setIsAssignEdgeOpen] = useState(false);
  const [isEdgeSyncing, setIsEdgeSyncing] = useState(false);
  const [activePaymentPayload, setActivePaymentPayload] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [membershipError, setMembershipError] = useState("");
  const [activeTeamTab, setActiveTeamTab] = useState("provisioning");
  const [inviteForm, setInviteForm] = useState<InviteForm>(INVITE_FORM_DEFAULT);
  const [isInviteSubmitting, setIsInviteSubmitting] = useState(false);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState("");
  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);

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
  } = useProjectStatus(projectId, {
    refetchInterval: (query) => {
      const status = query?.state?.data?.project?.status;
      return status === "provisioning" || status === "pending" ? 3000 : false;
    },
  });

  const {
    data: projectDetailsResponse,
    isFetching: isProjectDetailsFetching,
    refetch: refetchProjectDetails,
  } = useFetchProjectById(projectId, {
    enabled: Boolean(projectId),
    refetchInterval: (query) => {
      const status = query?.state?.data?.data?.status;
      return status === "provisioning" || status === "pending" ? 3000 : false;
    },
  });

  const { data: infraStatusData } = useProjectInfrastructureStatus(projectId, {
    enabled: Boolean(projectId),
  }) as any;

  const allProjectUsers = useMemo(() => {
    if (Array.isArray(projectDetailsResponse?.users)) return projectDetailsResponse.users;
    if (Array.isArray(projectStatusData?.project?.users)) return projectStatusData.project.users;
    if (Array.isArray(projectStatusData?.project?.users?.local))
      return projectStatusData.project.users.local;
    return [];
  }, [projectDetailsResponse, projectStatusData]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Todo: Implement invite logic
    ToastUtils.info("Invite functionality coming soon.");
  };

  useEffect(() => {
    if (!inviteSuccessMessage) return;
    const timer = setTimeout(() => setInviteSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [inviteSuccessMessage]);

  const { mutateAsync: updateProjectMembers, isPending: isMembershipUpdating } = useUpdateProject();
  const { mutateAsync: runProvisioning, isPending: isProvisioning } = useProvisionProject();

  const updateResourceCount = useCallback((resource: string, count: number) => {
    setResourceCounts((prev) => {
      if (prev[resource] === count) {
        return prev;
      }
      return { ...prev, [resource]: count };
    });
  }, []);

  const infrastructureComponents = infraStatusData?.data?.components;
  const edgeComponent = infrastructureComponents?.edge_networks ?? infrastructureComponents?.edge;

  const project = projectStatusData?.project;

  const { data: networksData } = useFetchNetworks(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });

  const { data: keyPairsData } = useFetchKeyPairs(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });
  const { data: securityGroupsData } = useFetchSecurityGroups(
    project?.identifier,
    project?.region,
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: subnetsData } = useFetchSubnets(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });
  const { data: igwsData } = useFetchIgws(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });
  const { data: routeTablesData } = useFetchRouteTables(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });
  const { data: networkInterfacesData } = useFetchNetworkInterfaces(
    project?.identifier,
    project?.region,
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: elasticIpsData } = useFetchElasticIps(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });
  const { data: vpcsData } = useFetchVpcs(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });

  useEffect(() => {
    if (Array.isArray(networksData)) {
      updateResourceCount("networks", networksData.length);
    }
  }, [networksData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(vpcsData)) {
      updateResourceCount("vpcs", vpcsData.length);
    } else if (infraStatusData?.data?.components?.vpc?.count !== undefined) {
      // Fallback to infrastructure status if VPCs data is not available
      updateResourceCount("vpcs", infraStatusData.data.components.vpc.count);
    }
  }, [vpcsData, infraStatusData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(keyPairsData)) {
      updateResourceCount("keyPairs", keyPairsData.length);
      updateResourceCount("key_pairs", keyPairsData.length);
    }
  }, [keyPairsData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(securityGroupsData) && securityGroupsData.length > 0) {
      updateResourceCount("security_groups", securityGroupsData.length);
    } else if (infraStatusData?.data?.components?.security_groups?.count !== undefined) {
      updateResourceCount("security_groups", infraStatusData.data.components.security_groups.count);
    }
  }, [securityGroupsData, infraStatusData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(subnetsData) && subnetsData.length > 0) {
      updateResourceCount("subnets", subnetsData.length);
    } else if (infraStatusData?.data?.components?.subnets?.count !== undefined) {
      updateResourceCount("subnets", infraStatusData.data.components.subnets.count);
    }
  }, [subnetsData, infraStatusData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(igwsData)) {
      updateResourceCount("internet_gateways", igwsData.length);
    }
  }, [igwsData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(routeTablesData)) {
      updateResourceCount("routeTables", routeTablesData.length);
      updateResourceCount("route_tables", routeTablesData.length);
    }
  }, [routeTablesData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(networkInterfacesData)) {
      updateResourceCount("enis", networkInterfacesData.length);
      updateResourceCount("network_interfaces", networkInterfacesData.length);
    }
  }, [networkInterfacesData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(elasticIpsData)) {
      updateResourceCount("eips", elasticIpsData.length);
      updateResourceCount("elastic_ips", elasticIpsData.length);
    }
  }, [elasticIpsData, updateResourceCount]);
  const summary = project?.summary ?? [];

  // Initialize Real-time Provisioning Hook
  useProjectBroadcasting(project?.id);

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
  const resolvedProjectId = project?.identifier || projectId;

  // Network expansion hooks (must be after resolvedProjectId is defined)
  const { data: networkStatusData, refetch: refetchNetworkStatus } = useProjectNetworkStatus(
    resolvedProjectId,
    { enabled: Boolean(resolvedProjectId) }
  );

  // Track previous status to detect provisioning completion
  const prevProjectStatusRef = useRef<string | undefined>(undefined);

  // Auto-refetch network data when provisioning completes
  useEffect(() => {
    const currentStatus = project?.status;
    const prevStatus = prevProjectStatusRef.current;

    // Detect transition from provisioning/pending to ready/active/completed
    if (
      prevStatus &&
      (prevStatus === "provisioning" || prevStatus === "pending") &&
      currentStatus &&
      (currentStatus === "ready" || currentStatus === "active" || currentStatus === "completed")
    ) {
      console.log("[AdminProjectDetails] Provisioning completed, refreshing network data...");
      // Trigger refetch of all network-related data
      refetchNetworkStatus?.();
      refetchProjectStatus?.();
      // Invalidate network queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ["networks"] });
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["securityGroups"] });
      queryClient.invalidateQueries({ queryKey: ["igws"] });
      queryClient.invalidateQueries({ queryKey: ["internet_gateways"] });
    }

    prevProjectStatusRef.current = currentStatus;
  }, [project?.status, refetchNetworkStatus, refetchProjectStatus, queryClient]);

  // Also detect when all provisioning_progress steps complete (for 100% READY state)
  const prevAllStepsCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    const progress = project?.provisioning_progress;
    if (!Array.isArray(progress) || progress.length === 0) return;

    const allCompleted = progress.every((step: any) => step.status === "completed");
    const wasIncomplete = !prevAllStepsCompletedRef.current;

    // Detect transition to all-completed state
    if (allCompleted && wasIncomplete) {
      console.log(
        "[AdminProjectDetails] All provisioning steps completed, refreshing network data..."
      );
      // Short delay to allow backend to finalize
      setTimeout(() => {
        refetchNetworkStatus?.();
        refetchProjectStatus?.();
        queryClient.invalidateQueries({ queryKey: ["networks"] });
        queryClient.invalidateQueries({ queryKey: ["vpcs"] });
        queryClient.invalidateQueries({ queryKey: ["subnets"] });
        queryClient.invalidateQueries({ queryKey: ["securityGroups"] });
        queryClient.invalidateQueries({ queryKey: ["igws"] });
      }, 500);
    }

    prevAllStepsCompletedRef.current = allCompleted;
  }, [project?.provisioning_progress, refetchNetworkStatus, refetchProjectStatus, queryClient]);

  // Extract network data from response (handle wrapped or unwrapped structure)
  const networkData =
    networkStatusData?.network || networkStatusData?.data?.network || networkStatusData;

  const { mutateAsync: enableInternet, isPending: isEnablingInternet } = useEnableInternetAccess();

  const { data: edgeConfig, refetch: refetchEdgeConfig } = useFetchProjectEdgeConfigAdmin(
    resolvedProjectId,
    project?.region,
    {
      enabled: Boolean(resolvedProjectId && project?.region),
    }
  );
  const edgePayload = edgeConfig?.data ?? edgeConfig;
  const projectDetailsPayload = projectDetailsResponse?.data ?? projectDetailsResponse;
  const projectDetails = projectDetailsPayload || project;

  const projectTenantId = useMemo(
    () =>
      project?.tenant_id ||
      projectDetails?.tenant_id ||
      project?.tenant?.id ||
      projectDetails?.tenant?.id ||
      null,
    [project, projectDetails]
  );

  const projectClientId = useMemo(() => {
    if (projectDetails?.client_id) return projectDetails.client_id;
    if (project?.client_id) return project.client_id;
    if (Array.isArray(projectDetails?.clients) && projectDetails.clients.length) {
      return projectDetails.clients[0]?.id ?? null;
    }
    if (Array.isArray(project?.clients) && project.clients.length) {
      return project.clients[0]?.id ?? null;
    }
    return null;
  }, [project, projectDetails]);

  const assignmentScope =
    projectDetails?.assignment_scope ||
    project?.assignment_scope ||
    (projectClientId ? "client" : projectTenantId ? "tenant" : "internal");

  const membershipParams = useMemo(() => {
    if (!assignmentScope && !projectTenantId && !projectClientId) {
      return null;
    }
    return {
      scope: assignmentScope || undefined,
      tenant_id: projectTenantId || undefined,
      client_id: projectClientId || undefined,
    };
  }, [assignmentScope, projectTenantId, projectClientId]);

  const { data: membershipSuggestions = [], isFetching: isMembershipFetching } =
    useProjectMembershipSuggestions(membershipParams ?? {}, {
      enabled: isMemberModalOpen && Boolean(membershipParams),
    });

  const providerLabel =
    project?.region_name ||
    project?.region ||
    projectDetails?.region_name ||
    projectDetails?.region ||
    "Provider";
  const projectUsers = project?.users?.local ?? [];
  const tenantAdminUsers = projectUsers.filter(isTenantAdmin);
  const tenantAdminCount = tenantAdminUsers.length;
  const hasTenantAdmin = tenantAdminCount > 0;
  const tenantAdminFullyReady = useMemo(
    () =>
      tenantAdminUsers.some(
        (user: User) =>
          isTenantAdmin(user) &&
          user?.status?.provider_account &&
          user?.status?.aws_policy &&
          user?.status?.symp_policy
      ),
    [tenantAdminUsers]
  );
  const hasAssignedProjectUser = projectUsers.length > 0;
  const hasProviderAccountUser = projectUsers.some((user: User) =>
    Boolean(user?.status?.provider_account)
  );
  const hasStoragePolicyUser = projectUsers.some((user: User) => Boolean(user?.status?.aws_policy));
  const hasNetworkPolicyUser = projectUsers.some((user: User) =>
    Boolean(user?.status?.symp_policy)
  );
  const fallbackSetupConditionsMet =
    hasAssignedProjectUser &&
    hasProviderAccountUser &&
    hasStoragePolicyUser &&
    hasNetworkPolicyUser &&
    tenantAdminFullyReady;

  const summaryPatternSets = useMemo(() => {
    const normalizePatterns = (patterns: string[] = []) =>
      patterns.map((pattern: any) => normalizeSummaryKey(pattern)).filter(Boolean);
    return {
      users: normalizePatterns([
        "Users Assigned",
        "Users Added",
        "Users Added (Local)",
        "Users Created",
      ]),
      accounts: normalizePatterns([
        `${providerLabel} Accounts`,
        "Users Assigned Accounts",
        "Accounts Assigned",
        "Accounts Provisioned",
      ]),
      storage: normalizePatterns(["Storage Policies Applied", "Storage Policies"]),
      network: normalizePatterns(["Network Policies Applied", "Network Policies"]),
      tenantAdmin: normalizePatterns(["Tenant Admin Role Assigned", "Tenant Admin"]),
    };
  }, [providerLabel]);

  const matchSummaryEntry = (patternSet: string[] = []) => {
    if (!patternSet.length) return null;
    for (const pattern of patternSet) {
      if (summaryStatusMap.has(pattern)) {
        return summaryStatusMap.get(pattern);
      }
    }
    for (const [key, value] of summaryStatusMap.entries()) {
      if (patternSet.some((pattern) => key.includes(pattern))) {
        return value;
      }
    }
    return null;
  };
  const fallbackRatioStats = useMemo(() => {
    const totalUsers = projectUsers.length;
    const accountsReady = projectUsers.filter((user: User) =>
      Boolean(user?.status?.provider_account)
    ).length;
    const storageReady = projectUsers.filter((user: User) =>
      Boolean(user?.status?.aws_policy)
    ).length;
    const networkReady = projectUsers.filter((user: User) =>
      Boolean(user?.status?.symp_policy)
    ).length;
    const tenantAdminReady = tenantAdminUsers.length;
    const fallbackTotal = Math.max(totalUsers, 1);

    return {
      users: { ready: totalUsers, total: fallbackTotal },
      accounts: { ready: accountsReady, total: Math.max(totalUsers || accountsReady, 1) },
      storage: { ready: storageReady, total: Math.max(totalUsers || storageReady, 1) },
      network: { ready: networkReady, total: Math.max(totalUsers || networkReady, 1) },
      tenantAdmin: { ready: tenantAdminReady, total: Math.max(totalUsers || tenantAdminReady, 1) },
    };
  }, [projectUsers, tenantAdminUsers]);

  const isFallbackCategoryReady = (category: keyof typeof fallbackRatioStats) => {
    const stats = fallbackRatioStats[category];
    return Boolean(stats && stats.ready > 0);
  };
  const isSummaryCategoryReady = (
    patternSet: string[],
    category: keyof typeof fallbackRatioStats
  ) => {
    const entry = matchSummaryEntry(patternSet);
    if (!entry) {
      return isFallbackCategoryReady(category);
    }
    if (entry.completed === true || entry.complete === true) return true;
    const ready = entry.count ?? 0;
    const missing = entry.missing_count ?? 0;
    if (ready > 0 && missing <= 0) return true;
    return isFallbackCategoryReady(category);
  };
  const summaryDrivenSetupMet =
    isSummaryCategoryReady(summaryPatternSets.users, "users") &&
    isSummaryCategoryReady(summaryPatternSets.accounts, "accounts") &&
    isSummaryCategoryReady(summaryPatternSets.storage, "storage") &&
    isSummaryCategoryReady(summaryPatternSets.network, "network") &&
    isSummaryCategoryReady(summaryPatternSets.tenantAdmin, "tenantAdmin");

  const setupConditionsMet = summaryDrivenSetupMet || fallbackSetupConditionsMet;
  const projectUserIdSet = useMemo(
    () =>
      new Set<number>(
        projectUsers
          .map((user: User) => Number(user.id))
          .filter((id: number) => Number.isFinite(id))
      ),
    [projectUsers]
  );

  useEffect(() => {
    if (!isMemberModalOpen) return;
    setSelectedMemberIds(new Set(projectUserIdSet));
    setMembershipError("");
  }, [isMemberModalOpen, projectUserIdSet]);

  const normalizedMembershipOptions = useMemo(() => {
    const entries = Array.isArray(membershipSuggestions) ? membershipSuggestions : [];
    const map = new Map();
    const upsertMember = (user: any, { isCurrent = false, isOwner = false } = {}) => {
      if (!user || user.id === undefined || user.id === null) return;
      const id = Number(user.id);
      if (!Number.isFinite(id)) return;
      const existing = map.get(id) || {};
      map.set(id, {
        id,
        name: existing.name || formatMemberName(user),
        email: existing.email || user.email || "",
        role:
          existing.role ||
          (Array.isArray(user.roles)
            ? user.roles.join(", ")
            : user.role || user.status?.role || ""),
        isCurrent: existing.isCurrent || isCurrent,
        isOwner: existing.isOwner || isOwner,
      });
    };

    entries.forEach((user: any) => {
      const numericId = Number(user?.id);
      upsertMember(user, {
        isCurrent: projectUserIdSet.has(numericId),
        isOwner: tenantAdminUsers.some((admin: User) => Number(admin.id) === numericId),
      });
    });

    projectUsers.forEach((user: User) => {
      upsertMember(user, {
        isCurrent: true,
        isOwner: isTenantAdmin(user),
      });
    });

    return Array.from(map.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [membershipSuggestions, projectUsers, projectUserIdSet, tenantAdminUsers]);

  const pendingOwnerCount = useMemo(() => {
    if (!selectedMemberIds || selectedMemberIds.size === 0) return 0;
    return tenantAdminUsers.reduce((count: number, user: User) => {
      const id = Number(user.id);
      if (!Number.isFinite(id)) {
        return count;
      }
      return selectedMemberIds.has(id) ? count + 1 : count;
    }, 0);
  }, [selectedMemberIds, tenantAdminUsers]);

  const ownerWarningMessage =
    tenantAdminCount > 0 && isMemberModalOpen && pendingOwnerCount === 0
      ? "Add another owner before removing the last one."
      : "";

  const projectInstances = useMemo(() => {
    if (Array.isArray(projectDetails?.instances)) {
      return projectDetails.instances;
    }
    if (Array.isArray(project?.instances)) {
      return project.instances;
    }
    if (Array.isArray(projectDetails?.pending_instances)) {
      return projectDetails.pending_instances;
    }
    return [];
  }, [projectDetails, project]);

  const instanceCount = projectInstances.length;

  const infrastructureSections = [
    { key: "user-provisioning", label: "Team access", icon: <Shield size={16} /> },
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
    // Helper to check infra status from backend if available
    const checkInfraStatus = (key: string) => {
      const components = infraStatusData?.data?.components;
      if (!components) return null;
      const comp = components[key];
      if (!comp) return false;
      return (
        comp.status === "active" || comp.status === "completed" || (comp.count && comp.count > 0)
      );
    };

    switch (sectionKey) {
      case "user-provisioning":
        return tenantAdminFullyReady;
      case "setup":
        return setupConditionsMet;
      case "vpcs": {
        const infraStatus = checkInfraStatus("vpc");
        // If infraStatus is available, strictly check count > 0 (or status completed which implies it)
        // But user asked for count > 0 specifically.
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
        if (projectDetails?.vpc_enabled) return true; // Fallback
        return summaryFlag ?? false;
      }
      case "networks": {
        const infraStatus = checkInfraStatus("networks"); // or whatever key backend uses, likely 'networks' isn't in standard map yet so fallback
        if ((resourceCounts.networks ?? 0) > 0) return true;
        const summaryFlag = summaryCompleted("network", "networks", "subnet", "subnets"); // Legacy summary check
        if (summaryFlag === true) return true;
        return summaryFlag ?? false;
      }
      case "keypairs": {
        const infraStatus = checkInfraStatus("keypairs");
        if (infraStatus !== null) return infraStatus;

        if ((resourceCounts.keyPairs ?? 0) > 0) return true;
        const summaryFlag = summaryCompleted("keypair", "keypairs", "createkeypair");
        if (summaryFlag === true) return true;
        return summaryFlag ?? false;
      }
      case "edge": {
        const infraStatus = checkInfraStatus("edge_networks");
        if (infraStatus !== null) return infraStatus;

        const edgeSummary = summaryCompleted("edge", "edge network", "edge_network");
        if (edgeSummary === true) return true;
        if (
          edgePayload &&
          (Array.isArray(edgePayload)
            ? edgePayload.length > 0
            : Object.keys(edgePayload).length > 0)
        )
          return true;
        return edgeSummary ?? false;
      }
      case "security-groups": {
        const infraStatus = checkInfraStatus("security_groups");
        if (infraStatus !== null) return infraStatus;
        if ((resourceCounts.security_groups ?? 0) > 0) return true;
        const summaryFlag = summaryCompleted("securitygroup", "securitygroups");
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
      case "igws": {
        const infraStatus = checkInfraStatus("internet_gateways");
        if (infraStatus !== null) return infraStatus;
        return (resourceCounts.internet_gateways ?? 0) > 0;
      }
      case "route-tables": {
        const infraStatus = checkInfraStatus("route_tables");
        if (infraStatus !== null) return infraStatus;
        return (resourceCounts.routeTables ?? 0) > 0;
      }
      case "enis": {
        const infraStatus = checkInfraStatus("network_interfaces");
        if (infraStatus !== null) return infraStatus;
        return (resourceCounts.enis ?? 0) > 0;
      }
      case "eips": {
        const infraStatus = checkInfraStatus("elastic_ips");
        if (infraStatus !== null) return infraStatus;
        return (resourceCounts.eips ?? 0) > 0;
      }
      default:
        return false;
    }
  };
  const completedSections = infrastructureSections.filter((section: any) =>
    getStatusForSection(section.key)
  ).length;
  const healthPercent = Math.round((completedSections / infrastructureSections.length) * 100);

  const projectStatusVariant = getProjectStatusVariant(project?.status || projectDetails?.status);
  const totalInfraSections = infrastructureSections.length || 1;
  const infrastructureStepLabel = `${completedSections}/${totalInfraSections} infra steps`;
  const heroProjectIdentifier =
    project?.identifier || projectDetails?.identifier || resolvedProjectId || projectId;
  const heroProviderLabel = project?.provider || projectDetails?.provider || "Provider";
  const heroRegionLabel = (project?.region || projectDetails?.region || "Region").toUpperCase();

  const metadataItems = useMemo(
    () => [
      {
        label: "Project Identifier",
        value: heroProjectIdentifier || "—",
      },
      {
        label: "Project Type",
        value: toTitleCase(projectDetails?.type || project?.type || "Unknown"),
      },
      {
        label: "Created",
        value: formatDate(projectDetails?.created_at || project?.created_at),
      },
      {
        label: "Instances",
        value: `${instanceCount} tracked`,
      },
    ],
    [
      heroProjectIdentifier,
      instanceCount,
      project?.created_at,
      project?.type,
      projectDetails?.created_at,
      projectDetails?.type,
    ]
  );

  const summaryMetrics = useMemo(
    () => [
      {
        label: "Project Type",
        value: toTitleCase(projectDetails?.type || project?.type),
        helper: "Deployment model for workloads",
        icon: Layers,
      },
      {
        label: "Region",
        value: heroRegionLabel,
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
        value: formatDate(projectDetails?.created_at || project?.created_at),
        helper: "Project inception date",
        icon: Clock,
      },
    ],
    [
      heroRegionLabel,
      instanceCount,
      project?.created_at,
      project?.type,
      projectDetails?.created_at,
      projectDetails?.type,
    ]
  );

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <ModernButton
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => navigate("/admin-dashboard/projects")}
      >
        Projects
      </ModernButton>
      <ModernButton
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => refetchProjectStatus()}
        disabled={isProjectStatusFetching}
      >
        <RefreshCw size={14} className={isProjectStatusFetching ? "animate-spin" : ""} />
        Refresh
      </ModernButton>
      <ModernButton
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setIsAssignEdgeOpen(true)}
      >
        Manage edge config
      </ModernButton>
    </div>
  );

  const areAllSummaryItemsComplete = summary.every(
    (item: any) => item.completed === true || item.complete === true
  );

  const canCreateInstances = areAllSummaryItemsComplete && hasTenantAdmin && setupConditionsMet;

  const missingInstancePrereqs: string[] = [];
  if (!areAllSummaryItemsComplete) missingInstancePrereqs.push("Complete provisioning checklist");
  if (!hasTenantAdmin) missingInstancePrereqs.push("Assign tenant admin");
  if (!setupConditionsMet) missingInstancePrereqs.push("Complete project setup");

  const quickStatusItems = [
    {
      label: "Provisioning ready",
      active: areAllSummaryItemsComplete && hasTenantAdmin,
      tone: areAllSummaryItemsComplete && hasTenantAdmin ? "success" : "danger",
    },
    {
      label: "Edge configuration synced",
      active: Boolean(
        edgeComponent &&
        (edgeComponent.status === "completed" ||
          (typeof edgeComponent.count === "number" && edgeComponent.count > 0))
      ),
      tone:
        edgeComponent &&
        (edgeComponent.status === "completed" ||
          (typeof edgeComponent.count === "number" && edgeComponent.count > 0))
          ? "success"
          : "neutral",
    },
    {
      label: "Tenant admin present",
      active: hasTenantAdmin,
      tone: hasTenantAdmin ? "success" : "danger",
    },
    {
      label: "Instance prerequisites ready",
      active: canCreateInstances,
      tone: canCreateInstances ? "success" : "danger",
    },
  ];

  const handleSectionClick = (key: string) => {
    setActiveSection(key);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };
  const { mutate: enableVpc, isPending: isVpcEnabling } = useEnableVpc();

  const handleEnableVpc = () => {
    if (!resolvedProjectId) return;
    enableVpc(resolvedProjectId, {
      onSuccess: () => {
        ToastUtils.success("VPC enablement initiated successfully.");
        refetchProjectDetails(); // Using refetchProjectDetails as refetchProject was not defined
      },
      onError: (error) => {
        ToastUtils.error(`Failed to enable VPC: ${error.message}`);
      },
    });
  };
  const handleEdgeSync = async () => {
    if (!resolvedProjectId || !project?.region) {
      return;
    }
    if (isEdgeSyncing) return;
    try {
      setIsEdgeSyncing(true);
      await syncProjectEdgeConfigAdmin({ project_id: resolvedProjectId, region: project.region });
      await refetchEdgeConfig();
    } catch (error) {
      console.error("Failed to sync edge config:", error);
    } finally {
      setIsEdgeSyncing(false);
    }
  };

  const handleNavigateAddInstance = () => {
    if (!resolvedProjectId) return;
    navigate(`/admin-dashboard/create-instance?project=${encodeURIComponent(resolvedProjectId)}`);
  };
  const handleViewInstanceDetails = (instance: any) => {
    if (!instance?.identifier) return;
    navigate(
      `/admin-dashboard/instances/details?identifier=${encodeURIComponent(instance.identifier)}`
    );
  };
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

  const handleOpenPayment = (entry: any) => {
    setActivePaymentPayload(entry);
    setIsPaymentModalOpen(true);
  };
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setActivePaymentPayload(null);
  };
  const handlePaymentComplete = async () => {
    closePaymentModal();
    await Promise.all([refetchProjectStatus(), refetchProjectDetails()]);
  };
  const handleToggleMember = (id: number) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenericAction = async ({ method, endpoint, label, payload = {} }) => {
    try {
      ToastUtils.info(`Executing ${label}...`);
      const res = await api(method.toUpperCase(), endpoint, payload);
      ToastUtils.success(`${label} completed successfully!`);
      await Promise.all([refetchProjectStatus(), refetchProjectDetails()]);
      return res;
    } catch (error: any) {
      console.error(`Action error [${label}]:`, error);
      ToastUtils.error(error?.message || `Failed to execute ${label}`);
      throw error;
    }
  };

  const handleUserAction = async (user: User, actionKey: string) => {
    const action = user?.actions?.[actionKey];
    if (!action) return;

    await handleGenericAction({
      method: action.method || "POST",
      endpoint: action.endpoint,
      label: action.label || actionKey,
      payload: action.payload_defaults || {},
    });
  };
  const handleSaveMembers = async () => {
    // Implementation for saving members
  };
  const renderSectionContent = () => {
    const contextualActions = summary.filter((item) => !item.completed && item.action);

    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            {contextualActions.length > 0 && (
              <ModernCard className="border-l-4 border-l-yellow-400 bg-yellow-50/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="text-yellow-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">Required Actions</h3>
                  </div>
                  <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                    {contextualActions.length} Pending
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contextualActions.map((item, idx) => (
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
                identifier: project?.identifier || resolvedProjectId || "",
                name: project?.name || "Project",
                status: project?.status || "unknown",
                region: project?.region,
                region_name: project?.region_name,
                provider: project?.provider,
                created_at: project?.created_at,
              }}
              instanceStats={{
                total: instanceStats?.total || 0,
                running: instanceStats?.running || 0,
                stopped:
                  (instanceStats?.total || 0) -
                  (instanceStats?.running || 0) -
                  (instanceStats?.provisioning || 0),
                provisioning: instanceStats?.provisioning || 0,
              }}
              resourceCounts={{
                vpcs: resourceCounts.vpcs ?? networkData?.vpc?.count ?? 0,
                subnets: resourceCounts.subnets ?? networkData?.subnets?.count ?? 0,
                security_groups:
                  resourceCounts.security_groups ?? networkData?.security_groups?.count ?? 0,
                key_pairs: resourceCounts.key_pairs ?? networkData?.key_pairs?.count ?? 0,
                route_tables: resourceCounts.route_tables ?? networkData?.route_tables?.count ?? 0,
                elastic_ips: resourceCounts.elastic_ips ?? networkData?.elastic_ips?.count ?? 0,
                network_interfaces:
                  resourceCounts.network_interfaces ?? networkData?.network_interfaces?.count ?? 0,
                internet_gateways:
                  resourceCounts.internet_gateways ?? networkData?.internet_gateways?.count ?? 0,
              }}
              networkStatus={networkData}
              vpcs={networksData || []}
              subnets={subnetsData || []}
              igws={igwsData || []}
              setupSteps={
                Array.isArray(project?.provisioning_progress)
                  ? project.provisioning_progress.map((step: any) => ({
                      id: step.id || step.label?.toLowerCase()?.replace(/\s+/g, "_") || "step",
                      label: step.label || "Step",
                      status: step.status as any,
                      description: step.status === "completed" ? "Completed" : "Action in progress",
                      updated_at: step.updated_at,
                    }))
                  : project?.status === "provisioning" &&
                      Array.isArray(project?.provisioning_progress)
                    ? project.provisioning_progress.map((step: any) => ({
                        id: step.id || step.label?.toLowerCase()?.replace(/\s+/g, "_") || "step",
                        label: step.label || "Step",
                        status: step.status as any,
                        description:
                          step.status === "completed" ? "Completed" : "Action in progress",
                        updated_at: step.updated_at,
                      }))
                    : quickStatusItems?.map((item: any) => ({
                        id: item.label?.toLowerCase()?.replace(/\s+/g, "_") || "step",
                        label: item.label || "Step",
                        status: item.active ? ("completed" as const) : ("not_started" as const),
                        description: item.active ? "Ready" : "Action required",
                      }))
              }
              setupProgressPercent={healthPercent}
              edgeNetworkConnected={!!edgePayload?.edge_network_id}
              edgeNetworkName={edgePayload?.edge_network_name}
              onAddInstance={handleNavigateAddInstance}
              onEnableInternet={async () => {
                try {
                  const result = await enableInternet(resolvedProjectId);
                  const alreadyEnabled = result?.already_enabled || result?.data?.already_enabled;
                  if (alreadyEnabled) {
                    ToastUtils.info("Internet access is already enabled for this project.");
                  } else {
                    ToastUtils.success("Internet access enabled successfully!");
                  }
                  await refetchNetworkStatus();
                  await refetchProjectStatus();
                } catch (error: any) {
                  console.error("Enable internet error:", error);
                  ToastUtils.error(error?.message || "Failed to enable internet access");
                }
              }}
              onManageMembers={() => setIsMemberModalOpen(true)}
              onSyncResources={() => {
                refetchNetworkStatus();
                // Invalidate local queries to pick up synced data
                queryClient.invalidateQueries(["networks"]);
                queryClient.invalidateQueries(["vpcs"]);
                queryClient.invalidateQueries(["subnets"]);
                queryClient.invalidateQueries(["securityGroups"]);
                queryClient.invalidateQueries(["security_groups"]);
                queryClient.invalidateQueries(["keyPairs"]);
                queryClient.invalidateQueries(["key_pairs"]);
                queryClient.invalidateQueries(["igws"]);
                queryClient.invalidateQueries(["internet_gateways"]);
                queryClient.invalidateQueries(["routeTables"]);
                queryClient.invalidateQueries(["route_tables"]);
                queryClient.invalidateQueries(["elasticIps"]);
                queryClient.invalidateQueries(["elastic_ips"]);
                queryClient.invalidateQueries(["networkInterfaces"]);

                refetchProjectStatus();
                refetchProjectDetails();
              }}
              onViewNetworkDetails={() => handleSectionClick?.("vpcs")}
              onCompleteSetup={async () => {
                try {
                  ToastUtils.info("Restarting infrastructure provisioning...");
                  await runProvisioning(resolvedProjectId);
                  ToastUtils.success("Provisioning sequence started!");
                  refetchProjectStatus();
                } catch (error: any) {
                  console.error("Provisioning error:", error);
                  ToastUtils.error(error?.message || "Failed to restart provisioning");
                }
              }}
              onViewKeyPairs={() =>
                navigate(
                  `/admin-dashboard/infrastructure/key-pairs?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewRouteTables={() =>
                navigate(
                  `/admin-dashboard/infrastructure/route-tables?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewElasticIps={() =>
                navigate(
                  `/admin-dashboard/infrastructure/elastic-ips?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewNetworkInterfaces={() =>
                navigate(
                  `/admin-dashboard/infrastructure/network-interfaces?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewVpcs={() =>
                navigate(
                  `/admin-dashboard/infrastructure/vpcs?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewSubnets={() =>
                navigate(
                  `/admin-dashboard/infrastructure/subnets?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewSecurityGroups={() =>
                navigate(
                  `/admin-dashboard/infrastructure/security-groups?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewNatGateways={() =>
                navigate(
                  `/admin-dashboard/infrastructure/nat-gateways?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewNetworkAcls={() =>
                navigate(
                  `/admin-dashboard/infrastructure/network-acls?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewVpcPeering={() =>
                navigate(
                  `/admin-dashboard/infrastructure/vpc-peering?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewInternetGateways={() =>
                navigate(
                  `/admin-dashboard/infrastructure/internet-gateways?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              onViewLoadBalancers={() =>
                navigate(
                  `/admin-dashboard/infrastructure/load-balancers?project=${project?.identifier || projectId}&region=${project?.region}`
                )
              }
              isEnablingInternet={isEnablingInternet}
              isSyncing={isProjectStatusFetching || isProjectDetailsFetching}
              isProvisioning={isProvisioning}
              showMemberManagement={true}
              showSyncButton={true}
            />
          </div>
        );
      case "user-provisioning":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Team Access</h3>
                <p className="text-sm text-gray-500">
                  Keep collaborators aligned—invite operators or tweak roles fast.
                </p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTeamTab("provisioning")}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeTeamTab === "provisioning" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTeamTab("invite")}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeTeamTab === "invite" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Invite
                </button>
              </div>
            </div>

            {activeTeamTab === "provisioning" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <ModernButton
                    size="sm"
                    variant="outline"
                    onClick={() => setIsMemberModalOpen(true)}
                  >
                    Manage Team
                  </ModernButton>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <ModernTable
                    data={allProjectUsers.map((user: User) => ({ ...user, id: user.id }))}
                    columns={[
                      {
                        key: "name",
                        header: "NAME",
                        render: (_, user: User) => (
                          <span className="font-medium text-gray-900">
                            {formatMemberName(user)}
                          </span>
                        ),
                      },
                      {
                        key: "email",
                        header: "EMAIL",
                        render: (val) => <span className="text-gray-500">{val}</span>,
                      },
                      {
                        key: "role",
                        header: "ROLE",
                        render: (_, user: User) => (
                          <div className="flex flex-col">
                            <span className="text-gray-900 border px-2 py-0.5 rounded-full text-[10px] w-fit font-mono font-bold uppercase mb-1">
                              {Array.isArray(user.roles)
                                ? user.roles[0] || "Member"
                                : user.role || user.status?.role || "Member"}
                            </span>
                            <div className="flex gap-1">
                              {user.status?.provider_account ? (
                                <span
                                  className="w-2 h-2 rounded-full bg-green-500"
                                  title="Provider Account Ready"
                                />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full bg-gray-200"
                                  title="No Provider Account"
                                />
                              )}
                              {user.status?.aws_policy ? (
                                <span
                                  className="w-2 h-2 rounded-full bg-blue-500"
                                  title="Storage Policy Attached"
                                />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full bg-gray-200"
                                  title="No Storage Policy"
                                />
                              )}
                              {user.status?.symp_policy ? (
                                <span
                                  className="w-2 h-2 rounded-full bg-indigo-500"
                                  title="Network Policy Attached"
                                />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full bg-gray-200"
                                  title="No Network Policy"
                                />
                              )}
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "actions",
                        header: "ACTIONS",
                        render: (_, user: User) => {
                          const userActions = user.actions || {};
                          return (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(userActions).map(([key, action]: [string, any]) => {
                                if (!action.show) return null;
                                return (
                                  <ModernButton
                                    key={key}
                                    size="xs"
                                    variant="outline"
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => handleUserAction(user, key)}
                                  >
                                    {action.label || key}
                                  </ModernButton>
                                );
                              })}
                            </div>
                          );
                        },
                      },
                    ]}
                    searchable={false}
                    filterable={false}
                    exportable={false}
                    paginated={false}
                    enableAnimations={false}
                    emptyMessage="No team members found."
                  />
                </div>
              </div>
            )}

            {activeTeamTab === "invite" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Note (Optional)
                    </label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      value={inviteForm.note}
                      onChange={(e) => setInviteForm({ ...inviteForm, note: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end">
                    <ModernButton type="submit" disabled={isInviteSubmitting}>
                      {isInviteSubmitting ? "Sending..." : "Send Invite"}
                    </ModernButton>
                  </div>
                </form>
              </div>
            )}
          </div>
        );

      case "vpcs":
        return <VPCs projectId={resolvedProjectId} region={project?.region} />;
      case "networks":
        return (
          <Networks
            projectId={resolvedProjectId}
            region={project?.region}
            onStatsUpdate={(count: number) => updateResourceCount("networks", count)}
          />
        );
      case "keypairs":
        return (
          <KeyPairs
            projectId={resolvedProjectId}
            region={project?.region}
            onStatsUpdate={(count: number) => updateResourceCount("keyPairs", count)}
          />
        );
      case "security-groups":
        return <SecurityGroup projectId={resolvedProjectId} region={project?.region} />;
      case "subnets":
        return <Subnets projectId={resolvedProjectId} region={project?.region} />;
      case "igws":
        return <IGWs projectId={resolvedProjectId} region={project?.region} />;
      case "route-tables":
        return <RouteTables projectId={resolvedProjectId} region={project?.region} />;
      case "enis":
        return <ENIs projectId={resolvedProjectId} region={project?.region} />;
      case "eips":
        return <EIPs projectId={resolvedProjectId} region={project?.region} />;
      default:
        return null;
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminActiveTab />
      <AdminPageShell
        title={project?.name || "Project Overview"}
        description={
          project
            ? `${project?.identifier || projectId} • ${project?.provider || "Provider"} • ${project?.region || "Region"}`
            : "Loading project context..."
        }
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <div className="flex items-center gap-2 mb-4">
          {activeSection !== "overview" && (
            <ModernButton
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs h-8"
              onClick={() => setActiveSection("overview")}
            >
              <ArrowLeft size={14} />
              Dashboard Overview
            </ModernButton>
          )}
        </div>

        {renderSectionContent()}
      </AdminPageShell>
      <ProjectMemberManagerModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={normalizedMembershipOptions as any[]}
        selectedIds={selectedMemberIds}
        onToggleMember={handleToggleMember}
        onSave={handleSaveMembers}
        isLoading={isMembershipFetching}
        isSaving={isMembershipUpdating}
        ownerWarning={ownerWarningMessage}
        errorMessage={membershipError}
      />

      {activePaymentPayload && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={closePaymentModal}
          transactionData={activePaymentPayload}
          onPaymentComplete={handlePaymentComplete}
          authToken={adminToken}
          apiBaseUrl={config.adminURL}
        />
      )}

      <AssignEdgeConfigModal
        isOpen={isAssignEdgeOpen}
        onClose={() => setIsAssignEdgeOpen(false)}
        projectId={resolvedProjectId}
        region={project?.region}
        onSuccess={async () => {
          await refetchProjectStatus();
          await refetchEdgeConfig();
        }}
      />
    </>
  );
}

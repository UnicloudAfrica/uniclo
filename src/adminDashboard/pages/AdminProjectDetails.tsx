import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Layers, MapPin, RefreshCw, Server, Shield, Wifi, Route } from "lucide-react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "../../shared/components/ui";
import PaymentModal from "../../shared/components/ui/PaymentModal";
import config from "../../config";
import {
  useFetchProjectById,
  useProjectStatus,
  useProjectMembershipSuggestions,
  useUpdateProject,
  useProjectNetworkStatus,
  useRevokeProjectUserPolicy,
  useAssignProjectUserPolicy,
  ProjectStatusResponse,
} from "../../hooks/adminHooks/projectHooks";
import { useCloudPolicies } from "../../hooks/adminHooks/cloudPolicyHooks";
import {
  useProjectInfrastructureStatus,
  useSyncProjectInfrastructure,
} from "../../hooks/adminHooks/projectInfrastructureHooks";
import { useFetchNetworks, useFetchNetworkInterfaces } from "../../hooks/adminHooks/networkHooks";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import { useFetchSecurityGroups } from "../../hooks/adminHooks/securityGroupHooks";
import { useFetchSubnets } from "../../hooks/adminHooks/subnetHooks";
import { useFetchIgws } from "../../hooks/adminHooks/igwHooks";
import { useFetchRouteTables } from "../../hooks/adminHooks/routeTableHooks";
import { useFetchElasticIps } from "../../hooks/adminHooks/eipHooks";
import { useFetchVpcs } from "../../hooks/adminHooks/vcpHooks";
import {
  useNatGateways,
  useNetworkAcls,
  useVpcPeering,
} from "../../hooks/adminHooks/vpcInfraHooks";
import { useLoadBalancers } from "../../hooks/adminHooks/loadBalancerHooks";
import { useFetchProjectEdgeConfigAdmin } from "../../hooks/adminHooks/edgeHooks";

import AssignEdgeConfigModal from "./projectComps/assignEdgeConfig";
import ToastUtils from "../../utils/toastUtil";

import api from "../../index/admin/api";

import InfrastructureSetupWizard from "../components/provisioning/InfrastructureSetupWizard";
import ProvisioningFullScreen from "../../shared/components/provisioning/ProvisioningFullScreen";

import ProjectMemberManagerModal from "../../shared/components/projects/ProjectMemberManagerModal";
import ProjectDetailsShell from "./projectDetails/ProjectDetailsShell";

import { ProjectUser, SummaryItem, SummaryAction } from "../../types/project";

import { ApiResponse } from "../../shared/types/resource";

// Types
interface User extends Omit<ProjectUser, "actions"> {
  actions?: Record<string, any>;
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
    const decoded = atob(decodeURIComponent(encodedId));
    // Sanity check: ensure no control characters (like null byte)
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F]/.test(decoded)) {
      return null;
    }
    return decoded;
  } catch (e) {
    return null;
  }
};

const isTenantAdmin = (user: User | null): boolean => {
  if (!user) return false;
  if (
    Array.isArray(user?.["roles"]) &&
    (user?.["roles"] as string[]).some((role) => role === "tenant_admin" || role === "tenant-admin")
  ) {
    return true;
  }
  if (typeof user?.["role"] === "string") {
    const role = (user?.["role"] as string).toLowerCase();
    if (role.includes("tenant_admin") || role.includes("tenant-admin")) return true;
  }
  if ((user?.["status"] as Record<string, any>)?.["tenant_admin"]) return true;
  return false;
};

const formatMemberName = (user: User | null): string => {
  if (!user) return "User";
  if (user?.["name"]) return user?.["name"] as string;
  if (user?.["full_name"]) return user?.["full_name"] as string;

  const firstName = user?.["first_name"] || user?.["firstName"] || "";
  const middleName = user?.["middle_name"] || user?.["middleName"] || "";
  const lastName = user?.["last_name"] || user?.["lastName"] || "";

  const name = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  return name || (user?.["email"] as string) || String(user?.["id"]) || "User";
};

const INVITE_FORM_DEFAULT: InviteForm = {
  name: "",
  email: "",
  role: "member",
  note: "",
};

export default function AdminProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAssignEdgeOpen, setIsAssignEdgeOpen] = useState(false);
  const [activePaymentPayload, setActivePaymentPayload] = useState<Record<string, unknown> | null>(
    null
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [membershipError, setMembershipError] = useState("");

  const [inviteForm, setInviteForm] = useState<InviteForm>(INVITE_FORM_DEFAULT);

  const [inviteSuccessMessage, setInviteSuccessMessage] = useState("");
  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>({});
  const [isInProvisioningMode, setIsInProvisioningMode] = useState(false);
  const [forceHideProvisioning, setForceHideProvisioning] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const identifierParam = queryParams.get("identifier");
  const encodedProjectId = queryParams.get("id");
  // Check if this is a newly created project (navigated from create form)
  const isNewProject = queryParams.get("new") === "true";
  const projectId = identifierParam
    ? identifierParam
    : encodedProjectId
      ? decodeId(encodedProjectId)
      : null;

  // Initialize provisioning mode if navigating from project creation
  useEffect(() => {
    if (isNewProject && !isInProvisioningMode) {
      setIsInProvisioningMode(true);
    }
  }, [isNewProject, isInProvisioningMode]);

  const {
    data: projectStatusData,
    isFetching: isProjectStatusFetching,
    refetch: refetchProjectStatus,
  } = useProjectStatus(projectId, {
    refetchInterval: (query) => {
      const data = query.state.data as ProjectStatusResponse | undefined;
      const status = data?.["project"]?.["status"];
      return status === "provisioning" || status === "pending" ? 3000 : false;
    },
  });

  const {
    data: projectDetailsResponse,

    refetch: refetchProjectDetails,
  } = useFetchProjectById(projectId, {
    enabled: Boolean(projectId),
    refetchInterval: (query: any) => {
      const status = query?.state?.data?.data?.status;
      return status === "provisioning" || status === "pending" ? 3000 : false;
    },
  }) as any;

  const { data: infraStatusData } = useProjectInfrastructureStatus(projectId, {
    enabled: Boolean(projectId),
  });

  const allProjectUsers = useMemo(() => {
    const details = projectDetailsResponse as ApiResponse<{ users?: User[] }> | undefined;
    const detailsUsers = details?.data?.users;
    if (Array.isArray(detailsUsers)) return detailsUsers;
    if (Array.isArray(projectStatusData?.project?.["users"]))
      return projectStatusData.project["users"] as User[];

    const statusUsers = projectStatusData?.project?.["users"] as
      | Record<string, unknown>
      | undefined;
    if (Array.isArray(statusUsers?.["local"])) return statusUsers["local"] as User[];
    return [];
  }, [projectDetailsResponse, projectStatusData]);

  const handleInviteSubmit = async (_e: React.FormEvent) => {
    _e.preventDefault();
    // Todo: Implement invite logic
    ToastUtils.info("Invite functionality coming soon.");
  };

  useEffect(() => {
    if (!inviteSuccessMessage) return;
    const timer = setTimeout(() => setInviteSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [inviteSuccessMessage]);

  useEffect(() => {
    setResourceCounts({});
  }, [projectId]);

  const { isPending: isMembershipUpdating } = useUpdateProject();

  const { mutateAsync: syncInfrastructure, isPending: isSyncingInfrastructure } =
    useSyncProjectInfrastructure();
  const { mutateAsync: revokePolicy, isPending: isRevokingPolicy } = useRevokeProjectUserPolicy();
  const { mutateAsync: assignPolicy, isPending: isAssigningPolicy } = useAssignProjectUserPolicy();

  const project = projectStatusData?.project;

  const { data: cloudPoliciesResponse } = useCloudPolicies(
    {
      region: project?.["region"] as string | undefined,
      active_only: true,
      provider: (project?.["provider"] as string | undefined) || "zadara",
    },
    { enabled: Boolean(project?.["region"]) }
  );

  const cloudPolicies = Array.isArray(cloudPoliciesResponse) ? cloudPoliciesResponse : [];

  const updateResourceCount = useCallback((resource: string, count: number) => {
    setResourceCounts((prev) => {
      if (prev[resource] === count) {
        return prev;
      }
      return { ...prev, [resource]: count };
    });
  }, []);

  // Compute setupSteps early for use in provisioning screen
  const setupSteps = useMemo(() => {
    const progress = project?.["provisioning_progress"];
    if (Array.isArray(progress)) {
      return progress.map((step) => ({
        id: step.id || (step as any)?.["label"]?.toLowerCase()?.replaceAll(/\s+/g, "_") || "step",
        label: (step as any)?.["label"] || "Step",
        status: (step as any)?.["status"] as any,
        description: (step as any)?.["status"] === "completed" ? "Completed" : "Action in progress",
        updated_at: (step as any)?.["updated_at"],
      }));
    }
    return [];
  }, [project?.["provisioning_progress"]]);

  // Sticky provisioning mode: once we enter provisioning, stay until all steps are complete
  const allStepsComplete =
    setupSteps.length > 0 && setupSteps.every((s) => s.status === "completed");

  useEffect(() => {
    // Enter provisioning mode when status becomes 'provisioning' OR when we have new=true param
    const currentStatus = project?.["status"];
    if ((currentStatus === "provisioning" || isNewProject) && !isInProvisioningMode) {
      setIsInProvisioningMode(true);
    }
    // Exit provisioning mode when:
    // 1. Status becomes 'active', OR
    // 2. All steps are complete (with a small delay for UX)
    if (isInProvisioningMode && (project?.status === "active" || allStepsComplete)) {
      // Add a small delay for the user to see 100% before transitioning
      const timer = setTimeout(() => {
        setIsInProvisioningMode(false);
        // Remove the 'new' param from URL to prevent re-entering provisioning mode on refresh
        if (isNewProject) {
          const newUrl = new URL(globalThis.window.location.href);
          newUrl.searchParams.delete("new");
          globalThis.window.history.replaceState({}, "", newUrl.toString());
        }
      }, 2000); // 2 second delay to show completion
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [project, project?.status, allStepsComplete, isInProvisioningMode, isNewProject]);

  const { data: networksData } = useFetchNetworks(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });

  const { data: keyPairsData } = useFetchKeyPairs(
    project?.identifier || project?.id,
    project?.region,
    {
      enabled: Boolean((project?.identifier || project?.id) && project?.region),
    }
  );
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
  const { data: natGatewaysData } = useNatGateways(project?.identifier);
  const { data: networkAclsData } = useNetworkAcls(project?.identifier);
  const { data: vpcPeeringData } = useVpcPeering(project?.identifier);
  const { data: loadBalancersData } = useLoadBalancers(project?.identifier);

  useEffect(() => {
    if (Array.isArray(networksData)) {
      updateResourceCount("networks", networksData.length);
    }
  }, [networksData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(vpcsData)) {
      updateResourceCount("vpcs", vpcsData.length);
    } else {
      const vpcCount = (infraStatusData as any)?.["data"]?.["components"]?.["vpc"]?.["count"];
      if (vpcCount !== undefined) {
        updateResourceCount("vpcs", vpcCount);
      }
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

  useEffect(() => {
    if (Array.isArray(natGatewaysData)) {
      updateResourceCount("nat_gateways", natGatewaysData.length);
    }
  }, [natGatewaysData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(networkAclsData)) {
      updateResourceCount("network_acls", networkAclsData.length);
    }
  }, [networkAclsData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(vpcPeeringData)) {
      updateResourceCount("vpc_peering", vpcPeeringData.length);
    }
  }, [vpcPeeringData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(loadBalancersData)) {
      updateResourceCount("load_balancers", loadBalancersData.length);
    }
  }, [loadBalancersData, updateResourceCount]);
  const summary = (project?.["summary"] ?? []) as SummaryItem[];
  const requiredActions = useMemo(
    () => summary.filter((item) => !item?.["completed"] && item?.["action"]),
    [summary]
  );

  // useProjectBroadcasting is now handled by the useProjectDetailsAdapter shared hook
  // which is called inside ProjectDetailsShell below.

  const normalizeSummaryKey = (value: string = "") =>
    value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

  const summaryStatusMap = useMemo(() => {
    const map = new Map<string, SummaryItem>();
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

  const summaryCompleted = (...labels: string[]) => {
    for (const label of labels) {
      const normalized = normalizeSummaryKey(label);
      if (summaryStatusMap.has(normalized)) {
        const item = summaryStatusMap.get(normalized);
        return item?.["completed"] ?? item?.["complete"] ?? false;
      }
    }
    return undefined;
  };
  const resolvedProjectId = project?.identifier || projectId;

  // Network expansion hooks (must be after resolvedProjectId is defined)
  const { data: networkStatusData, refetch: refetchNetworkStatus } = useProjectNetworkStatus(
    resolvedProjectId,
    { enabled: Boolean(resolvedProjectId) }
  ) as any;

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
    const progress = project?.["provisioning_progress"];
    if (!Array.isArray(progress) || progress.length === 0) return;

    const allCompleted = progress.every((step) => (step as any)?.["status"] === "completed");
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

  // Force refetch network status when project ID is resolved
  useEffect(() => {
    if (resolvedProjectId) {
      refetchNetworkStatus();
    }
  }, [resolvedProjectId, refetchNetworkStatus]);

  // Extract network data from response (handle wrapped or unwrapped structure)
  const networkData = useMemo(() => {
    if (!networkStatusData) return undefined;
    return networkStatusData.network || networkStatusData?.data?.network || networkStatusData;
  }, [networkStatusData]);

  const { data: edgeConfig, refetch: refetchEdgeConfig } = useFetchProjectEdgeConfigAdmin(
    resolvedProjectId,
    project?.region,
    {
      enabled: Boolean(resolvedProjectId && project?.region),
    }
  ) as any;
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

  const assignmentScope = (() => {
    if (projectDetails?.assignment_scope) return projectDetails.assignment_scope;
    if (project?.assignment_scope) return project.assignment_scope;
    if (projectClientId) return "client";
    if (projectTenantId) return "tenant";
    return "internal";
  })();

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
    (project?.["region_name"] as string | undefined) ||
    (project?.["region"] as string | undefined) ||
    (projectDetails?.["region_name"] as string | undefined) ||
    (projectDetails?.["region"] as string | undefined) ||
    "Provider";
  const projectUsersRaw = (project?.["users"] as Record<string, any> | undefined)?.["local"];
  const projectUsers = useMemo(
    () => (Array.isArray(projectUsersRaw) ? projectUsersRaw : []),
    [projectUsersRaw]
  );
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

    entries.forEach((user) => {
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

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
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
      const comp = components?.[key];
      if (!comp) return null;
      return (
        comp.status === "active" || comp.status === "completed" || (comp.count && comp.count > 0)
      );
    };

    const hasCount = (key: string) => (resourceCounts[key] ?? 0) > 0;

    switch (sectionKey) {
      case "user-provisioning":
        return tenantAdminFullyReady;
      case "setup":
        return setupConditionsMet;
      case "vpcs": {
        const infraStatus = checkInfraStatus("vpc");
        if (infraStatus !== null) return infraStatus;
        if (infraStatusData?.data?.components?.vpc?.count) return true;
        const summaryFlag = summaryCompleted(
          "vpc",
          "vpcs",
          "virtualprivatecloud",
          "vpcprovisioned"
        );
        if (summaryFlag === true) return true;
        return projectDetails?.vpc_enabled || summaryFlag || false;
      }
      case "networks": {
        const infraStatus = checkInfraStatus("networks");
        if (infraStatus !== null) return infraStatus;
        if (hasCount("networks")) return true;
        return summaryCompleted("network", "networks", "subnet", "subnets") || false;
      }
      case "keypairs": {
        const infraStatus = checkInfraStatus("keypairs");
        if (infraStatus !== null) return infraStatus;
        if (hasCount("keyPairs")) return true;
        return summaryCompleted("keypair", "keypairs", "createkeypair") || false;
      }
      case "edge": {
        const infraStatus = checkInfraStatus("edge_networks");
        if (infraStatus !== null) return infraStatus;
        const edgeSummary = summaryCompleted("edge", "edge network", "edge_network");
        if (edgeSummary === true) return true;
        const hasEdgePayload =
          edgePayload &&
          (Array.isArray(edgePayload)
            ? edgePayload.length > 0
            : Object.keys(edgePayload).length > 0);
        return hasEdgePayload || edgeSummary || false;
      }
      case "security-groups":
        return (
          checkInfraStatus("security_groups") ??
          hasCount("security_groups") ??
          summaryCompleted("securitygroup", "securitygroups") ??
          false
        );
      case "subnets":
        return (
          checkInfraStatus("subnets") ??
          hasCount("subnets") ??
          summaryCompleted("subnet", "subnets") ??
          false
        );
      case "igws":
        return checkInfraStatus("internet_gateways") ?? hasCount("internet_gateways");
      case "route-tables":
        return checkInfraStatus("route_tables") ?? hasCount("routeTables");
      case "enis":
        return checkInfraStatus("network_interfaces") ?? hasCount("enis");
      case "eips":
        return checkInfraStatus("elastic_ips") ?? hasCount("eips");
      default:
        return false;
    }
  };
  const completedSections = infrastructureSections.filter((section: any) =>
    getStatusForSection(section.key)
  ).length;
  const healthPercent = Math.round((completedSections / infrastructureSections.length) * 100);

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
        onClick={() => syncInfrastructure({ projectId: resolvedProjectId })}
        disabled={isProjectStatusFetching || isSyncingInfrastructure}
      >
        <RefreshCw
          size={14}
          className={isProjectStatusFetching || isSyncingInfrastructure ? "animate-spin" : ""}
        />
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

  const handleGenericAction = async ({ method, endpoint, label, payload = {} }: any) => {
    try {
      // Use a consistent ID to prevent notification stacking
      const toastId = `project-action-${endpoint}`;
      ToastUtils.info(`Executing ${label}...`, { id: toastId });
      const res = await api(method.toUpperCase(), endpoint, payload);
      ToastUtils.success(`${label} completed successfully!`, { id: toastId });
      await Promise.all([refetchProjectStatus(), refetchProjectDetails()]);
      return res;
    } catch (error: any) {
      console.error(`Action error [${label}]:`, error);
      ToastUtils.error(error?.message || `Failed to execute ${label}`, {
        id: `project-action-err-${label}`,
      });
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

  // Phase 8: Dedicated Provisioning Screen
  // Use sticky mode: once provisioning starts, stay on this screen until complete
  if ((isInProvisioningMode || project?.["status"] === "provisioning") && !forceHideProvisioning) {
    return (
      <ProvisioningFullScreen
        project={project as any}
        setupSteps={setupSteps || []}
        onRefresh={() => {
          // Refetch both project status and details to detect completion
          refetchProjectStatus();
          refetchProjectDetails();
        }}
        onViewProject={() => {
          setForceHideProvisioning(true);
          // Force page reload to re-evaluate project status
          globalThis.window.location.reload();
        }}
      />
    );
  }

  // Infra Studio: Project created but not provisioned
  if (
    project?.["status"] === "created" ||
    (project as any)?.["provisioning_status"] === "created"
  ) {
    return (
      <>
        <AdminActiveTab />
        <AdminPageShell
          title="Infrastructure Setup"
          description={`Initialize infrastructure for ${project?.["name"] || projectId}`}
          breadcrumbs={[
            { label: "Home", href: "/admin-dashboard" },
            { label: "Projects", href: "/admin-dashboard/projects" },
            {
              label: project ? `${project["name"]} - ${project["identifier"]}` : "Project Details",
              href: "/admin-dashboard/projects",
            },
            { label: "Setup" },
          ]}
        >
          <InfrastructureSetupWizard project={project as any} />
        </AdminPageShell>
      </>
    );
  }

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title={project?.["name"] || "Project Overview"}
        description={
          project
            ? `${project?.["identifier"] || projectId} • ${project?.["provider"] || "Provider"} • ${project?.["region"] || "Region"}`
            : "Loading project context..."
        }
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Projects", href: "/admin-dashboard/projects" },
          {
            label: project ? `${project["name"]} - ${project["identifier"]}` : "Project Details",
          },
        ]}
        actions={headerActions}
        disableContentPadding={true}
        contentClassName=""
      >
        <ProjectDetailsShell
          project={project}
          projectInstances={projectInstances}
          allProjectUsers={allProjectUsers}
          cloudPolicies={cloudPolicies}
          resourceCounts={{
            vcpus: instanceStats.total * 2,
            volumes: resourceCounts["volumes"] || 0,
            images: resourceCounts["images"] || 0,
            snapshots: resourceCounts["snapshots"] || 0,
            vpcs:
              (infraStatusData as any)?.["data"]?.["components"]?.["vpc"]?.["count"] ??
              resourceCounts["vpcs"] ??
              0,
            subnets:
              (infraStatusData as any)?.["data"]?.["components"]?.["subnets"]?.["count"] ??
              resourceCounts["subnets"] ??
              0,
            security_groups:
              (infraStatusData as any)?.["data"]?.["components"]?.["security_groups"]?.["count"] ??
              resourceCounts["security_groups"] ??
              0,
            key_pairs:
              (infraStatusData as any)?.["data"]?.["components"]?.["keypairs"]?.["count"] ??
              resourceCounts["key_pairs"] ??
              0,
            route_tables:
              (infraStatusData as any)?.["data"]?.["components"]?.["route_tables"]?.["count"] ??
              resourceCounts["route_tables"] ??
              0,
            elastic_ips:
              (infraStatusData as any)?.["data"]?.["components"]?.["elastic_ips"]?.["count"] ??
              resourceCounts["elastic_ips"] ??
              0,
            network_interfaces:
              (infraStatusData as any)?.["data"]?.["components"]?.["network_interfaces"]?.[
                "count"
              ] ??
              resourceCounts["network_interfaces"] ??
              0,
            nat_gateways: resourceCounts["nat_gateways"] ?? 0,
            network_acls: resourceCounts["network_acls"] ?? 0,
            vpc_peering: resourceCounts["vpc_peering"] ?? 0,
            internet_gateways:
              (infraStatusData as any)?.["data"]?.["components"]?.["internet_gateways"]?.[
                "count"
              ] ??
              resourceCounts[" internet_gateways"] ??
              0,
            load_balancers:
              (infraStatusData as any)?.["data"]?.["components"]?.["load_balancers"]?.["count"] ??
              resourceCounts["load_balancers"] ??
              0,
            users: allProjectUsers.length,
          }}
          infraStatusData={infraStatusData}
          networkData={networkData}
          canCreateInstances={canCreateInstances}
          setupSteps={
            Array.isArray(project?.["provisioning_progress"])
              ? (project?.["provisioning_progress"] as any[]).map((step) => ({
                  id:
                    step.id ||
                    (step as any)?.["label"]?.toLowerCase()?.replaceAll(/\s+/g, "_") ||
                    "step",
                  label: (step as any)?.["label"] || "Step",
                  status: (step as any)?.["status"] as any,
                  description:
                    (step as any)?.["status"] === "completed" ? "Completed" : "Action in progress",
                  updated_at: (step as any)?.["updated_at"],
                }))
              : []
          }
          setupProgressPercent={healthPercent}
          isProjectStatusFetching={isProjectStatusFetching}
          isSyncingInfrastructure={isSyncingInfrastructure}
          syncInfrastructure={syncInfrastructure}
          assignPolicy={assignPolicy}
          revokePolicy={revokePolicy}
          handleUserAction={handleUserAction}
          refetchProjectDetails={refetchProjectDetails}
          refetchProjectStatus={refetchProjectStatus}
          isAssigningPolicy={isAssigningPolicy}
          isRevokingPolicy={isRevokingPolicy}
          setIsMemberModalOpen={setIsMemberModalOpen}
          handleInviteSubmit={handleInviteSubmit}
          inviteForm={inviteForm}
          setInviteForm={setInviteForm}
          formatMemberName={formatMemberName}
          requiredActions={requiredActions}
          onRequiredAction={(action: SummaryAction) =>
            handleGenericAction({
              method: action?.method || "POST",
              endpoint: action?.endpoint,
              label: action?.label,
            })
          }
        />
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
          apiBaseUrl={config.adminURL}
        />
      )}

      <AssignEdgeConfigModal
        isOpen={isAssignEdgeOpen}
        onClose={() => setIsAssignEdgeOpen(false)}
        projectId={resolvedProjectId as any}
        region={project?.["region"]}
        onSuccess={async () => {
          await refetchProjectStatus();
          await refetchEdgeConfig();
        }}
      />
    </>
  );
}

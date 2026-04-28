import { useMemo } from "react";
import { Activity, Layers, MapPin, Server, Shield, Wifi, Route } from "lucide-react";
import { createElement } from "react";
import type { SummaryItem } from "@/types/project";
import type { InfraStatusData } from "@/shared/components/projects/details/projectDetailsResourceCounts";

// Infrastructure status component shape
interface InfraComponent {
  count?: number;
  status?: string;
}

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
  email?: string;
  roles?: string[];
  role?: string;
  status?: Record<string, unknown>;
  actions?: Record<string, unknown>;
}

const isTenantAdmin = (user: User | null): boolean => {
  if (!user) return false;
  if (
    Array.isArray(user?.["roles"]) &&
    user["roles"].some((role: string) => role === "tenant_admin" || role === "tenant-admin")
  ) {
    return true;
  }
  if (typeof user?.["role"] === "string") {
    const role = user["role"].toLowerCase();
    if (role.includes("tenant_admin") || role.includes("tenant-admin")) return true;
  }
  if ((user?.["status"] as Record<string, unknown>)?.["tenant_admin"]) return true;
  return false;
};

const normalizeSummaryKey = (value: string = "") =>
  value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

export interface InfrastructureSection {
  key: string;
  label: string;
  icon: React.ReactElement;
}

export interface InfrastructureStatusResult {
  setupConditionsMet: boolean;
  hasTenantAdmin: boolean;
  tenantAdminFullyReady: boolean;
  tenantAdminCount: number;
  tenantAdminUsers: User[];
  projectUsers: User[];
  infrastructureSections: InfrastructureSection[];
  getStatusForSection: (sectionKey: string) => boolean | null | undefined;
  completedSections: number;
  healthPercent: number;
  summaryCompleted: (...labels: string[]) => boolean | undefined;
  providerLabel: string;
  projectUserIdSet: Set<number>;
  fallbackRatioStats: Record<string, { ready: number; total: number }>;
}

interface UseInfrastructureStatusParams {
  project: Record<string, unknown> | undefined;
  projectDetails: Record<string, unknown> | undefined;
  infraStatusData: InfraStatusData | undefined;
  infraComponents: Record<string, InfraComponent>;
  getInfraCount: (key: string) => number | undefined;
  resourceCounts: Record<string, number>;
  edgePayload: unknown;
}

export function useInfrastructureStatus({
  project,
  projectDetails,
  infraStatusData,
  infraComponents,
  getInfraCount: _getInfraCount,
  resourceCounts,
  edgePayload,
}: UseInfrastructureStatusParams): InfrastructureStatusResult {
  const summary = useMemo(() => (project?.["summary"] ?? []) as SummaryItem[], [project]);

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

  const providerLabel =
    (project?.["region_name"] as string | undefined) ||
    (project?.["region"] as string | undefined) ||
    (projectDetails?.["region_name"] as string | undefined) ||
    (projectDetails?.["region"] as string | undefined) ||
    "Provider";

  const projectUsersRaw = (project?.["users"] as Record<string, unknown> | undefined)?.["local"];
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
      patterns.map((pattern: unknown) => normalizeSummaryKey(pattern)).filter(Boolean);
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

  const infrastructureSections: InfrastructureSection[] = [
    { key: "user-provisioning", label: "Team access", icon: createElement(Shield, { size: 16 }) },
    { key: "vpcs", label: "Virtual Private Cloud", icon: createElement(Server, { size: 16 }) },
    { key: "networks", label: "Networks", icon: createElement(Wifi, { size: 16 }) },
    { key: "subnets", label: "Subnets", icon: createElement(Layers, { size: 16 }) },
    { key: "igws", label: "Internet Gateways", icon: createElement(MapPin, { size: 16 }) },
    { key: "route-tables", label: "Route Tables", icon: createElement(Route, { size: 16 }) },
    { key: "security-groups", label: "Security Groups", icon: createElement(Shield, { size: 16 }) },
    { key: "keypairs", label: "Key Pairs", icon: createElement(Activity, { size: 16 }) },
    { key: "edge", label: "Edge Network", icon: createElement(Wifi, { size: 16 }) },
    { key: "enis", label: "Network Interfaces", icon: createElement(Server, { size: 16 }) },
    { key: "eips", label: "Elastic IPs", icon: createElement(MapPin, { size: 16 }) },
  ];

  const getStatusForSection = (sectionKey: string) => {
    const checkInfraStatus = (key: string) => {
      const comp = infraComponents[key];
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

  const completedSections = infrastructureSections.filter((section) =>
    getStatusForSection(section.key)
  ).length;
  const healthPercent = Math.round((completedSections / infrastructureSections.length) * 100);

  return {
    setupConditionsMet,
    hasTenantAdmin,
    tenantAdminFullyReady,
    tenantAdminCount,
    tenantAdminUsers,
    projectUsers,
    infrastructureSections,
    getStatusForSection,
    completedSections,
    healthPercent,
    summaryCompleted,
    providerLabel,
    projectUserIdSet,
    fallbackRatioStats,
  };
}

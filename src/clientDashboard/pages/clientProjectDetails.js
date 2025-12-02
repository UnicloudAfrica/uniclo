import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Activity,
    CheckCircle,
    Clock,
    Layers,
    Loader2,
    MapPin,
    RefreshCw,
    Route,
    Server,
    Shield,
    Wifi,
} from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ModernButton from "../../adminDashboard/components/ModernButton";
import PaymentModal from "../../adminDashboard/components/PaymentModal";
import config from "../../config";
import {
    useFetchClientProjectById,
    useClientProjectStatus,
    useClientProjectMembershipSuggestions,
    useUpdateClientProject,
} from "../../hooks/clientHooks/projectHooks";
import { useClientProjectInfrastructureStatus } from "../../hooks/clientHooks/projectInfrastructureHooks";
import KeyPairs from "./infraComps/keyPairs";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import Networks from "./infraComps/networks";
import { useFetchClientNetworks, useFetchClientNetworkInterfaces } from "../../hooks/clientHooks/networkHooks";
import { useFetchClientKeyPairs } from "../../hooks/clientHooks/keyPairsHook";
import { useFetchClientSecurityGroups } from "../../hooks/clientHooks/securityGroupHooks";
import { useFetchClientSubnets } from "../../hooks/clientHooks/subnetHooks";
import { useFetchClientIgws } from "../../hooks/clientHooks/igwHooks";
import { useFetchClientRouteTables } from "../../hooks/clientHooks/routeTableHooks";
import { useFetchClientElasticIps } from "../../hooks/clientHooks/elasticIPHooks";
import Subnets from "./infraComps/subnet";
import IGWs from "./infraComps/igws";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/eni";
import EIPs from "./infraComps/elasticIP";
import ClientAssignEdgeConfigModal from "../components/ClientAssignEdgeConfigModal";
import { designTokens } from "../../styles/designTokens";
import { syncClientProjectEdgeConfig, useFetchClientProjectEdgeConfig } from "../../hooks/clientHooks/edgeHooks";
import useClientAuthStore from "../../stores/clientAuthStore";
import ProjectMemberManagerModal from "../../shared/projects/ProjectMemberManagerModal";

// Shared Components
import ProjectDetailsHero from "../../shared/projects/details/ProjectDetailsHero";
import ProjectInstancesOverview from "../../shared/projects/details/ProjectInstancesOverview";
import ProjectInfrastructureJourney from "../../shared/projects/details/ProjectInfrastructureJourney";
import ProjectQuickStatus from "../../shared/projects/details/ProjectQuickStatus";
import ProjectProvisioningSnapshot from "../../shared/projects/details/ProjectProvisioningSnapshot";

const decodeId = (encodedId) => {
    try {
        return atob(decodeURIComponent(encodedId));
    } catch (e) {
        console.error("Error decoding ID:", e);
        return null;
    }
};

const isTenantAdmin = (user) => {
    if (!user) return false;
    if (Array.isArray(user.roles) && user.roles.some((role) => role === "tenant_admin" || role === "tenant-admin")) {
        return true;
    }
    if (typeof user.role === "string") {
        const role = user.role.toLowerCase();
        if (role.includes("tenant_admin") || role.includes("tenant-admin")) return true;
    }
    if (user?.status?.tenant_admin) return true;
    return false;
};

const formatDate = (value) => {
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

const toTitleCase = (input = "") =>
    input
        .toString()
        .replace(/[_-]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const formatMemberName = (user = {}) => {
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

const getProjectStatusVariant = (status = "") => {
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

export default function ClientProjectDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const clientToken = useClientAuthStore((state) => state.token);
    const [activeSection, setActiveSection] = useState("setup");
    const [isAssignEdgeOpen, setIsAssignEdgeOpen] = useState(false);
    const [isEdgeSyncing, setIsEdgeSyncing] = useState(false);
    const [activePaymentPayload, setActivePaymentPayload] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
    const [membershipError, setMembershipError] = useState("");
    const [resourceCounts, setResourceCounts] = useState({});
    const contentRef = useRef(null);

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
    } = useClientProjectStatus(projectId);

    const {
        data: projectDetailsResponse,
        isFetching: isProjectDetailsFetching,
        refetch: refetchProjectDetails,
    } = useFetchClientProjectById(projectId, { enabled: Boolean(projectId) });

    const {
        data: infraStatusData,
    } = useClientProjectInfrastructureStatus(projectId, { enabled: Boolean(projectId) });

    const { mutateAsync: updateProjectMembers, isPending: isMembershipUpdating } = useUpdateClientProject();
    const updateResourceCount = useCallback((resource, count) => {
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

    const { data: networksData } = useFetchClientNetworks(
        project?.identifier,
        project?.region,
        { enabled: Boolean(project?.identifier && project?.region) }
    );

    const { data: keyPairsData } = useFetchClientKeyPairs(
        project?.identifier,
        project?.region,
        { enabled: Boolean(project?.identifier && project?.region) }
    );
    const { data: securityGroupsData } = useFetchClientSecurityGroups(
        project?.identifier,
        project?.region,
        { enabled: Boolean(project?.identifier && project?.region) }
    );
    const { data: subnetsData } = useFetchClientSubnets(
        project?.identifier,
        project?.region,
        { enabled: Boolean(project?.identifier && project?.region) }
    );
    const { data: igwsData } = useFetchClientIgws(
        project?.identifier,
        project?.region,
        { enabled: Boolean(project?.identifier && project?.region) }
    );
    const { data: routeTablesData } = useFetchClientRouteTables(
        project?.identifier,
        project?.region,
        { enabled: Boolean(project?.identifier && project?.region) }
    );
    const { data: networkInterfacesData } = useFetchClientNetworkInterfaces(
        project?.identifier,
        project?.region,
        { enabled: Boolean(project?.identifier && project?.region) }
    );
    const { data: elasticIpsData } = useFetchClientElasticIps(
        project?.identifier,
        project?.region,
        { enabled: Boolean(project?.identifier && project?.region) }
    );

    useEffect(() => {
        if (Array.isArray(networksData)) {
            updateResourceCount("networks", networksData.length);
        }
    }, [networksData, updateResourceCount]);

    useEffect(() => {
        if (Array.isArray(keyPairsData)) {
            updateResourceCount("keyPairs", keyPairsData.length);
        }
    }, [keyPairsData, updateResourceCount]);

    const summary = project?.summary ?? [];

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
    const resolvedProjectId = project?.identifier || projectId;

    const {
        data: edgeConfig,
        isFetching: isEdgeConfigLoading,
        refetch: refetchEdgeConfig,
    } = useFetchClientProjectEdgeConfig(resolvedProjectId, project?.region, {
        enabled: Boolean(resolvedProjectId && project?.region),
    });
    const edgePayload = edgeConfig?.data ?? edgeConfig;
    const projectDetailsPayload =
        projectDetailsResponse?.data ?? projectDetailsResponse;
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

    const {
        data: membershipSuggestions = [],
        isFetching: isMembershipFetching,
    } = useClientProjectMembershipSuggestions(membershipParams ?? {}, {
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
                (user) =>
                    isTenantAdmin(user) &&
                    user?.status?.provider_account &&
                    user?.status?.aws_policy &&
                    user?.status?.symp_policy
            ),
        [tenantAdminUsers]
    );
    const hasAssignedProjectUser = projectUsers.length > 0;
    const hasProviderAccountUser = projectUsers.some((user) => Boolean(user?.status?.provider_account));
    const hasStoragePolicyUser = projectUsers.some((user) => Boolean(user?.status?.aws_policy));
    const hasNetworkPolicyUser = projectUsers.some((user) => Boolean(user?.status?.symp_policy));
    const fallbackSetupConditionsMet =
        hasAssignedProjectUser &&
        hasProviderAccountUser &&
        hasStoragePolicyUser &&
        hasNetworkPolicyUser &&
        tenantAdminFullyReady;

    const summaryPatternSets = useMemo(() => {
        const normalizePatterns = (patterns = []) =>
            patterns.map((pattern) => normalizeSummaryKey(pattern)).filter(Boolean);
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

    const matchSummaryEntry = (patternSet = []) => {
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
        const accountsReady = projectUsers.filter((user) => Boolean(user?.status?.provider_account)).length;
        const storageReady = projectUsers.filter((user) => Boolean(user?.status?.aws_policy)).length;
        const networkReady = projectUsers.filter((user) => Boolean(user?.status?.symp_policy)).length;
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

    const isFallbackCategoryReady = (category) => {
        const stats = fallbackRatioStats[category];
        return Boolean(stats && stats.ready > 0);
    };

    const isSummaryCategoryReady = (patternSet, category) => {
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
            new Set(
                projectUsers
                    .map((user) => Number(user.id))
                    .filter((id) => Number.isFinite(id))
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
        const upsertMember = (user, { isCurrent = false, isOwner = false } = {}) => {
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
                    (Array.isArray(user.roles) ? user.roles.join(", ") : user.role || user.status?.role || ""),
                isCurrent: existing.isCurrent || isCurrent,
                isOwner: existing.isOwner || isOwner,
            });
        };

        entries.forEach((user) => {
            const numericId = Number(user?.id);
            upsertMember(user, {
                isCurrent: projectUserIdSet.has(numericId),
                isOwner: tenantAdminUsers.some((admin) => Number(admin.id) === numericId),
            });
        });

        projectUsers.forEach((user) => {
            upsertMember(user, {
                isCurrent: true,
                isOwner: isTenantAdmin(user),
            });
        });

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [membershipSuggestions, projectUsers, projectUserIdSet, tenantAdminUsers]);

    const pendingOwnerCount = useMemo(() => {
        if (!selectedMemberIds || selectedMemberIds.size === 0) return 0;
        return tenantAdminUsers.reduce((count, user) => {
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
        { key: "setup", label: "Project Setup", icon: <CheckCircle size={16} /> },
        { key: "user-provisioning", label: "Team access", icon: <Shield size={16} /> },
        { key: "vpcs", label: "Virtual Private Cloud", icon: <Server size={16} /> },
        { key: "networks", label: "Networks", icon: <Wifi size={16} /> },
        { key: "keypairs", label: "Key Pairs", icon: <Activity size={16} /> },
        { key: "security-groups", label: "Security Groups", icon: <Shield size={16} /> },
        { key: "edge", label: "Edge Network", icon: <Wifi size={16} /> },
        { key: "subnets", label: "Subnets", icon: <Layers size={16} /> },
        { key: "igws", label: "Internet Gateways", icon: <MapPin size={16} /> },
        { key: "route-tables", label: "Route Tables", icon: <Route size={16} /> },
        { key: "enis", label: "Network Interfaces", icon: <Server size={16} /> },
        { key: "eips", label: "Elastic IPs", icon: <MapPin size={16} /> },
    ];

    const getStatusForSection = (sectionKey) => {
        switch (sectionKey) {
            case "user-provisioning":
                return tenantAdminFullyReady;
            case "setup":
                return setupConditionsMet;
            case "vpcs": {
                const summaryFlag = summaryCompleted("vpc", "vpcs", "virtualprivatecloud", "vpcprovisioned");
                if (summaryFlag === true) return true;
                if (projectDetails?.vpc_enabled) return true;
                return summaryFlag ?? false;
            }
            case "networks": {
                if ((resourceCounts.networks ?? 0) > 0) return true;
                const summaryFlag = summaryCompleted("network", "networks", "subnet", "subnets");
                if (summaryFlag === true) return true;
                return summaryFlag ?? false;
            }
            case "keypairs": {
                if ((resourceCounts.keyPairs ?? 0) > 0) return true;
                const summaryFlag = summaryCompleted("keypair", "keypairs", "createkeypair");
                if (summaryFlag === true) return true;
                return summaryFlag ?? false;
            }
            case "edge": {
                const edgeSummary = summaryCompleted("edge", "edge network", "edge_network");
                if (edgeSummary === true) return true;
                if (edgePayload && (Array.isArray(edgePayload) ? edgePayload.length > 0 : Object.keys(edgePayload).length > 0)) return true;
                return edgeSummary ?? false;
            }
            case "security-groups": {
                if (Array.isArray(securityGroupsData) && securityGroupsData.length > 0) return true;
                const summaryFlag = summaryCompleted("securitygroup", "securitygroups");
                if (summaryFlag === true) return true;
                return summaryFlag ?? false;
            }
            default:
                return false;
        }
    };

    const areAllSummaryItemsComplete = summary.every(
        (item) => item.completed === true || item.complete === true
    );
    const canCreateInstances =
        areAllSummaryItemsComplete && hasTenantAdmin && setupConditionsMet;

    const missingInstancePrereqs = [];
    if (!areAllSummaryItemsComplete) missingInstancePrereqs.push("Complete provisioning checklist");
    if (!hasTenantAdmin) missingInstancePrereqs.push("Assign tenant admin");
    if (!setupConditionsMet) missingInstancePrereqs.push("Complete project setup");

    const handleSectionClick = (key) => {
        setActiveSection(key);
        setTimeout(() => {
            contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
    };

    const handleEdgeSync = async () => {
        if (!resolvedProjectId || !project?.region) {
            return;
        }
        if (isEdgeSyncing) return;
        try {
            setIsEdgeSyncing(true);
            await syncClientProjectEdgeConfig({ project_id: resolvedProjectId, region: project.region });
            await refetchEdgeConfig();
        } catch (error) {
            console.error("Failed to sync edge config:", error);
        } finally {
            setIsEdgeSyncing(false);
        }
    };

    const handleNavigateAddInstance = () => {
        if (!resolvedProjectId) return;
        navigate(`/client-dashboard/instances/create?project=${encodeURIComponent(resolvedProjectId)}`);
    };

    const handleViewInstanceDetails = (instance) => {
        if (!instance?.identifier) return;
        navigate(`/client-dashboard/instances/details?identifier=${encodeURIComponent(instance.identifier)}`);
    };

    const instanceStats = useMemo(() => {
        const base = { total: projectInstances.length, running: 0, provisioning: 0, paymentPending: 0 };
        projectInstances.forEach((instance) => {
            const normalized = (instance.status || "").toLowerCase();
            if (["running", "active", "ready"].includes(normalized)) base.running += 1;
            else if (["pending", "processing", "provisioning", "initializing", "creating"].some((token) => normalized.includes(token))) base.provisioning += 1;
            else if (["payment_pending", "awaiting_payment", "payment_required"].some((token) => normalized.includes(token))) base.paymentPending += 1;
        });
        return base;
    }, [projectInstances]);

    const recentInstances = useMemo(() => {
        return [...projectInstances].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    }, [projectInstances]);

    const pendingPaymentEntries = useMemo(() => {
        return projectInstances
            .map((instance) => {
                const transaction = instance.latest_transaction || {};
                const isPaymentPending =
                    ["payment_pending", "awaiting_payment"].includes(instance.status?.toLowerCase()) ||
                    transaction.status === "pending";
                if (!isPaymentPending) return null;
                return {
                    instance,
                    transaction,
                    paymentOptions: instance.payment_options || [],
                    expiresAt: transaction.expires_at || null,
                };
            })
            .filter(Boolean);
    }, [projectInstances]);

    const handleOpenPayment = (entry) => {
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

    const handleToggleMember = (id) => {
        setSelectedMemberIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSaveMembers = async () => {
        // Implementation for saving members
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case "user-provisioning":
                return (
                    <div className="space-y-6">
                        {/* Team Access Card Logic Here if needed, or reuse component */}
                    </div>
                );
            case "setup":
                return (
                    <ProjectProvisioningSnapshot
                        summary={summary}
                        providerLabel={providerLabel}
                        projectRegion={project?.region}
                        hasTenantAdmin={hasTenantAdmin}
                        edgeComponent={edgeComponent}
                        isEdgeSyncing={isEdgeSyncing}
                        onEdgeSync={handleEdgeSync}
                        onManageEdge={() => setIsAssignEdgeOpen(true)}
                    />
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
                        onStatsUpdate={(count) => updateResourceCount("networks", count)}
                    />
                );
            case "keypairs":
                return (
                    <KeyPairs
                        projectId={resolvedProjectId}
                        region={project?.region}
                        provider={project?.provider}
                        onStatsUpdate={(count) => updateResourceCount("keyPairs", count)}
                    />
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
                return null;
        }
    };

    const completedSections = infrastructureSections.filter((section) =>
        getStatusForSection(section.key)
    ).length;
    const healthPercent = Math.round(
        (completedSections / infrastructureSections.length) * 100
    );

    const projectStatusVariant = getProjectStatusVariant(
        project?.status || projectDetails?.status
    );
    const totalInfraSections = infrastructureSections.length || 1;
    const infrastructureStepLabel = `${completedSections}/${totalInfraSections} infra steps`;
    const heroProjectIdentifier =
        project?.identifier || projectDetails?.identifier || resolvedProjectId || projectId;
    const heroProviderLabel =
        project?.provider || projectDetails?.provider || "Provider";
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
        [heroProjectIdentifier, instanceCount, project?.created_at, project?.type, projectDetails?.created_at, projectDetails?.type]
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
        [heroRegionLabel, instanceCount, project?.created_at, project?.type, projectDetails?.created_at, projectDetails?.type]
    );

    const headerActions = (
        <div className="flex flex-wrap gap-2">
            <ModernButton
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => navigate("/client-dashboard/projects")}
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
            <ModernButton size="sm" className="flex items-center gap-2" onClick={() => setIsAssignEdgeOpen(true)}>
                Manage edge config
            </ModernButton>
        </div>
    );

    const quickStatusItems = [
        {
            label: "Provisioning ready",
            active: areAllSummaryItemsComplete && hasTenantAdmin,
            tone: areAllSummaryItemsComplete && hasTenantAdmin ? "success" : "danger",
        },
        {
            label: "Edge configuration synced",
            active: Boolean(edgeComponent && (edgeComponent.status === "completed" || (typeof edgeComponent.count === "number" && edgeComponent.count > 0))),
            tone: Boolean(edgeComponent && (edgeComponent.status === "completed" || (typeof edgeComponent.count === "number" && edgeComponent.count > 0))) ? "success" : "neutral",
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

    return (
        <>
            <ClientPageShell
                title={project?.name || "Project Overview"}
                description={
                    project
                        ? `${project?.identifier || projectId} • ${project?.provider || "Provider"} • ${project?.region || "Region"}`
                        : "Loading project context..."
                }
                actions={headerActions}
                contentClassName="space-y-6"
            >
                <ProjectDetailsHero
                    project={project}
                    projectStatusVariant={projectStatusVariant}
                    healthPercent={healthPercent}
                    metadataItems={metadataItems}
                    summaryMetrics={summaryMetrics}
                    canCreateInstances={canCreateInstances}
                    missingInstancePrereqs={missingInstancePrereqs}
                    onAddInstance={handleNavigateAddInstance}
                    onManageEdge={() => setIsAssignEdgeOpen(true)}
                    infrastructureStepLabel={infrastructureStepLabel}
                />

                <ProjectInstancesOverview
                    instanceStats={instanceStats}
                    recentInstances={recentInstances}
                    projectInstances={projectInstances}
                    onViewInstance={handleViewInstanceDetails}
                    onAddInstance={handleNavigateAddInstance}
                    onViewAllInstances={() => navigate(`/client-dashboard/instances?project=${encodeURIComponent(resolvedProjectId)}`)}
                    canCreateInstances={canCreateInstances}
                    resolvedProjectId={resolvedProjectId}
                />

                <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
                    <ModernCard
                        variant="outlined"
                        padding="lg"
                        className="space-y-6"
                    >
                        <ProjectQuickStatus quickStatusItems={quickStatusItems} />
                        <ProjectInfrastructureJourney
                            infrastructureSections={infrastructureSections}
                            activeSection={activeSection}
                            onSectionClick={handleSectionClick}
                            getStatusForSection={getStatusForSection}
                        />
                    </ModernCard>

                    <ModernCard variant="outlined" padding="lg" ref={contentRef}>
                        {renderSectionContent()}
                    </ModernCard>
                </div>
            </ClientPageShell>
            <ProjectMemberManagerModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                members={normalizedMembershipOptions}
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
                    authToken={clientToken}
                    apiBaseUrl={config.clientURL}
                />
            )}

            <ClientAssignEdgeConfigModal
                isOpen={isAssignEdgeOpen}
                onClose={() => setIsAssignEdgeOpen(false)}
                projectId={resolvedProjectId}
                projectRegion={project?.region}
                onAssigned={async () => {
                    await refetchProjectStatus();
                    await refetchEdgeConfig();
                }}
            />
        </>
    );
}

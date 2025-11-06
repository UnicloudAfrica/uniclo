import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  GitBranch,
  Globe,
  Key,
  Layers,
  Loader2,
  MapPin,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Route,
  Server,
  Shield,
  Wifi,
  XCircle,
} from "lucide-react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ModernButton from "../../adminDashboard/components/ModernButton";
import ResourceListCard from "../../adminDashboard/components/ResourceListCard";
import PaymentModal from "../../adminDashboard/components/PaymentModal";
import {
  useClientProjectStatus,
  useFetchClientProjectById,
} from "../../hooks/clientHooks/projectHooks";
import { useClientProjectInfrastructureStatus } from "../../hooks/clientHooks/projectInfrastructureHooks";
import KeyPairs from "./infraComps/keyPairs";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import Subnets from "./infraComps/subnet";
import Networks from "./infraComps/networks";
import IGWs from "./infraComps/igws";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/eni";
import EIPs from "./infraComps/elasticIP";
import ClientAssignEdgeConfigModal from "../components/ClientAssignEdgeConfigModal";
import { designTokens } from "../../styles/designTokens";
import ToastUtils from "../../utils/toastUtil";
import clientApi from "../../index/client/api";
import clientSilentApi from "../../index/client/silent";
import {
  syncClientProjectEdgeConfig,
  useFetchClientProjectEdgeConfig,
} from "../../hooks/clientHooks/edgeHooks";
import useClientAuthStore from "../../stores/clientAuthStore";

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

const isMember = (user) => {
  if (!user) return false;
  if (isTenantAdmin(user)) return false;
  if (Array.isArray(user.roles) && user.roles.some((role) => role === "member" || role === "project_member" || role === "tenant_member")) {
    return true;
  }
  if (typeof user.role === "string") {
    const role = user.role.toLowerCase();
    if (role.includes("member") && !role.includes("admin")) return true;
  }
  if (user?.status?.member) return true;
  if (user?.status?.tenant_admin) return false;
  return true;
};

const safeParseJson = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("Failed to parse JSON value", error, value);
      return fallback;
    }
  }
  return fallback;
};

const withBusinessPath = (path = "") => {
  if (!path) return path;
  if (path.startsWith("/business/") || path.startsWith("http")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `/business${path}`;
  }
  return `/business/${path}`;
};

const promoteActionCandidates = [
  "assign_tenant_admin",
  "make_tenant_admin",
  "promote_tenant_admin",
  "assign_as_tenant_admin",
];

const demoteActionCandidates = [
  "revoke_tenant_admin",
  "remove_tenant_admin",
  "demote_tenant_admin",
  "assign_member",
  "make_member",
  "set_member",
  "assign_project_member",
];

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

const NeutralPill = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {label}
  </span>
);

const SummaryMetricCard = ({ icon: Icon, label, value, helper }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-sm backdrop-blur-sm">
    <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      {helper ? (
        <p className="text-xs text-white/70">{helper}</p>
      ) : null}
    </div>
  </div>
);

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

const StatusBadge = ({ label, active, tone = "primary" }) => {
  const palette = {
    primary: {
      base: designTokens.colors.primary[50],
      text: designTokens.colors.primary[700],
      icon: designTokens.colors.primary[500],
    },
    success: {
      base: designTokens.colors.success[50],
      text: designTokens.colors.success[700],
      icon: designTokens.colors.success[500],
    },
    danger: {
      base: designTokens.colors.error[50],
      text: designTokens.colors.error[700],
      icon: designTokens.colors.error[500],
    },
    neutral: {
      base: designTokens.colors.neutral[100],
      text: designTokens.colors.neutral[600],
      icon: designTokens.colors.neutral[400],
    },
  };
  const colors = palette[tone] || palette.primary;
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: colors.base,
        color: colors.text,
      }}
    >
      {active ? (
        <CheckCircle2 size={14} style={{ color: colors.icon }} />
      ) : (
        <XCircle size={14} style={{ color: palette.danger.icon }} />
      )}
      {label}
    </span>
  );
};

export default function ClientProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const clientToken = useClientAuthStore((state) => state.token);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("setup");
  const [isAssignEdgeOpen, setIsAssignEdgeOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [userActionLoading, setUserActionLoading] = useState(null);
  const [isEdgeSyncing, setIsEdgeSyncing] = useState(false);
  const [activePaymentPayload, setActivePaymentPayload] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(null);
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

  const infrastructureComponents = infraStatusData?.data?.components;
  const vpcComponent = infrastructureComponents?.vpc;
  const keypairComponent = infrastructureComponents?.keypairs ?? infrastructureComponents?.keypair;
  const edgeComponent = infrastructureComponents?.edge_networks ?? infrastructureComponents?.edge;
  const securityGroupComponent = infrastructureComponents?.security_groups ?? infrastructureComponents?.securitygroup;
  const subnetComponent = infrastructureComponents?.subnets ?? infrastructureComponents?.subnet;
  const igwComponent = infrastructureComponents?.internet_gateways ?? infrastructureComponents?.igws ?? infrastructureComponents?.igw;
  const routeTableComponent = infrastructureComponents?.route_tables ?? infrastructureComponents?.routetables ?? infrastructureComponents?.route_table;
  const eniComponent = infrastructureComponents?.network_interfaces ?? infrastructureComponents?.enis ?? infrastructureComponents?.eni;
  const eipComponent = infrastructureComponents?.elastic_ips ?? infrastructureComponents?.eips ?? infrastructureComponents?.eip;

  const project = projectStatusData?.project;

  const projectDetailsPayload = projectDetailsResponse?.data ?? projectDetailsResponse;
  const projectComposite = projectDetailsPayload || project || {};
  const resolvedProjectId =
    projectComposite?.identifier || project?.identifier || projectId;
  const projectRegion =
    projectComposite?.region || project?.region || null;
  const statusCandidate =
    projectComposite?.status ||
    project?.status ||
    projectDetailsPayload?.status ||
    projectStatusData?.status ||
    null;
  const [displayStatus, setDisplayStatus] = useState(
    () => statusCandidate || "unknown"
  );

  useEffect(() => {
    if (!statusCandidate) return;
    setDisplayStatus((current) => {
      if (!current) return statusCandidate;
      if (current.toLowerCase() === statusCandidate.toLowerCase()) {
        return current;
      }
      return statusCandidate;
    });
  }, [statusCandidate]);

  const summary = Array.isArray(projectComposite?.summary) && projectComposite.summary.length
    ? projectComposite.summary
    : Array.isArray(project?.summary)
    ? project.summary
    : [];

  const {
    data: edgeConfig,
    isFetching: isEdgeConfigLoading,
    refetch: refetchEdgeConfig,
  } = useFetchClientProjectEdgeConfig(resolvedProjectId, projectRegion, {
    enabled: Boolean(resolvedProjectId && projectRegion),
  });
  const edgePayload = edgeConfig?.data ?? edgeConfig;

  const resolveUserBlock = () => {
    const candidates = [projectComposite?.users, project?.users];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const hasLocal = Array.isArray(candidate.local) && candidate.local.length > 0;
      const hasTenantAdminMissing = Array.isArray(candidate.tenant_admin_missing) && candidate.tenant_admin_missing.length > 0;
      const hasAnyKeys = Object.keys(candidate || {}).length > 0;
      if (hasLocal || hasTenantAdminMissing || hasAnyKeys) {
        return candidate;
      }
    }
    return project?.users || projectComposite?.users || {};
  };

  const userBlock = resolveUserBlock() || {};
  const tenantAdminMissingUsers = Array.isArray(userBlock?.tenant_admin_missing)
    ? userBlock.tenant_admin_missing
    : Array.isArray(project?.users?.tenant_admin_missing)
    ? project.users.tenant_admin_missing
    : [];
  const projectUsers = Array.isArray(userBlock?.local) && userBlock.local.length
    ? userBlock.local
    : Array.isArray(project?.users?.local)
    ? project.users.local
    : [];
  const tenantAdminUsers = projectUsers.filter(isTenantAdmin);
  const hasTenantAdmin = tenantAdminUsers.length > 0;

  const projectInstances = useMemo(() => {
    if (Array.isArray(projectComposite?.instances)) {
      return projectComposite.instances;
    }
    if (Array.isArray(project?.instances)) {
      return project.instances;
    }
    if (Array.isArray(projectComposite?.pending_instances)) {
      return projectComposite.pending_instances;
    }
    if (Array.isArray(project?.pending_instances)) {
      return project.pending_instances;
    }
    return [];
  }, [projectComposite, project]);

  const networksData = Array.isArray(projectComposite?.networks)
    ? projectComposite.networks
    : Array.isArray(project?.networks)
    ? project.networks
    : [];
  const keyPairsData = Array.isArray(projectComposite?.key_pairs)
    ? projectComposite.key_pairs
    : Array.isArray(project?.key_pairs)
    ? project.key_pairs
    : [];
  const securityGroupsData = Array.isArray(projectComposite?.security_groups)
    ? projectComposite.security_groups
    : Array.isArray(project?.security_groups)
    ? project.security_groups
    : [];
  const subnetsData = Array.isArray(projectComposite?.subnets)
    ? projectComposite.subnets
    : Array.isArray(project?.subnets)
    ? project.subnets
    : [];
  const igwsData = Array.isArray(projectComposite?.igws)
    ? projectComposite.igws
    : Array.isArray(project?.igws)
    ? project.igws
    : [];
  const routeTablesData = Array.isArray(projectComposite?.route_tables)
    ? projectComposite.route_tables
    : Array.isArray(project?.route_tables)
    ? project.route_tables
    : [];
  const networkInterfacesData = Array.isArray(projectComposite?.network_interfaces)
    ? projectComposite.network_interfaces
    : Array.isArray(project?.network_interfaces)
    ? project.network_interfaces
    : [];
  const elasticIpsData = Array.isArray(projectComposite?.eips)
    ? projectComposite.eips
    : Array.isArray(project?.eips)
    ? project.eips
    : [];

  const instanceCount = projectInstances.length;

  const coerceCount = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") {
      if (typeof value.count === "number") return value.count;
      if (Array.isArray(value.data)) return value.data.length;
      if (Array.isArray(value.items)) return value.items.length;
    }
    return 0;
  };

  const mergeCounts = (...values) => {
    const coerced = values.map(coerceCount);
    return Math.max(0, ...coerced, 0);
  };

  const vpcCount = mergeCounts(
    projectComposite?.resources_count?.vpcs,
    project?.resources_count?.vpcs,
    projectComposite?.vpcs,
    project?.vpcs,
    infrastructureComponents?.vpc?.details,
    infraStatusData?.data?.counts?.vpcs
  );

  const subnetCount = mergeCounts(
    projectComposite?.resources_count?.subnets,
    project?.resources_count?.subnets,
    projectComposite?.subnets,
    project?.subnets,
    infrastructureComponents?.subnets?.details,
    infrastructureComponents?.subnet?.details,
    infraStatusData?.data?.counts?.subnets
  );

  const sgCount = mergeCounts(
    projectComposite?.resources_count?.security_groups,
    project?.resources_count?.security_groups,
    projectComposite?.security_groups,
    project?.security_groups,
    infrastructureComponents?.security_groups?.details,
    infrastructureComponents?.securitygroup?.details,
    infraStatusData?.data?.counts?.security_groups
  );

  const keyPairCount = mergeCounts(
    projectComposite?.resources_count?.keypairs,
    project?.resources_count?.keypairs,
    projectComposite?.key_pairs,
    project?.key_pairs,
    infrastructureComponents?.keypairs?.details,
    infrastructureComponents?.keypair?.details,
    infraStatusData?.data?.counts?.keypairs
  );

  const eniCount = mergeCounts(
    projectComposite?.resources_count?.network_interfaces,
    project?.resources_count?.network_interfaces,
    projectComposite?.network_interfaces,
    project?.network_interfaces,
    infrastructureComponents?.network_interfaces?.details,
    infrastructureComponents?.enis?.details,
    infraStatusData?.data?.counts?.network_interfaces
  );

  const normalizeStatusValue = (value) =>
    (value || "").toString().toLowerCase().replace(/\s+/g, "_");

  const missingInstancePrereqs = useMemo(() => {
    const missing = [];
    if (!vpcCount) missing.push("VPC");
    if (!subnetCount) missing.push("Subnet");
    if (!sgCount) missing.push("Security Group");
    if (!keyPairCount) missing.push("Key Pair");
    if (!eniCount) missing.push("Network Interface");
    return missing;
  }, [vpcCount, subnetCount, sgCount, keyPairCount, eniCount]);

  const canCreateInstances = missingInstancePrereqs.length === 0;

  const transactionPendingKeywords = ["pending", "awaiting", "requires", "processing"];

  const isTransactionPending = (tx) => {
    if (!tx) return false;
    const statusValue = normalizeStatusValue(tx.status);
    const gatewayStatusValue = normalizeStatusValue(
      tx.payment_status || tx.gateway_status || tx.state
    );
    return transactionPendingKeywords.some(
      (keyword) =>
        statusValue.includes(keyword) || gatewayStatusValue.includes(keyword)
    );
  };

  const buildPaymentPayload = (instanceDetails, transaction, paymentOptions, metadata) => {
    const fallbackCurrency =
      transaction?.currency ||
      projectComposite?.currency ||
      project?.currency ||
      "NGN";
    const fallbackAmount = Number(transaction?.amount ?? 0);

    const normalizedOptions = (Array.isArray(paymentOptions) && paymentOptions.length
      ? paymentOptions
      : [
          {
            id: "default-card",
            payment_type: "Card",
            name: "Paystack",
            transaction_reference:
              transaction?.identifier ||
              transaction?.reference ||
              `tx-${instanceDetails?.identifier}`,
            total: fallbackAmount,
            currency: fallbackCurrency,
            charge_breakdown: {
              base_amount: fallbackAmount,
              percentage_fee: 0,
              flat_fee: 0,
              total_fees: 0,
              grand_total: fallbackAmount,
              currency: fallbackCurrency,
            },
            details: null,
          },
        ]
    ).map((option, index) => {
      const total = Number(option.total ?? fallbackAmount);
      const currency = option.currency || fallbackCurrency;
      const chargeBreakdown = option.charge_breakdown || {
        base_amount: Number(option.base_amount ?? fallbackAmount),
        percentage_fee: Number(option.percentage_fee ?? 0),
        flat_fee: Number(option.flat_fee ?? 0),
        total_fees: Number(option.total_fees ?? 0),
        grand_total: total || fallbackAmount,
        currency,
      };

      return {
        id: option.id ?? index + 1,
        name: option.name || option.gateway || "Paystack",
        payment_type: option.payment_type || option.type || "Card",
        transaction_reference:
          option.transaction_reference ||
          option.reference ||
          transaction?.identifier ||
          transaction?.id ||
          `tx-${instanceDetails?.identifier}`,
        total,
        currency,
        details: option.details || null,
        charge_breakdown: chargeBreakdown,
      };
    });

    const expiresAt =
      metadata?.payment?.expires_at ||
      metadata?.expires_at ||
      transaction?.expires_at ||
      transaction?.payment_expires_at ||
      null;

    const pricingBreakdown = metadata?.pricing_breakdown || metadata?.breakdown;
    const orderItems = Array.isArray(metadata?.order_items)
      ? metadata.order_items
      : undefined;

    return {
      data: {
        transaction: {
          id: transaction?.id,
          identifier:
            transaction?.identifier ||
            transaction?.reference ||
            `tx-${instanceDetails?.identifier}`,
          status: transaction?.status || "pending",
          type: transaction?.type || transaction?.transaction_type || "purchase",
          amount: Number(transaction?.amount ?? normalizedOptions[0]?.total ?? 0),
          currency: transaction?.currency || normalizedOptions[0]?.currency || fallbackCurrency,
          user: transaction?.user || null,
        },
        order: {
          id: transaction?.order_id || metadata?.order_id || null,
          total: Number(transaction?.amount ?? normalizedOptions[0]?.total ?? 0),
          currency: transaction?.currency || normalizedOptions[0]?.currency || fallbackCurrency,
          fast_track: Boolean(metadata?.fast_track_completed),
        },
        instances: [
          {
            id: instanceDetails?.id,
            identifier: instanceDetails?.identifier,
            name: instanceDetails?.name,
            region: instanceDetails?.region || projectComposite?.region,
            provider: instanceDetails?.provider || projectComposite?.provider,
            status: instanceDetails?.status,
          },
        ],
        instance_count: 1,
        payment: {
          required: true,
          status: transaction?.status || "pending",
          payment_gateway_options: normalizedOptions,
          expires_at: expiresAt,
        },
        pricing_breakdown: pricingBreakdown,
        order_items: orderItems,
      },
    };
  };

  const pendingPaymentEntries = useMemo(() => {
    if (!Array.isArray(projectInstances) || projectInstances.length === 0) {
      return [];
    }
    return projectInstances
      .map((instance) => {
        const statusValue = normalizeStatusValue(instance.status);
        const paymentStatusValue = normalizeStatusValue(
          instance.payment_status || instance.billing_status
        );
        const indicatesPayment =
          ["payment_pending", "pending_payment", "awaiting_payment", "payment_required"].some((token) =>
            statusValue.includes(token) || paymentStatusValue.includes(token)
          ) || statusValue.includes("payment");

        const transactions = Array.isArray(instance.transactions)
          ? instance.transactions
          : [];
        const pendingTransaction = transactions.find(isTransactionPending);

        if (!pendingTransaction && !indicatesPayment) {
          return null;
        }

        const parsedMetadata = pendingTransaction
          ? safeParseJson(pendingTransaction.metadata, pendingTransaction.metadata)
          : null;
        const parsedOptions = pendingTransaction
          ? safeParseJson(
              pendingTransaction.payment_gateway_options,
              pendingTransaction.payment_gateway_options
            )
          : null;
        const paymentOptions = Array.isArray(parsedOptions)
          ? parsedOptions
          : parsedOptions
          ? [parsedOptions]
          : [];
        const expiresAt =
          parsedMetadata?.payment?.expires_at ||
          parsedMetadata?.expires_at ||
          pendingTransaction?.expires_at ||
          pendingTransaction?.payment_expires_at ||
          null;

        return {
          instance,
          transaction: pendingTransaction || null,
          paymentOptions,
          metadata: parsedMetadata,
          expiresAt,
        };
      })
      .filter(Boolean);
  }, [projectInstances]);

  const handleOpenPayment = async (entry) => {
    const targetInstance = entry?.instance;
    if (!targetInstance?.identifier) {
      ToastUtils.error("Instance identifier is missing for this payment.");
      return;
    }

    try {
      setPaymentLoading(targetInstance.identifier);
      let workingInstance = targetInstance;
      let pendingTransaction = entry?.transaction || null;
      let paymentOptions = entry?.paymentOptions || [];
      let metadata = entry?.metadata || null;

      if (!pendingTransaction || !Array.isArray(paymentOptions) || paymentOptions.length === 0) {
        const response = await clientSilentApi(
          "GET",
          withBusinessPath(`/instances/${encodeURIComponent(targetInstance.identifier)}`)
        );
        workingInstance = response?.data || targetInstance;
        const transactions = Array.isArray(workingInstance?.transactions)
          ? workingInstance.transactions
          : [];
        pendingTransaction = transactions.find(isTransactionPending) || null;
        if (pendingTransaction) {
          metadata = safeParseJson(
            pendingTransaction.metadata,
            pendingTransaction.metadata
          );
          const parsedOptions = safeParseJson(
            pendingTransaction.payment_gateway_options,
            pendingTransaction.payment_gateway_options
          );
          paymentOptions = Array.isArray(parsedOptions)
            ? parsedOptions
            : parsedOptions
            ? [parsedOptions]
            : [];
        }
      }

      if (!pendingTransaction) {
        ToastUtils.info("No pending payment was found for this instance.");
        return;
      }

      const payload = buildPaymentPayload(
        workingInstance,
        pendingTransaction,
        paymentOptions,
        metadata || {}
      );
      setActivePaymentPayload(payload);
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error("Failed to load payment details:", error);
      ToastUtils.error(error?.message || "Failed to load payment details.");
    } finally {
      setPaymentLoading(null);
    }
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setActivePaymentPayload(null);
  };

  const handlePaymentComplete = async () => {
    try {
      await Promise.all([
        refetchProjectStatus?.(),
        refetchProjectDetails?.(),
      ]);
    } catch (error) {
      console.warn("Failed to refresh project data after payment.", error);
    }
  };

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
  const handleNavigateAddInstance = () => {
    navigate("/client-dashboard/multi-instance-creation", {
      state: {
        project: {
          identifier: resolvedProjectId,
          name: projectComposite?.name,
          region: projectComposite?.region,
        },
      },
    });
  };

  const handleViewInstanceDetails = (instance) => {
    if (!instance?.identifier) return;
    navigate(
      `/client-dashboard/instances/details?identifier=${encodeURIComponent(
        instance.identifier
      )}`
    );
  };

  const handleSectionClick = (sectionKey) => {
    setActiveSection(sectionKey);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const handleEdgeSync = async () => {
    if (!resolvedProjectId || !projectComposite?.region) {
      ToastUtils.error("Project and region are required to sync edge configuration");
      return;
    }
    if (isEdgeSyncing) return;

    try {
      setIsEdgeSyncing(true);
      await syncClientProjectEdgeConfig({
        project_id: resolvedProjectId,
        region: projectRegion,
      });
      ToastUtils.success("Edge network configuration synced successfully");
      await Promise.allSettled([
        refetchProjectStatus?.(),
        refetchEdgeConfig?.(),
        refetchProjectDetails?.(),
      ]);
    } catch (error) {
      console.error("Edge sync failed:", error);
      ToastUtils.error(error?.message || "Failed to sync edge configuration");
    } finally {
      setIsEdgeSyncing(false);
    }
  };
  const instanceStatusPalette = (status) => {
    const normalized = normalizeStatusValue(status);
    if (["running", "active", "ready"].includes(normalized)) {
      return { bg: designTokens.colors.success[50], text: designTokens.colors.success[700] };
    }
    if (["stopped", "terminated", "decommissioned"].includes(normalized)) {
      return { bg: designTokens.colors.neutral[100], text: designTokens.colors.neutral[700] };
    }
    if (
      ["pending", "processing", "provisioning", "initializing", "creating"].some((token) =>
        normalized.includes(token)
      )
    ) {
      return { bg: designTokens.colors.warning[50], text: designTokens.colors.warning[700] };
    }
    if (["payment_pending", "awaiting_payment", "payment_required"].some((token) =>
      normalized.includes(token)
    )) {
      return { bg: designTokens.colors.warning[100], text: designTokens.colors.warning[700] };
    }
    if (["error", "failed", "unhealthy"].some((token) => normalized.includes(token))) {
      return { bg: designTokens.colors.error[50], text: designTokens.colors.error[700] };
    }
    return { bg: designTokens.colors.neutral[100], text: designTokens.colors.neutral[700] };
  };

  const instanceStats = useMemo(() => {
    const base = {
      total: projectInstances.length,
      running: 0,
      provisioning: 0,
      paymentPending: 0,
      stopped: 0,
    };

    projectInstances.forEach((instance) => {
      const normalized = normalizeStatusValue(instance?.status);
      if (["running", "active", "ready"].includes(normalized)) {
        base.running += 1;
      } else if (
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
      } else if (["stopped", "terminated", "decommissioned"].includes(normalized)) {
        base.stopped += 1;
      }
    });

    return base;
  }, [projectInstances]);

  const recentInstances = useMemo(
    () => projectInstances.slice(0, 5),
    [projectInstances]
  );

  const handleSummaryAction = async (action, actionKey) => {
    if (!action || !action.endpoint || actionLoading) return;

    const method = (action.method || "POST").toUpperCase();
    try {
      setActionLoading(actionKey);
      await clientApi(method, withBusinessPath(action.endpoint));
      ToastUtils.success("Action completed successfully");
      await refetchProjectStatus();
    } catch (error) {
      console.error("Action failed:", error);
      ToastUtils.error(error?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignTenantAdmins = async () => {
    if (!tenantAdminMissingUsers.length || actionLoading) {
      return;
    }
    try {
      setActionLoading("tenant_admin_bulk");
      for (const entry of tenantAdminMissingUsers) {
        const method = (entry.method || "POST").toUpperCase();
        if (!entry.assign_endpoint) continue;
        await clientApi(
          method,
          withBusinessPath(entry.assign_endpoint),
          entry.assign_payload || null
        );
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
    const endpoint = withBusinessPath(action.endpoint);
    const payload = action.payload_defaults || null;
    const hasPayload =
      payload && typeof payload === "object" && Object.keys(payload).length > 0;
    const body = hasPayload ? payload : null;
    const loadingKey = `${user.id}-${actionKey}`;

    try {
      setUserActionLoading(loadingKey);
      await clientApi(method, endpoint, body);
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
    projectComposite?.region_name || projectComposite?.region || "Provider";

  const infrastructureSections = [
    {
      key: "setup",
      label: "Project Setup",
      icon: <CheckCircle size={16} />,
    },
    {
      key: "vpcs",
      label: "Virtual Private Cloud",
      icon: <Network size={16} />,
    },
    {
      key: "networks",
      label: "Networks",
      icon: <Wifi size={16} />,
    },
    {
      key: "keypairs",
      label: "Key Pairs",
      icon: <Key size={16} />,
    },
    {
      key: "edge",
      label: "Edge Network",
      icon: <Wifi size={16} />,
    },
    {
      key: "security-groups",
      label: "Security Groups",
      icon: <Shield size={16} />,
    },
    {
      key: "subnets",
      label: "Subnets",
      icon: <GitBranch size={16} />,
    },
    {
      key: "igws",
      label: "Internet Gateways",
      icon: <Globe size={16} />,
    },
    {
      key: "route-tables",
      label: "Route Tables",
      icon: <Route size={16} />,
    },
    {
      key: "enis",
      label: "Network Interfaces",
      icon: <Radio size={16} />,
    },
    {
      key: "eips",
      label: "Elastic IPs",
      icon: <Wifi size={16} />,
    },
  ];

  const areAllSummaryItemsComplete =
    summary.length > 0 && summary.every((item) => item.completed === true);

  const componentIndicatesComplete = (component) => {
    if (!component) {
      return false;
    }

    if (component.status === "completed") {
      return true;
    }

    if (typeof component.count === "number" && component.count > 0) {
      return true;
    }

    const details = component.details;
    if (Array.isArray(details) && details.length > 0) {
      return true;
    }
    if (
      details &&
      !Array.isArray(details) &&
      typeof details === "object" &&
      Object.keys(details).length > 0
    ) {
      return true;
    }

    return false;
  };

  const hasCollectionItems = (payload) => {
    if (!payload) {
      return false;
    }

    if (Array.isArray(payload)) {
      return payload.length > 0;
    }

  if (typeof payload === "object") {
    if (Array.isArray(payload.data)) {
      return payload.data.length > 0;
    }
    if (Array.isArray(payload.items)) {
      return payload.items.length > 0;
    }

    const firstArray = Object.values(payload).find(
      (value) => Array.isArray(value) && value.length > 0
    );
    if (firstArray) {
      return true;
    }

    if (Object.keys(payload).length > 0) {
      return true;
    }
  }

  return false;
};

  const getStatusForSection = (sectionKey) => {
    switch (sectionKey) {
      case "setup":
        return areAllSummaryItemsComplete && hasTenantAdmin;
      case "vpcs":
        {
          const summaryFlag = summaryCompleted(
            "vpc",
            "vpcs",
            "virtualprivatecloud",
            "vpcprovisioned"
          );
          if (summaryFlag === true) return true;
          if (projectComposite?.vpc_enabled) return true;
          if (vpcComponent) {
            if (vpcComponent.status === "completed") return true;
            if (Array.isArray(vpcComponent.details) && vpcComponent.details.length > 0) return true;
          }
          return summaryFlag ?? false;
        }
      case "networks":
        {
          if (Array.isArray(networksData) && networksData.length > 0) return true;
          const summaryFlag = summaryCompleted("network", "networks", "subnet", "subnets");
          if (summaryFlag === true) return true;
          const networksComponent = infrastructureComponents?.networks;
          if (networksComponent) {
            if (networksComponent.status === "completed") return true;
            if (Array.isArray(networksComponent.details) && networksComponent.details.length > 0) return true;
            if (typeof networksComponent.count === "number" && networksComponent.count > 0) return true;
          }
          return summaryFlag ?? false;
        }
      case "keypairs":
        {
          if (Array.isArray(keyPairsData) && keyPairsData.length > 0) return true;
          const summaryFlag = summaryCompleted("keypair", "keypairs", "createkeypair");
          if (summaryFlag === true) return true;
          if (keypairComponent) {
            if (keypairComponent.status === "completed") return true;
            if (Array.isArray(keypairComponent.details) && keypairComponent.details.length > 0) return true;
            if (typeof keypairComponent.count === "number" && keypairComponent.count > 0) return true;
          }
          return summaryFlag ?? false;
        }
      case "edge":
        {
          const edgeSummary = summaryCompleted("edge", "edge network", "edge_network");
          if (edgeSummary === true) return true;
          if (edgeComponent && componentIndicatesComplete(edgeComponent)) return true;
          if (edgePayload && hasCollectionItems(edgePayload)) return true;
          return edgeSummary ?? false;
        }
      case "security-groups":
        {
          if (Array.isArray(securityGroupsData) && securityGroupsData.length > 0) return true;
          const summaryFlag = summaryCompleted("securitygroup", "securitygroups");
          if (summaryFlag === true) return true;
          if (securityGroupComponent && componentIndicatesComplete(securityGroupComponent)) return true;
          return summaryFlag ?? false;
        }
      case "subnets":
        {
          if (Array.isArray(subnetsData) && subnetsData.length > 0) return true;
          const summaryFlag = summaryCompleted("subnet", "subnets");
          if (summaryFlag === true) return true;
          if (subnetComponent && componentIndicatesComplete(subnetComponent)) return true;
          return summaryFlag ?? false;
        }
      case "igws":
        {
          if (Array.isArray(igwsData) && igwsData.length > 0) return true;
          const summaryFlag = summaryCompleted("igw", "internetgateway", "internetgatewayattached");
          if (summaryFlag === true) return true;
          if (igwComponent && componentIndicatesComplete(igwComponent)) return true;
          return summaryFlag ?? false;
        }
      case "route-tables":
        {
          if (Array.isArray(routeTablesData) && routeTablesData.length > 0) return true;
          const summaryFlag = summaryCompleted("routetable", "routetables");
          if (summaryFlag === true) return true;
          if (routeTableComponent && componentIndicatesComplete(routeTableComponent)) return true;
          return summaryFlag ?? false;
        }
      case "enis":
        {
          if (Array.isArray(networkInterfacesData) && networkInterfacesData.length > 0) return true;
          const summaryFlag = summaryCompleted("eni", "networkinterface", "networkinterfaces");
          if (summaryFlag === true) return true;
          if (eniComponent && componentIndicatesComplete(eniComponent)) return true;
          return summaryFlag ?? false;
        }
      case "eips":
        {
          if (Array.isArray(elasticIpsData) && elasticIpsData.length > 0) return true;
          const summaryFlag = summaryCompleted("eip", "elasticip", "elasticips");
          if (summaryFlag === true) return true;
          if (eipComponent && componentIndicatesComplete(eipComponent)) return true;
          return summaryFlag ?? false;
        }
      default:
        return false;
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  const renderProvisioningTimeline = () => {
    if (!summary.length) {
      return (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{ borderColor: designTokens.colors.neutral[200], color: designTokens.colors.neutral[600] }}
        >
          No provisioning data available yet.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {summary.map((item, index) => {
          const isComplete = item?.completed ?? item?.complete ?? false;
          const actionKey = `action-${index}`;
          const normalizedTitle = normalizeSummaryKey(item?.title || "");
          const tenantAdminSummaryKey = normalizeSummaryKey("Tenant Admin Role Assigned");
          const showBulkAssign = normalizedTitle === tenantAdminSummaryKey && tenantAdminMissingUsers.length > 0;
          const isBulkLoading = actionLoading === "tenant_admin_bulk";
          const isThisActionLoading = actionLoading === actionKey;
          return (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="h-10 w-10 flex items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: isComplete
                      ? designTokens.colors.success[400]
                      : designTokens.colors.neutral[300],
                    backgroundColor: isComplete
                      ? designTokens.colors.success[50]
                      : designTokens.colors.neutral[0],
                    color: isComplete
                      ? designTokens.colors.success[600]
                      : designTokens.colors.neutral[400],
                  }}
                >
                  {isComplete ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </div>
                {index !== summary.length - 1 && (
                  <span
                    className="flex-1 w-px mt-2"
                    style={{ backgroundColor: designTokens.colors.neutral[200] }}
                  />
                )}
              </div>
              <div
                className="flex-1 rounded-xl border p-4"
                style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: designTokens.colors.neutral[0] }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: designTokens.colors.neutral[900] }}
                  >
                    {item.title}
                  </p>
                  {typeof item.count === "number" && (
                    <span className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                      ({item.count})
                    </span>
                  )}
                  {typeof item.missing_count === "number" && item.missing_count > 0 && (
                    <span className="text-xs" style={{ color: designTokens.colors.warning[600] }}>
                      ({item.missing_count} missing)
                    </span>
                  )}
                  <StatusBadge
                    label={isComplete ? "Completed" : "Needs attention"}
                    active={isComplete}
                    tone={isComplete ? "success" : "danger"}
                  />
                </div>
                {item.description && (
                  <p
                    className="mt-2 text-sm"
                    style={{ color: designTokens.colors.neutral[600] }}
                  >
                    {item.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.action && (
                    <ModernButton
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleSummaryAction(item.action, actionKey)}
                      disabled={actionLoading !== null}
                    >
                      {isThisActionLoading && <Loader2 size={14} className="animate-spin" />}
                      {item.action.label}
                    </ModernButton>
                  )}
                  {showBulkAssign && (
                    <ModernButton
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={handleAssignTenantAdmins}
                      disabled={isBulkLoading}
                    >
                      {isBulkLoading && <Loader2 size={14} className="animate-spin" />}
                      Assign all tenant admins
                    </ModernButton>
                  )}
                </div>
                {showBulkAssign && (
                  <p className="mt-2 text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                    Users pending elevation:{" "}
                    {tenantAdminMissingUsers
                      .map((entry) => entry.name || entry.identifier || entry.id)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const userProvisioningBlock = () => {
    if (!projectUsers.length) {
      return (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{ borderColor: designTokens.colors.neutral[200], color: designTokens.colors.neutral[600] }}
        >
          No users are associated with this project yet.
        </div>
      );
    }

    const missingProviderAccounts = Array.isArray(userBlock?.provider_missing)
      ? userBlock.provider_missing
      : [];
    const missingAwsPolicies = Array.isArray(userBlock?.aws_policy_missing)
      ? userBlock.aws_policy_missing
      : [];
    const missingSympPolicies = Array.isArray(userBlock?.symp_policy_missing)
      ? userBlock.symp_policy_missing
      : [];
    const missingTenantAdmins = Array.isArray(userBlock?.tenant_admin_missing)
      ? userBlock.tenant_admin_missing
      : [];

    const annotateUser = (user) => {
      const matchesEntry = (entry) =>
        entry.id === user.id ||
        entry.identifier === user.identifier ||
        entry.email === user.email;

      return {
        missingProvider: missingProviderAccounts.some(matchesEntry),
        missingAws: missingAwsPolicies.some(matchesEntry),
        missingSymp: missingSympPolicies.some(matchesEntry),
        missingTenant: missingTenantAdmins.some(matchesEntry),
      };
    };

    return (
      <div className="space-y-3">
        {projectUsers.map((user) => {
          const roles = Array.isArray(user.roles)
            ? user.roles
            : user.role
            ? [user.role]
            : [];
          const isTenantAdminUser = isTenantAdmin(user);
          const isMemberUser = isMember(user);
          const actions = user?.actions || {};
          const actionKeys = Object.keys(actions);
          const normalizeActionLabel = (action) =>
            action?.label ? action.label.toLowerCase?.() || String(action.label).toLowerCase() : "";
          const promoteKey =
            actionKeys.find((key) => promoteActionCandidates.includes(key)) ||
            actionKeys.find((key) => {
              const label = normalizeActionLabel(actions[key]);
              return label.includes("tenant admin") && (label.includes("assign") || label.includes("make") || label.includes("promote"));
            });
          const demoteKey =
            actionKeys.find((key) => demoteActionCandidates.includes(key)) ||
            actionKeys.find((key) => {
              const label = normalizeActionLabel(actions[key]);
              return label.includes("member") && (label.includes("assign") || label.includes("make") || label.includes("switch") || label.includes("revert") || label.includes("demote"));
            });
          const toggleActionKey = isTenantAdminUser ? demoteKey : promoteKey;
          const excludedRoleActionKeys = new Set();
          if (promoteKey) excludedRoleActionKeys.add(promoteKey);
          if (demoteKey) excludedRoleActionKeys.add(demoteKey);
          const orderedKeys = [
            ...userActionOrder,
            ...actionKeys.filter((key) => !userActionOrder.includes(key)),
          ];
          const visibleActions = orderedKeys.filter((key) => {
            const action = actions[key];
            if (!action) return false;
            if (excludedRoleActionKeys.has(key)) return false;
            if (action.show === undefined) return true;
            return action.show;
          });
          const toggleAction = toggleActionKey ? actions[toggleActionKey] : null;
          const toggleActionVisible =
            toggleAction?.endpoint && (toggleAction.show === undefined || toggleAction.show);
          const roleLoadingKey = toggleActionKey ? `${user.id}-${toggleActionKey}` : null;
          const isRoleLoading = roleLoadingKey ? userActionLoading === roleLoadingKey : false;
          const flagged = annotateUser(user);
          const statusEntries = [
            {
              label: `${providerLabel} Account`,
              value: user?.status?.provider_account,
              missing: flagged.missingProvider,
            },
            {
              label: "Storage Policy",
              value: user?.status?.aws_policy,
              missing: flagged.missingAws,
            },
            {
              label: "Network Policy",
              value: user?.status?.symp_policy,
              missing: flagged.missingSymp,
            },
            {
              label: "Tenant Admin",
              value: isTenantAdminUser,
              missing: flagged.missingTenant,
            },
            {
              label: "Member",
              value: isMemberUser,
              missing: false,
            },
          ];

          return (
            <div
              key={user.id}
              className="rounded-2xl border p-4"
              style={{
                borderColor: designTokens.colors.neutral[200],
                backgroundColor: designTokens.colors.neutral[0],
              }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                  {roles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: designTokens.colors.primary[50],
                            color: designTokens.colors.primary[700],
                          }}
                        >
                          {role.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {statusEntries.map(({ label, value, missing }) =>
                    renderStatusChip(label, Boolean(value) && !missing)
                  )}
                </div>
              </div>
              {toggleAction && (
                <div className="mt-4">
                  {toggleActionVisible ? (
                    <ModernButton
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleUserAction(user, toggleActionKey)}
                      disabled={userActionLoading !== null}
                    >
                      {isRoleLoading && <Loader2 size={14} className="animate-spin" />}
                      {toggleAction.label ||
                        (isTenantAdminUser ? "Switch to Member" : "Make Tenant Admin")}
                    </ModernButton>
                  ) : (
                    <p className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                      Role switching is currently unavailable for this user. Verify backend permissions and retry.
                    </p>
                  )}
                </div>
              )}
              {visibleActions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {visibleActions.map((actionKey) => {
                    const action = actions[actionKey];
                    const loadingKey = `${user.id}-${actionKey}`;
                    const isLoading = userActionLoading === loadingKey;
                    return (
                      <ModernButton
                        key={actionKey}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => handleUserAction(user, actionKey)}
                        disabled={userActionLoading !== null}
                      >
                        {isLoading && <Loader2 size={14} className="animate-spin" />}
                        {action.label}
                      </ModernButton>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "setup":
        {
          const completedSummaryCount = summary.filter(
            (item) => item?.completed === true
          ).length;
          const completionRatio =
            summary.length > 0
              ? Math.round((completedSummaryCount / summary.length) * 100)
              : 0;

          return (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "linear-gradient(135deg, #0b63ce 0%, #6aa4ff 45%, #051937 100%)",
                    color: "#fff",
                  }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                        <CheckCircle size={14} />
                        {completedSummaryCount} of {summary.length} provisioning steps complete
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                        {providerLabel}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                        Region • {projectComposite?.region || "NA"}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Provisioning Snapshot</h2>
                      <p className="mt-2 text-sm text-white/70">
                        Keep an eye on what is ready, what is pending, and which users need attention before the environment can go live.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="relative">
                        <div
                          className="h-20 w-20 rounded-full flex items-center justify-center text-lg font-semibold"
                          style={{
                            background: `conic-gradient(${designTokens.colors.primary[200]} ${completionRatio}%, rgba(255,255,255,0.15) 0)`,
                            color: "#fff",
                          }}
                        >
                          <span className="text-xl font-semibold">{completionRatio}%</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-200" />
                          <span>{completedSummaryCount} completed checklist items</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasTenantAdmin ? (
                            <CheckCircle size={16} className="text-emerald-200" />
                          ) : (
                            <XCircle size={16} className="text-red-200" />
                          )}
                          <span>
                            {hasTenantAdmin
                              ? "Tenant admin provisioning available"
                              : "Add at least one tenant admin to activate provisioning"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {componentIndicatesComplete(edgeComponent) ? (
                            <CheckCircle size={16} className="text-emerald-200" />
                          ) : (
                            <XCircle size={16} className="text-yellow-200" />
                          )}
                          <span>
                            {componentIndicatesComplete(edgeComponent)
                              ? "Edge network ready"
                              : "Sync edge network configuration"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: hasTenantAdmin
                        ? designTokens.colors.success[200]
                        : designTokens.colors.warning[200],
                      backgroundColor: hasTenantAdmin
                        ? designTokens.colors.success[50]
                        : designTokens.colors.warning[50],
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: hasTenantAdmin ? designTokens.colors.success[700] : designTokens.colors.warning[700] }}>
                      {hasTenantAdmin
                        ? "Provisioning is unlocked"
                        : "A tenant admin is required to activate provisioning"}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: hasTenantAdmin ? designTokens.colors.success[600] : designTokens.colors.warning[600] }}>
                      {hasTenantAdmin
                        ? "At least one tenant admin can initiate provisioning flows, while other users remain members."
                        : "Switch a project user to the tenant_admin role to unlock provisioning actions."}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: designTokens.colors.neutral[0] }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                          Edge Network Sync
                        </p>
                        <p className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                          {componentIndicatesComplete(edgeComponent)
                            ? "Edge configuration is in sync."
                            : "Synchronize edge configuration with provider."}
                        </p>
                      </div>
                      <ModernButton
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setIsAssignEdgeOpen(true)}
                      >
                        Manage
                      </ModernButton>
                    </div>
                    <ModernButton
                      size="sm"
                      variant="outline"
                      className="mt-3 flex items-center gap-2"
                      onClick={handleEdgeSync}
                      disabled={
                        isEdgeSyncing ||
                        !resolvedProjectId ||
                        !projectComposite?.region
                      }
                    >
                      <RefreshCw size={14} className={isEdgeSyncing ? "animate-spin" : ""} />
                      {isEdgeSyncing ? "Syncing edge configuration..." : "Sync edge configuration"}
                    </ModernButton>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: designTokens.colors.neutral[0] }}
              >
                <h3 className="mb-4 text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                  Provisioning Checklist
                </h3>
                {renderProvisioningTimeline()}
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: designTokens.colors.neutral[200],
                  backgroundColor: designTokens.colors.neutral[0],
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                    Pending Instance Payments
                  </h3>
                  <StatusBadge
                    label={
                      pendingPaymentEntries.length
                        ? `${pendingPaymentEntries.length} payment${pendingPaymentEntries.length > 1 ? "s" : ""} pending`
                        : "All payments clear"
                    }
                    active={pendingPaymentEntries.length === 0}
                    tone={pendingPaymentEntries.length === 0 ? "success" : "danger"}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                  Instances remain paused until billing completes. Resume payments directly from here to keep provisioning on track.
                </p>

                {isProjectDetailsFetching ? (
                  <div
                    className="mt-4 flex items-center gap-2 text-sm"
                    style={{ color: designTokens.colors.neutral[600] }}
                  >
                    <Loader2 size={16} className="animate-spin" />
                    Loading project billing data...
                  </div>
                ) : pendingPaymentEntries.length === 0 ? (
                  <div
                    className="mt-4 rounded-xl border border-dashed px-4 py-6 text-sm text-center"
                    style={{
                      borderColor: designTokens.colors.neutral[200],
                      color: designTokens.colors.neutral[500],
                      backgroundColor: designTokens.colors.neutral[50],
                    }}
                  >
                    All instance payments are up to date for this project.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {pendingPaymentEntries.map((entry) => {
                      const instance = entry.instance;
                      const transaction = entry.transaction;
                      const paymentOptionSample =
                        Array.isArray(entry.paymentOptions) && entry.paymentOptions.length
                          ? entry.paymentOptions[0]
                          : null;
                      const amountValue =
                        typeof transaction?.amount === "number"
                          ? transaction.amount
                          : typeof paymentOptionSample?.total === "number"
                          ? paymentOptionSample.total
                          : null;
                      const currencyValue =
                        transaction?.currency ||
                        paymentOptionSample?.currency ||
                        projectComposite?.currency ||
                        "NGN";
                      const amountDisplay =
                        amountValue !== null && amountValue !== undefined
                          ? `${currencyValue} ${amountValue.toLocaleString()}`
                          : "Payment link pending";
                      const expiresDate = entry.expiresAt ? new Date(entry.expiresAt) : null;
                      const expiresLabel =
                        expiresDate && !Number.isNaN(expiresDate.getTime())
                          ? expiresDate.toLocaleString()
                          : null;
                      const statusLabel = (transaction?.status || instance.status || "pending")
                        .toString()
                        .replace(/_/g, " ");

                      return (
                        <div
                          key={instance.identifier || instance.id}
                          className="rounded-xl border px-4 py-3"
                          style={{
                            borderColor: designTokens.colors.neutral[200],
                            backgroundColor: designTokens.colors.neutral[50],
                          }}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: designTokens.colors.neutral[900] }}
                              >
                                {instance.name || instance.identifier || "Pending instance"}
                              </p>
                              <p
                                className="font-mono text-xs"
                                style={{ color: designTokens.colors.neutral[500] }}
                              >
                                {instance.identifier || "—"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                                Amount
                              </p>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: designTokens.colors.neutral[900] }}
                              >
                                {amountDisplay}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: designTokens.colors.warning[50],
                                color: designTokens.colors.warning[700],
                              }}
                            >
                              {statusLabel}
                            </span>
                            {expiresLabel && (
                              <span
                                className="text-xs"
                                style={{ color: designTokens.colors.neutral[500] }}
                              >
                                Expires {expiresLabel}
                              </span>
                            )}
                          </div>
                          <ModernButton
                            size="sm"
                            variant="outline"
                            className="mt-3 flex items-center gap-2"
                            onClick={() => handleOpenPayment(entry)}
                            disabled={Boolean(paymentLoading)}
                          >
                            {paymentLoading === instance.identifier && (
                              <Loader2 size={14} className="animate-spin" />
                            )}
                            Resume payment
                          </ModernButton>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: designTokens.colors.neutral[0] }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                    User Provisioning
                  </h3>
                <StatusBadge
                  label={hasTenantAdmin ? "Tenant admin ready" : "Tenant admin required"}
                  active={hasTenantAdmin}
                  tone={hasTenantAdmin ? "success" : "danger"}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                A tenant admin must be active to unlock provisioning flows. Other users can be switched between member and tenant admin at any time.
              </p>
              <div className="mt-4">{userProvisioningBlock()}</div>
            </div>
          </div>
        );
        }
      case "vpcs":
        return (
          <VPCs
            projectId={resolvedProjectId}
            region={projectComposite?.region}
            provider={projectComposite?.provider}
          />
        );
      case "networks":
        return (
          <Networks projectId={resolvedProjectId} region={projectRegion} />
        );
      case "keypairs":
        return (
          <KeyPairs
            projectId={resolvedProjectId}
            region={projectComposite?.region}
            provider={projectComposite?.provider}
          />
        );
      case "edge": {
        const statusTone = (value) => {
          const normalized = (value || "").toString().toLowerCase();
          if (["available", "active", "ready"].includes(normalized)) return "success";
          if (["pending", "provisioning", "creating", "syncing"].includes(normalized)) return "warning";
          if (["error", "failed"].includes(normalized)) return "danger";
          return "neutral";
        };

        const formatRange = (range) => {
          if (!range) return "—";
          if (range.start && range.end) return `${range.start} – ${range.end}`;
          return range.start || range.end || "—";
        };

        const flowlogsEnabled = Boolean(
          edgePayload?.flowlogs_enabled ?? edgePayload?.metadata?.flowlogs_enabled
        );

        const edgeNetworks = Array.isArray(edgePayload?.metadata?.edge_networks)
          ? edgePayload.metadata.edge_networks
          : [];
        const ipPoolMap = edgePayload?.metadata?.edge_network_ip_pools || {};

        const networkCards = edgeNetworks.map((network) => {
          const routerInfo = network?.router_info || {};
          const primarySubnet = Array.isArray(network?.subnet_infos)
            ? network.subnet_infos[0]
            : null;

          const metadata = [
            { label: "VLAN", value: network?.vlan ?? "—" },
            { label: "MTU", value: network?.mtu ?? "—" },
            { label: "Router", value: routerInfo?.name || routerInfo?.id || "—" },
            { label: "Router IP", value: routerInfo?.public_ip || "—" },
            {
              label: "Gateway IP",
              value:
                primarySubnet?.gateway_ip ||
                routerInfo?.internal_interfaces?.[0] ||
                "—",
            },
            {
              label: "Subnet CIDR",
              value: primarySubnet?.cidr_block || "—",
            },
          ];

          if (Array.isArray(network?.assigned_projects)) {
            metadata.push({
              label: "Assigned Projects",
              value: network.assigned_projects.length,
            });
          }

          const statuses = [
            {
              label: network?.state || "unknown",
              tone: statusTone(network?.state),
            },
            network?.shared ? { label: "Shared", tone: "info" } : null,
          ].filter(Boolean);

          return (
            <ResourceListCard
              key={network.id}
              title={network.name || "Edge network"}
              subtitle={network.id}
              metadata={metadata}
              statuses={statuses}
            />
          );
        });

        const ipPoolCards = Object.entries(ipPoolMap).flatMap(([edgeId, pools]) => {
          if (!Array.isArray(pools)) return [];
          return pools.map((pool) => {
            const ranges = Array.isArray(pool?.ip_ranges) ? pool.ip_ranges : [];
            return (
              <ResourceListCard
                key={`${edgeId}-${pool.id || pool.edge_network_ip_pool_id}`}
                title={pool.name || pool.label || "IP Pool"}
                subtitle={pool.edge_network_ip_pool_id || pool.id}
                metadata={[
                  {
                    label: "Pool Type",
                    value: pool.pool_type?.replace(/_/g, " ") || "—",
                  },
                  {
                    label: "Total IPs",
                    value: pool.total_ip_address_count ?? "—",
                  },
                  {
                    label: "Available",
                    value: pool.available_ip_address_count ?? "—",
                  },
                  {
                    label: "Usage",
                    value:
                      pool.used_ips_ratio ||
                      (typeof pool.fill_ratio === "number"
                        ? `${Math.round(pool.fill_ratio * 100)}%`
                        : "—"),
                  },
                  {
                    label: "IP Range",
                    value: ranges.length
                      ? ranges
                          .slice(0, 2)
                          .map((range) => formatRange(range))
                          .join(", ")
                      : "—",
                  },
                ]}
                statuses={[
                  pool.is_vpc_default_ip_pool
                    ? { label: "Default pool", tone: "success" }
                    : null,
                  pool.shared ? { label: "Shared", tone: "info" } : null,
                ].filter(Boolean)}
              />
            );
          });
        });

        const assignmentMetadata = [
          {
            label: "IP Pool",
            value: edgePayload?.ip_pool_label,
          },
          {
            label: "Default Edge Subnet",
            value: edgePayload?.metadata?.default_edge_subnet,
          },
          {
            label: "Default IP Pool",
            value: edgePayload?.metadata?.default_edgenet_ip_pool,
          },
          {
            label: "Project VLAN Pool",
            value: edgePayload?.metadata?.project_vlan_pool_id,
          },
        ].filter((item) => item.value);

        const assignmentStatuses = [
          flowlogsEnabled
            ? { label: "Flow logs enabled", tone: "success" }
            : { label: "Flow logs disabled", tone: "neutral" },
          edgePayload?.metadata?.project_type
            ? {
                label: edgePayload.metadata.project_type.replace(/_/g, " "),
                tone: "info",
              }
            : null,
        ].filter(Boolean);

        const assignmentCard = edgePayload ? (
          <ResourceListCard
            title={edgePayload.edge_network_label || "Edge assignment"}
            subtitle={
              edgePayload.edge_network_id ||
              edgePayload?.metadata?.default_edge_network ||
              "—"
            }
            metadata={assignmentMetadata}
            statuses={assignmentStatuses}
          />
        ) : null;

        const hasDetails = networkCards.length > 0 || ipPoolCards.length > 0;

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3
                className="text-lg font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Configure Edge Network
              </h3>
              <div className="flex items-center gap-2">
                <ModernButton
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setIsAssignEdgeOpen(true)}
                >
                  Manage assignment
                </ModernButton>
                <ModernButton
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleEdgeSync}
                  disabled={
                    isEdgeSyncing || !resolvedProjectId || !projectComposite?.region
                  }
                >
                  <RefreshCw size={14} className={isEdgeSyncing ? "animate-spin" : ""} />
                  {isEdgeSyncing ? "Syncing..." : "Sync edge"}
                </ModernButton>
              </div>
            </div>

            <div
              className="space-y-4 rounded-xl border p-4"
              style={{
                borderColor: designTokens.colors.neutral[200],
                backgroundColor: designTokens.colors.neutral[0],
              }}
            >
              {isEdgeConfigLoading ? (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: designTokens.colors.neutral[600] }}
                >
                  <Loader2 size={16} className="animate-spin" />
                  Loading edge configuration...
                </div>
              ) : edgePayload ? (
                <div className="space-y-4">
                  {assignmentCard}
                  {networkCards.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {networkCards}
                    </div>
                  )}
                  {ipPoolCards.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {ipPoolCards}
                    </div>
                  )}
                  {!hasDetails && (
                    <p
                      className="text-sm"
                      style={{ color: designTokens.colors.neutral[600] }}
                    >
                      This edge assignment does not expose additional provider metadata.
                    </p>
                  )}
                </div>
              ) : (
                <p
                  className="text-sm"
                  style={{ color: designTokens.colors.neutral[600] }}
                >
                  No edge configuration has been assigned. Use “Manage assignment” to attach a saved configuration.
                </p>
              )}
            </div>
          </div>
        );
      }
      case "security-groups":
        return (
          <SecurityGroup
            projectId={resolvedProjectId}
            region={projectRegion}
          />
        );
      case "subnets":
        return (
          <Subnets
            projectId={resolvedProjectId}
            region={projectRegion}
          />
        );
      case "igws":
        return (
          <IGWs
            projectId={resolvedProjectId}
            region={projectRegion}
          />
        );
      case "route-tables":
        return (
          <RouteTables
            projectId={resolvedProjectId}
            region={projectRegion}
          />
        );
      case "enis":
        return (
          <ENIs
            projectId={resolvedProjectId}
            region={projectRegion}
          />
        );
      case "eips":
        return (
          <EIPs
            projectId={resolvedProjectId}
            region={projectRegion}
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
    displayStatus || "unknown"
  );
  const totalInfraSections = infrastructureSections.length || 1;
  const infrastructureStepLabel = `${completedSections}/${totalInfraSections} infra steps`;
  const heroProjectIdentifier =
    projectComposite?.identifier ||
    project?.identifier ||
    resolvedProjectId ||
    projectId;
  const heroProviderLabel =
    projectComposite?.provider ||
    project?.provider ||
    "Provider";
  const heroRegionLabel = (
    projectComposite?.region ||
    project?.region ||
    "Region"
  ).toUpperCase();
  const heroDescription =
    projectComposite?.description ||
    project?.description ||
    "Configure infrastructure, track instances, and manage networking resources for this project.";

  const metadataItems = useMemo(
    () => [
      {
        label: "Project Identifier",
        value: heroProjectIdentifier || "—",
      },
      {
        label: "Project Type",
        value: toTitleCase(
          projectComposite?.type || project?.type || "Unknown"
        ),
      },
      {
        label: "Created",
        value: formatDate(
          projectComposite?.created_at || project?.created_at
        ),
      },
      {
        label: "Instances",
        value: `${instanceCount} tracked`,
      },
    ],
    [
      heroProjectIdentifier,
      instanceCount,
      projectComposite?.created_at,
      projectComposite?.type,
      project?.created_at,
      project?.type,
    ]
  );

  const summaryMetrics = useMemo(
    () => [
      {
        label: "Project Type",
        value: toTitleCase(projectComposite?.type || project?.type),
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
        value: formatDate(
          projectComposite?.created_at || project?.created_at
        ),
        helper: "Project inception date",
        icon: Clock,
      },
    ],
    [
      heroRegionLabel,
      instanceCount,
      projectComposite?.created_at,
      projectComposite?.type,
      project?.created_at,
      project?.type,
    ]
  );

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <ModernButton
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => navigate("/client-dashboard/projects")}
      >
        <ChevronLeft size={16} />
        Projects
      </ModernButton>
      <ModernButton
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={async () => {
          await Promise.allSettled([
            refetchProjectStatus?.(),
            refetchProjectDetails?.(),
            refetchEdgeConfig?.(),
          ]);
        }}
        disabled={isProjectStatusFetching || isProjectDetailsFetching || isEdgeConfigLoading}
      >
        <RefreshCw
          size={14}
          className={
            isProjectStatusFetching || isProjectDetailsFetching || isEdgeConfigLoading
              ? "animate-spin"
              : ""
          }
        />
        Refresh
      </ModernButton>
      <ModernButton size="sm" className="flex items-center gap-2" onClick={() => setIsAssignEdgeOpen(true)}>
        Manage edge config
      </ModernButton>
    </div>
  );

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <ClientPageShell
        title={projectComposite?.name || "Project Overview"}
        description={
          resolvedProjectId
            ? `${heroProjectIdentifier} • ${heroProviderLabel} • ${heroRegionLabel}`
            : "Loading project context..."
        }
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <ModernCard
          variant="glass"
          padding="none"
          className="overflow-hidden"
        >
          <div
            className="relative p-6 md:p-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(11, 99, 206, 0.95) 0%, rgba(17, 24, 39, 0.92) 60%, rgba(3, 7, 18, 0.95) 100%)",
              color: "#fff",
              borderRadius: designTokens.borderRadius.xl,
            }}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-5">
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                  Project Control Center
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${projectStatusVariant.bg} ${projectStatusVariant.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${projectStatusVariant.dot}`} />
                    {projectStatusVariant.label}
                  </span>
                  <NeutralPill icon={Shield} label={heroProjectIdentifier || "—"} />
                  <NeutralPill icon={Layers} label={heroProviderLabel} />
                  <NeutralPill icon={MapPin} label={heroRegionLabel} />
                  <NeutralPill icon={Activity} label={infrastructureStepLabel} />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold md:text-4xl">
                    {projectComposite?.name || "Project Overview"}
                  </h1>
                  <p className="max-w-2xl text-sm md:text-base text-white/80">
                    {heroDescription}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-6 lg:items-end">
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={handleNavigateAddInstance}
                    disabled={!canCreateInstances}
                    title={
                      canCreateInstances
                        ? "Launch multi-instance workflow"
                        : `Complete the following before launching an instance: ${missingInstancePrereqs.join(
                            ", "
                          )}.`
                    }
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                      canCreateInstances
                        ? "bg-white text-[#0b63ce] hover:bg-white/90 hover:text-[#0b63ce]"
                        : "bg-white/20 text-white/60 cursor-not-allowed"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Add Instance
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAssignEdgeOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                  >
                    <Wifi className="h-4 w-4" />
                    Manage Edge
                  </button>
                </div>
                <div className="flex items-center gap-6 lg:gap-8">
                  <div className="text-center">
                    <div
                      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20"
                      style={{
                        background: `conic-gradient(rgba(255,255,255,0.9) ${healthPercent}%, rgba(255,255,255,0.2) 0)`,
                      }}
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-semibold text-[#0b63ce]">
                        {healthPercent}%
                      </div>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-white/70">
                      Infrastructure health
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm text-white/85">
                    {metadataItems.map((item) => (
                      <div key={item.label}>
                        <p className="text-xs uppercase tracking-wide text-white/60">
                          {item.label}
                        </p>
                        <p className="mt-1 font-medium">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryMetrics.map((metric) => (
                <SummaryMetricCard key={metric.label} {...metric} />
              ))}
            </div>
            <div className="pointer-events-none absolute right-6 top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          </div>
          {!canCreateInstances && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
              <p className="font-semibold text-amber-900">Instances locked</p>
              <p className="mt-1">
                Complete the following before provisioning new instances:{" "}
                <span className="font-medium">
                  {missingInstancePrereqs.join(", ")}
                </span>
                .
              </p>
            </div>
          )}
        </ModernCard>

        <ModernCard padding="lg" variant="outlined">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Instances overview</h2>
              <p className="mt-1 text-sm text-gray-600">
                Review instance activity before jumping into the detailed tabs below.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ModernButton
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => navigate(`/client-dashboard/instances?project=${encodeURIComponent(resolvedProjectId)}`)}
                disabled={!resolvedProjectId}
              >
                View all instances
              </ModernButton>
              <ModernButton
                size="sm"
                className="flex items-center gap-2"
                onClick={handleNavigateAddInstance}
                disabled={!resolvedProjectId}
              >
                <Plus size={16} />
                Add Instance
              </ModernButton>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: designTokens.colors.primary[100],
                backgroundColor: designTokens.colors.primary[50],
              }}
            >
              <p
                className="text-xs font-semibold uppercase"
                style={{ color: designTokens.colors.primary[700] }}
              >
                Total
              </p>
              <p
                className="mt-2 text-2xl font-semibold"
                style={{ color: designTokens.colors.primary[700] }}
              >
                {instanceStats.total}
              </p>
              <p
                className="text-xs"
                style={{ color: designTokens.colors.primary[600] }}
              >
                Instances discovered
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: designTokens.colors.success[100] }}>
              <p className="text-xs font-semibold uppercase" style={{ color: designTokens.colors.success[700] }}>
                Running
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: designTokens.colors.success[700] }}>
                {instanceStats.running}
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: designTokens.colors.warning[100] }}>
              <p className="text-xs font-semibold uppercase" style={{ color: designTokens.colors.warning[700] }}>
                Provisioning
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: designTokens.colors.warning[700] }}>
                {instanceStats.provisioning}
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: designTokens.colors.warning[100] }}>
              <p className="text-xs font-semibold uppercase" style={{ color: designTokens.colors.warning[700] }}>
                Payment pending
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: designTokens.colors.warning[700] }}>
                {instanceStats.paymentPending}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Most recent instances</p>
              <span className="text-xs text-gray-500">Showing {recentInstances.length} of {projectInstances.length}</span>
            </div>
            {recentInstances.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                No instances have been provisioned yet. Use the button above to start a deployment.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Instance</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white text-sm">
                    {recentInstances.map((instance) => {
                      const palette = instanceStatusPalette(instance.status);
                      return (
                        <tr key={instance.id || instance.identifier}>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">
                                {instance.name || instance.identifier || "Unnamed Instance"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {instance.identifier || "—"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {instance.flavor || instance.instance_type || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                              style={{
                                backgroundColor: palette.bg,
                                color: palette.text,
                              }}
                            >
                              {instance.status?.replace(/_/g, " ") || "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {instance.created_at
                              ? new Date(instance.created_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ModernButton
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleViewInstanceDetails(instance)}
                            >
                              View
                            </ModernButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ModernCard>

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <ModernCard
            variant="outlined"
            padding="lg"
            className="space-y-6"
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: designTokens.colors.neutral[800] }}>
                Quick Status
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                <StatusBadge
                  label="Provisioning ready"
                  active={areAllSummaryItemsComplete && hasTenantAdmin}
                  tone={areAllSummaryItemsComplete && hasTenantAdmin ? "success" : "danger"}
                />
                <StatusBadge
                  label="Edge configuration synced"
                  active={componentIndicatesComplete(edgeComponent)}
                  tone={componentIndicatesComplete(edgeComponent) ? "success" : "neutral"}
                />
              <StatusBadge
                label="Tenant admin present"
                active={hasTenantAdmin}
                tone={hasTenantAdmin ? "success" : "danger"}
              />
              <StatusBadge
                label="Instance prerequisites ready"
                active={canCreateInstances}
                tone={canCreateInstances ? "success" : "danger"}
              />
            </div>
          </div>

            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: designTokens.colors.neutral[800] }}>
                Infrastructure Journey
              </h3>
              <div className="relative pl-3">
                <div className="absolute left-[23px] top-3 bottom-3 hidden w-px bg-gray-200 md:block" />
                <div className="space-y-3">
                  {infrastructureSections.map((section, index) => {
                    const isComplete = getStatusForSection(section.key);
                    const isActive = activeSection === section.key;
                    const isFirst = index === 0;
                    const iconNode = React.cloneElement(section.icon, {
                      size: 18,
                      style: {
                        color: isComplete
                          ? designTokens.colors.success[500]
                          : designTokens.colors.neutral[400],
                    },
                    });

                    return (
                      <button
                        key={section.key}
                        onClick={() => handleSectionClick(section.key)}
                        className="relative w-full rounded-xl border px-4 py-3 text-left transition"
                        style={{
                          backgroundColor: isActive
                            ? designTokens.colors.primary[50]
                            : "#FFFFFF",
                          borderColor: isActive
                            ? designTokens.colors.primary[200]
                            : designTokens.colors.neutral[200],
                          boxShadow: isActive ? "0 4px 8px rgba(11, 99, 206, 0.08)" : "none",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full border"
                              style={{
                                borderColor: isComplete
                                  ? designTokens.colors.success[200]
                                  : designTokens.colors.neutral[200],
                                backgroundColor: isComplete
                                  ? designTokens.colors.success[50]
                                  : "#FFFFFF",
                              }}
                            >
                              {iconNode}
                            </div>
                            {!isFirst && (
                              <div className="absolute -top-10 left-1/2 hidden h-10 w-px -translate-x-1/2 bg-gray-200 md:block" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className="text-sm font-semibold"
                              style={{
                                color: isActive
                                  ? designTokens.colors.primary[700]
                                  : designTokens.colors.neutral[800],
                              }}
                            >
                              {section.label}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: designTokens.colors.neutral[500] }}
                            >
                              {isComplete ? "Ready to provision" : "Pending configuration"}
                            </p>
                          </div>
                          <span
                            className="rounded-full px-2 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: isComplete
                                ? designTokens.colors.success[50]
                                : designTokens.colors.neutral[100],
                              color: isComplete
                                ? designTokens.colors.success[600]
                                : designTokens.colors.neutral[600],
                            }}
                          >
                            {isComplete ? "Ready" : "Pending"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ModernCard>

          <ModernCard variant="outlined" padding="lg">
            <div ref={contentRef}>{renderSectionContent()}</div>
          </ModernCard>
        </div>
      </ClientPageShell>

      {activePaymentPayload && (
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        transactionData={activePaymentPayload}
        onPaymentComplete={handlePaymentComplete}
        authToken={clientToken}
      />
      )}

      <ClientAssignEdgeConfigModal
        isOpen={isAssignEdgeOpen}
        onClose={() => setIsAssignEdgeOpen(false)}
        projectId={resolvedProjectId}
        region={projectComposite?.region}
        onAssigned={async () => {
          await Promise.allSettled([
            refetchProjectStatus?.(),
            refetchProjectDetails?.(),
            refetchEdgeConfig?.(),
          ]);
        }}
      />
    </>
  );
}

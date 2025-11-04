import React, { useState, useEffect, useRef, useCallback } from "react";
import CartFloat from "../components/cartFloat";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react"; // Import Pencil and Trash2
import AddInstanceModal from "../components/addInstanace";
import PaymentModal from "../components/instancesubcomps/paymentModalcomponent";
import { useLocation, useNavigate } from "react-router-dom";
import { useFetchProjectById } from "../../hooks/projectHooks";
import EditDescriptionModal from "./projectComps/editProject";
import ConfirmDeleteModal from "./projectComps/deleteProject";
import KeyPairs from "./infraComps/keyPairs";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import IGWs from "./infraComps/igws";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/eni";
import EIPs from "./infraComps/elasticIP";
import Subnets from "./infraComps/subnet";
import EdgeConfigPanel from "../components/EdgeConfigPanel";
import { useFetchTenantKeyPairs } from "../../hooks/keyPairsHook";
import { useFetchTenantSecurityGroups } from "../../hooks/securityGroupHooks";
import { useFetchTenantSubnets } from "../../hooks/subnetHooks";
import { useFetchTenantInternetGateways } from "../../hooks/internetGatewayHooks";
import { useFetchTenantRouteTables } from "../../hooks/routeTable";
import { useFetchTenantNetworkInterfaces } from "../../hooks/eni";
import { useFetchTenantElasticIps } from "../../hooks/elasticIPHooks";
import { useFetchTenantVpcs } from "../../hooks/vpcHooks";
import ToastUtils from "../../utils/toastUtil";
import silentApi from "../../index/silent";

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

const normalizeStatusValue = (value) =>
  (value || "").toString().toLowerCase().replace(/\s+/g, "_");

const PAYMENT_STATUS_MARKERS = [
  "payment_pending",
  "pending_payment",
  "awaiting_payment",
  "payment_required",
];

const isTransactionPending = (transaction) => {
  if (!transaction) return false;
  const statusValue = normalizeStatusValue(transaction.status);
  if (!statusValue) return false;
  if (PAYMENT_STATUS_MARKERS.some((marker) => statusValue.includes(marker))) {
    return true;
  }
  return statusValue === "pending";
};

const instanceIndicatesPaymentPending = (instance) => {
  if (!instance) return false;
  const statusValue = normalizeStatusValue(instance.status);
  const paymentStatusValue = normalizeStatusValue(
    instance.payment_status || instance.billing_status
  );
  const hasMarker = (value) =>
    PAYMENT_STATUS_MARKERS.some((marker) => value.includes(marker)) ||
    (value.includes("payment") && value.includes("pending"));
  return hasMarker(statusValue) || hasMarker(paymentStatusValue);
};

const extractPendingTransaction = (instance) => {
  if (!instance) return null;
  const transactions = Array.isArray(instance.transactions)
    ? instance.transactions
    : [];
  return (
    transactions.find((tx) => isTransactionPending(tx)) || null
  );
};

// Function to decode the ID from URL
const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null; // Handle invalid encoded ID
  }
};

export default function ProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instances, setInstances] = useState([]); // Local state for instances, will be populated from projectDetails
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isAddInstanceOpen, setAddInstanceOpen] = useState(false);
  const [isEditDescriptionModalOpen, setIsEditDescriptionModalOpen] =
    useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const [paymentContext, setPaymentContext] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const encodedProjectId = queryParams.get("id");
  const projectId = decodeId(encodedProjectId);

  // Separate state for top-level tabs and sub-tabs
  const [activeTopLevelTab, setActiveTopLevelTab] = useState("Instances");
  const [activeInfraTab, setActiveInfraTab] = useState("VPCs");
  const [edgeRefreshSignal, setEdgeRefreshSignal] = useState(0);
  const [infraActionRequest, setInfraActionRequest] = useState(null);
  const infraActionTokenRef = useRef(0);
  const [infraCounts, setInfraCounts] = useState({});

  const infraQuickActions = [
    {
      key: "keyPairs",
      title: "Create Key Pair",
      description: "Manage SSH credentials for your project.",
      tab: "Key Pairs",
      supportsCreate: true,
      supportsSync: true,
    },
    {
      key: "securityGroups",
      title: "Create Security Groups",
      description: "Control access rules for your workloads.",
      tab: "SGs",
      supportsCreate: true,
      supportsSync: true,
    },
    {
      key: "subnets",
      title: "Manage Subnets",
      description: "Allocate subnets within your VPCs.",
      tab: "Subnets",
      supportsCreate: true,
      supportsSync: true,
    },
    {
      key: "igws",
      title: "Configure IGW",
      description: "Attach internet gateways to expose networks.",
      tab: "IGWs",
      supportsCreate: true,
      supportsSync: true,
    },
    {
      key: "routeTables",
      title: "Route Tables",
      description: "Define traffic flow across your networks.",
      tab: "Route Tables",
      supportsCreate: true,
      supportsSync: true,
    },
    {
      key: "enis",
      title: "ENIs",
      description: "Provision elastic network interfaces.",
      tab: "ENIs",
      supportsCreate: true,
      supportsSync: true,
    },
    {
      key: "eips",
      title: "EIPs",
      description: "Allocate and manage elastic IP addresses.",
      tab: "EIPs",
      supportsCreate: true,
      supportsSync: true,
    },
    {
      key: "edge",
      title: "Configure Edge Network",
      description: "Refresh edge network assignments.",
      tab: null,
      supportsCreate: false,
      supportsSync: true,
    },
  ];

  const triggerInfraAction = (resource, type, tab) => {
    if (activeTopLevelTab !== "Infrastructure") {
      setActiveTopLevelTab("Infrastructure");
    }

    if (resource === "edge") {
      setEdgeRefreshSignal((prev) => prev + 1);
      return;
    }
    if (tab) {
      setActiveInfraTab(tab);
    }

    infraActionTokenRef.current += 1;
    setInfraActionRequest({
      resource,
      type,
      token: infraActionTokenRef.current,
    });
  };

  const handleInfraActionHandled = (action) => {
    setInfraActionRequest((prev) =>
      prev && prev.token === action.token ? null : prev
    );
  };

  const handleInfraStatsUpdate = (resource, count) => {
    if (!resource) {
      return;
    }
    setInfraCounts((prev) =>
      prev[resource] === count ? prev : { ...prev, [resource]: count }
    );
  };

  const extractCount = (result) => {
    if (!result) return 0;
    if (Array.isArray(result)) return result.length;
    if (Array.isArray(result.data)) return result.data.length;
    if (Array.isArray(result.items)) return result.items.length;
    return 0;
  };

  useEffect(() => {
    if (!projectEnabled) return;
    handleInfraStatsUpdate("vpcs", extractCount(quickVpcs));
  }, [quickVpcs, projectEnabled]);

  useEffect(() => {
    if (!regionEnabled) return;
    handleInfraStatsUpdate("keyPairs", extractCount(quickKeyPairs));
  }, [quickKeyPairs, regionEnabled]);

  useEffect(() => {
    if (!regionEnabled) return;
    handleInfraStatsUpdate(
      "securityGroups",
      extractCount(quickSecurityGroups)
    );
  }, [quickSecurityGroups, regionEnabled]);

  useEffect(() => {
    if (!regionEnabled) return;
    handleInfraStatsUpdate("subnets", extractCount(quickSubnets));
  }, [quickSubnets, regionEnabled]);

  useEffect(() => {
    if (!regionEnabled) return;
    handleInfraStatsUpdate("igws", extractCount(quickIgws));
  }, [quickIgws, regionEnabled]);

  useEffect(() => {
    if (!regionEnabled) return;
    handleInfraStatsUpdate("routeTables", extractCount(quickRouteTables));
  }, [quickRouteTables, regionEnabled]);

  useEffect(() => {
    if (!regionEnabled) return;
    handleInfraStatsUpdate("enis", extractCount(quickEnis));
  }, [quickEnis, regionEnabled]);

  useEffect(() => {
    if (!regionEnabled) return;
    handleInfraStatsUpdate("eips", extractCount(quickEips));
  }, [quickEips, regionEnabled]);

  const {
    data: projectDetails,
    isFetching: isProjectFetching,
    error: projectError,
    refetch: refetchProjectDetails,
  } = useFetchProjectById(projectId);

  const projectRegion = projectDetails?.region || projectDetails?.region;
  const projectEnabled = !!projectId;
  const regionEnabled = projectEnabled && !!projectRegion;

  const { data: quickVpcs } = useFetchTenantVpcs(projectId, projectRegion, {
    enabled: projectEnabled,
  });
  const { data: quickKeyPairs } = useFetchTenantKeyPairs(projectId, projectRegion, {
    enabled: regionEnabled,
  });
  const { data: quickSecurityGroups } = useFetchTenantSecurityGroups(
    projectId,
    projectRegion,
    { enabled: regionEnabled }
  );
  const { data: quickSubnets } = useFetchTenantSubnets(projectId, projectRegion, {
    enabled: regionEnabled,
  });
  const { data: quickIgws } = useFetchTenantInternetGateways(
    projectId,
    projectRegion,
    { enabled: regionEnabled }
  );
  const { data: quickRouteTables } = useFetchTenantRouteTables(
    projectId,
    projectRegion,
    { enabled: regionEnabled }
  );
  const { data: quickEnis } = useFetchTenantNetworkInterfaces(
    projectId,
    projectRegion,
    { enabled: regionEnabled }
  );
  const { data: quickEips } = useFetchTenantElasticIps(projectId, projectRegion, {
    enabled: regionEnabled,
  });

  // Update local instances state when projectDetails changes
  useEffect(() => {
    if (projectDetails?.instances) {
      setInstances(projectDetails.instances);
    } else {
      setInstances([]); // Ensure it's an empty array if no instances
    }
  }, [projectDetails]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(isDateOnly
        ? {}
        : { hour: "numeric", minute: "2-digit", hour12: true }),
    };

    return date
      .toLocaleString("en-US", options)
      .replace(/,([^,]*)$/, isDateOnly ? "$1" : " -$1");
  };

  const openAddInstance = () => setAddInstanceOpen(true);
  const closeAddInstance = () => setAddInstanceOpen(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = instances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(instances.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleRowClick = (item) => {
    // Encode the ID using btoa then encodeURIComponent
    const encodedId = encodeURIComponent(btoa(item.identifier));
    const instanceName = item.name; // No need to encode name as per request

    // Navigate to the instance details page
    navigate(
      `/dashboard/instances/details?id=${encodedId}&name=${instanceName}`
    );
  };

  const hasPendingPayment = useCallback(
    (instance) =>
      Boolean(
        extractPendingTransaction(instance) ||
          instanceIndicatesPaymentPending(instance)
      ),
    []
  );

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setPaymentContext(null);
  }, []);

  const handleOpenPaymentModal = useCallback(
    async (event, instance) => {
      event?.stopPropagation?.();
      if (!instance?.identifier) {
        ToastUtils.error("Instance identifier is missing for this payment.");
        return;
      }

      setPaymentLoadingId(instance.identifier);

      try {
        let workingInstance = instance;
        let pendingTransaction = extractPendingTransaction(instance);

        if (!pendingTransaction) {
          const response = await silentApi(
            "GET",
            `/business/instances/${encodeURIComponent(instance.identifier)}`
          );
          if (response?.data) {
            workingInstance = response.data;
            pendingTransaction = extractPendingTransaction(response.data);
          }
        }

        if (!pendingTransaction) {
          ToastUtils.error("No pending payment was found for this instance.");
          return;
        }

        const metadata =
          safeParseJson(
            pendingTransaction.metadata,
            pendingTransaction.metadata
          ) || {};
        const rawOptions = safeParseJson(
          pendingTransaction.payment_gateway_options,
          pendingTransaction.payment_gateway_options
        );
        let paymentOptions = Array.isArray(rawOptions)
          ? rawOptions
          : rawOptions
          ? [rawOptions]
          : [];

        const fallbackCurrency =
          pendingTransaction.currency ||
          paymentOptions?.[0]?.currency ||
          projectDetails?.currency ||
          "NGN";
        const fallbackAmount = Number(
          pendingTransaction.amount ??
            paymentOptions?.[0]?.total ??
            metadata?.amount ??
            0
        );

        if (!paymentOptions.length) {
          paymentOptions = [
            {
              id: "paystack-card",
              name: "Paystack",
              payment_type: "Card",
              transaction_reference:
                pendingTransaction.identifier ||
                pendingTransaction.reference ||
                `tx-${instance.identifier}`,
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
            },
          ];
        } else {
          paymentOptions = paymentOptions.map((option, index) => {
            const total = Number(option.total ?? fallbackAmount);
            const currency = option.currency || fallbackCurrency;
            const breakdown = option.charge_breakdown || {};
            return {
              id: option.id ?? index + 1,
              name: option.name || option.gateway || "Paystack",
              payment_type: option.payment_type || option.type || "Card",
              transaction_reference:
                option.transaction_reference ||
                option.reference ||
                pendingTransaction.identifier ||
                pendingTransaction.id ||
                `tx-${instance.identifier}`,
              total,
              currency,
              details: option.details || null,
              charge_breakdown: {
                base_amount: Number(breakdown.base_amount ?? fallbackAmount),
                percentage_fee: Number(breakdown.percentage_fee ?? 0),
                flat_fee: Number(breakdown.flat_fee ?? 0),
                total_fees: Number(breakdown.total_fees ?? 0),
                grand_total: Number(breakdown.grand_total ?? total ?? fallbackAmount),
                currency,
              },
            };
          });
        }

        const pricingBreakdown =
          metadata?.pricing_breakdown || metadata?.breakdown || {};

        const normalizedTransaction = {
          ...pendingTransaction,
          amount: fallbackAmount,
          currency: fallbackCurrency,
          payment_gateway_options: paymentOptions,
          metadata: {
            ...metadata,
            pricing_breakdown: pricingBreakdown,
          },
        };

        setPaymentContext({
          instance: workingInstance,
          transaction: normalizedTransaction,
        });
        setIsPaymentModalOpen(true);
      } catch (error) {
        console.error("Failed to load payment details:", error);
        ToastUtils.error(
          error?.message || "Failed to load payment instructions."
        );
      } finally {
        setPaymentLoadingId(null);
      }
    },
    [projectDetails]
  );

  const handlePaymentInitiated = useCallback(
    (reference) => {
      if (reference) {
        ToastUtils.success("Payment initiated successfully.");
      } else {
        ToastUtils.info("Payment process started.");
      }
      closePaymentModal();
      refetchProjectDetails?.();
    },
    [closePaymentModal, refetchProjectDetails]
  );

  const getStatusBadgeClass = useCallback((status) => {
    const normalized = normalizeStatusValue(status);
    if (!normalized) {
      return "bg-gray-100 text-gray-800";
    }
    if (
      normalized.includes("running") ||
      normalized.includes("active")
    ) {
      return "bg-green-100 text-green-800";
    }
    if (
      normalized.includes("stopped") ||
      normalized.includes("failed") ||
      normalized.includes("error")
    ) {
      return "bg-red-100 text-red-800";
    }
    if (
      normalized.includes("spawn") ||
      normalized.includes("provisioning") ||
      normalized.includes("creating")
    ) {
      return "bg-blue-100 text-blue-800";
    }
    if (
      PAYMENT_STATUS_MARKERS.some((marker) => normalized.includes(marker)) ||
      (normalized.includes("payment") && normalized.includes("pending"))
    ) {
      return "bg-orange-100 text-orange-800";
    }
    if (normalized.includes("pending")) {
      return "bg-yellow-100 text-yellow-700";
    }
    return "bg-gray-100 text-gray-800";
  }, []);

  // Determine if project can be deleted (only if no instances)
  const canDeleteProject = instances.length === 0;

  // Array of menu items and their corresponding components
  const infraMenuItems = [
    { name: "VPCs", component: VPCs, resourceKey: "vpcs" },
    { name: "Key Pairs", component: KeyPairs, resourceKey: "keyPairs" },
    { name: "SGs", component: SecurityGroup, resourceKey: "securityGroups" },
    { name: "Subnets", component: Subnets, resourceKey: "subnets" },
    { name: "IGWs", component: IGWs, resourceKey: "igws" },
    { name: "Route Tables", component: RouteTables, resourceKey: "routeTables" },
    { name: "ENIs", component: ENIs, resourceKey: "enis" },
    { name: "EIPs", component: EIPs, resourceKey: "eips" },
  ];


  // Loading state for project details
  if (isProjectFetching) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="dashboard-content-shell p-6 md:p-8 flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700 mt-2">Loading project details...</p>
        </main>
      </>
    );
  }

  // "Not Found" state if no projectDetails or an error occurred
  if (!projectDetails || projectError) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="dashboard-content-shell p-6 md:p-8 flex items-center justify-center flex-col text-center">
          <p className=" text-sm md:text-base font-normal text-gray-700 mb-4">
            This project could not be found.
          </p>
          <button
            onClick={() => navigate("/dashboard/projects")}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
          >
            Go to Projects Page
          </button>
        </main>
      </>
    );
  }

  // Determine which sub-component to render for the Infra tab
  const activeInfraDef = infraMenuItems.find(
    (item) => item.name === activeInfraTab
  );
  const ActiveInfraComponent = activeInfraDef?.component;

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="dashboard-content-shell p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1E1E1EB2]">
            Project Details
          </h1>
          {canDeleteProject && (
            <button
              onClick={() => setIsDeleteConfirmModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          )}
        </div>

        {/* Project Details Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#575758]">Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Project Name:</span>
              <span className="text-gray-900">{projectDetails.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Type:</span>
              <span className="text-gray-900 uppercase">
                {projectDetails.type}
              </span>
            </div>
            <div className="flex flex-col md:col-span-1">
              <span className="font-medium text-gray-600 flex items-center gap-2">
                Description:
                <button
                  onClick={() => setIsEditDescriptionModalOpen(true)}
                  className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                  title="Edit Description"
                >
                  <Pencil className="w-3" />
                </button>
              </span>
              <span className="text-gray-900">
                {projectDetails.description}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Created At:</span>
              <span className="text-gray-900">
                {formatDate(projectDetails.created_at)}
              </span>
            </div>
            {/* Owner field is not in the provided project object, so it's removed */}
          </div>
        </div>

        {/* Edge Config Panel (Tenant view) */}
        <EdgeConfigPanel
          projectId={projectId}
          region={projectDetails.region}
          refreshSignal={edgeRefreshSignal}
        />

        {/* Quick Infrastructure Actions */}
        {activeTopLevelTab === "Infrastructure" && (
          <div className="bg-white rounded-[12px] p-6 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-[#575758] mb-4">
              Infrastructure Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {infraQuickActions.map((item) => {
                const count = infraCounts[item.key] ?? 0;
                const hasItems = count > 0;

                return (
                  <div
                    key={item.key}
                    className="border border-gray-200 rounded-[12px] p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800">
                          {item.title}
                        </h4>
                        {item.key !== "edge" && (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${hasItems ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                          >
                            {hasItems
                              ? `${count} item${count === 1 ? "" : "s"}`
                              : "Empty"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.supportsCreate && (
                        <button
                          onClick={() =>
                            triggerInfraAction(item.key, "create", item.tab)
                          }
                          className="px-3 py-2 rounded-full border border-[#288DD1] text-[#288DD1] hover:bg-[#E6F2FA] transition-colors text-sm"
                        >
                          Create
                        </button>
                      )}
                      {item.supportsSync && (
                        <button
                          onClick={() =>
                            triggerInfraAction(item.key, "sync", item.tab)
                          }
                          className="px-3 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                        >
                          Sync
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Top-Level Tab Navigation: Instances and Infrastructure */}
        <div className="w-full flex justify-start items-center border-b border-gray-300 mb-6 bg-white rounded-t-xl overflow-x-auto">
          <button
            onClick={() => setActiveTopLevelTab("Instances")}
            className={`px-8 py-4 text-sm font-medium transition-colors border-b-2
                    ${
                      activeTopLevelTab === "Instances"
                        ? "text-[#288DD1] border-[#288DD1]"
                        : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-400"
                    }`}
          >
            Instances
          </button>
          <button
            onClick={() => setActiveTopLevelTab("Infrastructure")}
            className={`px-8 py-4 text-sm font-medium transition-colors border-b-2
                    ${
                      activeTopLevelTab === "Infrastructure"
                        ? "text-[#288DD1] border-[#288DD1]"
                        : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-400"
                    }`}
          >
            Infrastructure
          </button>
        </div>

        {activeTopLevelTab === "Instances" ? (
          <>
            <div className=" w-full flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#575758] ">
                Instances
              </h2>
              <button
                onClick={openAddInstance}
                className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
              >
                Add Instance
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Disk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      EBS Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Operating System
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E8E6EA]">
                  {currentData.length > 0 ? (
                    currentData.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.storage_size_gb
                            ? `${item.storage_size_gb} GiB`
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.ebs_volume?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.os_image?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(item.status)}`}
                          >
                            {item.status?.replace(/_/g, " ") || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                          <div className="flex flex-col items-start gap-2">
                            {hasPendingPayment(item) && (
                              <button
                                onClick={(e) => handleOpenPaymentModal(e, item)}
                                disabled={paymentLoadingId === item.identifier}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                                  paymentLoadingId === item.identifier
                                    ? "cursor-not-allowed border-blue-100 bg-blue-50 text-blue-400"
                                    : "border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100"
                                }`}
                              >
                                {paymentLoadingId === item.identifier ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Loading…
                                  </>
                                ) : (
                                  "Complete payment"
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click from firing
                                handleRowClick(item);
                              }}
                              className="text-[#288DD1] hover:underline text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6" // Updated colspan to match new column count
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No instances found for this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden mt-6 space-y-4">
              {currentData.length > 0 ? (
                currentData.map((item) => {
                  const statusLabel =
                    item.status?.replace(/_/g, " ") || "N/A";
                  const statusClass = getStatusBadgeClass(item.status);
                  const paymentLoading = paymentLoadingId === item.identifier;
                  const showPayment = hasPendingPayment(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="bg-white rounded-[12px] shadow-sm p-4 cursor-pointer border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {item.name || "N/A"}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span className="font-medium">Disk:</span>
                          <span>
                            {item.storage_size_gb
                              ? `${item.storage_size_gb} GiB`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">EBS Volume:</span>
                          <span>{item.ebs_volume?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">OS:</span>
                          <span>{item.os_image?.name || "N/A"}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        {showPayment && (
                          <button
                            onClick={(e) => handleOpenPaymentModal(e, item)}
                            disabled={paymentLoading}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                              paymentLoading
                                ? "cursor-not-allowed border-blue-100 bg-blue-50 text-blue-400"
                                : "border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100"
                            }`}
                          >
                            {paymentLoading ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Loading…
                              </>
                            ) : (
                              "Complete payment"
                            )}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleRowClick(item);
                          }}
                          className="text-[#288DD1] hover:underline text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
                  No instances found for this project.
                </div>
              )}
            </div>

            {/* Pagination */}
            {instances.length > itemsPerPage && (
              <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200 bg-white rounded-b-[12px] mt-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">{currentPage}</span>
                  <span className="text-sm text-gray-700">of</span>
                  <span className="text-sm text-gray-700">{totalPages}</span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Infrastructure Content Block */
          <div>
            <div className="w-full flex items-center justify-start border-b border-gray-300 mb-6 bg-white rounded-b-xl overflow-x-auto">
              {infraMenuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveInfraTab(item.name)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2
                    ${
                      activeInfraTab === item.name
                        ? "text-[#288DD1] border-[#288DD1]"
                        : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-400"
                    }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-[#575758] mb-4">
                {activeInfraTab}
              </h2>
              {ActiveInfraComponent && (
                <ActiveInfraComponent
                  projectId={projectId}
                  region={projectDetails.region}
                  actionRequest={infraActionRequest}
                  onActionHandled={handleInfraActionHandled}
                  onStatsUpdate={(count) =>
                    handleInfraStatsUpdate(activeInfraDef?.resourceKey, count)
                  }
                />
              )}
            </div>
          </div>
        )}
      </main>
      {paymentContext?.transaction && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={closePaymentModal}
          transaction={paymentContext.transaction}
          onPaymentInitiated={handlePaymentInitiated}
        />
      )}
      <AddInstanceModal isOpen={isAddInstanceOpen} onClose={closeAddInstance} />
      <EditDescriptionModal
        isOpen={isEditDescriptionModalOpen}
        onClose={() => setIsEditDescriptionModalOpen(false)}
        projectId={projectId}
        projectDetails={projectDetails}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        projectId={projectId}
        projectName={projectDetails?.name || "this project"}
      />
    </>
  );
}

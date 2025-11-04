import React, { useCallback, useEffect, useMemo, useState } from "react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GitBranch,
  Globe,
  Key,
  Layers,
  MapPin,
  Network,
  Pencil,
  Plus,
  PlugZap,
  Radio,
  Rocket,
  Route,
  Server,
  Share2,
  Shield,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { useFetchClientProjectById } from "../../hooks/clientHooks/projectHooks";
import ClientActiveTab from "../components/clientActiveTab";
import EdgeConfigPanel from "../components/EdgeConfigPanel";
import ClientPageShell from "../components/ClientPageShell";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";
import ToastUtils from "../../utils/toastUtil";

const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (error) {
    console.error("Error decoding ID:", error);
    return null;
  }
};

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
      : {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
  };

  return date
    .toLocaleString("en-US", options)
    .replace(/,([^,]*)$/, isDateOnly ? "$1" : " •$1");
};

const toTitleCase = (value) => {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getProjectStatusVariant = (status) => {
  const normalized = (status || "unknown").toLowerCase();
  switch (normalized) {
    case "active":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        label: "Active",
      };
    case "pending":
    case "processing":
    case "provisioning":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
        label:
          normalized === "pending"
            ? "Pending"
            : normalized === "processing"
            ? "Processing"
            : "Provisioning",
      };
    case "inactive":
      return {
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
        label: "Inactive",
      };
    case "failed":
    case "error":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        dot: "bg-rose-500",
        label: normalized === "failed" ? "Failed" : "Error",
      };
    default:
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
        label: toTitleCase(normalized),
      };
  }
};

const getInstanceStatusVariant = (status) => {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "running":
      return "bg-emerald-50 text-emerald-700";
    case "stopped":
    case "terminated":
      return "bg-rose-50 text-rose-700";
    case "spawning":
    case "initializing":
      return "bg-sky-50 text-sky-700";
    case "payment_pending":
    case "pending":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200/70 ${className}`} />
);

const SummaryMetricCard = ({ icon: Icon, label, value, helper }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-[--theme-border-color] bg-white/90 p-5 shadow-sm">
    <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[--theme-color-10] text-[--theme-color]">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[--theme-muted-color]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[--theme-heading-color]">
        {value}
      </p>
      {helper ? (
        <p className="text-xs text-[--theme-muted-color]">{helper}</p>
      ) : null}
    </div>
  </div>
);

const NeutralPill = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {label}
  </span>
);

const getResourceCount = (counts = {}, key) => {
  const keys = Array.isArray(key) ? key : [key];
  for (const rawKey of keys) {
    if (!rawKey) continue;
    const variations = [
      rawKey,
      rawKey.replace(/-/g, "_"),
      rawKey.replace(/_/g, "-"),
    ];
    for (const variant of variations) {
      if (Object.prototype.hasOwnProperty.call(counts, variant)) {
        const value = counts[variant];
        if (typeof value === "number") {
          return value;
        }
      }
    }
  }
  return 0;
};

export default function ClientProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: theme } = useClientTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instances, setInstances] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isEditDescriptionModalOpen, setIsEditDescriptionModalOpen] =
    useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);

  const queryParams = new URLSearchParams(location.search);
  const encodedProjectId = queryParams.get("id");
  const projectId = decodeId(encodedProjectId);

  const [activeTopLevelTab, setActiveTopLevelTab] = useState("Instances");
  const [activeInfraTab, setActiveInfraTab] = useState("VPCs");

  const {
    data: projectDetails,
    isFetching: isProjectFetching,
    error: projectError,
    refetch: refetchProjectDetails,
  } = useFetchClientProjectById(projectId);

  useEffect(() => {
    if (projectDetails?.instances) {
      setInstances(projectDetails.instances);
    } else {
      setInstances([]);
    }
  }, [projectDetails]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(instances.length / itemsPerPage)),
    [instances.length, itemsPerPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return instances.slice(indexOfFirstItem, indexOfLastItem);
  }, [instances, currentPage, itemsPerPage]);

  const canDeleteProject = instances.length === 0;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleInstanceClick = (instance) => {
    const encodedId = encodeURIComponent(btoa(instance.identifier));
    const instanceName = instance.name;
    navigate(
      `/client-dashboard/instances/details?id=${encodedId}&name=${instanceName}`
    );
  };

  const accentGradient = useMemo(() => {
    const start = theme?.themeColor || "var(--theme-color)";
    const end = theme?.secondaryColor || "var(--secondary-color)";
    return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
  }, [theme?.themeColor, theme?.secondaryColor]);

  const projectStatus = getProjectStatusVariant(projectDetails?.status);

  const instanceCount = useMemo(() => {
    if (!projectDetails) return 0;
    return (
      projectDetails?.resources_count?.instances ??
      projectDetails?.instances?.length ??
      0
    );
  }, [projectDetails]);

  const summaryMetrics = useMemo(
    () => [
      {
        label: "Project Type",
        value: toTitleCase(projectDetails?.type),
        helper: "Deployment model for workloads",
        icon: Layers,
      },
      {
        label: "Region",
        value: (projectDetails?.region || "N/A").toUpperCase(),
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
        value: formatDate(projectDetails?.created_at),
        helper: "Project inception date",
        icon: Clock,
      },
    ],
    [instanceCount, projectDetails]
  );

  const infraMenuItems = [
    { name: "VPCs", component: VPCs },
    { name: "Key Pairs", component: KeyPairs },
    { name: "SGs", component: SecurityGroup },
    { name: "Subnets", component: Subnets },
    { name: "IGWs", component: IGWs },
    { name: "Route Tables", component: RouteTables },
    { name: "ENIs", component: ENIs },
    { name: "EIPs", component: EIPs },
  ];

  const ActiveInfraComponent = infraMenuItems.find(
    (item) => item.name === activeInfraTab
  )?.component;

  const resourcesCount = projectDetails?.resources_count || {};

  const vpcCount =
    getResourceCount(resourcesCount, ["vpcs", "vpc", "virtual_private_cloud"]) +
    (Array.isArray(projectDetails?.vpcs) ? projectDetails.vpcs.length : 0);
  const subnetCount =
    getResourceCount(resourcesCount, ["subnets", "subnet"]) +
    (Array.isArray(projectDetails?.subnets) ? projectDetails.subnets.length : 0);
  const sgCount =
    getResourceCount(resourcesCount, [
      "security_groups",
      "securitygroups",
      "security-groups",
    ]) +
    (Array.isArray(projectDetails?.security_groups)
      ? projectDetails.security_groups.length
      : 0);
  const keyPairCount =
    getResourceCount(resourcesCount, ["key_pairs", "keypairs"]) +
    (Array.isArray(projectDetails?.key_pairs)
      ? projectDetails.key_pairs.length
      : 0);
  const edgeCount =
    getResourceCount(resourcesCount, ["edge", "edge_configs", "edge_network"]) +
    (Array.isArray(projectDetails?.edge_configs)
      ? projectDetails.edge_configs.length
      : projectDetails?.edge_config
      ? 1
      : 0);
  const igwCount =
    getResourceCount(resourcesCount, ["igws", "internet_gateways"]) +
    (Array.isArray(projectDetails?.igws) ? projectDetails.igws.length : 0);
  const routeTableCount =
    getResourceCount(resourcesCount, ["route_tables", "route_tables_count"]) +
    (Array.isArray(projectDetails?.route_tables)
      ? projectDetails.route_tables.length
      : 0);
  const eniCount =
    getResourceCount(resourcesCount, ["enis", "network_interfaces"]) +
    (Array.isArray(projectDetails?.enis) ? projectDetails.enis.length : 0);
  const eipCount =
    getResourceCount(resourcesCount, ["eips", "elastic_ips"]) +
    (Array.isArray(projectDetails?.eips) ? projectDetails.eips.length : 0);
  const networkCount =
    getResourceCount(resourcesCount, ["networks"]) +
    (Array.isArray(projectDetails?.networks) ? projectDetails.networks.length : 0);

  const missingInstancePrereqs = useMemo(() => {
    const missing = [];
    if (!vpcCount) missing.push("VPC");
    if (!subnetCount) missing.push("Subnet");
    if (!sgCount) missing.push("Security Group");
    if (!keyPairCount) missing.push("Key Pair");
    if (!eniCount) missing.push("Network Interface");
    return missing;
  }, [eniCount, keyPairCount, sgCount, subnetCount, vpcCount]);

  const canCreateInstances = missingInstancePrereqs.length === 0;
  const instancePrereqMessage = canCreateInstances
    ? "Launch a new compute instance for this project."
    : `Complete the following before launching an instance: ${missingInstancePrereqs.join(
        ", "
      )}.`;

  const handleAddInstance = useCallback(() => {
    if (!canCreateInstances) {
      ToastUtils.error(instancePrereqMessage);
      return;
    }

    navigate("/client-dashboard/add-instance");
  }, [canCreateInstances, instancePrereqMessage, navigate]);

  const setupComplete =
    (projectDetails?.status &&
      !["pending", "processing", "provisioning"].includes(
        projectDetails.status.toLowerCase()
      )) ||
    instanceCount > 0 ||
    vpcCount > 0;

  const journeySteps = useMemo(() => {
    const steps = [
      {
        key: "setup",
        label: "Setting up infrastructure",
        icon: Rocket,
        description:
          "Baseline provisioning, billing configuration, and foundational project checks.",
        completed: Boolean(setupComplete),
        statusDetail: projectDetails?.status
          ? toTitleCase(projectDetails.status)
          : "Pending setup",
        ctaLabel: null,
        onClick: null,
      },
      {
        key: "instances",
        label: "Instances",
        icon: Server,
        description:
          "Compute resources available to run workloads attached to this project.",
        completed: instanceCount > 0,
        count: instanceCount,
        resourceLabel: "instances",
        ctaLabel: instanceCount > 0 ? "View instances" : "Launch",
        onClick: () => setActiveTopLevelTab("Instances"),
      },
      {
        key: "vpcs",
        label: "Virtual Private Clouds",
        icon: Network,
        description:
          "Isolated virtual networks controlling traffic between services and external networks.",
        completed: vpcCount > 0,
        count: vpcCount,
        resourceLabel: "VPCs",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("VPCs");
        },
      },
      {
        key: "networks",
        label: "Networks",
        icon: Activity,
        description:
          "Overlay or segmented networks attached to your VPC fabric.",
        completed: networkCount > 0 || subnetCount > 0,
        count: networkCount || subnetCount,
        resourceLabel: networkCount ? "networks" : "subnets",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("Subnets");
        },
      },
      {
        key: "security_groups",
        label: "Security Groups",
        icon: Shield,
        description:
          "Stateful firewalls defining which traffic is permitted between resources.",
        completed: sgCount > 0,
        count: sgCount,
        resourceLabel: "security groups",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("SGs");
        },
      },
      {
        key: "key_pairs",
        label: "Key Pairs",
        icon: Key,
        description:
          "SSH credentials that allow secure administrative access to instances.",
        completed: keyPairCount > 0,
        count: keyPairCount,
        resourceLabel: "key pairs",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("Key Pairs");
        },
      },
      {
        key: "edge",
        label: "Edge Networking",
        icon: Radio,
        description:
          "Edge endpoints and load balancers distributing traffic across regions.",
        completed: edgeCount > 0,
        count: edgeCount,
        resourceLabel: "edge configs",
        ctaLabel: edgeCount > 0 ? "View edge" : "Configure",
        onClick: () => {
          const edgeSection = document.getElementById("client-edge-config");
          if (edgeSection) {
            edgeSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        },
      },
      {
        key: "subnets",
        label: "Subnets",
        icon: GitBranch,
        description:
          "Network segments partitioning your VPC for availability zones and routing boundaries.",
        completed: subnetCount > 0,
        count: subnetCount,
        resourceLabel: "subnets",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("Subnets");
        },
      },
      {
        key: "igws",
        label: "Internet Gateways",
        icon: Globe,
        description:
          "Allow routing between your private resources and the public internet.",
        completed: igwCount > 0,
        count: igwCount,
        resourceLabel: "IGWs",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("IGWs");
        },
      },
      {
        key: "route_tables",
        label: "Route Tables",
        icon: Route,
        description:
          "Static and dynamic routing rules directing traffic across networks.",
        completed: routeTableCount > 0,
        count: routeTableCount,
        resourceLabel: "route tables",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("Route Tables");
        },
      },
      {
        key: "enis",
        label: "Elastic Network Interfaces",
        icon: Share2,
        description:
          "Attachable virtual NICs providing connectivity to instances and services.",
        completed: eniCount > 0,
        count: eniCount,
        resourceLabel: "ENIs",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("ENIs");
        },
      },
      {
        key: "eips",
        label: "Elastic IPs",
        icon: PlugZap,
        description:
          "Static public IP addresses allocated for internet-facing services.",
        completed: eipCount > 0,
        count: eipCount,
        resourceLabel: "EIPs",
        ctaLabel: "Manage",
        onClick: () => {
          setActiveTopLevelTab("Infrastructure");
          setActiveInfraTab("EIPs");
        },
      },
    ];

    return steps.map((step) => ({
      ...step,
      statusLabel: step.completed ? "Completed" : "Pending",
    }));
  }, [
    edgeCount,
    eipCount,
    eniCount,
    igwCount,
    instanceCount,
    keyPairCount,
    networkCount,
    projectDetails?.identifier,
    projectDetails?.status,
    setActiveTopLevelTab,
    routeTableCount,
    setActiveInfraTab,
    setupComplete,
    sgCount,
    subnetCount,
    vpcCount,
  ]);

  const infrastructureStepsForHealth = journeySteps.filter(
    (step) => step.key !== "setup"
  );

  const totalInfraSections = infrastructureStepsForHealth.length || 1;
  const completedInfraSections = infrastructureStepsForHealth.filter(
    (item) => item.completed
  ).length;

  const healthPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round((completedInfraSections / totalInfraSections) * 100)
    )
  );

  const providerLabel =
    projectDetails?.provider || projectDetails?.cloud_provider || "Unassigned";

  const regionLabel = (projectDetails?.region || "N/A").toUpperCase();

  const infrastructureStepLabel = totalInfraSections
    ? `${completedInfraSections}/${totalInfraSections} infra steps`
    : "Infra steps pending";

  const pageTitle = projectDetails?.name || "Project Overview";
  const pageDescription = projectDetails
    ? `${projectDetails?.identifier || projectId} • ${providerLabel} • ${regionLabel}`
    : "Loading project context...";

  const breadcrumbs = useMemo(
    () => [
      { label: "Home", href: "/client-dashboard" },
      { label: "Projects", href: "/client-dashboard/projects" },
      {
        label:
          projectDetails?.name ||
          projectDetails?.identifier ||
          (projectId ? `Project ${projectId}` : "Details"),
      },
    ],
    [projectDetails?.identifier, projectDetails?.name, projectId]
  );

  const headerActions = useMemo(() => {
    const baseButtonClasses =
      "inline-flex items-center gap-2 rounded-full border border-[--theme-color-20] px-4 py-2 text-sm font-semibold transition";
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate("/client-dashboard/projects")}
          className={`${baseButtonClasses} text-[--theme-color] hover:border-[--theme-color] hover:bg-[--theme-color-10]`}
        >
          <ChevronLeft className="h-4 w-4" />
          Projects
        </button>
        <button
          type="button"
          onClick={() => refetchProjectDetails()}
          disabled={isProjectFetching}
          className={`${baseButtonClasses} text-[--theme-color] hover:border-[--theme-color] hover:bg-[--theme-color-10] disabled:cursor-not-allowed disabled:border-[--theme-border-color] disabled:text-[--theme-muted-color]`}
        >
          <RefreshCw
            className={`h-4 w-4 ${isProjectFetching ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>
    );
  }, [isProjectFetching, navigate, refetchProjectDetails]);

  const metadataItems = useMemo(
    () => [
      {
        label: "Project Identifier",
        value: projectDetails?.identifier || projectId,
      },
      {
        label: "Project Type",
        value: toTitleCase(projectDetails?.type),
      },
      {
        label: "Created",
        value: formatDate(projectDetails?.created_at),
      },
      {
        label: "Instances",
        value: `${instanceCount} tracked`,
      },
    ],
    [instanceCount, projectDetails, projectId]
  );

  const quickStatusItems = useMemo(
    () => [
      {
        label: "Provisioning ready",
        description: "All baseline setup tasks completed",
        active: Boolean(setupComplete),
      },
      {
        label: "Instances available",
        description: "Compute resources attached to the project",
        active: instanceCount > 0,
      },
      {
        label: "Edge network configured",
        description: "Edge endpoints or load balancers are provisioned",
        active: edgeCount > 0,
      },
      {
        label: "Security baseline",
        description: "Security groups and key pairs prepared",
        active: sgCount > 0 && keyPairCount > 0,
      },
    ],
    [edgeCount, instanceCount, keyPairCount, sgCount, setupComplete]
  );

  if (isProjectFetching) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ClientActiveTab />
        <ClientPageShell
          title="Project Details"
          description="Loading project context..."
          breadcrumbs={[
            { label: "Home", href: "/client-dashboard" },
            { label: "Projects", href: "/client-dashboard/projects" },
            { label: "Details" },
          ]}
          contentClassName="flex min-h-[60vh] items-center justify-center"
        >
          <div className="w-full max-w-5xl space-y-6">
            <div
              className="rounded-3xl p-8 text-white"
              style={{ background: accentGradient }}
            >
              <SkeletonBlock className="h-5 w-40 bg-white/20" />
              <SkeletonBlock className="mt-4 h-10 w-3/5 bg-white/30" />
              <SkeletonBlock className="mt-3 h-4 w-2/3 bg-white/20" />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-20 bg-white/20" />
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={`metric-${index}`} className="h-28" />
              ))}
            </div>
            <SkeletonBlock className="h-64" />
          </div>
        </ClientPageShell>
      </>
    );
  }

  if (!projectDetails || projectError) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ClientActiveTab />
        <ClientPageShell
          title="Project Details"
          description="We couldn't locate this project."
          breadcrumbs={[
            { label: "Home", href: "/client-dashboard" },
            { label: "Projects", href: "/client-dashboard/projects" },
            { label: "Details" },
          ]}
          contentClassName="flex min-h-[60vh] flex-col items-center justify-center text-center gap-4"
        >
          <p className="text-sm md:text-base font-normal text-gray-700">
            This project could not be found.
          </p>
          <button
            onClick={() => navigate("/client-dashboard/projects")}
            className="px-6 py-3 rounded-full bg-[--theme-color] text-white font-semibold hover:bg-[--secondary-color] transition"
            type="button"
          >
            Back to Projects
          </button>
        </ClientPageShell>
      </>
    );
  }

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <ClientPageShell
        title={pageTitle}
        description={pageDescription}
        breadcrumbs={breadcrumbs}
        actions={headerActions}
        contentClassName="space-y-8"
        contentWrapper="div"
      >
        <section
          className="relative overflow-hidden rounded-3xl border border-transparent p-6 md:p-10 text-white shadow-lg"
          style={{ background: accentGradient }}
        >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${projectStatus.bg} ${projectStatus.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${projectStatus.dot}`} />
                    {projectStatus.label}
                  </span>
                  <NeutralPill
                    icon={Shield}
                    label={projectDetails.identifier || projectId}
                  />
                  <NeutralPill icon={Layers} label={providerLabel} />
                  <NeutralPill icon={MapPin} label={regionLabel} />
                  <NeutralPill icon={Activity} label={infrastructureStepLabel} />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold md:text-4xl">
                    {projectDetails.name || "Project Overview"}
                  </h1>
                  <p className="max-w-2xl text-sm md:text-base text-white/80">
                    {projectDetails.description ||
                      "Configure infrastructure, track instances, and manage networking resources for this project."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-6 lg:items-end">
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={handleAddInstance}
                    disabled={!canCreateInstances}
                    title={instancePrereqMessage}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                      canCreateInstances
                        ? "bg-white text-[--theme-color] hover:bg-white/90 hover:text-[--secondary-color]"
                        : "bg-white/20 text-white/60 cursor-not-allowed"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Add Instance
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditDescriptionModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Overview
                  </button>
                  {canDeleteProject ? (
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500/80"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center gap-6 lg:gap-8">
                  <div className="text-center">
                    <div
                      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20"
                      style={{
                        background: `conic-gradient(rgba(255,255,255,0.9) ${healthPercent}%, rgba(255,255,255,0.2) 0)`,
                      }}
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-semibold text-[--theme-color]">
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
          </section>

          {!canCreateInstances ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
              <p className="font-semibold text-amber-900">Instances locked</p>
              <p className="mt-1">
                Complete the following before launching an instance:{" "}
                <span className="font-medium">
                  {missingInstancePrereqs.join(", ")}
                </span>
                .
              </p>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
            <section className="rounded-2xl border border-[--theme-border-color] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[--theme-heading-color]">
                Quick status
              </h2>
              <p className="mt-1 text-sm text-[--theme-muted-color]">
                Snapshot of infrastructure readiness mirrored from the admin
                console.
              </p>
              <div className="mt-5 space-y-3">
                {quickStatusItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-[--theme-border-color] bg-white/90 p-3"
                  >
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                        item.active
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {item.active ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[--theme-heading-color]">
                        {item.label}
                      </p>
                      <p className="text-xs text-[--theme-muted-color]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[--theme-border-color] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[--theme-heading-color]">
                    Infrastructure journey
                  </h2>
                  <p className="text-sm text-[--theme-muted-color]">
                    Follow the provisioning milestones from the admin control
                    center to ensure this project is production ready.
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {journeySteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.key}
                      className="flex flex-col gap-3 rounded-xl border border-[--theme-border-color] bg-white/90 p-4 transition hover:border-[--theme-color-20] hover:shadow-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex flex-1 items-start gap-3">
                        <span
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            step.completed
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[--theme-heading-color]">
                              {step.label}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                step.completed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  step.completed ? "bg-emerald-500" : "bg-gray-400"
                                }`}
                              />
                              {step.statusLabel}
                            </span>
                          </div>
                          <p className="text-xs text-[--theme-muted-color]">
                            {step.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[--theme-muted-color]">
                            {typeof step.count === "number" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[--theme-color-10] px-2.5 py-1 text-[--theme-color]">
                                {step.count} {step.resourceLabel || "resources"}
                              </span>
                            ) : null}
                            {step.statusDetail ? (
                              <span>{step.statusDetail}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      {step.ctaLabel && step.onClick ? (
                        <button
                          type="button"
                          onClick={step.onClick}
                          className="inline-flex items-center justify-center rounded-full border border-[--theme-color-20] px-4 py-2 text-sm font-semibold text-[--theme-color] transition hover:border-[--theme-color] hover:bg-[--theme-color-10]"
                        >
                          {step.ctaLabel}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section
            id="client-edge-config"
            className="rounded-2xl border border-[--theme-border-color] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[--theme-heading-color]">
                  Edge configuration
                </h2>
                <p className="text-sm text-[--theme-muted-color]">
                  Manage regional failover and delivery endpoints for this project.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <EdgeConfigPanel
                projectId={projectId}
                region={projectDetails.region}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[--theme-border-color] bg-white p-2 shadow-sm">
            <div className="flex flex-wrap justify-start gap-2 rounded-xl bg-gray-50 p-2">
              {["Instances", "Infrastructure"].map((tab) => {
                const isActive = activeTopLevelTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTopLevelTab(tab)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white text-[--theme-color] shadow-sm"
                        : "text-[--theme-muted-color] hover:text-[--theme-color]"
                    }`}
                  >
                    {tab === "Instances" ? (
                      <Activity className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    {tab}
                  </button>
                );
              })}
            </div>

            {activeTopLevelTab === "Instances" ? (
              <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[--theme-heading-color]">
                      Instances
                    </h2>
                    <p className="text-sm text-[--theme-muted-color]">
                      Track compute resources provisioned within this project.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddInstance}
                    disabled={!canCreateInstances}
                    title={instancePrereqMessage}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      canCreateInstances
                        ? "bg-[--theme-color] text-white hover:bg-[--secondary-color]"
                        : "bg-[--theme-color-10] text-[--theme-muted-color] cursor-not-allowed"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Add Instance
                  </button>
                </div>

                <div className="hidden md:block overflow-hidden rounded-2xl border border-[--theme-border-color]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-[--theme-muted-color]">
                      <tr>
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Disk</th>
                        <th className="px-6 py-3 text-left">EBS Volume</th>
                        <th className="px-6 py-3 text-left">Operating System</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-[--theme-heading-color]">
                      {currentData.length ? (
                        currentData.map((instance) => (
                          <tr
                            key={instance.id}
                            className="cursor-pointer transition hover:bg-gray-50/80"
                            onClick={() => handleInstanceClick(instance)}
                          >
                            <td className="px-6 py-4">
                              <p className="font-semibold">
                                {instance.name || "N/A"}
                              </p>
                              <p className="text-xs text-[--theme-muted-color]">
                                {instance.identifier || "No identifier"}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              {instance.storage_size_gb
                                ? `${instance.storage_size_gb} GiB`
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              {instance.ebs_volume?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              {instance.os_image?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getInstanceStatusVariant(
                                  instance.status
                                )}`}
                              >
                                {instance.status?.replace(/_/g, " ") || "Unknown"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleInstanceClick(instance);
                                  }}
                                  className="inline-flex items-center justify-center rounded-full border border-[--theme-color-20] px-3 py-1 text-sm font-semibold text-[--theme-color] hover:border-[--theme-color] hover:bg-[--theme-color-10]"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-sm text-[--theme-muted-color]"
                          >
                            No instances found for this project.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4">
                  {currentData.length ? (
                    currentData.map((instance) => (
                      <button
                        key={instance.id}
                        type="button"
                        onClick={() => handleInstanceClick(instance)}
                        className="w-full rounded-2xl border border-[--theme-border-color] bg-white p-5 text-left shadow-sm transition hover:border-[--theme-color] hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-[--theme-heading-color]">
                              {instance.name || "N/A"}
                            </h3>
                            <p className="text-xs text-[--theme-muted-color]">
                              {instance.identifier || "No identifier"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getInstanceStatusVariant(
                              instance.status
                            )}`}
                          >
                            {instance.status?.replace(/_/g, " ") || "Unknown"}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[--theme-muted-color]">
                          <div>
                            <p className="uppercase tracking-wide">Disk</p>
                            <p className="font-medium text-[--theme-heading-color]">
                              {instance.storage_size_gb
                                ? `${instance.storage_size_gb} GiB`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wide">EBS Volume</p>
                            <p className="font-medium text-[--theme-heading-color]">
                              {instance.ebs_volume?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wide">OS</p>
                            <p className="font-medium text-[--theme-heading-color]">
                              {instance.os_image?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wide">Status</p>
                            <p className="font-medium text-[--theme-heading-color]">
                              {instance.status?.replace(/_/g, " ") || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[--theme-border-color] bg-white/70 p-6 text-center text-sm text-[--theme-muted-color]">
                      No instances found for this project.
                    </div>
                  )}
                </div>

                {instances.length > itemsPerPage && (
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[--theme-border-color] bg-white px-3 py-2 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[--theme-muted-color] transition enabled:hover:bg-[--theme-color-10] enabled:hover:text-[--theme-color] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-semibold text-[--theme-heading-color]">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            prev < totalPages ? prev + 1 : prev
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[--theme-muted-color] transition enabled:hover:bg-[--theme-color-10] enabled:hover:text-[--theme-color] disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[--theme-heading-color]">
                      Infrastructure
                    </h2>
                    <p className="text-sm text-[--theme-muted-color]">
                      Explore networking and security resources linked to this project.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 overflow-x-auto rounded-xl bg-gray-50 p-2">
                  {infraMenuItems.map((item) => {
                    const isActive = activeInfraTab === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setActiveInfraTab(item.name)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "bg-white text-[--theme-color] shadow-sm"
                            : "text-[--theme-muted-color] hover:text-[--theme-color]"
                        }`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-2xl border border-[--theme-border-color] bg-white p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-[--theme-heading-color]">
                    {activeInfraTab}
                  </h3>
                  <div className="mt-4">
                    {ActiveInfraComponent ? (
                      <ActiveInfraComponent
                        projectId={projectId}
                        region={projectDetails.region}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </section>
      </ClientPageShell>

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

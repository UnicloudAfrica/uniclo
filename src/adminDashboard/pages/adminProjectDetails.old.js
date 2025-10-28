import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useLocation, useNavigate } from "react-router-dom";
import { useFetchProjectById, useProjectStatus } from "../../hooks/adminHooks/projectHooks";
import { useProjectInfrastructureStatus } from "../../hooks/adminHooks/projectInfrastructureHooks";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle,
  AlertCircle,
  Network,
  Globe,
  Server,
  HardDrive,
} from "lucide-react";
import EditProjectModal from "./projectComps/editProject";
import ConfirmDeleteModal from "./projectComps/deleteProject";
import KeyPairs from "./infraComps/keyPairs";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import EIPs from "./infraComps/eips";
import Subnets from "./infraComps/subNet";
import IGWs from "./infraComps/igw";
import ENIs from "./infraComps/enis";
import RouteTables from "./infraComps/routetable";
import AssignEdgeConfigModal from "./projectComps/assignEdgeConfig";
import AdminEdgeConfigPanel from "../components/AdminEdgeConfigPanel";
import ModernButton from "../components/ModernButton";
import ModernCard from "../components/ModernCard";
import ToastUtils from "../../utils/toastUtil";
import api from "../../index/admin/api";
import AdminPageShell from "../components/AdminPageShell";

const INFRA_MENU_ITEMS = [
  { name: "VPCs", component: VPCs },
  { name: "Key Pairs", component: KeyPairs },
  { name: "SGs", component: SecurityGroup },
  { name: "Subnets", component: Subnets },
  { name: "IGWs", component: IGWs },
  { name: "Route Tables", component: RouteTables },
  { name: "ENIs", component: ENIs },
  { name: "EIPs", component: EIPs },
];

// Function to decode the ID from URL
const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null; // Handle invalid encoded ID
  }
};

export default function AdminProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRevampedRoute = location.pathname.includes("projects-revamped");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instances, setInstances] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isEditDescriptionModalOpen, setIsEditDescriptionModalOpen] =
    useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [isAssignEdgeOpen, setIsAssignEdgeOpen] = useState(false);

  const [summaryActionEndpoint, setSummaryActionEndpoint] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const identifierParam = queryParams.get("identifier");
  const encodedProjectId = queryParams.get("id");
  const projectId = identifierParam
    ? identifierParam
    : encodedProjectId
      ? decodeId(encodedProjectId)
      : null;
  const backToProjectsPath = isRevampedRoute
    ? "/admin-dashboard/projects-revamped"
    : "/admin-dashboard/projects";
  const openEdgeFromQuery = queryParams.get("openEdge") === "1";
  const {
    data: projectStatusData,
    isFetching: isProjectStatusFetching,
    refetch: refetchProjectStatus,
  } = useProjectStatus(projectId);

  // Debug logging
  useEffect(() => {
    if (projectStatusData) {
      console.log('✅ projectStatusData received:', projectStatusData);
      console.log('📊 Summary items:', projectStatusData?.project?.summary);
      console.log('👥 Users data:', projectStatusData?.project?.users);
    }
  }, [projectStatusData]);

  const summaryItems = projectStatusData?.project?.summary ?? [];


  const {
    data: projectDetails,
    isLoading: isProjectLoading,
    isFetching: isProjectFetching,
    error: projectError,
    refetch: refetchProject,
  } = useFetchProjectById(projectId);

  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [activeTopLevelTab, setActiveTopLevelTab] = useState("Instances");
  const [activeInfraTab, setActiveInfraTab] = useState("VPCs");
  const infrastructureSectionRef = useRef(null);


  useEffect(() => {
    if (projectDetails?.instances) {
      setInstances(projectDetails.instances);
    } else {
      setInstances([]);
    }
  }, [projectDetails]);

  useEffect(() => {
    if (!isProjectLoading && projectDetails && !lastRefreshedAt) {
      setLastRefreshedAt(new Date());
    }
  }, [isProjectLoading, projectDetails, lastRefreshedAt]);

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

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
    // Note: Instance management details have been moved to standard instances
    // For now, show a message instead of navigating to removed route
    alert('Instance details functionality will be available in the updated instances interface');
    // navigate(
    //   `/admin-dashboard/instances/details?identifier=${encodeURIComponent(item.identifier)}&name=${encodeURIComponent(instanceName)}`
    // );
  };

  const formattedLastRefreshed = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    : null;

  const navigateToSection = (sectionKey) => {
    setActiveTopLevelTab("Infrastructure");
    if (sectionKey) {
      const sectionToTab = {
        vpcs: "VPCs",
        "create-key-pair": "Key Pairs",
        "configure-edge-network": "VPCs",
        "create-security-groups": "SGs",
        "manage-subnets": "Subnets",
        "configure-igw": "IGWs",
        "route-tables": "Route Tables",
        enis: "ENIs",
        eips: "EIPs",
      };
      const targetTab = sectionToTab[sectionKey];
      if (targetTab) {
        setActiveInfraTab(targetTab);
      }
    }
    setTimeout(() => {
      infrastructureSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleConfigureEdge = () => {
    navigateToSection("configure-edge-network");
    setIsAssignEdgeOpen(true);
  };

  const handleChecklistAction = async (action) => {
    if (!action || !action.endpoint) return;

    const method = (action.method || 'POST').toUpperCase();
    const endpoint = action.endpoint.startsWith('/') ? action.endpoint : `/${action.endpoint}`;

    try {
      setSummaryActionEndpoint(endpoint);
      await api(method, endpoint, action.body ?? undefined);
      ToastUtils.success(action.success_message || 'Action completed');
      refetchProjectStatus();
      refetchInfraStatus();
    } catch (error) {
      console.error('Checklist action failed', error);
      ToastUtils.error(error?.message || 'Action failed');
    } finally {
      setSummaryActionEndpoint(null);
    }
  };

  const {
    data: infraStatus,
    isFetching: isInfraFetching,
    refetch: refetchInfraStatus,
  } = useProjectInfrastructureStatus(projectId);

  const infraData = infraStatus?.data ?? infraStatus ?? {};
  const infraComponents = infraData?.components ?? {};

  const hasVpcConfigured =
    infraComponents?.vpc?.status === "completed";

  // Check if project is VPC-enabled (use status API data which includes fallback logic)
  const isVpcEnabled = projectStatusData?.project?.vpc_enabled ?? projectDetails?.provisioning_progress?.vpc_enabled === true;

  const handleManualRefresh = async () => {
    if (!projectId) {
      ToastUtils.warning(
        "Project identifier is missing. Please return to the projects list."
      );
      return;
    }

    try {
      setIsManualRefreshing(true);
      const result = await refetchProject();
      if (result?.error) {
        throw result.error;
      }
      await refetchInfraStatus();
      setLastRefreshedAt(new Date());
      ToastUtils.success("Project details refreshed");
      refetchProjectStatus();
    } catch (error) {
      console.error("Failed to refresh project details:", error);
      ToastUtils.error(
        error?.message ||
        "Failed to refresh project details. Please try again."
      );
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const canDeleteProject = instances.length === 0;

  // Array of menu items and their corresponding components
  const infraMenuItems = INFRA_MENU_ITEMS;

  const ActiveInfraComponent = useMemo(() => {
    const match = infraMenuItems.find((item) => item.name === activeInfraTab);
    return match?.component || null;
  }, [infraMenuItems, activeInfraTab]);

  // Open edge modal automatically if requested via query param
  useEffect(() => {
    if (openEdgeFromQuery) {
      setIsAssignEdgeOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isProjectLoading) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <AdminPageShell
          title="Project Details"
          description="Loading project insights..."
          contentClassName="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#288DD1]" />
          <p className="text-sm text-gray-700 md:text-base">
            Loading project details...
          </p>
        </AdminPageShell>
      </>
    );
  }

  const projectErrorMessage = !projectId
    ? "Project identifier is missing or invalid."
    : projectError?.message || "This project could not be found.";

  if (!projectId || !projectDetails || projectError) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <AdminPageShell
          title="Project Details"
          description={projectErrorMessage}
          actions={
            <ModernButton variant="outline" onClick={() => navigate(backToProjectsPath)}>
              Back to Projects
            </ModernButton>
          }
          contentClassName="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center"
        >
          <p className="max-w-md text-sm md:text-base text-gray-600">
            Check the project identifier and try again. If the issue persists, verify that the project is still
            available in your workspace.
          </p>
        </AdminPageShell>
      </>
    );
  }

  const overviewMetrics = projectDetails
    ? [
        {
          label: "Region",
          value: projectDetails.region
            ? projectDetails.region.toUpperCase()
            : "N/A",
          description: "Deployment region",
          icon: <Network size={18} className="text-[#288DD1]" />,
        },
        {
          label: "Provider",
          value: (projectDetails.provider || "zadara").toUpperCase(),
          description: "Cloud provider",
          icon: <Globe size={18} className="text-[#288DD1]" />,
        },
        {
          label: "Instances",
          value: projectDetails.resources_count?.instances ?? 0,
          description: "Compute resources",
          icon: <Server size={18} className="text-[#288DD1]" />,
        },
        {
          label: "Volumes",
          value: projectDetails.resources_count?.volumes ?? 0,
          description: "Storage resources",
          icon: <HardDrive size={18} className="text-[#288DD1]" />,
        },
      ]
    : [];

  const isRefreshing =
    isManualRefreshing ||
    (isProjectFetching && !isProjectLoading) ||
    isInfraFetching;

  const pageTitle = "Project Details";
  const pageDescription =
    "Monitor provisioning progress, infrastructure resources, and automation tasks for this project.";
  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Projects", href: backToProjectsPath },
    { label: projectDetails?.name || "Project Details" },
  ];
  const headerActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <ModernButton
        variant="ghost"
        onClick={() => navigate(backToProjectsPath)}
        leftIcon={<ChevronLeft size={16} />}
      >
        Back to Projects
      </ModernButton>
      <ModernButton
        variant="outline"
        onClick={handleManualRefresh}
        isDisabled={isRefreshing}
        isLoading={isRefreshing}
        leftIcon={!isRefreshing ? <RefreshCw size={16} /> : undefined}
      >
        {isRefreshing ? "Refreshing" : "Refresh"}
      </ModernButton>
      <ModernButton
        variant="primary"
        onClick={handleConfigureEdge}
        leftIcon={<Globe size={16} />}
      >
        Configure Edge
      </ModernButton>
      {canDeleteProject && (
        <ModernButton
          variant="danger"
          onClick={() => setIsDeleteConfirmModalOpen(true)}
          leftIcon={<Trash2 size={16} />}
        >
          Delete Project
        </ModernButton>
      )}
    </div>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <AdminPageShell
        title={pageTitle}
        description={pageDescription}
        breadcrumbs={breadcrumbs}
        actions={headerActions}
        contentClassName="space-y-6"
      >
        {formattedLastRefreshed && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Last refreshed {formattedLastRefreshed}
          </div>
        )}

        {overviewMetrics.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <ModernCard
                key={metric.label}
                padding="sm"
                variant="outlined"
                className="flex items-center gap-3"
              >
                <div className="p-3 rounded-full bg-[#E0F2FF] text-[#288DD1]">
                  {metric.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {metric.label}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
              </ModernCard>
            ))}
          </div>
        )}

        <div className="rounded-[12px] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#575758]">Overview</h2>
            <button
              onClick={handleConfigureEdge}
              className="flex items-center gap-2 px-4 py-2 bg-[#288DD1] text-white rounded-lg hover:bg-[#1976D2] transition-colors text-sm"
              title="Configure Edge"
            >
              Configure Edge
            </button>
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
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">VPC Status:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">
                  {!isVpcEnabled ? "Not VPC-enabled" :
                    hasVpcConfigured ? "Provisioned by Zadara" : "VPC-enabled, awaiting provisioning"}
                </span>
                {!isVpcEnabled && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    Enable Required
                  </span>
                )}
                {isVpcEnabled && !hasVpcConfigured && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Ready to Provision
                  </span>
                )}
                {hasVpcConfigured && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Edge Config Panel */}
        <AdminEdgeConfigPanel projectId={projectId} region={projectDetails.region} />

        {/* Top-Level Tab Navigation: Instances and Infrastructure */}
        <div className="flex w-full items-center justify-start overflow-x-auto border-b border-gray-300 bg-white rounded-t-xl">
          <button
            onClick={() => setActiveTopLevelTab("Instances")}
            className={`px-8 py-4 text-sm font-medium transition-colors border-b-2
                    ${activeTopLevelTab === "Instances"
                ? "text-[#288DD1] border-[#288DD1]"
                : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-400"
              }`}
          >
            Instances
          </button>
          <button
            onClick={() => setActiveTopLevelTab("Infrastructure")}
            className={`px-8 py-4 text-sm font-medium transition-colors border-b-2
                    ${activeTopLevelTab === "Infrastructure"
                ? "text-[#288DD1] border-[#288DD1]"
                : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-400"
              }`}
          >
            Infrastructure
          </button>
        </div>

        {/* --- */}

        {/* Region badge for Infrastructure */}
        {activeTopLevelTab === "Infrastructure" && (
          <>
            <ModernCard className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#288DD1]" />
                  <span className="font-semibold text-gray-800">Provisioning Checklist</span>
                </div>
                {isProjectStatusFetching && (
                  <Loader2 className="w-4 h-4 animate-spin text-[#288DD1]" />
                )}
              </div>
              <div className="space-y-3">
                {summaryItems.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-amber-900">Checklist data unavailable</div>
                        <div className="text-xs text-amber-700 mt-1">
                          {isProjectStatusFetching ? 'Loading checklist...' : 'No checklist data returned from backend'}
                        </div>
                        {!isProjectStatusFetching && (
                          <button
                            onClick={() => refetchProjectStatus()}
                            className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline"
                          >
                            Retry loading checklist
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  summaryItems.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {item.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="space-y-1 flex-1">
                          <div className="text-sm font-medium text-gray-800">{item.title}</div>
                          {typeof item.count === 'number' && (
                            <div className="text-xs text-gray-500">Total: {item.count}</div>
                          )}
                          {!item.completed && typeof item.missing_count === 'number' && item.missing_count > 0 && (
                            <div className="text-xs text-amber-600 font-medium">{item.missing_count} pending</div>
                          )}
                          {item.updated_at && (
                            <div className="text-xs text-gray-400">Completed {new Date(item.updated_at).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {item.action ? (
                          <ModernButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleChecklistAction(item.action)}
                            isLoading={summaryActionEndpoint === (item.action.endpoint.startsWith('/') ? item.action.endpoint : `/${item.action.endpoint}`)}
                          >
                            {item.action.label || 'Fix'}
                          </ModernButton>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* User Details Section */}
              {projectStatusData?.project?.users && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Project Users ({projectStatusData.project.users.total})</h3>
                  
                  {/* All Users */}
                  {projectStatusData.project.users.local && projectStatusData.project.users.local.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-600 mb-2">All Local Users</div>
                      <div className="space-y-2">
                        {projectStatusData.project.users.local.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-gray-500">{user.email}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-[10px] ${user.status.provider_account ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                {projectStatusData.project.region_name || 'Region'}
                              </span>
                              <span className={`px-2 py-1 rounded text-[10px] ${user.status.aws_policy ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                Storage
                              </span>
                              <span className={`px-2 py-1 rounded text-[10px] ${user.status.symp_policy ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                Network
                              </span>
                              <span className={`px-2 py-1 rounded text-[10px] ${user.status.tenant_admin ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                Admin
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Provider Accounts */}
                  {projectStatusData.project.users.provider_missing && projectStatusData.project.users.provider_missing.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-amber-600 mb-2">Missing {projectStatusData.project.region_name || 'Provider'} Accounts ({projectStatusData.project.users.provider_missing.length})</div>
                      <div className="space-y-2">
                        {projectStatusData.project.users.provider_missing.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg text-xs">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                            </div>
                            {user.sync_endpoint && (
                              <ModernButton
                                size="xs"
                                variant="outline"
                                onClick={() => handleChecklistAction({ method: 'POST', endpoint: user.sync_endpoint, label: 'Sync User' })}
                              >
                                Sync
                              </ModernButton>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Storage Policies */}
                  {projectStatusData.project.users.aws_policy_missing && projectStatusData.project.users.aws_policy_missing.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-amber-600 mb-2">Missing Storage Policies ({projectStatusData.project.users.aws_policy_missing.length})</div>
                      <div className="space-y-2">
                        {projectStatusData.project.users.aws_policy_missing.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg text-xs">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                            </div>
                            {user.assign_endpoint && (
                              <ModernButton
                                size="xs"
                                variant="outline"
                                onClick={() => handleChecklistAction({ method: user.method || 'POST', endpoint: user.assign_endpoint, label: 'Assign' })}
                              >
                                Assign Policy
                              </ModernButton>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Network Policies */}
                  {projectStatusData.project.users.symp_policy_missing && projectStatusData.project.users.symp_policy_missing.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-amber-600 mb-2">Missing Network Policies ({projectStatusData.project.users.symp_policy_missing.length})</div>
                      <div className="space-y-2">
                        {projectStatusData.project.users.symp_policy_missing.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg text-xs">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                            </div>
                            {user.assign_endpoint && (
                              <ModernButton
                                size="xs"
                                variant="outline"
                                onClick={() => handleChecklistAction({ method: user.method || 'POST', endpoint: user.assign_endpoint, label: 'Assign' })}
                              >
                                Assign Policy
                              </ModernButton>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Tenant Admin */}
                  {projectStatusData.project.users.tenant_admin_missing && projectStatusData.project.users.tenant_admin_missing.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-amber-600 mb-2">Missing Tenant Admin Role ({projectStatusData.project.users.tenant_admin_missing.length})</div>
                      <div className="space-y-2">
                        {projectStatusData.project.users.tenant_admin_missing.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg text-xs">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                            </div>
                            {user.assign_endpoint && (
                              <ModernButton
                                size="xs"
                                variant="outline"
                                onClick={() => handleChecklistAction({ method: user.method || 'POST', endpoint: user.assign_endpoint, label: 'Assign' })}
                              >
                                Assign Role
                              </ModernButton>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModernCard>

            {/* Region badge for Infrastructure */}
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                Region: {projectDetails.region}
              </span>
            </div>

          </>
        )}

        {/* Conditionally Render Content based on Top-Level Tab */}
        {activeTopLevelTab === "Instances" ? (
          <>
            <div className="w-full flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#575758]">
                Instances
              </h2>
              <button
                onClick={() =>
                  navigate("/admin-dashboard/add-instance", {
                    state: { project: projectDetails },
                  })
                }
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
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${item.status === "Running"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Stopped"
                                ? "bg-red-100 text-red-800"
                                : item.status === "spawning"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.status === "payment_pending"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {item.status?.replace(/_/g, " ") || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(item);
                            }}
                            className="text-[#288DD1] hover:underline text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
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
                currentData.map((item) => (
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
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${item.status === "Running"
                          ? "bg-green-100 text-green-800"
                          : item.status === "Stopped"
                            ? "bg-red-100 text-red-800"
                            : item.status === "spawning"
                              ? "bg-blue-100 text-blue-800"
                              : item.status === "payment_pending"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {item.status?.replace(/_/g, " ") || "N/A"}
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
                    <div className="mt-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item);
                        }}
                        className="text-[#288DD1] hover:underline text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
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
          <div ref={infrastructureSectionRef}>
            <div className="w-full flex items-center justify-start border-b border-gray-300 mb-6 bg-white rounded-b-xl overflow-x-auto">
              {infraMenuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveInfraTab(item.name)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2
                    ${activeInfraTab === item.name
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
                  projectId={projectDetails.identifier}
                  projectName={projectDetails.name}
                  region={projectDetails.region}
                />
              )}
            </div>
          </div>
        )}
      </AdminPageShell>

      {/* Modals are unchanged */}
      <EditProjectModal
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
      <AssignEdgeConfigModal
        isOpen={isAssignEdgeOpen}
        onClose={() => setIsAssignEdgeOpen(false)}
        projectId={projectId}
        region={projectDetails?.region}
      />
    </>
  );
}

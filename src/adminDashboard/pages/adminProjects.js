import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import ProjectsPageContent from "../../shared/projects/ProjectsPageContent";
import { useFetchProjects } from "../../hooks/adminHooks/projectHooks";
import {
  Eye,
  Loader2,
  Plus,
  FolderOpen,
  Calendar,
  Activity,
  Settings,
  Check,
  AlertCircle,
  Clock,
  RefreshCw,
  Server
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CreateProjectModal from "./projectComps/addProject";
import { designTokens } from "../../styles/designTokens";
import ToastUtils from "../../utils/toastUtil";

// Function to encode the ID for URL
const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Provisioning", value: "provisioning" },
  { label: "Processing", value: "processing" },
  { label: "Inactive", value: "inactive" },
  { label: "Error", value: "error" },
];

const getStatusDisplayConfig = (status) => {
  switch (status) {
    case "processing":
    case "provisioning":
      return {
        backgroundColor: "#FEF3C7",
        color: "#D97706",
        icon: <Loader2 size={12} className="animate-spin" />,
        label: status === "processing" ? "Processing..." : "Provisioning...",
      };
    case "active":
      return {
        backgroundColor: "#D1FAE5",
        color: "#059669",
        icon: <Check size={12} />,
        label: "Active",
      };
    case "failed":
    case "error":
      return {
        backgroundColor: "#FEE2E2",
        color: "#DC2626",
        icon: <AlertCircle size={12} />,
        label: status === "failed" ? "Failed" : "Error",
      };
    case "inactive":
      return {
        backgroundColor: "#E5E7EB",
        color: "#ffffff",
        icon: <Clock size={12} />,
        label: "Inactive",
      };
    case "pending":
      return {
        backgroundColor: "#DBEAFE",
        color: "#1D4ED8",
        icon: <Clock size={12} />,
        label: "Pending",
      };
    default:
      return {
        backgroundColor: "#F3F4F6",
        color: "#4B5563",
        icon: <Clock size={12} />,
        label: status ? status : "Unknown",
      };
  }
};

export default function AdminProjects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isRevampedRoute = location.pathname.includes("projects-revamped");

  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddProjectOpen, setAddProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get("status") || "");
  const [filterRegion, setFilterRegion] = useState(() => searchParams.get("region") || "");

  const updateSearchParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      setSearchParams(Object.fromEntries(params.entries()));
    },
    [searchParams, setSearchParams]
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddProject = () => setAddProject(true);
  const closeAddProject = () => setAddProject(false);

  const defaultPerPage = isRevampedRoute ? 15 : 10;

  const [currentPage, setCurrentPage] = useState(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const pp = Number(searchParams.get("per_page"));
    return [10, 15, 20, 30].includes(pp) ? pp : defaultPerPage;
  });

  // Fetch projects with backend pagination
  const {
    data: projectsResponse,
    isLoading: isProjectsLoading,
    isFetching: isProjectsFetching,
    isError: isProjectsError,
    error: projectsError,
    refetch: refetchProjects,
  } = useFetchProjects({
    page: currentPage,
    per_page: itemsPerPage,
    status: filterStatus || undefined,
    region: filterRegion || undefined,
  });

  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Extract list and pagination meta
  const projectsData = useMemo(() => {
    if (!projectsResponse) return [];
    if (Array.isArray(projectsResponse?.data?.data)) {
      return projectsResponse.data.data;
    }
    if (Array.isArray(projectsResponse?.data)) {
      return projectsResponse.data;
    }
    return [];
  }, [projectsResponse]);

  const pagination = projectsResponse?.data?.meta || projectsResponse?.meta || {};
  const totalProjects = pagination?.total ?? projectsData.length;
  const totalPages = pagination?.last_page ?? 1;

  const availableRegions = useMemo(() => {
    if (Array.isArray(pagination?.available_regions) && pagination.available_regions.length > 0) {
      return pagination.available_regions;
    }
    return Array.from(
      new Set(
        projectsData
          .map((project) => project.region)
          .filter(Boolean)
      )
    );
  }, [pagination, projectsData]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projectsData;
    }

    const query = searchQuery.trim().toLowerCase();
    return projectsData.filter((project) => {
      const nameMatch = project.name?.toLowerCase().includes(query);
      const identifierMatch = project.identifier?.toLowerCase().includes(query);
      const descriptionMatch = project.description?.toLowerCase().includes(query);
      return nameMatch || identifierMatch || descriptionMatch;
    });
  }, [projectsData, searchQuery]);

  const activeProjectsCount =
    pagination?.counts?.active ?? projectsData.filter((p) => p.status === "active").length;

  const provisioningProjectsCount = projectsData.filter(
    (p) =>
      p.provisioning_progress?.status === "provisioning" ||
      p.status === "provisioning" ||
      p.status === "processing"
  ).length;

  const totalInstancesCount =
    pagination?.totals?.instances ??
    projectsData.reduce(
      (sum, project) => sum + (project.resources_count?.instances || 0),
      0
    );

  const projectStats = {
    totalProjects,
    activeProjects: activeProjectsCount,
    provisioningProjects: provisioningProjectsCount,
    totalInstances: totalInstancesCount,
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
    updateSearchParams({
      status: value || undefined,
      page: 1,
    });
  };

  const handleRegionFilterChange = (value) => {
    setFilterRegion(value);
    setCurrentPage(1);
    updateSearchParams({
      region: value || undefined,
      page: 1,
    });
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
    updateSearchParams({
      search: value || undefined,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setFilterStatus("");
    setFilterRegion("");
    setSearchQuery("");
    setCurrentPage(1);
    updateSearchParams({
      status: undefined,
      region: undefined,
      search: undefined,
      page: 1,
    });
  };

  // Define columns for ModernTable
  const columns = [
    {
      key: 'name',
      header: 'Project Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <FolderOpen size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => (
        <div className="max-w-xs truncate">
          <span title={value}>{value || 'No description'}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (value) => (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: designTokens.colors.success[50],
            color: designTokens.colors.success[700]
          }}
        >
          {value || 'Standard'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value, row) => {
        const style = getStatusDisplayConfig(value);
        return (
          <div className="flex items-center gap-1">
            <span
              className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
              style={{
                backgroundColor: style.backgroundColor,
                color: style.color
              }}
            >
              {style.icon}
              <span className="capitalize">{style.label}</span>
            </span>
            {row._isOptimistic && (
              <span className="text-xs text-gray-400 italic">*</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: designTokens.colors.neutral[500] }} />
          <span className="text-sm">
            {value ? new Date(value).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      )
    }
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Eye size={16} />,
      label: '',
      onClick: (item) => handleRowClick(item)
    }
  ];

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateSearchParams({
        page,
        per_page: itemsPerPage,
      });
    }
  };

  const handlePerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    updateSearchParams({
      page: 1,
      per_page: value,
    });
  };

  useEffect(() => {
    if (!isProjectsLoading && projectsResponse && !lastUpdatedAt) {
      setLastUpdatedAt(new Date());
    }
  }, [isProjectsLoading, projectsResponse, lastUpdatedAt]);

  const handleManualRefresh = async () => {
    try {
      setIsManualRefreshing(true);
      const result = await refetchProjects();
      if (result?.error) {
        throw result.error;
      }
      setLastUpdatedAt(new Date());
      ToastUtils.success("Projects refreshed");
    } catch (error) {
      console.error("Failed to refresh projects:", error);
      ToastUtils.error(
        error?.message || "Failed to refresh projects. Please try again."
      );
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const formattedLastUpdated = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    : null;

  const subHeaderMeta = formattedLastUpdated ? (
    <span
      className="text-xs"
      style={{ color: designTokens.colors.neutral[500] }}
    >
      Last updated: {formattedLastUpdated}
    </span>
  ) : null;

  const headerActions = (
    <div className="flex items-center gap-2">
      <ModernButton
        onClick={handleManualRefresh}
        variant="outline"
        size="sm"
        isLoading={isManualRefreshing}
        isDisabled={isManualRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw
          size={16}
          className={isManualRefreshing ? "animate-spin" : ""}
        />
        Refresh
      </ModernButton>
      <ModernButton onClick={openAddProject} className="flex items-center gap-2">
        <Plus size={18} />
        Add Project
      </ModernButton>
    </div>
  );

  // Keep URL in sync when state changes
  // Update state if URL is changed externally
  useEffect(() => {
    const sp = Number(searchParams.get("page"));
    const spp = Number(searchParams.get("per_page"));
    const statusFromUrl = searchParams.get("status") || "";
    const regionFromUrl = searchParams.get("region") || "";
    const searchFromUrl = searchParams.get("search") || "";

    const pageFromUrl = Number.isFinite(sp) && sp > 0 ? sp : 1;
    const perPageAllowed = [10, 15, 20, 30];
    const perPageFromUrl = perPageAllowed.includes(spp) ? spp : defaultPerPage;

    if (pageFromUrl !== currentPage) setCurrentPage(pageFromUrl);
    if (perPageFromUrl !== itemsPerPage) setItemsPerPage(perPageFromUrl);
    if (statusFromUrl !== filterStatus) setFilterStatus(statusFromUrl);
    if (regionFromUrl !== filterRegion) setFilterRegion(regionFromUrl);
    if (searchFromUrl !== searchQuery) setSearchQuery(searchFromUrl);
  }, [searchParams, currentPage, itemsPerPage, defaultPerPage, filterStatus, filterRegion, searchQuery]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    if (isRevampedRoute) {
      navigate(
        `/admin-dashboard/projects-revamped/details?identifier=${encodeURIComponent(
          item.identifier
        )}`
      );
      return;
    }

    navigate(
      `/admin-dashboard/projects/details?identifier=${encodeURIComponent(
        item.identifier
      )}`
    );
  };

  if (isProjectsLoading) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <DashboardPageShell
          title="Project Management"
          description="Manage and track your infrastructure projects"
          actions={headerActions}
          subHeaderContent={subHeaderMeta}
          contentClassName="flex min-h-[60vh] flex-col items-center justify-center gap-3"
          mainClassName="admin-dashboard-shell"
          homeHref="/admin-dashboard"
        >
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: designTokens.colors.primary[500] }}
          />
          <p style={{ color: designTokens.colors.neutral[700] }}>
            Loading projects...
          </p>
        </DashboardPageShell>
        <CreateProjectModal
          isOpen={isAddProjectOpen}
          onClose={closeAddProject}
        />
      </>
    );
  }

  if (isProjectsError) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <DashboardPageShell
          title="Project Management"
          description="Manage and track your infrastructure projects"
          actions={headerActions}
          subHeaderContent={subHeaderMeta}
          contentClassName="flex min-h-[60vh] items-center justify-center"
          homeHref="/admin-dashboard"
        >
          <ModernCard className="max-w-xl w-full">
            <div className="text-center space-y-4">
              <div
                className="text-lg font-medium"
                style={{ color: designTokens.colors.error[700] }}
              >
                Failed to load projects
              </div>
              <div
                className="text-sm"
                style={{ color: designTokens.colors.error[600] }}
              >
                {projectsError?.message || "An unexpected error occurred."}
              </div>
              <div className="flex items-center justify-center gap-2">
                <ModernButton
                  onClick={() => refetchProjects()}
                  variant="outline"
                >
                  Retry
                </ModernButton>
                <ModernButton onClick={openAddProject}>
                  Add Project
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        </DashboardPageShell>
        <CreateProjectModal isOpen={isAddProjectOpen} onClose={closeAddProject} />
      </>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <DashboardPageShell
        title="Project Management"
        description="Manage and track your infrastructure projects"
        actions={headerActions}
        subHeaderContent={subHeaderMeta}
        contentClassName="space-y-6"
        mainClassName="admin-dashboard-shell"
        homeHref="/admin-dashboard"
      >
        <ProjectsPageContent
          searchQuery={searchQuery}
          onSearchChange={handleSearchInputChange}
          statusOptions={STATUS_OPTIONS}
          statusFilter={filterStatus}
          onStatusChange={handleStatusFilterChange}
          availableRegions={availableRegions}
          regionFilter={filterRegion}
          onRegionChange={handleRegionFilterChange}
          onResetFilters={handleResetFilters}
          statsCards={[
            {
              title: "Total Projects",
              value: projectStats.totalProjects,
              icon: <FolderOpen size={24} />,
              change: 0,
              trend: "up",
              color: "primary",
              description: "Tracked across tenants",
            },
            {
              title: "Active Projects",
              value: projectStats.activeProjects,
              icon: <Activity size={24} />,
              color: "success",
              description: "Available for workloads",
            },
            {
              title: "Provisioning",
              value: projectStats.provisioningProjects,
              icon: <Settings size={24} />,
              color: "warning",
              description: "In progress with Zadara",
            },
            {
              title: "Instances",
              value: projectStats.totalInstances,
              icon: <Server size={24} />,
              color: "info",
              description: "Instances discovered",
            },
          ]}
          filteredProjects={filteredProjects}
          totalProjects={totalProjects}
          isFetching={isProjectsFetching}
          onRowClick={handleRowClick}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handlePerPageChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          statusDisplayConfig={getStatusDisplayConfig}
          renderColumns={() => columns}
          tableActions={actions}
        />
      </DashboardPageShell>
      <CreateProjectModal isOpen={isAddProjectOpen} onClose={closeAddProject} />
    </>
  );
}

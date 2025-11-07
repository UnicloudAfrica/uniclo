import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Eye,
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Server,
} from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import ProjectsPageContent from "../../shared/projects/ProjectsPageContent";
import { useFetchProjects } from "../../hooks/projectHooks";
import ModernButton from "../../adminDashboard/components/ModernButton";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ToastUtils from "../../utils/toastUtil";
import { designTokens } from "../../styles/designTokens";

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

const defaultPerPageOptions = [10, 15, 20, 30];

const decodeNumberParam = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildProjectsList = (response) => {
  if (!response) return [];
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return [];
};

export default function TenantProjects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const goToCreateProject = useCallback(
    () => navigate("/dashboard/projects/create"),
    [navigate]
  );

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") || ""
  );
  const [filterStatus, setFilterStatus] = useState(
    () => searchParams.get("status") || ""
  );
  const [filterRegion, setFilterRegion] = useState(
    () => searchParams.get("region") || ""
  );

  const defaultPerPage = searchParams.get("per_page")
    ? decodeNumberParam(searchParams.get("per_page"), 10)
    : 10;

  const [currentPage, setCurrentPage] = useState(() =>
    decodeNumberParam(searchParams.get("page"), 1)
  );
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const requestedPerPage = decodeNumberParam(
      searchParams.get("per_page"),
      defaultPerPage
    );
    return defaultPerPageOptions.includes(requestedPerPage)
      ? requestedPerPage
      : defaultPerPage;
  });

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

  const {
    data: projectsResponse,
    isLoading: isProjectsLoading,
    isFetching: isProjectsFetching,
    isError: isProjectsError,
    error: projectsError,
    refetch: refetchProjects,
  } = useFetchProjects(
    {
      page: currentPage,
      per_page: itemsPerPage,
      status: filterStatus || undefined,
      region: filterRegion || undefined,
    },
    {
      keepPreviousData: true,
    }
  );

  const projectsData = useMemo(
    () => buildProjectsList(projectsResponse),
    [projectsResponse]
  );

  const pagination = useMemo(
    () =>
      projectsResponse?.meta ||
      projectsResponse?.data?.meta ||
      {
        total: projectsData.length,
        last_page: 1,
      },
    [projectsResponse, projectsData.length]
  );

  const totalProjects = pagination?.total ?? projectsData.length;
  const totalPages = pagination?.last_page ?? 1;

  const availableRegions = useMemo(() => {
    if (
      Array.isArray(pagination?.available_regions) &&
      pagination.available_regions.length > 0
    ) {
      return pagination.available_regions;
    }
    return Array.from(
      new Set(projectsData.map((project) => project.region).filter(Boolean))
    );
  }, [pagination, projectsData]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projectsData;
    }
    const query = searchQuery.trim().toLowerCase();
    return projectsData.filter((project) => {
      const nameMatch = project.name?.toLowerCase().includes(query);
      const identifierMatch = project.identifier
        ?.toLowerCase()
        .includes(query);
      const descriptionMatch = project.description
        ?.toLowerCase()
        .includes(query);
      return nameMatch || identifierMatch || descriptionMatch;
    });
  }, [projectsData, searchQuery]);

  const activeProjectsCount =
    pagination?.counts?.active ??
    filteredProjects.filter((project) => project.status === "active").length;

  const provisioningProjectsCount = useMemo(
    () =>
      filteredProjects.filter(
        (project) =>
          project.provisioning_progress?.status === "provisioning" ||
          project.status === "provisioning" ||
          project.status === "processing"
      ).length,
    [filteredProjects]
  );

  const totalInstancesCount =
    pagination?.totals?.instances ??
    filteredProjects.reduce(
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

  const columns = [
    {
      key: "name",
      header: "Project Name",
      render: (value) => (
        <div className="flex items-center gap-2">
          <FolderOpen
            size={16}
            style={{ color: designTokens.colors.primary[500] }}
          />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (value) => (
        <div className="max-w-xs truncate">
          <span title={value}>{value || "No description"}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (value) => (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: designTokens.colors.success[50],
            color: designTokens.colors.success[700],
          }}
        >
          {value || "Standard"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value, row) => {
        const style = getStatusDisplayConfig(value);
        return (
          <div className="flex items-center gap-1">
            <span
              className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
              style={{
                backgroundColor: style.backgroundColor,
                color: style.color,
              }}
            >
              {style.icon}
              <span className="capitalize">{style.label}</span>
            </span>
            {row?._isOptimistic && (
              <span className="text-xs text-gray-400 italic">*</span>
            )}
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Created",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar
            size={14}
            style={{ color: designTokens.colors.neutral[500] }}
          />
          <span className="text-sm">
            {value ? new Date(value).toLocaleDateString() : "N/A"}
          </span>
        </div>
      ),
    },
  ];

  const actions = [
    {
      icon: <Eye size={16} />,
      label: "",
      onClick: (item) => handleRowClick(item),
    },
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

  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

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
      <ModernButton onClick={goToCreateProject} className="flex items-center gap-2">
        <Plus size={18} />
        Add Project
      </ModernButton>
    </div>
  );

  useEffect(() => {
    const pageFromUrl = decodeNumberParam(searchParams.get("page"), 1);
    const perPageFromUrl = decodeNumberParam(
      searchParams.get("per_page"),
      defaultPerPage
    );
    const statusFromUrl = searchParams.get("status") || "";
    const regionFromUrl = searchParams.get("region") || "";
    const searchFromUrl = searchParams.get("search") || "";

    if (pageFromUrl !== currentPage) setCurrentPage(pageFromUrl);
    if (
      perPageFromUrl !== itemsPerPage &&
      defaultPerPageOptions.includes(perPageFromUrl)
    ) {
      setItemsPerPage(perPageFromUrl);
    }
    if (statusFromUrl !== filterStatus) setFilterStatus(statusFromUrl);
    if (regionFromUrl !== filterRegion) setFilterRegion(regionFromUrl);
    if (searchFromUrl !== searchQuery) setSearchQuery(searchFromUrl);
  }, [
    searchParams,
    currentPage,
    itemsPerPage,
    filterStatus,
    filterRegion,
    searchQuery,
    defaultPerPage,
  ]);

  const handleRowClick = (item) => {
    navigate(
      `/dashboard/projects/details?id=${encodeURIComponent(
        btoa(item.identifier)
      )}`
    );
  };

  const shellProps = {
    title: "Projects",
    description:
      "Manage tenant projects, monitor provisioning, and launch new workloads.",
    actions: headerActions,
    subHeaderContent: subHeaderMeta,
    homeHref: "/dashboard",
    contentClassName: "space-y-6",
  };

  if (isProjectsLoading) {
    return (
      <>
        <TenantPageShell {...shellProps}>
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: designTokens.colors.primary[500] }}
            />
            <p style={{ color: designTokens.colors.neutral[700] }}>
              Loading projects...
            </p>
          </div>
        </TenantPageShell>
      </>
    );
  }

  if (isProjectsError) {
    return (
      <>
        <TenantPageShell {...shellProps}>
          <div className="flex min-h-[50vh] items-center justify-center">
            <ModernCard className="w-full max-w-xl">
              <div className="space-y-4 text-center">
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
                  {projectsError?.message ||
                    "An unexpected error occurred while fetching your projects."}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <ModernButton
                    onClick={() => refetchProjects()}
                    variant="outline"
                  >
                    Retry
                  </ModernButton>
                  <ModernButton onClick={goToCreateProject}>
                    Add Project
                  </ModernButton>
                </div>
              </div>
            </ModernCard>
          </div>
        </TenantPageShell>
      </>
    );
  }

  return (
    <>
      <TenantPageShell {...shellProps}>
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
              color: "primary",
              description: "Workspaces in this tenant",
            },
            {
              title: "Active Projects",
              value: projectStats.activeProjects,
              icon: <Activity size={24} />,
              color: "success",
              description: "Ready for provisioning",
            },
            {
              title: "Provisioning",
              value: projectStats.provisioningProjects,
              icon: <Settings size={24} />,
              color: "warning",
              description: "Currently syncing with provider",
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
      </TenantPageShell>
    </>
  );
}

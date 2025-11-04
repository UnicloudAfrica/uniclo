import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Server,
  Settings,
} from "lucide-react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ModernButton from "../../adminDashboard/components/ModernButton";
import AdminPageHeader from "../../adminDashboard/components/AdminPageHeader";
import ProjectsPageContent from "../../shared/projects/ProjectsPageContent";
import { designTokens } from "../../styles/designTokens";
import { useFetchClientProjects } from "../../hooks/clientHooks/projectHooks";
import CreateProjectModal from "./projectComps/addProject";
import ToastUtils from "../../utils/toastUtil";

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
        color: "#6B7280",
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

const encodeId = (id) => encodeURIComponent(btoa(id));

const ClientProjects = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddProjectOpen, setAddProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get("status") || "");
  const [filterRegion, setFilterRegion] = useState(() => searchParams.get("region") || "");
  const [currentPage, setCurrentPage] = useState(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const pp = Number(searchParams.get("per_page"));
    return [10, 15, 20, 30].includes(pp) ? pp : 10;
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const {
    data: projects = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchClientProjects();

  useEffect(() => {
    if (!isLoading && projects && !lastUpdatedAt) {
      setLastUpdatedAt(new Date());
    }
  }, [isLoading, projects, lastUpdatedAt]);

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

  const projectList = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects]
  );

  const availableRegions = useMemo(
    () =>
      Array.from(
        new Set(
          projectList
            .map((project) => project.region)
            .filter(Boolean)
            .map((region) => region.toUpperCase())
        )
      ),
    [projectList]
  );

  const filteredProjects = useMemo(() => {
    return projectList.filter((project) => {
      const matchesSearch = (() => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.trim().toLowerCase();
        return (
          project?.name?.toLowerCase().includes(query) ||
          project?.identifier?.toLowerCase().includes(query) ||
          project?.description?.toLowerCase().includes(query)
        );
      })();

      const matchesStatus = (() => {
        if (!filterStatus) return true;
        return (project?.status || "").toLowerCase() === filterStatus;
      })();

      const matchesRegion = (() => {
        if (!filterRegion) return true;
        return (project?.region || "").toUpperCase() === filterRegion;
      })();

      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [projectList, searchQuery, filterStatus, filterRegion]);

  const totalProjects = filteredProjects.length;
  const totalPages = totalProjects > 0 ? Math.ceil(totalProjects / itemsPerPage) : 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const projectStats = useMemo(() => {
    const base = projectList.reduce(
      (acc, project) => {
        const status = (project?.status || "unknown").toLowerCase();
        acc.totalProjects += 1;
        if (status === "active") acc.activeProjects += 1;
        if (status === "provisioning" || status === "processing") {
          acc.provisioningProjects += 1;
        }
        acc.totalInstances += project?.resources_count?.instances || 0;
        return acc;
      },
      {
        totalProjects: 0,
        activeProjects: 0,
        provisioningProjects: 0,
        totalInstances: 0,
      }
    );

    return base;
  }, [projectList]);

  const handleManualRefresh = async () => {
    try {
      setIsManualRefreshing(true);
      const result = await refetch();
      if (result?.error) {
        throw result.error;
      }
      setLastUpdatedAt(new Date());
      ToastUtils.success("Projects refreshed");
    } catch (err) {
      console.error("Failed to refresh projects:", err);
      ToastUtils.error(err?.message || "Failed to refresh projects. Please try again.");
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleRowClick = (project) => {
    const encodedId = encodeId(project.identifier);
    const encodedName = encodeURIComponent(project.name);
    navigate(`/client-dashboard/projects/details?id=${encodedId}&name=${encodedName}`);
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
    updateSearchParams({ status: value || undefined, page: 1 });
  };

  const handleRegionFilterChange = (value) => {
    setFilterRegion(value);
    setCurrentPage(1);
    updateSearchParams({ region: value || undefined, page: 1 });
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
    updateSearchParams({ search: value || undefined, page: 1 });
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

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    updateSearchParams({ page: 1, per_page: value });
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
    updateSearchParams({ page, per_page: itemsPerPage });
  };

  useEffect(() => {
    const sp = Number(searchParams.get("page"));
    const spp = Number(searchParams.get("per_page"));
    const statusFromUrl = searchParams.get("status") || "";
    const regionFromUrl = searchParams.get("region") || "";
    const searchFromUrl = searchParams.get("search") || "";

    const pageFromUrl = Number.isFinite(sp) && sp > 0 ? sp : 1;
    const perPageAllowed = [10, 15, 20, 30];
    const perPageFromUrl = perPageAllowed.includes(spp) ? spp : 10;

    if (pageFromUrl !== currentPage) setCurrentPage(pageFromUrl);
    if (perPageFromUrl !== itemsPerPage) setItemsPerPage(perPageFromUrl);
    if (statusFromUrl !== filterStatus) setFilterStatus(statusFromUrl);
    if (regionFromUrl !== filterRegion) setFilterRegion(regionFromUrl);
    if (searchFromUrl !== searchQuery) setSearchQuery(searchFromUrl);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Project Name",
        render: (value) => (
          <div className="flex items-center gap-2">
            <FolderOpen size={16} style={{ color: designTokens.colors.primary[500] }} />
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
            className="rounded-full px-2 py-1 text-xs font-medium"
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
        render: (value) => {
          const style = getStatusDisplayConfig(value);
          return (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: style.backgroundColor,
                color: style.color,
              }}
            >
              {style.icon}
              <span className="capitalize">{style.label}</span>
            </span>
          );
        },
      },
      {
        key: "created_at",
        header: "Created",
        render: (value) => (
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: designTokens.colors.neutral[500] }} />
            <span className="text-sm">
              {value ? new Date(value).toLocaleDateString() : "N/A"}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        icon: <Eye size={16} />,
        label: "",
        onClick: (item) => handleRowClick(item),
      },
    ],
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

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
        <RefreshCw size={16} className={isManualRefreshing ? "animate-spin" : ""} />
        Refresh
      </ModernButton>
      <ModernButton onClick={() => setAddProjectOpen(true)} className="flex items-center gap-2">
        <Plus size={18} />
        Add Project
      </ModernButton>
    </div>
  );

  const subHeaderContent = lastUpdatedAt ? (
    <span className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>
      Last updated:{" "}
      {lastUpdatedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  ) : null;

  const breadcrumbs = [
    { label: "Home", href: "/client-dashboard" },
    { label: "Projects" },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const statsCards = [
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
      description: "In progress",
    },
    {
      title: "Instances",
      value: projectStats.totalInstances,
      icon: <Server size={24} />,
      color: "info",
      description: "Instances discovered",
    },
  ];

  if (isLoading) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
        <ClientActiveTab />
        <main className="dashboard-content-shell flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: designTokens.colors.primary[500] }} />
        </main>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
        <ClientActiveTab />
        <main className="dashboard-content-shell flex min-h-[60vh] items-center justify-center p-6 md:p-8">
          <div className="w-full max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-700">Failed to load projects</h2>
            <p className="mt-2 text-sm text-red-600">
              {error?.message || "An unexpected error occurred."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <ModernButton variant="outline" onClick={() => refetch()}>
                Retry
              </ModernButton>
              <ModernButton onClick={() => setAddProjectOpen(true)}>Add Project</ModernButton>
            </div>
          </div>
        </main>
        <CreateProjectModal isOpen={isAddProjectOpen} onClose={() => setAddProjectOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />
      <main className="dashboard-content-shell p-0">
        <AdminPageHeader
          breadcrumbs={breadcrumbs}
          title="Project Management"
          description="Manage and track your infrastructure projects"
          actions={headerActions}
          subHeaderContent={subHeaderContent}
        />
        <section
          className="space-y-6 p-6 md:p-8"
          style={{ backgroundColor: designTokens.colors.neutral[25] }}
        >
          <ProjectsPageContent
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusOptions={STATUS_OPTIONS}
            statusFilter={filterStatus}
            onStatusChange={handleStatusFilterChange}
            availableRegions={availableRegions}
            regionFilter={filterRegion}
            onRegionChange={handleRegionFilterChange}
            onResetFilters={handleResetFilters}
            statsCards={statsCards}
            filteredProjects={paginatedProjects}
            totalProjects={totalProjects}
            isFetching={isFetching}
            onRowClick={handleRowClick}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          statusDisplayConfig={getStatusDisplayConfig}
          renderColumns={() => columns}
          tableActions={actions}
        />
        </section>
      </main>
      <CreateProjectModal isOpen={isAddProjectOpen} onClose={() => setAddProjectOpen(false)} />
    </>
  );
};

export default ClientProjects;

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { ModernButton } from "../ui";
import ProjectsStatsBar from "./ProjectsStatsBar";
import ProjectsFilterPanel from "./ProjectsFilterPanel";
import ProjectsTableView from "./ProjectsTableView";
import ProjectsCardView from "./ProjectsCardView";
import ProjectsBulkActions from "./ProjectsBulkActions";
import {
  filterProjects,
  sortProjects,
  calculateProjectStats,
  getUniqueValues,
} from "../../../utils/projectUtils";
import ToastUtils from "../../../utils/toastUtil.ts";

/**
 * Main container component for projects listing page
 * Manages state, data fetching, filtering, sorting, and pagination
 */
const ProjectsPageContainer = ({
  // Data props
  projects = [],
  isLoading = false,
  isFetching = false,
  isError = false,
  error = null,
  onRefresh,

  // Navigation props
  onCreateProject,
  onViewProject,

  // Bulk operations
  onBulkArchive,
  onBulkActivate,
  onBulkDelete,
  onBulkExport,

  // Single operations
  onArchiveProject,
  onActivateProject,
  onDeleteProject,

  // Configuration
  showCreateButton = true,
  showRefreshButton = true,
  showBulkActions = true,
  showStats = true,
  enableExport = true,

  // Custom components
  customActions = null,
  customFilters = null,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // UI State
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [filters, setFilters] = useState(() => ({
    status: searchParams.get("status")?.split(",").filter(Boolean) || [],
    region: searchParams.get("region")?.split(",").filter(Boolean) || [],
    provider: searchParams.get("provider")?.split(",").filter(Boolean) || [],
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  }));

  // Pagination State
  const [currentPage, setCurrentPage] = useState(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const pp = Number(searchParams.get("per_page"));
    return [10, 15, 20, 30, 50].includes(pp) ? pp : 15;
  });

  // Sort State
  const [sortConfig, setSortConfig] = useState(() => ({
    key: searchParams.get("sort_by") || "created_at",
    direction: searchParams.get("sort_dir") || "desc",
  }));

  // Update last updated timestamp when data loads
  useEffect(() => {
    if (!isLoading && projects && !lastUpdatedAt) {
      setLastUpdatedAt(new Date());
    }
  }, [isLoading, projects, lastUpdatedAt]);

  // Sync URL params with state
  const updateSearchParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      });

      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  // Get unique filter options
  const filterOptions = useMemo(
    () => ({
      regions: getUniqueValues(projects, "region").map((r) => r.toUpperCase()),
      providers: getUniqueValues(projects, "provider"),
      statuses: ["active", "pending", "provisioning", "processing", "inactive", "error", "failed"],
    }),
    [projects]
  );

  // Apply filters and sorting
  const filteredProjects = useMemo(() => {
    const filtered = filterProjects(projects, searchQuery, filters);
    return sortProjects(filtered, sortConfig);
  }, [projects, searchQuery, filters, sortConfig]);

  // Calculate statistics
  const stats = useMemo(() => calculateProjectStats(filteredProjects), [filteredProjects]);

  // Pagination
  const totalProjects = filteredProjects.length;
  const totalPages = totalProjects > 0 ? Math.ceil(totalProjects / itemsPerPage) : 1;

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  // Reset to first page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Handlers
  const handleSearchChange = useCallback(
    (value) => {
      setSearchQuery(value);
      setCurrentPage(1);
      updateSearchParams({ search: value || undefined, page: 1 });
    },
    [updateSearchParams]
  );

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      setCurrentPage(1);
      updateSearchParams({
        status: newFilters.status.length > 0 ? newFilters.status : undefined,
        region: newFilters.region.length > 0 ? newFilters.region : undefined,
        provider: newFilters.provider.length > 0 ? newFilters.provider : undefined,
        dateFrom: newFilters.dateFrom || undefined,
        dateTo: newFilters.dateTo || undefined,
        page: 1,
      });
    },
    [updateSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setFilters({
      status: [],
      region: [],
      provider: [],
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
    updateSearchParams({
      search: undefined,
      status: undefined,
      region: undefined,
      provider: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
    });
  }, [updateSearchParams]);

  const handleSort = useCallback(
    (key, direction) => {
      setSortConfig({ key, direction });
      updateSearchParams({
        sort_by: key,
        sort_dir: direction,
      });
    },
    [updateSearchParams]
  );

  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
      updateSearchParams({ page });
    },
    [totalPages, updateSearchParams]
  );

  const handleItemsPerPageChange = useCallback(
    (value) => {
      setItemsPerPage(value);
      setCurrentPage(1);
      updateSearchParams({ per_page: value, page: 1 });
    },
    [updateSearchParams]
  );

  const handleManualRefresh = async () => {
    if (!onRefresh) return;

    try {
      setIsManualRefreshing(true);
      await onRefresh();
      setLastUpdatedAt(new Date());
      ToastUtils.success("Projects refreshed");
    } catch (err) {
      console.error("Failed to refresh projects:", err);
      ToastUtils.error(err?.message || "Failed to refresh projects");
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleSelectProject = useCallback((identifier) => {
    setSelectedProjects((prev) =>
      prev.includes(identifier) ? prev.filter((id) => id !== identifier) : [...prev, identifier]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProjects.length === paginatedProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(paginatedProjects.map((p) => p.identifier));
    }
  }, [selectedProjects, paginatedProjects]);

  const handleClearSelection = useCallback(() => {
    setSelectedProjects([]);
  }, []);

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      {showRefreshButton && onRefresh && (
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
      )}
      {showCreateButton && onCreateProject && (
        <ModernButton onClick={onCreateProject} className="flex items-center gap-2">
          <Plus size={18} />
          Add Project
        </ModernButton>
      )}
      {customActions}
    </div>
  );

  // Sub-header content
  const subHeaderContent = lastUpdatedAt ? (
    <span className="text-xs text-gray-500">
      Last updated:{" "}
      {lastUpdatedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  ) : null;

  return (
    <div className="space-y-6">
      {/* Header Actions - Add Project, Refresh, etc. */}
      <div className="flex items-center justify-between">
        <div>{subHeaderContent}</div>
        {headerActions}
      </div>

      {/* Stats Bar */}
      {showStats && <ProjectsStatsBar stats={stats} isLoading={isLoading} />}

      {/* Filter Panel */}
      <ProjectsFilterPanel
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        filterOptions={filterOptions}
        customFilters={customFilters}
      />

      {/* Bulk Actions */}
      {showBulkActions && selectedProjects.length > 0 && (
        <ProjectsBulkActions
          selectedCount={selectedProjects.length}
          onClearSelection={handleClearSelection}
          onArchive={onBulkArchive ? () => onBulkArchive(selectedProjects) : null}
          onActivate={onBulkActivate ? () => onBulkActivate(selectedProjects) : null}
          onDelete={onBulkDelete ? () => onBulkDelete(selectedProjects) : null}
          onExport={enableExport && onBulkExport ? () => onBulkExport(selectedProjects) : null}
        />
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <ProjectsTableView
          projects={paginatedProjects}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error}
          selectedProjects={selectedProjects}
          onSelectProject={handleSelectProject}
          onSelectAll={handleSelectAll}
          onViewProject={onViewProject}
          onArchiveProject={onArchiveProject}
          onActivateProject={onActivateProject}
          onDeleteProject={onDeleteProject}
          sortConfig={sortConfig}
          onSort={handleSort}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalProjects={totalProjects}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <ProjectsCardView
          projects={paginatedProjects}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onViewProject={onViewProject}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalProjects={totalProjects}
        />
      </div>
    </div>
  );
};

export default ProjectsPageContainer;

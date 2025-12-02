import React from "react";
import { Search, Loader2, FolderOpen, ChevronDown, ChevronUp, MoreVertical, Edit, Archive, Trash2, PlayCircle, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ModernCard from "../../adminDashboard/components/ModernCard";
import TableActionButtons from "../../adminDashboard/components/TableActionButtons";
import ModernStatsCard from "../../adminDashboard/components/ModernStatsCard";
import ModernTable from "../../adminDashboard/components/ModernTable";
import ModernButton from "../../adminDashboard/components/ModernButton";
import AdvancedFilters from "../../adminDashboard/components/AdvancedFilters";
import ResourceEmptyState from "../../adminDashboard/components/ResourceEmptyState";
import Skeleton from "../../shared/components/Skeleton";
import { designTokens } from "../../styles/designTokens";

const ProjectsPageContent = ({
  searchQuery,
  onSearchChange,
  statusOptions,
  statusFilter,
  onStatusChange,
  availableRegions,
  regionFilter,
  onRegionChange,
  onResetFilters,
  statsCards,
  filteredProjects,
  totalProjects,
  isFetching,
  onRowClick,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalPages,
  onPageChange,
  statusDisplayConfig,
  renderColumns,
  tableActions,
  mobileCardExtra,
  paginationLabel = "Rows per page:",
  // Selection props
  selectedProjects = [],
  onSelectProject,
  onSelectAll,
  tableColumns = [],
  sortConfig = { key: "created_at", direction: "desc" },
  onSort,
  // Advanced filters props
  filterConfig,
  filters,
  onFilterChange,
  onApplyFilters,
  // Single item actions
  onArchiveProject,
  onActivateProject,
  onDeleteProject,
  isError,
  error,
  onRetry,
}) => {
  const columns = renderColumns ? renderColumns() : [];
  const actions = tableActions || [];

  // UI State
  const [expandedRows, setExpandedRows] = useState([]);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const actionMenuRef = useRef(null);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActiveActionMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleRow = (identifier) => {
    setExpandedRows((prev) =>
      prev.includes(identifier)
        ? prev.filter((id) => id !== identifier)
        : [...prev, identifier]
    );
  };

  const toggleActionMenu = (identifier, event) => {
    event.stopPropagation();
    setActiveActionMenu(activeActionMenu === identifier ? null : identifier);
  };

  const handlePerPageChange = (event) => {
    const value = Number(event.target.value);
    onItemsPerPageChange(value);
  };

  return (
    <>
      <ModernCard padding="sm" className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm transition focus:border-[#288DD1] focus:ring-2 focus:ring-[#288DD1]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {filterConfig ? (
              <AdvancedFilters
                filters={filterConfig}
                values={filters}
                onChange={onFilterChange}
                onApply={onApplyFilters}
                onReset={onResetFilters}
              />
            ) : (
              <>
                <select
                  value={statusFilter}
                  onChange={(event) => onStatusChange(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-[#288DD1] focus:ring-2 focus:ring-[#288DD1]"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={regionFilter}
                  onChange={(event) => onRegionChange(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-[#288DD1] focus:ring-2 focus:ring-[#288DD1]"
                >
                  <option value="">All Regions</option>
                  {availableRegions.map((region) => (
                    <option key={region} value={region}>
                      {region.toUpperCase()}
                    </option>
                  ))}
                </select>
              </>
            )}

            {(searchQuery || (filters && Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v))) && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-sm text-[#288DD1] transition hover:text-[#1976D2] whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </ModernCard>

      {Array.isArray(statsCards) && statsCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <ModernStatsCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              change={card.change}
              trend={card.trend}
              color={card.color}
              description={card.description}
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-4 md:hidden">
        {isError ? (
          <ModernCard>
            <div className="py-8">
              <ResourceEmptyState
                title="Failed to load projects"
                message={error?.message || "An unexpected error occurred."}
                icon={<AlertCircle size={24} color={designTokens.colors.error[500]} />}
                action={
                  <ModernButton onClick={onRetry} variant="outline">
                    Retry
                  </ModernButton>
                }
              />
            </div>
          </ModernCard>
        ) : filteredProjects.length === 0 ? (
          <ModernCard padding="sm">
            <p className="text-sm text-gray-600">
              No projects found. Create your first project to get started.
            </p>
          </ModernCard>
        ) : (
          filteredProjects.map((project) => {
            const statusStyle = statusDisplayConfig(project.status);
            return (
              <ModernCard
                key={project.id || project.identifier}
                padding="sm"
                hover
                onClick={() => onRowClick(project)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">{project.identifier}</p>
                    {project.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{project.description}</p>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: statusStyle.backgroundColor,
                      color: statusStyle.color,
                    }}
                  >
                    {statusStyle.icon}
                    <span className="capitalize">{statusStyle.label}</span>
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <p className="text-xs text-gray-500">Region</p>
                    <p className="font-medium text-gray-900">
                      {project.region ? project.region.toUpperCase() : "N/A"}
                    </p>
                  </div>
                  {project.provider ? (
                    <div>
                      <p className="text-xs text-gray-500">Provider</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {project.provider}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs text-gray-500">Instances</p>
                    <p className="font-medium text-gray-900">
                      {project.resources_count?.instances || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {project.created_at
                        ? new Date(project.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRowClick(project);
                    }}
                    className="text-sm text-[#288DD1] transition hover:text-[#1976D2]"
                  >
                    View details →
                  </button>
                </div>
                {mobileCardExtra ? mobileCardExtra(project) : null}
              </ModernCard>
            );
          })
        )}
      </div>

      <div className="hidden md:block">
        <ModernCard>
          {isFetching ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between mb-4">
                <Skeleton width={200} height={24} />
                <div className="flex gap-2">
                  <Skeleton width={80} height={32} />
                  <Skeleton width={80} height={32} />
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex gap-4">
                    <Skeleton width={20} height={20} />
                    <Skeleton width={100} height={16} />
                    <Skeleton width={100} height={16} />
                    <Skeleton width={100} height={16} />
                    <Skeleton width={100} height={16} />
                  </div>
                </div>
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4 border-b last:border-0 flex gap-4 items-center">
                    <Skeleton width={20} height={20} />
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <Skeleton width="80%" height={16} />
                      <Skeleton width="60%" height={16} />
                      <Skeleton width="70%" height={16} />
                      <Skeleton width="50%" height={16} />
                      <Skeleton width="40%" height={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="py-8">
              <ResourceEmptyState
                title="Failed to load projects"
                message={error?.message || "An unexpected error occurred."}
                icon={<AlertCircle size={24} color={designTokens.colors.error[500]} />}
                action={
                  <ModernButton onClick={onRetry} variant="outline">
                    Retry
                  </ModernButton>
                }
              />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-8">
              <ResourceEmptyState
                title="No projects found"
                message={searchQuery ? "Try adjusting your search terms to find what you're looking for." : "Get started by creating a new project to manage your infrastructure."}
                icon={<FolderOpen size={24} />}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-10 px-6 py-3"></th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        <input
                          type="checkbox"
                          checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                          onChange={onSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      {tableColumns.map((col) => (
                        <th
                          key={col.key}
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          {col.sortable ? (
                            <button
                              onClick={() => onSort(col.key, sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc')}
                              className="flex items-center gap-1"
                            >
                              {col.label}
                              {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? <div size={12} /> : <div size={12} />)}
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredProjects.map((project) => {
                      const statusStyle = statusDisplayConfig(project.status);
                      return (
                        <React.Fragment key={project.identifier}>
                          <tr
                            className={`hover:bg-gray-50 transition-colors ${project.deleted_at ? "opacity-50 bg-red-50" : ""} ${expandedRows.includes(project.identifier) ? "bg-blue-50/30" : ""}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleRow(project.identifier)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {expandedRows.includes(project.identifier) ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedProjects.includes(project.identifier)}
                                onChange={() => onSelectProject(project.identifier)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer" onClick={() => onRowClick(project)}>
                              {project.name || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.identifier || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${['provisioning', 'processing'].includes(project.status) ? 'animate-pulse' : ''
                                  }`}
                                style={{
                                  backgroundColor: statusStyle.backgroundColor,
                                  color: statusStyle.color,
                                }}
                              >
                                {statusStyle.icon}
                                <span className="capitalize">{statusStyle.label}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.region ? project.region.toUpperCase() : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {project.provider || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                              <TableActionButtons
                                onView={() => onRowClick(project)}
                                onArchive={() => onArchiveProject && onArchiveProject(project)}
                                onActivate={() => onActivateProject && onActivateProject(project)}
                                onDelete={() => onDeleteProject && onDeleteProject(project)}
                                showView={true}
                                showEdit={false}
                                showDelete={true}
                                showArchive={true}
                                showDuplicate={false}
                                itemName={project.name}
                                // Custom logic for archive/activate toggle
                                customActions={[
                                  project.status !== 'active' ? {
                                    label: 'Activate Project',
                                    icon: <PlayCircle size={16} />,
                                    onClick: () => onActivateProject && onActivateProject(project),
                                  } : null
                                ].filter(Boolean)}
                              />
                            </td>
                          </tr>
                          {expandedRows.includes(project.identifier) && (
                            <tr className="bg-gray-50/50">
                              <td colSpan="9" className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div className="col-span-2">
                                    <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                                    <p className="text-gray-600">{project.description || "No description provided."}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Quick Stats</h4>
                                    <div className="flex gap-4">
                                      <div>
                                        <span className="text-gray-500 block text-xs">Instances</span>
                                        <span className="font-medium">{project.resources_count?.instances || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-xs">Volumes</span>
                                        <span className="font-medium">{project.resources_count?.volumes || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </ModernCard>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{paginationLabel}</span>
          <select
            value={itemsPerPage}
            onChange={handlePerPageChange}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#288DD1] focus:ring-2 focus:ring-[#288DD1]"
          >
            {[10, 15, 20, 30].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <ModernButton
              variant="outline"
              size="sm"
              isDisabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </ModernButton>
            <ModernButton
              variant="outline"
              size="sm"
              isDisabled={currentPage === totalPages || totalPages === 0}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </ModernButton>
          </div>
        </div>
      </div>
    </>
  );
};

ProjectsPageContent.defaultProps = {
  statusDisplayConfig: () => ({
    backgroundColor: designTokens.colors.neutral[100],
    color: designTokens.colors.neutral[700],
    icon: null,
    label: "Unknown",
  }),
  statsCards: [],
  renderColumns: null,
  tableActions: [],
  mobileCardExtra: null,
};

export default ProjectsPageContent;

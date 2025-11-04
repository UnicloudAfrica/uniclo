import React from "react";
import { Search } from "lucide-react";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ModernStatsCard from "../../adminDashboard/components/ModernStatsCard";
import ModernTable from "../../adminDashboard/components/ModernTable";
import ModernButton from "../../adminDashboard/components/ModernButton";
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
}) => {
  const columns = renderColumns ? renderColumns() : [];
  const actions = tableActions || [];

  const handlePerPageChange = (event) => {
    const value = Number(event.target.value);
    onItemsPerPageChange(value);
  };

  return (
    <>
      <ModernCard padding="sm" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search projects by name, identifier or description"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm transition focus:border-[#288DD1] focus:ring-2 focus:ring-[#288DD1]"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-[#288DD1] focus:ring-2 focus:ring-[#288DD1]"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={regionFilter}
              onChange={(event) => onRegionChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-[#288DD1] focus:ring-2 focus:ring-[#288DD1]"
            >
              <option value="">All Regions</option>
              {availableRegions.map((region) => (
                <option key={region} value={region}>
                  {region.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(statusFilter || regionFilter || searchQuery) && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-sm text-[#288DD1] transition hover:text-[#1976D2]"
            >
              Clear filters
            </button>
          </div>
        )}
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
        {filteredProjects.length === 0 ? (
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
          <ModernTable
            title={`Projects (${totalProjects} total)`}
            data={filteredProjects}
            columns={columns}
            actions={actions}
            searchable={false}
            filterable={false}
            exportable
            sortable
            loading={isFetching}
            onRowClick={onRowClick}
            emptyMessage="No projects found. Create your first project to get started."
          />
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

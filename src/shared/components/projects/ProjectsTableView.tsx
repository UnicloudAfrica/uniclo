import React, { useMemo } from "react";
import { Eye, Archive, PlayCircle, Trash2 } from "lucide-react";
import ModernTable, { Column } from "../ui/ModernTable";
import { getStatusDisplayConfig, formatDate, SortConfig } from "@/utils/projectUtils";
import { Project } from "@/types/project";

export interface ProjectsTableViewProps {
  projects: Project[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error?: Error | { message: string } | null;
  selectedProjects?: string[];
  onSelectProject: (ids: string[]) => void;
  onSelectAll?: () => void;
  onViewProject: (project: Project) => void;
  onArchiveProject?: (project: Project) => void;
  onActivateProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  sortConfig: SortConfig;
  onSort: (key: string, direction: "asc" | "desc") => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  totalProjects: number;
}

/**
 * Desktop table view for projects using ModernTable
 */
const ProjectsTableView: React.FC<ProjectsTableViewProps> = ({
  projects,
  isLoading,
  isFetching,
  selectedProjects = [],
  onSelectProject,
  onViewProject,
  onArchiveProject,
  onActivateProject,
  onDeleteProject,
  sortConfig,
  onSort,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  totalProjects,
}) => {
  // Define columns
  const columns = useMemo<Column<Project>[]>(
    () => [
      {
        key: "name",
        header: "Project Name",
        sortable: true,
        render: (value, row) => (
          <span
            className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => onViewProject(row)}
          >
            {(value as React.ReactNode) || "—"}
          </span>
        ),
      },
      {
        key: "identifier",
        header: "Identifier",
        sortable: false, // Identifier usually not sorted, but can be enabled if needed
        render: (value) => (
          <span className="text-gray-500">{(value as React.ReactNode) || "—"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (value) => {
          const statusStyle = getStatusDisplayConfig(value as string);
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusStyle.animate ? "animate-pulse" : ""}`}
              style={{
                backgroundColor: statusStyle.backgroundColor,
                color: statusStyle.color,
              }}
            >
              {statusStyle.icon}
              <span className="capitalize">{statusStyle.label}</span>
            </span>
          );
        },
      },
      {
        key: "region",
        header: "Region",
        render: (value) => (value ? (value as string).toUpperCase() : "N/A"),
      },
      {
        key: "provider",
        header: "Provider",
        render: (value) => <span className="capitalize">{(value as React.ReactNode) || "—"}</span>,
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        render: (value) => formatDate(value as string),
      },
    ],
    [onViewProject]
  );

  // Custom Actions Column Render
  // Since ModernTable action prop is rigid, we'll append a custom column for actions to have full control
  const tableColumns = useMemo<Column<Project>[]>(
    () => [
      ...columns,
      {
        key: "actions",
        header: <div className="text-right">Actions</div>,
        align: "right",
        render: (_, row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProject(row);
              }}
              className="text-blue-600 hover:text-blue-900 transition p-1"
              title="View details"
            >
              <Eye size={16} />
            </button>
            {onActivateProject && row.status !== "active" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onActivateProject(row);
                }}
                className="text-green-600 hover:text-green-900 transition p-1"
                title="Activate project"
              >
                <PlayCircle size={16} />
              </button>
            )}
            {onArchiveProject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchiveProject(row);
                }}
                className="text-gray-600 hover:text-gray-900 transition p-1"
                title="Archive project"
              >
                <Archive size={16} />
              </button>
            )}
            {onDeleteProject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(row);
                }}
                className="text-red-600 hover:text-red-900 transition p-1"
                title="Delete project"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [columns, onViewProject, onActivateProject, onArchiveProject, onDeleteProject]
  );

  return (
    <ModernTable<Project>
      data={projects}
      columns={tableColumns}
      loading={isLoading || isFetching} // Unified loading state
      // Pagination
      paginated={true}
      page={currentPage}
      pageSize={itemsPerPage}
      totalItems={totalProjects}
      totalPages={totalPages}
      onPageChange={onPageChange}
      // Sorting
      sortConfig={sortConfig}
      onSort={(key, dir) => onSort(key, dir)}
      // Selection
      selectedIds={selectedProjects}
      onSelectionChange={onSelectProject}
      selectable={true}
      expandable={true}
      renderExpandedRow={(row) => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="col-span-2">
            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
            <p className="text-gray-600">{row.description || "No description provided."}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Resources</h4>
            <div className="flex gap-4">
              <div>
                <span className="text-gray-500 block text-xs">Instances</span>
                <span className="font-medium">{row.resources_count?.instances || 0}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Volumes</span>
                <span className="font-medium">{row.resources_count?.volumes || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    />
  );
};

export default ProjectsTableView;

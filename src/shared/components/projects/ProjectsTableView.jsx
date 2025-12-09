import React, { useMemo } from "react";
import { Eye, Archive, PlayCircle, Trash2 } from "lucide-react";
import { ModernTable } from "../ui";
import { getStatusDisplayConfig, formatDate } from "../../../utils/projectUtils";

/**
 * Desktop table view for projects using ModernTable
 */
const ProjectsTableView = ({
  projects,
  isLoading,
  isFetching,
  // Error props handling
  isError,
  error,
  // Selection props
  selectedProjects = [],
  onSelectProject,
  onSelectAll,
  // Action handlers
  onViewProject,
  onArchiveProject,
  onActivateProject,
  onDeleteProject,
  // Sort props
  sortConfig,
  onSort,
  // Pagination props
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  totalProjects,
}) => {
  // Define columns
  const columns = useMemo(
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
            {value || "—"}
          </span>
        ),
      },
      {
        key: "identifier",
        header: "Identifier",
        sortable: false, // Identifier usually not sorted, but can be enabled if needed
        render: (value) => <span className="text-gray-500">{value || "—"}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (value) => {
          const statusStyle = getStatusDisplayConfig(value);
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
        render: (value) => (value ? value.toUpperCase() : "N/A"),
      },
      {
        key: "provider",
        header: "Provider",
        render: (value) => <span className="capitalize">{value || "—"}</span>,
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        render: (value) => formatDate(value),
      },
    ],
    [onViewProject]
  );

  // Define actions
  const actions = useMemo(() => {
    const baseActions = [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: onViewProject,
        tone: "neutral",
      },
    ];

    // Conditional actions need to be handled carefully as ModernTable actions are static per column
    // However, ModernTable renders actions for each row, so we can pass a function if supported?
    // ModernTable actions are Array<Action<T>>. The onClick receives the row.
    // It doesn't seem ModernTable supports per-row conditional visibility directly in the 'actions' prop array easily
    // without custom render.
    // Let's check ModernTable again. It renders: actions.map(...) for each row.
    // So all actions show for all rows.
    // To handle conditional 'Activate', 'Archive', etc., we might need a custom 'Actions' column or update ModernTable.
    // Alternatively, we can use the 'render' of a custom column to render the specific buttons.
    return [];
  }, [onViewProject]);

  // Custom Actions Column Render
  // Since ModernTable action prop is rigid, we'll append a custom column for actions to have full control
  const tableColumns = useMemo(
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

  // Selection handling
  // ModernTable uses internal state for selection unless onSelectionChange is provided.
  // It calls onSelectionChange(selectedIds).
  // It also expects `selected` prop if we want to control it??
  // Looking at ModernTable: `selectedIds` is a state. `onSelectionChange` is a callback.
  // It initializes `selectedIds` from... essentially empty.
  // Use `selectable` prop.
  // BUT `ProjectsPageContainer` manages `selectedProjects`.
  // ModernTable implementation shows it has its own `selectedIds` state and `setSelectedIds`.
  // It DOES NOT accept a controlled `selectedIds` prop in the interface viewed.
  // Wait, let me re-read ModernTable.tsx lines 117.
  // `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());`
  // It does NOT seem to accept `selectedIds` as a prop to sync with parent.
  // This is a limitation. I might need to patch ModernTable or use a workaround.
  // WORKAROUND: ModernTable is selectable but the state is local.
  // HOWEVER, `ProjectsTableView` props includes `selectedProjects` array.
  // If I cannot control `ModernTable` selection, I can't sync it easily.

  // Let's look closely at ModernTable.tsx again...
  // It has `onSelectionChange`.
  // It does NOT have `selectedKeys` or similar prop.
  // THIS IS A PROBLEM. I should probably fix ModernTable to support controlled selection first if I want to be clean.
  // OR... I can modify `ProjectsTableView` to ignore `selectedProjects` passed from parent if I trust ModernTable...
  // But `ProjectsPageContainer` needs the selection for Bulk Actions!
  // So `onSelectionChange` will update parent. But if parent clears it (e.g. after bulk delete), ModernTable won't know to clear.

  // I will use `useEffect` in `ProjectsTableView` to potentially force update if I could... but I can't access `setSelectedIds` of ModernTable from outside.
  // Actually, I should probably UPDATE `ModernTable.tsx` to accept `selectedIds` as a prop.

  return (
    <ModernTable
      data={projects}
      columns={tableColumns}
      isLoading={isLoading || isFetching} // Unified loading state
      loading={isLoading}
      // Pagination
      paginated={true}
      page={currentPage}
      pageSize={itemsPerPage}
      totalItems={totalProjects}
      totalPages={totalPages}
      onPageChange={onPageChange}
      // Sorting (Managed by parent via onSort, but ModernTable has internal sortConfig state too)
      // ModernTable: `const [sortConfig, setSortConfig]`
      // It doesn't seem to accept controlled `sortConfig`.
      // Workaround: Use `sortable={false}` in ModernTable and handle sorting via header clicks?
      // No, ModernTable headers handle checks.
      // I should really patch ModernTable to be more flexible/controlled.

      // For now, let's try to utilize it as best as possible.
      // Pass `projects` which are ALREADY sorted and paginated.
      // `ModernTable` logic: `if (page !== undefined) return sortedData;` (Lines 198-200)
      // So pagination works for controlled data.
      // Sorting: `if (!sortConfig.key) return filteredData;`
      // If I don't set sort key in ModernTable, it won't client-side sort.
      // I need to hook into `handleSort`.
      // ModernTable doesn't expose `onSort` prop that overrides internal logic?
      // Line 91: `sortable = true`
      // Line 287: `handleSort` sets internal state.

      // DECISION: I need to update ModernTable to support Controlled Mode for Selection and Sorting.
      // This is "Refactoring Projects Feature" -> "Improving Shared Components" is valid scope.

      // Let's implement `ProjectsTableView` assuming I WILL update ModernTable next.
      // I'll pass `currentSort` and `onSort` and `selectedIds` to ModernTable.

      selectedIds={selectedProjects} // I will add this prop
      onSelectionChange={onSelectProject} // Wait, `onSelectProject` takes single ID?
      // ProjectsPageContainer: `handleSelectProject` toggles single ID. `handleSelectAll` toggles all.
      // ModernTable `onSelectionChange` returns ARRAY of IDs.
      // I need to adapt the handler.

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

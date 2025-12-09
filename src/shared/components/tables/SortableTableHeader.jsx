import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

/**
 * Reusable SortableTableHeader component
 *
 * @param {Object} props
 * @param {Array} props.columns - Array of column configurations
 * @param {Object} props.sortConfig - Current sort configuration { key, direction }
 * @param {function} props.onSort - Callback when sort changes
 * @param {string} props.className - Additional CSS classes
 */
const SortableTableHeader = ({
  columns = [],
  sortConfig = { key: null, direction: "asc" },
  onSort,
  className = "",
}) => {
  const handleSort = (columnKey) => {
    if (!columnKey) return;

    const newDirection =
      sortConfig.key === columnKey && sortConfig.direction === "asc" ? "desc" : "asc";

    onSort(columnKey, newDirection);
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  return (
    <thead className={`bg-gray-50 ${className}`}>
      <tr>
        {columns.map((column) => {
          const isSortable = column.sortable !== false;
          const isActive = sortConfig.key === column.key;

          return (
            <th
              key={column.key}
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ""} ${
                isSortable ? "cursor-pointer select-none hover:bg-gray-100" : ""
              } ${isActive ? "bg-gray-100" : ""}`}
              onClick={() => isSortable && handleSort(column.key)}
              onKeyDown={(e) => {
                if (isSortable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleSort(column.key);
                }
              }}
              tabIndex={isSortable ? 0 : -1}
              role={isSortable ? "button" : undefined}
              aria-sort={
                isActive ? (sortConfig.direction === "asc" ? "ascending" : "descending") : undefined
              }
            >
              <div className="flex items-center gap-2">
                <span>{column.label}</span>
                {isSortable && getSortIcon(column.key)}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default SortableTableHeader;

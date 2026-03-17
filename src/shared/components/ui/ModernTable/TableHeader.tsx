import { useMemo, type ChangeEvent } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";
import type { Column, SortConfig, TableRowBase } from "./types";
import type { TableStyleMap } from "./useTableStyles";

interface TableHeaderProps<T extends TableRowBase> {
  columns: Column<T>[];
  sortable: boolean;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  selectable: boolean;
  expandable: boolean;
  hasActions: boolean;
  paginatedData: T[];
  selectedIds: Set<string>;
  onSelectAll: (e: ChangeEvent<HTMLInputElement>) => void;
  styles: TableStyleMap;
}

function TableHeader<T extends TableRowBase>({
  columns,
  sortable,
  sortConfig,
  onSort,
  selectable,
  expandable,
  hasActions,
  paginatedData,
  selectedIds,
  onSelectAll,
  styles,
}: TableHeaderProps<T>) {
  const { isMobile } = useResponsive();

  const visibleColumns = useMemo(
    () => (isMobile ? columns.filter((c) => !c.hideOnMobile) : columns),
    [columns, isMobile]
  );

  return (
    <thead style={styles.thead}>
      <tr>
        {expandable && <th style={{ ...styles.th, width: "40px" }} />}
        {selectable && (
          <th style={{ ...styles.th, width: "40px" }}>
            <input
              type="checkbox"
              onChange={onSelectAll}
              checked={
                paginatedData.length > 0 &&
                paginatedData.every((row) => row.id && selectedIds.has(String(row.id)))
              }
              className="table-checkbox"
            />
          </th>
        )}
        {visibleColumns.map((column) => (
          <th
            key={column.key}
            style={{
              ...styles.th,
              position: "relative",
            }}
            onClick={() => onSort(column.key)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {column.header}
              {sortable && sortConfig.key === column.key && (
                <div>
                  {sortConfig.direction === "asc" ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </div>
              )}
            </div>
          </th>
        ))}
        {hasActions && <th style={styles.th}>Actions</th>}
      </tr>
    </thead>
  );
}

export default TableHeader;

import type { ReactNode } from "react";
import { Search, Filter, Download } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import ModernButton from "../ModernButton";
import type { BulkAction, TableRowBase } from "./types";
import type { TableStyleMap } from "./useTableStyles";

interface TableToolbarProps<T extends TableRowBase> {
  title: string;
  searchable: boolean;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchFocused: boolean;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  filterable: boolean;
  filterSlot: ReactNode | undefined;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  exportable: boolean;
  onExport: () => void;
  selectable: boolean;
  selectedIds: Set<string>;
  bulkActions: BulkAction<T>[];
  data: T[];
  styles: TableStyleMap;
}

function TableToolbar<T extends TableRowBase>({
  title,
  searchable,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  searchFocused: _searchFocused,
  onSearchFocus,
  onSearchBlur,
  filterable,
  filterSlot,
  isFilterOpen: _isFilterOpen,
  onFilterToggle,
  exportable,
  onExport,
  selectable,
  selectedIds,
  bulkActions,
  data,
  styles,
}: TableToolbarProps<T>) {
  const showToolbar =
    title || searchable || filterable || exportable || (selectable && selectedIds.size > 0);

  if (!showToolbar) return null;

  return (
    <div style={styles.header}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flex: 1,
        }}
      >
        {title && <h3 style={styles.title}>{title}</h3>}

        {searchable && (
          <div style={styles.searchContainer}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: designTokens.colors.neutral[400],
              }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              style={styles.searchInput}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {selectable && selectedIds.size > 0 && bulkActions.length > 0 && (
          <div className="flex gap-2">
            {bulkActions.map((action, idx) => (
              <ModernButton
                key={idx}
                variant={action.variant || "outline"}
                size="sm"
                onClick={() => {
                  const selectedRows = data.filter(
                    (row) => row.id && selectedIds.has(String(row.id))
                  );
                  action.onClick(Array.from(selectedIds), selectedRows);
                }}
              >
                {action.icon}
                {action.label} ({selectedIds.size})
              </ModernButton>
            ))}
          </div>
        )}

        {filterSlot && <div className="flex items-center">{filterSlot}</div>}

        {filterable && !filterSlot && (
          <ModernButton variant="outline" size="sm" onClick={onFilterToggle}>
            <Filter size={16} />
            Filter
          </ModernButton>
        )}

        {exportable && (
          <ModernButton variant="outline" size="sm" onClick={onExport}>
            <Download size={16} />
            Export
          </ModernButton>
        )}
      </div>
    </div>
  );
}

export default TableToolbar;

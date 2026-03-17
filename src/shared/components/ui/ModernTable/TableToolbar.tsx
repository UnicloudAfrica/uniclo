import type { ReactNode } from "react";
import { Search, Filter, Download } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { useResponsive } from "@/hooks/useResponsive";
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
  headerActions: ReactNode | undefined;
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
  headerActions,
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
  const { isMobile } = useResponsive();

  const showToolbar =
    title || searchable || filterable || exportable || (selectable && selectedIds.size > 0);

  if (!showToolbar) return null;

  return (
    <div
      style={{
        ...styles.header,
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
      }}
      className="table-toolbar"
    >
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "stretch" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "12px" : "16px",
          flex: 1,
        }}
        className="table-toolbar-left"
      >
        {title && <h3 style={styles.title}>{title}</h3>}

        {searchable && (
          <div style={styles.searchContainer} className="table-toolbar-search">
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

      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap" as const,
          justifyContent: isMobile ? "flex-start" : "flex-end",
        }}
        className="table-toolbar-right"
      >
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

        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}

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

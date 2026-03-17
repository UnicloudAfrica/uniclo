import { Fragment, useMemo, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { useResponsive } from "@/hooks/useResponsive";
import type { Action, Column, TableRowBase } from "./types";
import type { TableStyleMap } from "./useTableStyles";
import { getRowValue, formatCellValue, getActionToneStyles, getFontSize, getColor } from "./utils";

interface TableBodyProps<T extends TableRowBase> {
  paginatedData: T[];
  columns: Column<T>[];
  actions: Action<T>[];
  selectable: boolean;
  expandable: boolean;
  selectedIds: Set<string>;
  expandedRowIds: Set<string>;
  hoveredRow: number | null;
  currentPage: number;
  pageSize: number;
  enableAnimations: boolean;
  prefersReducedMotion: boolean;
  tableLoaded: boolean;
  emptyMessage: ReactNode;
  onRowClick?: (row: T) => void;
  onSelectRow: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onSetHoveredRow: (index: number | null) => void;
  renderExpandedRow?: (row: T) => ReactNode;
  styles: TableStyleMap;
}

function TableBody<T extends TableRowBase>({
  paginatedData,
  columns,
  actions,
  selectable,
  expandable,
  selectedIds,
  expandedRowIds,
  hoveredRow,
  currentPage,
  pageSize,
  enableAnimations,
  prefersReducedMotion,
  tableLoaded,
  emptyMessage,
  onRowClick,
  onSelectRow,
  onToggleExpand,
  onSetHoveredRow,
  renderExpandedRow,
  styles,
}: TableBodyProps<T>) {
  const { isMobile } = useResponsive();

  const visibleColumns = useMemo(
    () => (isMobile ? columns.filter((c) => !c.hideOnMobile) : columns),
    [columns, isMobile]
  );

  const totalColSpan =
    visibleColumns.length + (actions.length > 0 ? 1 : 0) + (selectable ? 1 : 0) + (expandable ? 1 : 0);

  if (paginatedData.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={totalColSpan} style={styles.emptyState}>
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {paginatedData.map((row, index) => {
        const isHovered = hoveredRow === index;
        const isSelected = row.id ? selectedIds.has(String(row.id)) : false;

        return (
          <Fragment key={row.id ?? index}>
            <tr
              style={{
                cursor: onRowClick ? "pointer" : "default",
                backgroundColor: isSelected
                  ? designTokens.colors.primary[50]
                  : isHovered
                    ? designTokens.colors.neutral[50]
                    : "transparent",
                transform: isHovered && onRowClick ? "translateX(4px)" : "translateX(0)",
                transition: prefersReducedMotion
                  ? "background-color 0.2s ease"
                  : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                borderLeft:
                  isHovered && onRowClick
                    ? `3px solid ${designTokens.colors.primary[400]}`
                    : "3px solid transparent",
              }}
              className={
                enableAnimations && !prefersReducedMotion && tableLoaded
                  ? "table-row stagger-item"
                  : ""
              }
              onClick={() => onRowClick && onRowClick(row)}
              onMouseEnter={() => onSetHoveredRow(index)}
              onMouseLeave={() => onSetHoveredRow(null)}
            >
              {expandable && (
                <td style={styles.td}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (row.id) onToggleExpand(String(row.id));
                    }}
                    style={{
                      padding: "4px",
                      borderRadius: designTokens.borderRadius.md,
                      color: getColor("neutral", 500),
                      backgroundColor: "transparent",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getColor("neutral", 100);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {row.id && expandedRowIds.has(String(row.id)) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                </td>
              )}
              {selectable && (
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (row.id) onSelectRow(String(row.id));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="table-checkbox"
                  />
                </td>
              )}
              {visibleColumns.map((column) => (
                <td key={column.key} style={styles.td}>
                  {(() => {
                    const cellValue = getRowValue(row, column.key);
                    if (!column.render) return formatCellValue(cellValue);
                    try {
                      return column.render(cellValue, row, index, currentPage, pageSize);
                    } catch {
                      return formatCellValue(cellValue);
                    }
                  })()}
                </td>
              ))}
              {actions.length > 0 && (
                <td style={styles.td} className="table-actions">
                  <div style={{ display: "flex", gap: "8px" }}>
                    {actions.map((action, actionIndex) => {
                      const tone = getActionToneStyles(action.tone);
                      return (
                        <button
                          key={actionIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          style={{
                            padding: "6px 10px",
                            border: `1px solid ${tone.border}`,
                            borderRadius: designTokens.borderRadius.main,
                            backgroundColor: tone.bg,
                            color: tone.color,
                            cursor: "pointer",
                            transition: prefersReducedMotion
                              ? "color 0.2s ease"
                              : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            transform: "scale(1)",
                            boxShadow: tone.shadow,
                            fontWeight: designTokens.typography.fontWeight.medium,
                            fontSize: getFontSize("sm"),
                          }}
                          className={
                            enableAnimations && !prefersReducedMotion ? "modern-button-action" : ""
                          }
                          onMouseEnter={(e) => {
                            if (!prefersReducedMotion) {
                              e.currentTarget.style.backgroundColor = tone.hoverBg;
                              e.currentTarget.style.border = `1px solid ${tone.hoverBorder}`;
                              e.currentTarget.style.transform = "scale(1.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!prefersReducedMotion) {
                              e.currentTarget.style.backgroundColor = tone.bg;
                              e.currentTarget.style.border = `1px solid ${tone.border}`;
                              e.currentTarget.style.transform = "scale(1)";
                            }
                          }}
                        >
                          {action.icon && action.icon}
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
            {expandable && row.id && expandedRowIds.has(String(row.id)) && renderExpandedRow && (
              <tr className="bg-gray-50/50">
                <td colSpan={totalColSpan} style={{ ...styles.td, padding: 0 }}>
                  <div className="p-4">{renderExpandedRow(row)}</div>
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </tbody>
  );
}

export default TableBody;

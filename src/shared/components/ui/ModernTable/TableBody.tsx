import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { useResponsive } from "@/hooks/useResponsive";
import type { Action, Column, TableRowBase } from "./types";
import type { TableStyleMap } from "./useTableStyles";
import { getRowValue, formatCellValue, getActionToneStyles, getColor } from "./utils";

/**
 * Render row-level actions as a single overflow menu (kebab) when there
 * are 2+ actions — avoids the "rainbow row of buttons" problem that
 * stacked tone-tinted inline buttons produced. A single action stays
 * inline so the common case ("View") doesn't require a click-through.
 */
function RowActionsMenu<T>({ actions, row }: { actions: Action<T>[]; row: T }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Floating-menu coords. The dropdown is rendered via a portal in
  // `document.body` and positioned with `position: fixed` so the
  // table's `overflow-x: auto` scroll container can't clip it.
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );

  // Reposition every time we open + on viewport changes. Right-anchor
  // the menu to the trigger button so it never sticks past the right
  // edge of the screen.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const MENU_WIDTH = 176; // matches the w-44 utility (44 × 4px)
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const top = rect.bottom + 4; // 4px gap below the trigger
      const left = Math.max(
        8,
        Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
      );
      setCoords({ top, left });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (actions.length === 0) return null;

  // Single action → render the existing tone-tinted inline button so the
  // most common case stays a one-click hop (the "rainbow" problem only
  // shows up when there are several visible at once).
  if (actions.length === 1) {
    const action = actions[0];
    const tone = getActionToneStyles(action.tone);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          action.onClick(row);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-90"
        style={{ color: tone.color, backgroundColor: tone.bg, borderColor: tone.border }}
      >
        {action.icon && <span className="inline-flex">{action.icon}</span>}
        {action.label}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        <MoreVertical size={16} />
      </button>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: 176,
                zIndex: 9999,
              }}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
              onClick={(e) => e.stopPropagation()}
            >
              {actions.map((action, idx) => {
                const tone = getActionToneStyles(action.tone);
                return (
                  <button
                    key={idx}
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      action.onClick(row);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-neutral-800"
                    style={{ color: tone.color }}
                  >
                    {action.icon && <span className="inline-flex">{action.icon}</span>}
                    <span className="truncate">{action.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

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
                  <RowActionsMenu actions={actions} row={row} />
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

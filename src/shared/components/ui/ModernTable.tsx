import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { designTokens } from "../../../styles/designTokens";
import ModernButton from "./ModernButton";
import { useAnimations, useReducedMotion } from "../../../hooks/useAnimations";
import { useResponsive } from "../../../hooks/useResponsive";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (value: any, row: T, index: number, page: number, pageSize: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
}

interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  tone?: "primary" | "danger" | "success" | "neutral";
}

interface BulkAction<T> {
  label: string;
  onClick: (selectedIds: string[], selectedRows: T[]) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  icon?: React.ReactNode;
}

interface ModernTableProps<T> {
  data?: T[];
  columns?: Column<T>[];
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  filterable?: boolean;
  exportable?: boolean;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: React.ReactNode;
  actions?: Action<T>[];
  bulkActions?: BulkAction<T>[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  filterSlot?: React.ReactNode;
  enableAnimations?: boolean;
  responsive?: boolean;
  className?: string;

  /**
   * Controlled pagination props
   */
  page?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;

  selectedIds?: string[];
  sortConfig?: { key: string | null; direction: "asc" | "desc" | null };
  onSort?: (key: string, direction: "asc" | "desc") => void;

  /**
   * Expandable rows props
   */
  expandable?: boolean;
  renderExpandedRow?: (row: T) => React.ReactNode;
}

const ModernTable = <T extends { id?: string | number | null }>({
  data = [],
  columns = [],
  title = "",
  searchable = true,
  searchPlaceholder = "Search...",
  searchKeys = [],
  filterable = true,
  exportable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
  loading = false,
  onRowClick,
  emptyMessage = "No data available",
  actions = [],
  bulkActions = [],
  selectable = false,
  onSelectionChange,
  // Controlled props
  selectedIds: controlledSelectedIds,
  sortConfig: controlledSortConfig,
  onSort,

  filterSlot,
  enableAnimations = true,
  responsive = true,
  className = "",
  // Controlled pagination
  page,
  totalPages: controlledTotalPages,
  totalItems: controlledTotalItems,
  onPageChange,
  expandable = false,
  renderExpandedRow,
}: ModernTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [internalSortConfig, setInternalSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });
  const [internalPage, setInternalPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());

  // Use controlled state if provided
  const sortConfig = controlledSortConfig || internalSortConfig;
  const selectedIds = useMemo(
    () => (controlledSelectedIds ? new Set(controlledSelectedIds) : internalSelectedIds),
    [controlledSelectedIds, internalSelectedIds]
  );

  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Use controlled page if provided, otherwise internal state
  const currentPage = page !== undefined ? page : internalPage;

  // Animation hooks
  const { useInView, useLoadingAnimation } = useAnimations();
  const [tableRef, isInView] = useInView(0.1);
  const prefersReducedMotion = useReducedMotion();

  // Responsive hooks
  const { isMobile } = useResponsive();

  // State for animations
  const [tableLoaded, setTableLoaded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Helper for fontSize
  const getFontSize = (key: keyof typeof designTokens.typography.fontSize) => {
    const value = designTokens.typography.fontSize[key];
    return value[0] as string;
  };

  // Helper for colors to avoid type issues
  const getColor = (color: string, shade: number | string) => {
    return (designTokens.colors as any)[color][shade];
  };

  // Filter and search data
  const filteredData = useMemo(() => {
    // If we are using controlled pagination (server-side), we typically assume data is already filtered/searched
    // unless this is a hybrid approach. For now, if page is provided, we assume data passed IS the data to show.
    // However, the original ModernTable filtered client-side.
    // Let's keep client-side filtering active unless disabled by props, but if 'page' is controlled,
    // we often expect 'data' to be just the current page's data.
    // TO KEEP COMPATIBILITY: If 'page' is set, we assume 'data' is the slice for that page, so we normally shouldn't filter it further
    // But if 'searchable' is true and used, maybe we do?
    // Let's stick to: if 'page' is set, 'data' is what we render (but we still support sort/filter if user desires).

    const sourceData = Array.isArray(data)
      ? data.filter((item) => item !== null && item !== undefined)
      : [];
    if (!searchQuery) return sourceData;

    const lowerQuery = searchQuery.toLowerCase();
    return sourceData.filter((row: any) => {
      // Use searchKeys if provided, otherwise search all columns
      const keysToSearch = searchKeys.length > 0 ? searchKeys : columns.map((c) => c.key);

      return keysToSearch.some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }, [data, columns, searchQuery, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    // If controlled sort is provided, data might already be sorted, but let's client-side sort if it's not paginated/server-side
    // Usually if onSort is provided, we expect data to update.
    // But for hybrid, let's keep sorting.

    return [...filteredData].sort((a: any, b: any) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    // If controlled page is provided, we assume 'data' is ALREADY the slice for the current page
    if (page !== undefined) {
      return sortedData; // Don't slice again
    }

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, paginated, page]);

  // Calculate total pages and items
  const totalPages =
    controlledTotalPages !== undefined
      ? controlledTotalPages
      : Math.ceil(sortedData.length / pageSize);

  // If controlled, we use the controlled totalItems. If not, we use the full dataset length (sortedData.length)
  // BUT: if we are controlled, 'sortedData' might only be the current page.
  // So 'totalItems' should be used for display if provided.
  const displayTotalStats = () => {
    if (controlledTotalItems !== undefined) {
      return {
        from: (currentPage - 1) * pageSize + 1,
        to: Math.min(currentPage * pageSize, controlledTotalItems),
        total: controlledTotalItems,
      };
    }
    // Client side
    return {
      from: (currentPage - 1) * pageSize + 1,
      to: Math.min(currentPage * pageSize, sortedData.length),
      total: sortedData.length,
    };
  };

  const paginationStats = displayTotalStats();

  const getActionToneStyles = (tone: "primary" | "danger" | "success" | "neutral" = "neutral") => {
    const { neutral, primary, error, success } = designTokens.colors;
    const tones = {
      primary: {
        color: primary[700],
        bg: primary[50],
        border: primary[200],
        hoverBg: primary[100],
        hoverBorder: primary[300],
        shadow: "0 6px 14px -10px rgba(40, 141, 209, 0.45)",
      },
      danger: {
        color: error[700],
        bg: error[50],
        border: error[200],
        hoverBg: error[100],
        hoverBorder: (error as any)[300],
        shadow: "0 6px 14px -10px rgba(239, 68, 68, 0.45)",
      },
      success: {
        color: success[700],
        bg: success[50],
        border: success[200],
        hoverBg: success[100],
        hoverBorder: (success as any)[300],
        shadow: "0 6px 14px -10px rgba(34, 197, 94, 0.45)",
      },
      neutral: {
        color: neutral[700],
        bg: neutral[50],
        border: neutral[200],
        hoverBg: neutral[100],
        hoverBorder: neutral[300],
        shadow: "0 4px 10px -8px rgba(15, 23, 42, 0.25)",
      },
    };
    return tones[tone] || tones.neutral;
  };

  // Effect for table load animation
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setTableLoaded(true), 100);
      return () => clearTimeout(timer);
    }
    setTableLoaded(false);
  }, [loading, paginatedData.length]);

  // Reset row hover on page change
  useEffect(() => {
    setHoveredRow(null);
  }, [currentPage]);

  const handleSort = (key: string) => {
    if (!sortable) return;

    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";

    if (onSort) {
      onSort(key, direction);
    } else {
      setInternalSortConfig({ key, direction });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newSelected = new Set<string>();
    if (e.target.checked) {
      const allIds = paginatedData.map((row) => String(row.id));
      newSelected = new Set(allIds);
    }

    if (controlledSelectedIds && onSelectionChange) {
      onSelectionChange(Array.from(newSelected));
    } else {
      setInternalSelectedIds(newSelected);
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelected));
      }
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }

    if (controlledSelectedIds && onSelectionChange) {
      onSelectionChange(Array.from(newSelected));
    } else {
      setInternalSelectedIds(newSelected);
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelected));
      }
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRowIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRowIds(newExpanded);
  };

  const handleExport = () => {
    // Basic CSV export functionality
    const csvContent = [
      columns.map((col) => col.header).join(","),
      ...sortedData.map((row: any) => columns.map((col) => row[col.key] || "").join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "data"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tableStyles = {
    container: {
      backgroundColor: designTokens.colors.neutral[0],
      borderRadius: designTokens.borderRadius.xl,
      overflow: "hidden",
      opacity: !enableAnimations || tableLoaded || isInView ? 1 : 0,
      transform:
        !enableAnimations || tableLoaded || isInView ? "translateY(0)" : "translateY(20px)",
      transition: prefersReducedMotion ? "none" : "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    header: {
      padding: "20px 24px",
      borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap" as const,
      gap: "16px",
    },
    title: {
      fontSize: getFontSize("lg"),
      fontWeight: designTokens.typography.fontWeight.semibold,
      color: getColor("neutral", 900),
      margin: 0,
    },
    searchContainer: {
      position: "relative" as const,
      flex: 1,
      maxWidth: "300px",
    },
    searchInput: {
      width: "100%",
      height: "40px",
      paddingLeft: "40px",
      paddingRight: "16px",
      border: `1px solid ${searchFocused ? getColor("primary", 300) : getColor("neutral", 300)}`,
      borderRadius: designTokens.borderRadius.lg,
      backgroundColor: searchFocused ? getColor("neutral", 0) : getColor("neutral", 50),
      fontSize: getFontSize("sm"),
      outline: "none",
      transition: prefersReducedMotion ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      fontFamily: designTokens.typography.fontFamily.sans.join(", "),
      transform: searchFocused ? "translateY(-1px)" : "translateY(0)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
    },
    thead: {
      backgroundColor: getColor("neutral", 50),
    },
    th: {
      padding: "12px 16px",
      textAlign: "left" as const,
      fontSize: getFontSize("xs"),
      fontWeight: designTokens.typography.fontWeight.medium,
      color: getColor("neutral", 600),
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      borderBottom: `1px solid ${getColor("neutral", 200)}`,
      cursor: sortable ? "pointer" : "default",
      transition: prefersReducedMotion ? "none" : "all 0.2s ease",
    },
    td: {
      padding: "16px",
      fontSize: getFontSize("sm"),
      color: getColor("neutral", 900),
      borderBottom: `1px solid ${getColor("neutral", 100)}`,
      transition: prefersReducedMotion ? "none" : "all 0.2s ease",
    },
    emptyState: {
      padding: "48px 24px",
      textAlign: "center" as const,
      color: getColor("neutral", 500),
      fontSize: getFontSize("sm"),
    },
    pagination: {
      padding: "16px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: `1px solid ${getColor("neutral", 200)}`,
      backgroundColor: getColor("neutral", 50), // Fixed from 25
    },
    loadingOverlay: {
      position: "absolute" as const,
      inset: 0,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
  };

  if (loading) {
    return (
      <div
        style={{
          ...tableStyles.container,
          position: "relative",
          minHeight: "200px",
        }}
        className={className}
      >
        <div style={tableStyles.loadingOverlay}>
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
            style={{ borderColor: designTokens.colors.primary[500] }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={tableRef as any}
      style={tableStyles.container}
      className={`shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      {(title ||
        searchable ||
        filterable ||
        exportable ||
        (selectable && selectedIds.size > 0)) && (
        <div style={tableStyles.header}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flex: 1,
            }}
          >
            {title && <h3 style={tableStyles.title}>{title}</h3>}

            {searchable && (
              <div style={tableStyles.searchContainer}>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={tableStyles.searchInput}
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
                    variant={action.variant || "secondary"}
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
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={16} />
                Filter
              </ModernButton>
            )}

            {exportable && (
              <ModernButton variant="outline" size="sm" onClick={handleExport}>
                <Download size={16} />
                Export
              </ModernButton>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyles.table}>
          <thead style={tableStyles.thead}>
            <tr>
              {expandable && <th style={{ ...tableStyles.th, width: "40px" }} />}
              {selectable && (
                <th style={{ ...tableStyles.th, width: "40px" }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every((row) => row.id && selectedIds.has(String(row.id)))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    ...tableStyles.th,
                    position: "relative",
                  }}
                  onClick={() => handleSort(column.key)}
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
              {actions.length > 0 && <th style={tableStyles.th}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const isHovered = hoveredRow === index;
                const isSelected = row.id ? selectedIds.has(String(row.id)) : false;

                return (
                  <React.Fragment key={row.id || index}>
                    <tr
                      key={row.id || index}
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
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {expandable && (
                        <td style={tableStyles.td}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (row.id) toggleRowExpansion(String(row.id));
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500"
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
                        <td style={tableStyles.td}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (row.id) handleSelectRow(String(row.id));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} style={tableStyles.td}>
                          {(() => {
                            const cellValue = (row as any)[column.key];
                            if (!column.render) return cellValue;
                            try {
                              return column.render(cellValue, row, index, currentPage, pageSize);
                            } catch (error) {
                              console.error("ModernTable cell render error", {
                                column: column.key,
                                row,
                                error,
                              });
                              return cellValue ?? "";
                            }
                          })()}
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td style={tableStyles.td}>
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
                                    fontSize: designTokens.typography.fontSize.sm[0] as any,
                                  }}
                                  className={
                                    enableAnimations && !prefersReducedMotion
                                      ? "modern-button-action"
                                      : ""
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
                    {expandable &&
                      row.id &&
                      expandedRowIds.has(String(row.id)) &&
                      renderExpandedRow && (
                        <tr className="bg-gray-50/50">
                          <td
                            colSpan={
                              columns.length +
                              (actions.length > 0 ? 1 : 0) +
                              (selectable ? 1 : 0) +
                              (expandable ? 1 : 0)
                            }
                            style={{ ...tableStyles.td, padding: 0 }}
                          >
                            <div className="p-4">{renderExpandedRow(row)}</div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (actions.length > 0 ? 1 : 0) +
                    (selectable ? 1 : 0) +
                    (expandable ? 1 : 0)
                  }
                  style={tableStyles.emptyState}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <div style={tableStyles.pagination}>
          <div
            style={{
              fontSize: designTokens.typography.fontSize.sm[0] as any,
              color: designTokens.colors.neutral[600],
            }}
          >
            Showing {paginationStats.from} to {paginationStats.to} of {paginationStats.total}{" "}
            entries
          </div>

          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <button
              onClick={() => {
                const newPage = 1;
                onPageChange ? onPageChange(newPage) : setInternalPage(newPage);
              }}
              disabled={currentPage === 1}
              style={{
                padding: "8px",
                border: "none",
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: "transparent",
                color:
                  currentPage === 1
                    ? designTokens.colors.neutral[400]
                    : designTokens.colors.neutral[600],
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              onClick={() => {
                const newPage = Math.max(currentPage - 1, 1);
                onPageChange ? onPageChange(newPage) : setInternalPage(newPage);
              }}
              disabled={currentPage === 1}
              style={{
                padding: "8px",
                border: "none",
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: "transparent",
                color:
                  currentPage === 1
                    ? designTokens.colors.neutral[400]
                    : designTokens.colors.neutral[600],
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <span
              style={{
                padding: "8px 12px",
                fontSize: designTokens.typography.fontSize.sm[0] as any,
                color: designTokens.colors.neutral[700],
              }}
            >
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => {
                const newPage = Math.min(currentPage + 1, totalPages);
                onPageChange ? onPageChange(newPage) : setInternalPage(newPage);
              }}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px",
                border: "none",
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: "transparent",
                color:
                  currentPage === totalPages
                    ? designTokens.colors.neutral[400]
                    : designTokens.colors.neutral[600],
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => {
                const newPage = totalPages;
                onPageChange ? onPageChange(newPage) : setInternalPage(newPage);
              }}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px",
                border: "none",
                borderRadius: designTokens.borderRadius.md,
                backgroundColor: "transparent",
                color:
                  currentPage === totalPages
                    ? designTokens.colors.neutral[400]
                    : designTokens.colors.neutral[600],
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernTable;

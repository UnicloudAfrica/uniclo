import { useState, useMemo, useEffect, type ChangeEvent } from "react";
import { designTokens } from "@/styles/designTokens";
import { useAnimations, useReducedMotion } from "@/hooks/useAnimations";
import type { ModernTableProps, TableRowBase } from "./types";
import { getRowValue, exportToCsv } from "./utils";
import { useTableStyles } from "./useTableStyles";
import TableToolbar from "./TableToolbar";
import TableHeader from "./TableHeader";
import TableBody from "./TableBody";
import TablePagination from "./TablePagination";

const ModernTable = <T extends TableRowBase>({
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
  headerActions,
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
  // ── Internal state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [internalSortConfig, setInternalSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });
  const [internalPage, setInternalPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Controlled vs internal state
  const sortConfig = controlledSortConfig || internalSortConfig;
  const selectedIds = useMemo(
    () => (controlledSelectedIds ? new Set(controlledSelectedIds) : internalSelectedIds),
    [controlledSelectedIds, internalSelectedIds]
  );
  const currentPage = page !== undefined ? page : internalPage;

  // ── Animation hooks ─────────────────────────────────────────────────
  const { useInView } = useAnimations();
  const [tableRef, isInView] = useInView<HTMLDivElement>(0.1);
  const prefersReducedMotion = useReducedMotion();

  const [tableLoaded, setTableLoaded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // ── Styles ──────────────────────────────────────────────────────────
  const tableStyles = useTableStyles({
    searchFocused,
    sortable,
    enableAnimations,
    tableLoaded,
    isInView,
    prefersReducedMotion,
  });

  // ── Derived data (filter -> sort -> paginate) ───────────────────────
  const filteredData = useMemo(() => {
    const sourceData = Array.isArray(data)
      ? data.filter((item) => item !== null && item !== undefined)
      : [];
    if (!searchQuery) return sourceData;

    const lowerQuery = searchQuery.toLowerCase();
    return sourceData.filter((row: T) => {
      const keysToSearch = searchKeys.length > 0 ? searchKeys : columns.map((c) => c.key);
      return keysToSearch.some((key) => {
        const value = getRowValue(row, key);
        return value && String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }, [data, columns, searchQuery, searchKeys]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a: T, b: T) => {
      const aValue = getRowValue(a, sortConfig.key!);
      const bValue = getRowValue(b, sortConfig.key!);

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aText = String(aValue).toLowerCase();
      const bText = String(bValue).toLowerCase();

      if (aText < bText) return sortConfig.direction === "asc" ? -1 : 1;
      if (aText > bText) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    if (page !== undefined) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, paginated, page]);

  // ── Pagination stats ────────────────────────────────────────────────
  const totalPages =
    controlledTotalPages !== undefined
      ? controlledTotalPages
      : Math.ceil(sortedData.length / pageSize);

  const paginationStats = useMemo(() => {
    if (controlledTotalItems !== undefined) {
      return {
        from: (currentPage - 1) * pageSize + 1,
        to: Math.min(currentPage * pageSize, controlledTotalItems),
        total: controlledTotalItems,
      };
    }
    return {
      from: (currentPage - 1) * pageSize + 1,
      to: Math.min(currentPage * pageSize, sortedData.length),
      total: sortedData.length,
    };
  }, [currentPage, pageSize, controlledTotalItems, sortedData.length]);

  // ── Effects ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) {
      setTableLoaded(false);
      return undefined;
    }
    const timer = setTimeout(() => setTableLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [loading, paginatedData.length]);

  useEffect(() => {
    setHoveredRow(null);
  }, [currentPage]);

  // ── Event handlers ──────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (!sortable) return;
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    if (onSort) {
      onSort(key, direction);
    } else {
      setInternalSortConfig({ key, direction });
    }
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
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
    exportToCsv(title, columns, sortedData);
  };

  // ── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          ...tableStyles.container,
          position: "relative",
          minHeight: "200px",
        }}
        className={`${responsive ? "modern-table-responsive" : ""} ${className}`.trim()}
      >
        <div style={tableStyles.loadingOverlay}>
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
            style={{ borderColor: designTokens.colors.primary[500] }}
          />
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div ref={tableRef} style={tableStyles.container} className={`${responsive ? "modern-table-responsive" : ""} ${className}`.trim()}>
      <TableToolbar
        title={title}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchFocused={searchFocused}
        onSearchFocus={() => setSearchFocused(true)}
        onSearchBlur={() => setSearchFocused(false)}
        filterable={filterable}
        filterSlot={filterSlot}
        headerActions={headerActions}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        exportable={exportable}
        onExport={handleExport}
        selectable={selectable}
        selectedIds={selectedIds}
        bulkActions={bulkActions}
        data={data}
        styles={tableStyles}
      />

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyles.table}>
          <TableHeader
            columns={columns}
            sortable={sortable}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectable={selectable}
            expandable={expandable}
            hasActions={actions.length > 0}
            paginatedData={paginatedData}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            styles={tableStyles}
          />
          <TableBody
            paginatedData={paginatedData}
            columns={columns}
            actions={actions}
            selectable={selectable}
            expandable={expandable}
            selectedIds={selectedIds}
            expandedRowIds={expandedRowIds}
            hoveredRow={hoveredRow}
            currentPage={currentPage}
            pageSize={pageSize}
            enableAnimations={enableAnimations}
            prefersReducedMotion={prefersReducedMotion}
            tableLoaded={tableLoaded}
            emptyMessage={emptyMessage}
            onRowClick={onRowClick}
            onSelectRow={handleSelectRow}
            onToggleExpand={toggleRowExpansion}
            onSetHoveredRow={setHoveredRow}
            renderExpandedRow={renderExpandedRow}
            styles={tableStyles}
          />
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          paginationStats={paginationStats}
          onPageChange={onPageChange}
          onInternalPageChange={setInternalPage}
          styles={tableStyles}
        />
      )}
    </div>
  );
};

export default ModernTable;

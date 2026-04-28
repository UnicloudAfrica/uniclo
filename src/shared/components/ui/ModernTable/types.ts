import type { ReactNode, CSSProperties } from "react";

type BivariantCallback<Args extends unknown[], Return> = {
  bivarianceHack: (...args: Args) => Return;
}["bivarianceHack"];

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: BivariantCallback<[unknown, T, number, number, number], ReactNode>;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  hideOnMobile?: boolean;
}

export interface Action<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  tone?: "primary" | "danger" | "success" | "neutral";
}

export interface BulkAction<T> {
  label: string;
  onClick: (selectedIds: string[], selectedRows: T[]) => void;
  variant?: "primary" | "secondary" | "outline" | "outlineDanger" | "ghost" | "danger" | "success";
  icon?: ReactNode;
}

export interface ModernTableProps<T> {
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
  emptyMessage?: ReactNode;
  emptyState?: { title?: string; description?: string; icon?: ReactNode; action?: { label: string; onClick: () => void } };
  actions?: Action<T>[];
  bulkActions?: BulkAction<T>[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  filterSlot?: ReactNode;
  headerActions?: ReactNode;
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
  renderExpandedRow?: (row: T) => ReactNode;
}

export interface SortConfig {
  key: string | null;
  direction: "asc" | "desc" | null;
}

export interface PaginationStats {
  from: number;
  to: number;
  total: number;
}

export interface ActionToneStyles {
  color: string;
  bg: string;
  border: string;
  hoverBg: string;
  hoverBorder: string;
  shadow: string;
}

export type TableStyles = Record<string, CSSProperties>;

export type TableRowBase = { id?: string | number | null };

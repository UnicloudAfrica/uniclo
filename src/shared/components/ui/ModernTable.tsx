/**
 * ModernTable
 *
 * This file is a thin barrel re-export that keeps all existing import paths
 * working while the implementation lives in the ModernTable/ directory.
 */
export { default } from "./ModernTable/ModernTable";
export type { Column } from "./ModernTable/types";
export type {
  Action,
  BulkAction,
  ModernTableProps,
  SortConfig,
  PaginationStats,
  ActionToneStyles,
  TableRowBase,
} from "./ModernTable/types";

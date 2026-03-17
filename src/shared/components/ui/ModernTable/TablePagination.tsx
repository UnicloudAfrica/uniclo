import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { useResponsive } from "@/hooks/useResponsive";
import type { PaginationStats } from "./types";
import type { TableStyleMap } from "./useTableStyles";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  paginationStats: PaginationStats;
  onPageChange?: (page: number) => void;
  onInternalPageChange: (page: number) => void;
  styles: TableStyleMap;
}

function TablePagination({
  currentPage,
  totalPages,
  paginationStats,
  onPageChange,
  onInternalPageChange,
  styles,
}: TablePaginationProps) {
  const { isMobile } = useResponsive();

  const goToPage = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      onInternalPageChange(newPage);
    }
  };

  const navButtonStyle = (disabled: boolean) => ({
    padding: "8px",
    border: "none",
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: "transparent",
    color: disabled ? designTokens.colors.neutral[400] : designTokens.colors.neutral[600],
    cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <div style={styles.pagination} className="table-pagination">
      <div
        style={{
          fontSize: designTokens.typography.fontSize.sm[0],
          color: designTokens.colors.neutral[600],
          textAlign: isMobile ? "center" : undefined,
        }}
        className="table-pagination-stats"
      >
        Showing {paginationStats.from} to {paginationStats.to} of {paginationStats.total} entries
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          alignItems: "center",
          justifyContent: isMobile ? "center" : undefined,
        }}
        className="table-pagination-nav"
      >
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          style={navButtonStyle(currentPage === 1)}
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          onClick={() => goToPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          style={navButtonStyle(currentPage === 1)}
        >
          <ChevronLeft size={16} />
        </button>

        <span
          style={{
            padding: "8px 12px",
            fontSize: designTokens.typography.fontSize.sm[0],
            color: designTokens.colors.neutral[700],
          }}
        >
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={navButtonStyle(currentPage === totalPages)}
        >
          <ChevronRight size={16} />
        </button>

        <button
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          style={navButtonStyle(currentPage === totalPages)}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default TablePagination;

import { useMemo, type CSSProperties } from "react";
import { designTokens } from "@/styles/designTokens";
import { useResponsive } from "@/hooks/useResponsive";
import { getFontSize, getColor } from "./utils";

export interface TableStyleMap {
  container: CSSProperties;
  header: CSSProperties;
  title: CSSProperties;
  searchContainer: CSSProperties;
  searchInput: CSSProperties;
  table: CSSProperties;
  thead: CSSProperties;
  th: CSSProperties;
  td: CSSProperties;
  emptyState: CSSProperties;
  pagination: CSSProperties;
  loadingOverlay: CSSProperties;
}

interface UseTableStylesOptions {
  searchFocused: boolean;
  sortable: boolean;
  enableAnimations: boolean;
  tableLoaded: boolean;
  isInView: boolean;
  prefersReducedMotion: boolean;
}

export function useTableStyles({
  searchFocused,
  sortable,
  enableAnimations,
  tableLoaded,
  isInView,
  prefersReducedMotion,
}: UseTableStylesOptions): TableStyleMap {
  const { isMobile, isTablet } = useResponsive();

  return useMemo(
    () =>
      ({
        container: {
          backgroundColor: designTokens.colors.neutral[0],
          border: `1px solid ${designTokens.colors.neutral[200]}`,
          borderRadius: designTokens.borderRadius.xl,
          boxShadow: "var(--shadow-xs)",
          overflow: "hidden",
          opacity: !enableAnimations || tableLoaded || isInView ? 1 : 0,
          transform:
            !enableAnimations || tableLoaded || isInView ? "translateY(0)" : "translateY(20px)",
          transition: prefersReducedMotion ? "none" : "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        header: {
          padding: isMobile ? "12px 16px" : isTablet ? "16px 20px" : "20px 24px",
          borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap" as const,
          gap: isMobile ? "12px" : "16px",
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
          maxWidth: isMobile ? "100%" : "300px",
          minWidth: isMobile ? "100%" : undefined,
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
          padding: isMobile ? "8px 12px" : isTablet ? "10px 14px" : "12px 16px",
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
          padding: isMobile ? "10px 12px" : isTablet ? "12px 14px" : "16px",
          fontSize: getFontSize("sm"),
          color: getColor("neutral", 900),
          borderBottom: `1px solid ${getColor("neutral", 100)}`,
          transition: prefersReducedMotion ? "none" : "all 0.2s ease",
        },
        emptyState: {
          padding: isMobile ? "32px 16px" : "48px 24px",
          textAlign: "center" as const,
          color: getColor("neutral", 500),
          fontSize: getFontSize("sm"),
        },
        pagination: {
          padding: isMobile ? "12px 16px" : "16px 24px",
          display: "flex",
          flexDirection: (isMobile ? "column" : "row") as CSSProperties["flexDirection"],
          justifyContent: "space-between",
          alignItems: isMobile ? "center" : "center",
          gap: isMobile ? "12px" : "0",
          borderTop: `1px solid ${getColor("neutral", 200)}`,
          backgroundColor: getColor("neutral", 50),
        },
        loadingOverlay: {
          position: "absolute" as const,
          inset: 0,
          backgroundColor: "rgb(var(--theme-neutral-50) / 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        },
      }) satisfies TableStyleMap,
    [searchFocused, sortable, enableAnimations, tableLoaded, isInView, prefersReducedMotion, isMobile, isTablet]
  );
}

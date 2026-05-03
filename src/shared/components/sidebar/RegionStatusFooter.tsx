import React from "react";
import { CheckCircle } from "lucide-react";

/**
 * Sidebar footer that shows the current region, sovereignty marker, and
 * uptime SLA. Renders compactly when the sidebar is collapsed.
 *
 * Reference design: green dot · `NG-1 Lagos` · `Sovereign · 99.99% SLA`.
 */

export type RegionStatus = "operational" | "degraded" | "down";

export interface RegionStatusFooterProps {
  /** Region code (e.g. `NG-1`). */
  regionCode: string;
  /** Region label (e.g. `Lagos`, `Cape Town`). */
  regionLabel: string;
  /** Sub-label rendered below (e.g. `Sovereign · 99.99% SLA`). */
  detail?: string;
  status?: RegionStatus;
  /** Hide the labels and just show the dot (used when sidebar is collapsed). */
  collapsed?: boolean;
  className?: string;
}

const statusPalette: Record<RegionStatus, { dot: string; ring: string }> = {
  operational: {
    dot: "rgb(var(--theme-success-500))",
    ring: "rgba(34, 197, 94, 0.18)",
  },
  degraded: {
    dot: "rgb(var(--theme-warning-500))",
    ring: "rgba(245, 158, 11, 0.18)",
  },
  down: {
    dot: "rgb(var(--theme-danger-500))",
    ring: "rgba(239, 68, 68, 0.18)",
  },
};

const RegionStatusFooter: React.FC<RegionStatusFooterProps> = ({
  regionCode,
  regionLabel,
  detail,
  status = "operational",
  collapsed = false,
  className = "",
}) => {
  const palette = statusPalette[status];

  if (collapsed) {
    return (
      <div
        className={["flex items-center justify-center px-2 py-3", className].filter(Boolean).join(" ")}
        title={`${regionCode} ${regionLabel}${detail ? ` — ${detail}` : ""}`}
      >
        <span
          className="relative flex h-2.5 w-2.5"
          aria-label={`Region ${regionCode} ${status}`}
        >
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: palette.ring }}
          />
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: palette.dot }}
          />
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        "flex items-center gap-3 border-t px-3 py-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: "var(--theme-border-color)" }}
      role="status"
      aria-label={`Region ${regionCode} ${regionLabel} is ${status}`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ backgroundColor: palette.ring }}
        />
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: palette.dot }}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--theme-heading-color)]">
          <span>{regionCode}</span>
          <span className="text-[color:var(--theme-muted-color)]">{regionLabel}</span>
          {status === "operational" ? (
            <CheckCircle
              size={12}
              aria-hidden="true"
              style={{ color: palette.dot }}
            />
          ) : null}
        </div>
        {detail ? (
          <div className="truncate text-[11px] text-[color:var(--theme-muted-color)]">{detail}</div>
        ) : null}
      </div>
    </div>
  );
};

export default RegionStatusFooter;

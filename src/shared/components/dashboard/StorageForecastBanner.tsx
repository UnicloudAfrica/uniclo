import React from "react";
import { Zap, ArrowRight } from "lucide-react";

/**
 * Soft warning banner shown above the dashboard stats grid when a storage
 * resource is projected to exceed capacity within the alerting window.
 *
 * Variant tones map to UI severity:
 * - `info` (default): theme-color tinted, "FYI"
 * - `warning`: amber tint, "needs attention"
 * - `critical`: red tint, "urgent"
 */

export type ForecastTone = "info" | "warning" | "critical";

export interface StorageForecastBannerProps {
  /** Inline message — supports React nodes for code-formatted resource names. */
  message: React.ReactNode;
  /** Optional CTA on the right side. */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  tone?: ForecastTone;
  /** Custom leading icon (defaults to a lightning bolt for `info`). */
  icon?: React.ReactNode;
  /** Dismissable banner — calls this when the user closes the banner. */
  onDismiss?: () => void;
  className?: string;
}

const tonePalette: Record<ForecastTone, { bg: string; border: string; iconBg: string; iconFg: string; fg: string }> = {
  info: {
    bg: "rgba(10, 94, 62, 0.06)",
    border: "rgba(10, 94, 62, 0.18)",
    iconBg: "rgb(var(--theme-color-50))",
    iconFg: "var(--theme-color)",
    fg: "rgb(var(--theme-color-700))",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.25)",
    iconBg: "rgb(var(--theme-warning-100))",
    iconFg: "rgb(var(--theme-warning-700))",
    fg: "rgb(var(--theme-warning-800))",
  },
  critical: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.25)",
    iconBg: "rgb(var(--theme-danger-100))",
    iconFg: "rgb(var(--theme-danger-700))",
    fg: "rgb(var(--theme-danger-800))",
  },
};

const StorageForecastBanner: React.FC<StorageForecastBannerProps> = ({
  message,
  action,
  tone = "info",
  icon,
  onDismiss,
  className = "",
}) => {
  const palette = tonePalette[tone];

  return (
    <div
      role="status"
      className={[
        "flex flex-col items-start gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: palette.bg, borderColor: palette.border, color: palette.fg }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: palette.iconBg, color: palette.iconFg }}
        aria-hidden="true"
      >
        {icon ?? <Zap size={16} />}
      </span>

      <div className="flex-1 text-sm leading-relaxed">{message}</div>

      <div className="flex items-center gap-2">
        {action ? (
          action.onClick ? (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-black/5"
              style={{ color: palette.iconFg }}
            >
              {action.label}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          ) : (
            <a
              href={action.href}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-black/5"
              style={{ color: palette.iconFg }}
            >
              {action.label}
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          )
        ) : null}

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="rounded-lg p-1.5 text-sm opacity-60 transition hover:bg-black/5 hover:opacity-100"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default StorageForecastBanner;

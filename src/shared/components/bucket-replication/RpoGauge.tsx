import { memo } from "react";
import Gauge, { type GaugeTone } from "@/shared/components/ui/Gauge";
import type { BucketReplicationHealth } from "./types";

/**
 * G5: skeleton dimensions match the Gauge primitive's SIZE_PX exactly so
 * the layout doesn't shift when health resolves. Source of truth for
 * gauge sizing is Gauge.tsx — keep these synchronized.
 */
const SKELETON_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 64,
  md: 96,
  lg: 128,
};

export interface RpoGaugeProps {
  /**
   * Health snapshot. `null` = data not yet loaded (skeleton).
   * `undefined` allowed for forward-compat — treated as null.
   */
  health: BucketReplicationHealth | null | undefined;
  /**
   * G6: explicit error from the polling hook. When non-null, the gauge
   * renders an error state instead of an indefinite skeleton.
   */
  error?: Error | null | undefined;
  /** When true, the gauge renders the loading skeleton even with data. */
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  /** Hide the numeric label below the dial. Defaults to false. */
  hideLabel?: boolean;
  className?: string;
  /** Retry callback shown on error state. Optional — no button if omitted. */
  onRetry?: () => void;
}

/**
 * Visual RPO indicator with EC-39 catch-up handling.
 *
 * Maps the health snapshot to a 0-100% gauge based on the ratio of
 * actual RPO to the target. If the replication is in catch-up mode
 * (ingestion drained but not yet at steady-state), the gauge renders a
 * "CATCH-UP" badge in amber and SUPPRESSES the danger tone — operators
 * shouldn't get paged for expected post-pause behaviour.
 *
 * Tone thresholds (steady mode):
 *   - 0 ≤ ratio ≤ 1×   → success (green)
 *   - 1× < ratio ≤ 5×  → warning (amber)
 *   - ratio > 5×       → danger (red)
 *
 * Accessibility:
 *   - Gauge primitive owns the role="meter" + aria-valuenow/valuemin/valuemax
 *   - The catch-up badge is announced via its visible text
 *   - When health is null, the loading state is communicated via
 *     `aria-busy` on the wrapper
 */
const RpoGauge = memo(function RpoGauge({
  health,
  error,
  isLoading,
  size = "md",
  hideLabel = false,
  className = "",
  onRetry,
}: RpoGaugeProps) {
  const px = SKELETON_PX[size];

  // G6: error state takes precedence over null health. Prevents the
  // "infinite skeleton on a 500'd request" failure mode.
  if (error) {
    return (
      <div
        role="alert"
        className={`inline-flex flex-col items-center gap-1 ${className}`}
      >
        <div
          aria-hidden="true"
          className="rounded-full border-2 border-red-300 dark:border-red-700/60 flex items-center justify-center text-red-600 dark:text-red-400 text-xl"
          style={{ width: px, height: px }}
        >
          ⚠
        </div>
        {!hideLabel && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              Health unavailable
            </span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (health == null || isLoading) {
    // G5: skeleton dimensions exactly match Gauge SIZE_PX so the page
    // doesn't shift when health resolves.
    return (
      <div
        className={`inline-flex flex-col items-center gap-1 ${className}`}
        aria-busy="true"
        aria-label="RPO loading"
      >
        <div
          className="rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse"
          style={{ width: px, height: px }}
        />
        {!hideLabel && (
          <span className="h-3 w-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
        )}
      </div>
    );
  }

  const target = Math.max(1, health.rpo_target_seconds || 300);
  const actual = health.rpo_total_seconds ?? 0;
  const ratio = actual / target;

  // EC-39: catch-up mode suppresses danger tone but keeps a visible warning.
  const tone: GaugeTone =
    health.mode === "catchup"
      ? "warning"
      : ratio <= 1
        ? "success"
        : ratio <= 5
          ? "warning"
          : "danger";

  // Cap displayed value at 100% so the gauge fills cleanly even when
  // RPO is far over budget. The accompanying label still shows the
  // raw seconds so power users can see the actual lag.
  const displayPct = Math.min(100, Math.round(ratio * 100));
  const formatted = formatDuration(actual);
  const targetFormatted = formatDuration(target);

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <Gauge
        value={displayPct}
        size={size}
        tone={tone}
        label={`Replication RPO ${formatted} of target ${targetFormatted}`}
        displayValue={formatted}
      />
      {!hideLabel && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-mono tabular-nums">{formatted}</span>
          {health.mode === "catchup" && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 uppercase tracking-wider"
              role="status"
              aria-live="polite"
            >
              Catch-up
            </span>
          )}
          {health.mode !== "catchup" && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              of {targetFormatted}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Format a duration in seconds as a compact human-readable string.
 * Examples: 30s, 2m 15s, 1h 4m, 2d 3h.
 */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 1) return "<1s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

export default RpoGauge;

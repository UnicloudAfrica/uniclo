import { memo } from "react";
import ProgressBar from "@/shared/components/ui/ProgressBar";

export interface EgressMeterProps {
  /** Month-to-date egress spend in USD. `null` when not yet loaded. */
  monthToDateUsd: number | null | undefined;
  /** Configured cap. `null` = unlimited (kill-switch off). */
  capUsd: number | null | undefined;
  /** Optional override label. Default "Monthly egress (EC-40 kill-switch)". */
  label?: string;
  /**
   * Show the EC-40 explanation text below the bar. Defaults true on
   * detail pages, false in tight list rows. Set false in dense layouts.
   */
  showHelpText?: boolean;
  className?: string;
}

/**
 * Monthly egress spend meter with EC-40 auto-pause threshold colouring.
 *
 * Color stops:
 *   - 0-79%   → green (healthy)
 *   - 80-99%  → amber (approaching cap, alert ops)
 *   - ≥100%   → red + auto-pause notice (replication is paused upstream)
 *
 * When `capUsd` is null/undefined, the bar is hidden and a "no cap
 * configured" hint is shown — explicit so admins notice if their kill-
 * switch is missing.
 *
 * Accessibility:
 *   - ProgressBar primitive owns role="progressbar" + aria-valuenow
 *   - Cap-reached state is announced via role="alert" so screen readers
 *     pick up the auto-pause without polling
 */
const EgressMeter = memo(function EgressMeter({
  monthToDateUsd,
  capUsd,
  label = "Monthly egress (EC-40 kill-switch)",
  showHelpText = true,
  className = "",
}: EgressMeterProps) {
  if (capUsd == null) {
    return (
      <div className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        <p className="font-medium mb-0.5">{label}</p>
        <p>
          No cap configured.{" "}
          <span className="text-amber-700 dark:text-amber-300">
            Egress runs unbounded — set a monthly_egress_cap_usd to enable
            the auto-pause kill-switch.
          </span>
        </p>
      </div>
    );
  }

  const mtd = Math.max(0, monthToDateUsd ?? 0);
  const cap = Math.max(0.01, capUsd);
  const pct = Math.round((mtd / cap) * 100);
  const overLimit = pct >= 100;
  const tone =
    pct >= 100 ? "danger" : pct >= 80 ? "warning" : "success";

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span
          className="font-mono tabular-nums text-gray-600 dark:text-gray-400"
          aria-label={`Spent ${formatUsd(mtd)} of cap ${formatUsd(cap)} — ${pct} percent`}
        >
          {formatUsd(mtd)} / {formatUsd(cap)} · {pct}%
        </span>
      </div>
      <ProgressBar
        value={Math.min(100, pct)}
        tone={tone}
        label={`${label} — ${formatUsd(mtd)} of ${formatUsd(cap)}, ${pct} percent`}
      />
      {overLimit && (
        <p
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          Cap reached — replication auto-paused. Raise the cap or wait for
          next billing cycle (error_code: <code>egress_cap_reached</code>).
        </p>
      )}
      {!overLimit && pct >= 80 && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-amber-700 dark:text-amber-300"
        >
          Approaching cap — auto-pause triggers at 100%.
        </p>
      )}
      {showHelpText && pct < 80 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Auto-pauses replication when egress exceeds cap, preventing surprise bills.
        </p>
      )}
    </div>
  );
});

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default EgressMeter;

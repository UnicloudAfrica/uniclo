import { memo } from "react";
import type { EndpointValidationLockout } from "./types";

export interface ValidationLockoutBadgeProps {
  endpoint: EndpointValidationLockout;
  /**
   * Compact mode — single icon + count, suitable for table cells.
   * Default false (full inline badge with text).
   */
  compact?: boolean;
  className?: string;
}

/**
 * Surfaces SEC-AUDIT-BUCKET-5 validation lockout state next to a bucket
 * endpoint. Three rendering states:
 *
 *   1. Locked   — red 🔒 badge with the failure count + tooltip
 *   2. Failures — amber "N validation fail(s)" hint when 1-2 failures
 *                 (lockout fires at 3)
 *   3. Healthy  — renders nothing (no visual noise on the happy path)
 *
 * Accessibility:
 *   - role="status" + aria-live="polite" so the badge appears to a
 *     screen reader user without focus changes when the count updates
 *     after a validate attempt
 *   - Tooltip text mirrored in aria-label for keyboard / screen-reader
 *     users who can't hover
 *
 * Edge cases handled:
 *   - Backend not yet deployed with lockout columns → both fields
 *     undefined → renders nothing (no errors)
 *   - validation_locked_at present but consecutive_validation_failures
 *     missing → still renders LOCKED with count fallback to "?"
 */
const ValidationLockoutBadge = memo(function ValidationLockoutBadge({
  endpoint,
  compact = false,
  className = "",
}: ValidationLockoutBadgeProps) {
  const fails = endpoint.consecutive_validation_failures ?? 0;
  const isLocked = endpoint.validation_locked_at != null;

  // M2: always-present visually-hidden live region whose TEXT mutates
  // when state changes. Some screen readers don't announce nodes that
  // mount/unmount with role=status; mutation of always-present text
  // is reliable.
  const announcement = isLocked
    ? `Endpoint locked after ${fails || "unknown"} validation failures.`
    : fails > 0
      ? `${fails} validation failure${fails === 1 ? "" : "s"}, ${Math.max(0, 3 - fails)} until lockout.`
      : "";

  // Healthy state — no visible badge, but keep the empty live region
  // present so a screen-reader user gets the "lockout cleared"
  // announcement when state goes from "locked" → "no failures".
  if (!isLocked && fails === 0) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {announcement}
      </span>
    );
  }

  const lockedReason =
    endpoint.validation_locked_reason ??
    "Locked after 3 consecutive validation failures (SEC-AUDIT-BUCKET-5).";

  if (isLocked) {
    return (
      <>
        <span
          aria-hidden="true"
          title={lockedReason}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 w-fit ${className}`}
        >
          <span>🔒</span>
          {compact ? `${fails || "?"}` : `LOCKED · ${fails || "?"} fails`}
        </span>
        <span role="status" aria-live="polite" className="sr-only">
          {`${announcement} ${lockedReason}`}
        </span>
      </>
    );
  }

  return (
    <>
      <span
        aria-hidden="true"
        title="After 3 consecutive failures the endpoint will be locked."
        className={`inline-flex items-center text-[10px] text-amber-600 dark:text-amber-400 ${className}`}
      >
        {compact
          ? `${fails}/3`
          : `${fails} validation fail${fails === 1 ? "" : "s"}`}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
});

export default ValidationLockoutBadge;

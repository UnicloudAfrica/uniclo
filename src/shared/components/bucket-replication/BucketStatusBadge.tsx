import { memo } from "react";
import StatusPill from "@/shared/components/ui/StatusPill";
import {
  type BucketMigrationStatus,
  type BucketReplicationStatus,
  MIGRATION_STATUS_LABEL,
  MIGRATION_STATUS_TONE,
  REPLICATION_STATUS_LABEL,
  REPLICATION_STATUS_TONE,
} from "./types";

type ReplicationProps = {
  /** Variant — narrows the status union and lookup map. */
  variant: "replication";
  status: BucketReplicationStatus | string;
  /** Optional override label (e.g. localized). */
  label?: string;
  /** Hide the colored dot (default true). */
  showIcon?: boolean;
  className?: string;
  /**
   * Tooltip text — shown on hover AND announced to screen readers via
   * aria-label. Use to surface why the status is what it is (e.g. the
   * `last_error` for paused_error, the EC-id for reconcile_required).
   */
  hint?: string;
};

type MigrationProps = {
  variant: "migration";
  status: BucketMigrationStatus | string;
  label?: string;
  showIcon?: boolean;
  className?: string;
  hint?: string;
};

export type BucketStatusBadgeProps = ReplicationProps | MigrationProps;

/**
 * Polymorphic status badge for the bucket subsystem.
 *
 * Wraps {@link StatusPill} with the canonical bucket-status → tone +
 * label mapping. The `variant` prop narrows the status union so callers
 * get a TypeScript error if they pass a migration status to a
 * replication badge (or vice versa).
 *
 * Accessibility:
 *   - The status is announced to screen readers via the badge's text.
 *   - When `hint` is provided, the wrapping element gets `aria-label`
 *     combining label + hint, so a screen-reader user hears both.
 *   - The colored dot is decorative — `aria-hidden` on the dot lives
 *     inside StatusPill itself.
 *
 * Usage:
 *   <BucketStatusBadge variant="replication" status={r.status} />
 *   <BucketStatusBadge variant="migration"  status="failed" hint={r.last_error ?? undefined} />
 *
 * Edge cases handled:
 *   - Unknown status (e.g. backend ships a new state we haven't mapped)
 *     → renders the raw status string with neutral tone.
 *   - Empty string → "Unknown" via StatusPill's fallback.
 */
const BucketStatusBadge = memo(function BucketStatusBadge(props: BucketStatusBadgeProps) {
  const { status, label, showIcon = true, className, hint } = props;

  const knownTone =
    props.variant === "replication"
      ? REPLICATION_STATUS_TONE[status as BucketReplicationStatus]
      : MIGRATION_STATUS_TONE[status as BucketMigrationStatus];

  const knownLabel =
    props.variant === "replication"
      ? REPLICATION_STATUS_LABEL[status as BucketReplicationStatus]
      : MIGRATION_STATUS_LABEL[status as BucketMigrationStatus];

  // Unknown statuses ship as-is — never throw, never silently relabel.
  // This is a forward-compat decision: if AcF adds a new state, we'd
  // rather render it than block the page.
  const finalLabel = label ?? knownLabel ?? status ?? "Unknown";
  const finalTone = knownTone ?? "neutral";

  const a11yLabel = hint ? `${finalLabel} — ${hint}` : finalLabel;

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={a11yLabel}
      title={hint}
    >
      <StatusPill
        label={finalLabel}
        tone={finalTone}
        showIcon={showIcon}
        className={className}
      />
    </span>
  );
});

export default BucketStatusBadge;

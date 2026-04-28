/**
 * Type contracts for the bucket-replication component package.
 *
 * Mirror the AcF backend models — see
 * `api/app/Models/BucketReplication.php` for the source of truth.
 *
 * Keep these narrow + documented: any field a UI component reads MUST be
 * declared here so consumers can pass partial mocks in tests + Storybook
 * without having to fake the entire response payload.
 */

import type { StatusTone } from "@/shared/components/ui/StatusPill";

// ─────────────────────────────────────────────────────────────────────
// Replication
// ─────────────────────────────────────────────────────────────────────

/** Lifecycle states. Order matches the user-visible state machine. */
export const BUCKET_REPLICATION_STATUSES = [
  "draft",
  "active",
  "paused",
  "paused_error",
  "fencing",
  "draining",
  "promoted",
  "reconcile_required",
  "failed",
] as const;

export type BucketReplicationStatus = (typeof BUCKET_REPLICATION_STATUSES)[number];

/** Maps lifecycle status to a {@link StatusTone}. */
export const REPLICATION_STATUS_TONE: Record<BucketReplicationStatus, StatusTone> = {
  draft: "neutral",
  active: "success",
  paused: "warning",
  paused_error: "danger",
  fencing: "warning",
  draining: "warning",
  promoted: "info",
  reconcile_required: "warning",
  failed: "danger",
};

/** Human label per status. Sentence case so it composes with badges + tooltips. */
export const REPLICATION_STATUS_LABEL: Record<BucketReplicationStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  paused_error: "Paused (error)",
  fencing: "Fencing source",
  draining: "Draining queue",
  promoted: "Promoted",
  reconcile_required: "Reconcile required",
  failed: "Failed",
};

/** Statuses that count as "actively running" — the engine is doing work. */
export const ACTIVE_REPLICATION_STATUSES: ReadonlyArray<BucketReplicationStatus> = [
  "active",
  "fencing",
  "draining",
];

// ─────────────────────────────────────────────────────────────────────
// Migration
// ─────────────────────────────────────────────────────────────────────

export const BUCKET_MIGRATION_STATUSES = [
  "scheduled",
  "listing",
  "transferring",
  "verifying",
  "completed",
  "failed",
  "cancelled",
  "paused_auth_failure",
] as const;

export type BucketMigrationStatus = (typeof BUCKET_MIGRATION_STATUSES)[number];

export const MIGRATION_STATUS_TONE: Record<BucketMigrationStatus, StatusTone> = {
  scheduled: "neutral",
  listing: "info",
  transferring: "info",
  verifying: "info",
  completed: "success",
  failed: "danger",
  cancelled: "warning",
  paused_auth_failure: "danger",
};

export const MIGRATION_STATUS_LABEL: Record<BucketMigrationStatus, string> = {
  scheduled: "Scheduled",
  listing: "Listing",
  transferring: "Transferring",
  verifying: "Verifying",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  paused_auth_failure: "Paused — auth failure",
};

// ─────────────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────────────

export interface BucketReplicationHealth {
  rpo_total_seconds: number | null;
  ingestion_lag_seconds: number | null;
  apply_lag_seconds: number | null;
  /**
   * EC-39: when "catchup", RPO alerts are SUPPRESSED. UI should render
   * a distinct CATCH-UP badge so on-call doesn't try to firefight.
   */
  mode: "steady" | "catchup";
  queue_depth: number;
  bulk_queue_depth?: number;
  interactive_queue_depth?: number;
  egress_month_to_date_usd: number | null;
  egress_cap_usd: number | null;
  last_heartbeat_at: string | null;
  last_event_applied_at: string | null;
  rpo_target_seconds: number;
}

// ─────────────────────────────────────────────────────────────────────
// Endpoint validation lockout (SEC-AUDIT-BUCKET-5)
// ─────────────────────────────────────────────────────────────────────

export interface EndpointValidationLockout {
  consecutive_validation_failures?: number;
  validation_locked_at?: string | null;
  validation_locked_reason?: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// Resource types (Path B access grants)
// ─────────────────────────────────────────────────────────────────────

export const BUCKET_RESOURCE_TYPES = ["endpoint", "migration", "replication"] as const;
export type BucketResourceType = (typeof BUCKET_RESOURCE_TYPES)[number];

export const BUCKET_RESOURCE_PREFIX: Record<BucketResourceType, string> = {
  endpoint: "bke_",
  migration: "bmig_",
  replication: "brpl_",
};

/**
 * Validate a bucket identifier matches the prefix-shape AcF uses.
 * Mirrors the backend regex `^(bke|bmig|brpl)_[A-Za-z0-9]{20}$`.
 */
export function isValidBucketIdentifier(value: string, type?: BucketResourceType): boolean {
  if (!/^(bke|bmig|brpl)_[A-Za-z0-9]{20}$/.test(value)) return false;
  if (type) return value.startsWith(BUCKET_RESOURCE_PREFIX[type]);
  return true;
}

// ─────────────────────────────────────────────────────────────────────
// Failover wizard
// ─────────────────────────────────────────────────────────────────────

/**
 * EC-38 failover steps, ordered. Step 1 fences the source, step 2 waits
 * for the queue to drain, step 3 promotes the target irreversibly.
 */
export type FailoverStep = "fence" | "drain" | "promote";

export interface FailoverState {
  status: BucketReplicationStatus;
  queueDepth: number;
  targetBucketName: string;
}

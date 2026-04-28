/**
 * `@/shared/components/bucket-replication`
 *
 * Reusable, accessible components for the AnyCloudFlow bucket subsystem
 * UI surfaces. Built on top of the existing `@/shared/components/ui`
 * primitives (StatusPill, Gauge, ProgressBar, ModernModal, etc.) — these
 * components add the bucket-specific semantics (status mapping, EC-39
 * catch-up handling, EC-38 failover flow, EC-40 cap-reached behaviour,
 * SEC-AUDIT-BUCKET-5 lockout state).
 *
 * See `./README.md` for component matrix + usage examples.
 */
export { default as BucketStatusBadge } from "./BucketStatusBadge";
export type { BucketStatusBadgeProps } from "./BucketStatusBadge";

export { default as RpoGauge } from "./RpoGauge";
export type { RpoGaugeProps } from "./RpoGauge";

export { default as EgressMeter } from "./EgressMeter";
export type { EgressMeterProps } from "./EgressMeter";

export { default as ValidationLockoutBadge } from "./ValidationLockoutBadge";
export type { ValidationLockoutBadgeProps } from "./ValidationLockoutBadge";

export { default as FailoverWizard } from "./FailoverWizard";
export type { FailoverWizardProps } from "./FailoverWizard";

export { default as AccessGrantManager } from "./AccessGrantManager";
export type {
  AccessGrantManagerProps,
  AccessGrant,
  ClientOption,
} from "./AccessGrantManager";

export { useBucketHealthPolling } from "./useBucketHealthPolling";
export type { UseBucketHealthPollingOptions } from "./useBucketHealthPolling";

export { useBucketReplicationRealtime } from "./useBucketReplicationRealtime";
export type { UseBucketReplicationRealtimeOptions } from "./useBucketReplicationRealtime";

export {
  ACTIVE_REPLICATION_STATUSES,
  BUCKET_MIGRATION_STATUSES,
  BUCKET_REPLICATION_STATUSES,
  BUCKET_RESOURCE_PREFIX,
  BUCKET_RESOURCE_TYPES,
  isValidBucketIdentifier,
  MIGRATION_STATUS_LABEL,
  MIGRATION_STATUS_TONE,
  REPLICATION_STATUS_LABEL,
  REPLICATION_STATUS_TONE,
} from "./types";
export type {
  BucketMigrationStatus,
  BucketReplicationHealth,
  BucketReplicationStatus,
  BucketResourceType,
  EndpointValidationLockout,
  FailoverState,
  FailoverStep,
} from "./types";

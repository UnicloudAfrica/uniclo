/**
 * Barrel for AnyCloudFlow realtime UI drop-ins.
 *
 * These components are colocated here (rather than under
 * `shared/components/realtime/`) because they're AnyCloudFlow-specific and
 * depend on the AnyCloudFlow Echo singleton at `@/lib/acfEcho`. Any page
 * in UniCloud — admin, tenant, or client — can import from this module.
 *
 * Drop-in points:
 *   • AcfSyncProgressCard           — per-replication live progress
 *   • AcfActiveSyncsStrip           — grid of progress cards for active syncs
 *   • AcfFailoverStageIndicator     — vertical stepper for failover stages
 *   • AcfRealtimeStatus             — manual placement (e.g. ACF settings page)
 *   • AcfRealtimeStatusPortal       — self-mounting into the admin header
 */
export { default as AcfSyncProgressCard } from "./AcfSyncProgressCard";
export type {
  AcfSyncProgressCardProps,
  SyncProgressData,
} from "./AcfSyncProgressCard";

export { default as AcfActiveSyncsStrip } from "./AcfActiveSyncsStrip";

export { default as AcfFailoverStageIndicator } from "./AcfFailoverStageIndicator";
export type { AcfFailoverStageIndicatorProps } from "./AcfFailoverStageIndicator";

export { default as AcfRealtimeStatus } from "./AcfRealtimeStatus";
export type { AcfRealtimeStatusProps } from "./AcfRealtimeStatus";

export { default as AcfRealtimeStatusPortal } from "./AcfRealtimeStatusPortal";

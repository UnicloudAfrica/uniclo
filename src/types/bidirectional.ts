/**
 * Bidirectional Replication Types — Maps to AnyCloudFlow's bidirectional sync layer.
 *
 * UniCloud queries these from AnyCloudFlow via the integration driver;
 * these types define the API response shapes for the frontend.
 */

// ─── Enums ────────────────────────────────────────────────────────

export enum ReplicationMode {
  ActivePassive = "active_passive",
  BidirectionalSync = "bidirectional_sync",
}

export enum WorkloadProfile {
  StatelessApp = "stateless_app",
  FileContent = "file_content",
  DatabaseBacked = "database_backed",
  Mixed = "mixed",
}

export enum ConflictResolutionStrategy {
  LastWriteWins = "last_write_wins",
  NodeAPriority = "node_a_priority",
  NodeBPriority = "node_b_priority",
  Manual = "manual",
}

export enum ConflictStatus {
  Detected = "detected",
  AutoResolved = "auto_resolved",
  ManuallyResolved = "manually_resolved",
  Skipped = "skipped",
}

export enum QuorumState {
  Healthy = "healthy",
  Degraded = "degraded",
  Lost = "lost",
  Fenced = "fenced",
}

export enum TrafficPoolStatus {
  InRotation = "in_rotation",
  Draining = "draining",
  Removed = "removed",
  Standby = "standby",
}

// ─── API Response Types ──────────────────────────────────────────

export interface ReplicationConflict {
  id: string;
  replication_id: string;
  file_path: string;
  status: ConflictStatus;
  detected_at: string;
  resolved_at?: string;
  resolution_strategy?: string;
  winning_side?: "a" | "b";
  node_a_hash?: string;
  node_b_hash?: string;
  node_a_size?: number;
  node_b_size?: number;
}

export interface BidirectionalStatus {
  mode: ReplicationMode;
  workload_profile?: WorkloadProfile;
  quorum_state: QuorumState;
  witness_configured: boolean;
  conflict_resolution_strategy: ConflictResolutionStrategy;
  sync_direction: string;
  last_sync_at?: string;
  unresolved_conflict_count: number;
  degraded_at?: string;
  degradation_reason?: string;
  traffic_pool_status?: Record<string, TrafficPoolStatus>;
  local_pair?: {
    id: string;
    identifier: string;
    mode: ReplicationMode;
    quorum_state: QuorumState;
    witness_configured: boolean;
    degraded_at?: string;
    degradation_reason?: string;
    unresolved_conflict_count: number;
    traffic_pool_status?: Record<string, TrafficPoolStatus>;
  };
}

export interface QuorumStatus {
  state: QuorumState;
  witness_host?: string;
  lease_ttl_seconds?: number;
  node_a_lease_active: boolean;
  node_b_lease_active: boolean;
  last_check_at?: string;
  local_quorum_state?: QuorumState;
}

export interface TrafficStatus {
  node_a: TrafficPoolStatus;
  node_b: TrafficPoolStatus;
  driver: string;
  config?: Record<string, unknown>;
}

export interface SwitchModePayload {
  mode: ReplicationMode;
  workload_profile?: WorkloadProfile;
  include_paths?: string[];
}

export interface ResolveConflictPayload {
  winning_side: "a" | "b";
}

export interface ConfigureWitnessPayload {
  witness_host: string;
  witness_port?: number;
  lease_ttl_seconds?: number;
}

export interface ConfigureTrafficControlPayload {
  driver: "webhook" | "dns" | "cloudflare";
  config: Record<string, string>;
}

// ─── Helper Labels ──────────────────────────────────────────────

export const REPLICATION_MODE_LABELS: Record<ReplicationMode, string> = {
  [ReplicationMode.ActivePassive]: "Active-Passive",
  [ReplicationMode.BidirectionalSync]: "Bidirectional Sync",
};

export const WORKLOAD_PROFILE_LABELS: Record<WorkloadProfile, string> = {
  [WorkloadProfile.StatelessApp]: "Stateless Application",
  [WorkloadProfile.FileContent]: "File Content",
  [WorkloadProfile.DatabaseBacked]: "Database-Backed",
  [WorkloadProfile.Mixed]: "Mixed",
};

export const QUORUM_STATE_LABELS: Record<QuorumState, string> = {
  [QuorumState.Healthy]: "Healthy",
  [QuorumState.Degraded]: "Degraded",
  [QuorumState.Lost]: "Lost",
  [QuorumState.Fenced]: "Fenced",
};

export const QUORUM_STATE_COLORS: Record<QuorumState, string> = {
  [QuorumState.Healthy]: "green",
  [QuorumState.Degraded]: "yellow",
  [QuorumState.Lost]: "red",
  [QuorumState.Fenced]: "gray",
};

export const TRAFFIC_POOL_LABELS: Record<TrafficPoolStatus, string> = {
  [TrafficPoolStatus.InRotation]: "In Rotation",
  [TrafficPoolStatus.Draining]: "Draining",
  [TrafficPoolStatus.Removed]: "Removed",
  [TrafficPoolStatus.Standby]: "Standby",
};

export const CONFLICT_STATUS_LABELS: Record<ConflictStatus, string> = {
  [ConflictStatus.Detected]: "Detected",
  [ConflictStatus.AutoResolved]: "Auto-Resolved",
  [ConflictStatus.ManuallyResolved]: "Manually Resolved",
  [ConflictStatus.Skipped]: "Skipped",
};

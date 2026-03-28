export type ServerlessDrStatusType =
  | "draft"
  | "active"
  | "syncing"
  | "failover_started"
  | "booting_dr"
  | "applying_delta"
  | "verifying"
  | "dr_live"
  | "failback_started"
  | "completed"
  | "failed"
  | "paused";

export const SDR_STATUS_LABELS: Record<ServerlessDrStatusType, string> = {
  draft: "Draft",
  active: "Active",
  syncing: "Syncing",
  failover_started: "Failover Started",
  booting_dr: "Booting DR",
  applying_delta: "Applying Delta",
  verifying: "Verifying",
  dr_live: "DR Live",
  failback_started: "Failback Started",
  completed: "Completed",
  failed: "Failed",
  paused: "Paused",
};

export const SDR_STATUS_COLORS: Record<ServerlessDrStatusType, string> = {
  draft: "gray",
  active: "green",
  syncing: "blue",
  failover_started: "orange",
  booting_dr: "orange",
  applying_delta: "orange",
  verifying: "yellow",
  dr_live: "red",
  failback_started: "orange",
  completed: "green",
  failed: "red",
  paused: "gray",
};

export interface ServerlessDrVmMapping {
  id: number;
  source_endpoint: { id: number; identifier: string; ip_address: string; name: string } | null;
  target_endpoint: { id: number; identifier: string; ip_address: string; name: string } | null;
  tier: string | null;
  boot_order: number;
}

export interface ServerlessDrPolicy {
  identifier: string;
  name: string;
  description: string | null;
  status: ServerlessDrStatusType;
  status_label: string;
  replication_interval_minutes: number;
  rto_target_minutes: number | null;
  rpo_target_minutes: number | null;
  source_vm_count: number;
  target_vm_count: number;
  is_healthy: boolean;
  last_sync_at: string | null;
  total_syncs: number;
  total_bytes_transferred: number;
  vm_mappings: ServerlessDrVmMapping[] | null;
  syncs_count: number | null;
  failovers_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface ServerlessDrSync {
  id: number;
  status: string;
  bytes_transferred: number;
  duration_seconds: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface ServerlessDrFailover {
  id: number;
  identifier: string;
  type: "failover" | "failback" | "drill";
  status: string;
  boot_log: Record<string, unknown>[] | null;
  rto_actual_seconds: number | null;
  rpo_actual_seconds: number | null;
  error_message: string | null;
  initiated_by: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface ServerlessDrStatusResponse {
  identifier: string;
  status: ServerlessDrStatusType;
  status_label: string;
  is_healthy: boolean;
  source_vm_count: number;
  target_vm_count: number;
  last_sync_at: string | null;
  last_sync_bytes: number | null;
  sync_age_minutes: number | null;
  total_syncs: number;
  active_failover: {
    identifier: string;
    type: string;
    status: string;
    boot_log: Record<string, unknown>[] | null;
  } | null;
}

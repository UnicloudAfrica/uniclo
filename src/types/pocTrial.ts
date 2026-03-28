export interface PocTrialConfig {
  poc_trial_enabled: boolean;
  poc_trial_days: number | null;
  poc_trial_granted_at: string | null;
  poc_trial_expires_at: string | null;
  poc_trial_granted_by: number | null;
  overrides: PocOverride[];
  active_trials_count: number;
}

export interface PocOverride {
  id: number;
  tenant_id: string;
  product_type: string;
  trial_days: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PocTrial {
  id: number;
  uuid: string;
  tenant_id: string;
  tenant_name?: string;
  triable_type: string;
  triable_id: number;
  product_type: string;
  product_type_label: string;
  status: "active" | "converted" | "expired" | "cancelled";
  trial_days: number;
  trial_starts_at: string;
  trial_ends_at: string;
  converted_at: string | null;
  cancelled_at: string | null;
  days_remaining: number;
  resource_name?: string;
  resource_identifier?: string;
  metadata?: Record<string, unknown>;
  granted_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PocTrialRequest {
  id: number;
  uuid: string;
  tenant_id?: string;
  tenant_name?: string;
  product_type: string;
  product_type_label: string;
  trial_days: number;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  resource_description?: string;
  customer_tenant_id?: string;
  customer_tenant_name?: string;
  customer_user_id?: number;
  customer_user_name?: string;
  requested_by_name?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_notes?: string;
  poc_trial_id?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface TenantPocConfig {
  poc_trial_enabled: boolean;
  poc_trial_days: number | null;
  poc_trial_expires_at: string | null;
  overrides: PocOverride[];
  active_trials_count: number;
  pending_requests_count: number;
}

export interface PocStatistics {
  total_active: number;
  total_converted: number;
  total_expired: number;
  total_cancelled: number;
  by_product_type: Record<string, number>;
  expiring_this_week: number;
  tenants_with_poc: number;
  pending_requests: number;
}

export interface PocTrialFilters {
  status?: string;
  product_type?: string;
  tenant_id?: string;
  expiring_within_days?: number;
  per_page?: number;
  page?: number;
}

export const PRODUCT_TYPES = [
  { value: "instance", label: "Instance" },
  { value: "managed_database", label: "Lattice Database" },
  { value: "object_storage", label: "Object Storage" },
  { value: "volume", label: "Volume" },
  { value: "load_balancer", label: "Load Balancer" },
  { value: "backup_policy", label: "Backup Policy" },
] as const;

export const POC_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "converted", label: "Converted" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const POC_REQUEST_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

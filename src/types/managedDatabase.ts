/**
 * Managed Database Types — TypeScript definitions for VM-based managed database resources.
 */

// ─── Engine & Plan Config ──────────────────────────────────────

export type DatabaseEngine = "mongodb" | "postgresql" | "mysql" | "redis";
export type PlanSize = "micro" | "small" | "medium" | "large" | "xlarge";
export type DeploymentType = "dedicated";

export type DatabaseStatus =
  | "payment_pending"
  | "provisioning"
  | "active"
  | "paused"
  | "error"
  | "upgrading"
  | "deleting"
  | "terminated";

export interface EngineConfig {
  label: string;
  icon: string;
  description: string;
  versions: string[];
  default_version: string;
  supports_replication: boolean;
  supports_sharding: boolean;
  min_replicas: number;
  max_replicas: number;
}

export interface PlanConfig {
  label: string;
  vcpu: number;
  memory_mb: number;
  storage_gb: number;
}

// ─── Database Models ───────────────────────────────────────────

export interface ManagedDatabasePlan {
  id: number;
  name: string;
  engine: DatabaseEngine;
  plan_size: PlanSize;
  provider: string;
  region: string;
  vcpu: number;
  memory_mb: number;
  storage_gb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManagedDatabase {
  id: number;
  identifier: string;
  tenant_id: string | null;
  project_id: number | null;
  name: string;
  engine: DatabaseEngine;
  engine_version: string;
  provider: string;
  region: string;
  plan_size: PlanSize;
  managed_database_plan_id: number | null;
  storage_gb: number;
  memory_mb: number;
  vcpu_count: number;
  replica_count: number;
  deployment_type: DeploymentType;
  status: DatabaseStatus;
  provider_resource_id: string | null;
  connection_string: string | null;
  firewall_cidrs: string[];
  monthly_cost: number;
  provisioning_progress: ProvisioningStep[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;

  // VM infrastructure fields
  vm_instance_id?: string | null;
  vm_volume_id?: string | null;
  vm_security_group_id?: string | null;
  private_ip?: string | null;
  dns_record_name?: string | null;
  dns_record_id?: string | null;

  // DR fields
  dr_region?: string | null;
  dr_primary_id?: number | null;
  replication_config?: {
    role: "primary" | "replica";
    primary_ip?: string;
    replicas?: string[];
  } | null;

  // Relations (loaded conditionally)
  plan?: ManagedDatabasePlan;
  project?: { id: number; name: string; identifier: string };
  backups?: ManagedDatabaseBackup[];
}

export interface ProvisioningStep {
  id: string;
  label: string;
  status: "pending" | "completed" | "failed";
  context?: Record<string, unknown>;
}

export interface ManagedDatabaseBackup {
  id: number;
  managed_database_id: number;
  snapshot_id: string | null;
  type: "automated" | "manual";
  status: "in_progress" | "completed" | "failed";
  size_bytes: number | null;
  started_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connection_string?: string;
}

// ─── Metrics & Monitoring ─────────────────────────────────────

export type MetricType =
  | "query_stats"
  | "slow_queries"
  | "connections"
  | "replication_lag"
  | "disk_usage";

export interface DatabaseMetricSnapshot {
  latest: Record<string, unknown>;
  collected_at: string | null;
  history_count: number;
}

export interface DatabaseMetrics {
  query_stats?: DatabaseMetricSnapshot;
  slow_queries?: DatabaseMetricSnapshot;
  connections?: DatabaseMetricSnapshot;
  replication_lag?: DatabaseMetricSnapshot;
  disk_usage?: DatabaseMetricSnapshot;
}

export interface DatabaseMetricHistoryEntry {
  collected_at: string;
  data: Record<string, unknown>;
}

export interface AvailableUpgrades {
  engine: DatabaseEngine;
  current_version: string;
  available_versions: string[];
}

// ─── Pricing ───────────────────────────────────────────────────

export interface DatabasePricingLine {
  name: string;
  frequency: "recurring" | "one_time";
  unit_amount: number;
  currency: string;
  quantity: number;
  total: number;
  meta?: Record<string, unknown>;
}

export interface DatabaseQuoteResponse {
  lines: DatabasePricingLine[];
  pre_discount_subtotal: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  months: number;
  replica_count: number;
  monthly_cost: number;
  plan: {
    id: number;
    name: string;
    engine: DatabaseEngine;
    plan_size: PlanSize;
    vcpu: number;
    memory_mb: number;
    storage_gb: number;
  };
  discount_label?: string;
  discount_type?: "percent" | "fixed";
  discount_rate?: number;
}

// ─── API Responses ─────────────────────────────────────────────

export interface DatabaseOrderResponse {
  success: boolean;
  message?: string;
  data: {
    transaction: {
      id: number;
      identifier: string;
      status: string;
      type: string;
      amount: number;
      currency: string;
    };
    order: {
      id: number;
      total: number;
      currency: string;
      fast_track: boolean;
    };
    database: ManagedDatabase | null;
    fast_track_completed: boolean;
    pricing_breakdown: DatabaseQuoteResponse;
    payment?: {
      required: boolean;
      payment_gateway_options?: unknown[];
      status: string;
      saved_cards?: unknown[];
    };
  };
}

// ─── Form State ────────────────────────────────────────────────

export type CustomerContext = "tenant" | "user" | "unassigned";

export interface DatabaseFormState {
  engine: DatabaseEngine | "";
  engineVersion: string;
  planSize: PlanSize | "";
  region: string;
  availabilityZone: string;
  name: string;
  projectId: string | number | null;
  deploymentType: DeploymentType;
  replicaCount: number;
  /** AZ codes selected for each read replica */
  replicaAzs: string[];
  /** @deprecated Use replicaAzs */
  replicaRegions: string[];
  backupEnabled: boolean;
  drEnabled: boolean;
  firewallCidrs: string[];
  months: number;
  fastTrack: boolean;
  /** Billing country ISO code, defaulted from user profile */
  billingCountry: string;
  /** Customer context for order assignment */
  customerContext: CustomerContext;
  /** Selected tenant ID (admin only) */
  assignedTenantId: string | number | null;
  /** Selected client ID (admin/tenant only) */
  assignedClientId: string | number | null;
}

export const DEFAULT_DATABASE_FORM: DatabaseFormState = {
  engine: "",
  engineVersion: "",
  planSize: "",
  region: "",
  availabilityZone: "",
  name: "",
  projectId: null,
  deploymentType: "dedicated",
  replicaCount: 1,
  replicaAzs: [],
  replicaRegions: [],
  backupEnabled: true,
  drEnabled: false,
  firewallCidrs: ["0.0.0.0/0"],
  months: 1,
  fastTrack: false,
  billingCountry: "",
  customerContext: "tenant",
  assignedTenantId: null,
  assignedClientId: null,
};

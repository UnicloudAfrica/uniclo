/**
 * Managed Database Types — TypeScript definitions for VM-based managed database resources.
 */

// ─── Engine & Plan Config ──────────────────────────────────────

export type DatabaseEngine =
  // Relational
  | "postgresql" | "mysql" | "mariadb" | "cockroachdb" | "tidb" | "yugabytedb"
  // Time-series
  | "timescaledb" | "influxdb" | "questdb" | "victoriametrics" | "prometheus"
  // Document
  | "mongodb" | "couchdb" | "couchbase" | "arangodb" | "surrealdb" | "ferretdb" | "rethinkdb"
  // Key-Value / Cache
  | "redis" | "valkey" | "dragonflydb" | "keydb" | "memcached"
  // Wide-column
  | "cassandra" | "scylladb"
  // Search
  | "elasticsearch" | "opensearch" | "meilisearch"
  // Vector
  | "milvus" | "qdrant" | "weaviate" | "chromadb"
  // Graph
  | "neo4j" | "dgraph"
  // Messaging
  | "kafka" | "rabbitmq" | "nats"
  // Analytics / Infrastructure
  | "clickhouse" | "etcd" | "consul" | "minio" | "foundationdb"
  // Commercial free editions
  | "mssql_express" | "mssql_developer" | "oracle_xe" | "db2_community"
  // Licensed / BYOL
  | "mssql_standard" | "mssql_enterprise" | "oracle_enterprise";
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

export type EngineCategory =
  | "relational" | "timeseries" | "document" | "key_value" | "wide_column"
  | "search" | "vector" | "graph" | "messaging" | "analytics"
  | "infrastructure" | "object_storage";

export type EngineLicense = "open_source" | "free_edition" | "commercial";

export interface EngineConfig {
  label: string;
  icon: string;
  category?: EngineCategory;
  license?: EngineLicense;
  description: string;
  versions: string[];
  default_version: string;
  supports_replication: boolean;
  supports_sharding: boolean;
  min_replicas: number;
  max_replicas: number;
  requires_license_key?: boolean;
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
  /**
   * FR-031: which wholesale tier StaqDB bills against. `bundled` = StaqDB's
   * all-in price (VM + management). `management_only` = UniCloud provides
   * the VM separately and StaqDB charges only the management layer.
   */
  plan_kind?: "bundled" | "management_only";
  cloud_account_id?: number | null;
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
  operations?: ManagedDatabaseOperation[];
}

export interface ProvisioningStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "in_progress" | "completed" | "failed" | "warning";
  context?: Record<string, unknown>;
}

export interface ManagedDatabaseBackup {
  id: number;
  database_id: number;
  type: "automated" | "manual";
  status: "creating" | "available" | "restoring" | "deleting" | "deleted" | "error" | "in_progress" | "completed" | "failed";
  name: string | null;
  description: string | null;
  size_mb: number | null;
  engine: string | null;
  engine_version: string | null;
  snapshot_identifier: string | null;
  retention_days: number | null;
  restore_count: number;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  last_restored_at: string | null;
  error_message: string | null;
  is_restorable: boolean;
  created_at: string;
}

export type ManagedDatabaseOperationType = "credential_rotation";

export type ManagedDatabaseOperationStatus =
  | "pending"
  | "in_progress"
  | "verifying"
  | "completed"
  | "failed"
  | "needs_reconcile";

export interface ManagedDatabaseOperationProgressStep {
  id: string;
  label: string;
  status: ManagedDatabaseOperationStatus | "warning";
  updated_at?: string;
  context?: Record<string, unknown>;
}

export interface ManagedDatabaseOperation {
  id: string;
  identifier: string;
  managed_database_id: number;
  tenant_id: string | null;
  user_id: number | null;
  project_id: number | null;
  operation_type: ManagedDatabaseOperationType;
  status: ManagedDatabaseOperationStatus;
  progress_percent: number;
  payload: Record<string, unknown> | null;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  progress: ManagedDatabaseOperationProgressStep[] | null;
  retry_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
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

// ─── Cloud Accounts (BYOC) ────────────────────────────────────

export interface CloudAccountProvider {
  name: string;
  label: string;
  required_fields: string[];
  field_hints: Record<string, string>;
}

export interface CloudAccount {
  id: number;
  name: string;
  provider: string;
  provider_label: string;
  default_region: string | null;
  status: "unverified" | "active" | "error" | "suspended";
  status_message: string | null;
  verified_at: string | null;
  last_used_at: string | null;
  database_count: number;
  created_at: string;
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
  /**
   * Plan info from the resolver. `id` is now nullable because Option C
   * eliminated the local ManagedDatabasePlan catalog — plans come from
   * StaqDB live. wholesale/retail USD + price_source surface the
   * pricing composition for admin debugging + audit.
   *
   * `price_source` is `"staqdb"` when the live API answered, `"fallback"`
   * when local config was used (and a warning log was emitted server-side).
   */
  plan: {
    id: number | null;
    name: string;
    engine: DatabaseEngine;
    plan_size: PlanSize;
    vcpu: number;
    memory_mb: number;
    storage_gb: number;
    wholesale_usd?: number;
    retail_usd?: number;
    price_source?: "staqdb" | "fallback";
  };
  discount_label?: string;
  discount_type?: "percent" | "fixed";
  discount_rate?: number;
}

/**
 * One row from `GET /managed-databases/plans` (the resolver-backed catalog).
 *
 * `management_only_retail_usd` is non-null when StaqDB exposes a BYOC /
 * partner-supplied-VM price tier for that plan (StaqDB GAP-127). UniCloud
 * adopts this once StaqDB ships the management-only column — see UniCloud
 * `FR-031`.
 */
export interface ManagedDatabasePlanRow {
  engine: DatabaseEngine;
  plan_size: PlanSize;
  vcpu: number;
  memory_mb: number;
  storage_gb: number;
  wholesale_usd: number;
  retail_usd: number;
  management_only_wholesale_usd: number | null;
  management_only_retail_usd: number | null;
  source: "staqdb" | "fallback";
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
  /** Custom database name (empty = use system default "defaultdb") */
  dbName: string;
  /** Custom database username (empty = use system default "dbadmin") */
  dbUser: string;
  /** Custom database password (empty = auto-generated) */
  dbPassword: string;
  /** Whether to use system-generated defaults for credentials */
  useDefaultCredentials: boolean;
  /** Network access mode: public (Elastic IP) or private (VPC-only) */
  networkMode: "public" | "private";
  /** Built-in connection pooling on the same VM (free) */
  connectionPooling: boolean;
  /** TLS encryption for connections (free, enabled by default) */
  tlsEnabled: boolean;
  /** Dedicated proxy VM in front of the database (paid add-on) */
  dedicatedProxy: boolean;
  /** WireGuard VPN gateway for private encrypted access (paid add-on) */
  vpnGateway: boolean;
  /** End of fast-track date — after this date, user must pay to continue */
  fastTrackEndsAt: string;
  /** Member user IDs selected for the internal project */
  memberUserIds: number[];
  /** Assignment scope: internal (admins), tenant, or client */
  assignmentScope: "internal" | "tenant" | "client";
  /** License key for commercial BYOL engines */
  licenseKey: string;
  /** License acquisition method: 'byol' (bring your own) or 'purchase' (buy through us — coming soon) */
  licenseMode: "byol" | "purchase" | "";
  /** BYOC: Selected cloud account ID for customer-provisioned infrastructure */
  cloudAccountId: number | null;
  /**
   * FR-031: which wholesale tier StaqDB bills against. Empty string ("")
   * means "use the platform default" (typically `management_only`).
   * `bundled` = StaqDB charges all-in (VM + management). `management_only`
   * = UniCloud provisions the VM separately; StaqDB charges only management.
   */
  planKind: "" | "bundled" | "management_only";
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
  dbName: "",
  dbUser: "",
  dbPassword: "",
  useDefaultCredentials: true,
  networkMode: "public",
  connectionPooling: true,
  tlsEnabled: true,
  dedicatedProxy: false,
  vpnGateway: false,
  fastTrackEndsAt: "",
  memberUserIds: [],
  assignmentScope: "internal",
  licenseKey: "",
  licenseMode: "",
  cloudAccountId: null,
  planKind: "",
};

// ─── Database Backups ────────────────────────────────────────

export interface DatabaseBackupPolicy {
  backup_enabled: boolean;
  retention_days: number;
  preferred_window: string;
  total_backups: number;
  automated_backups: number;
  manual_snapshots: number;
  total_size_mb: number;
  latest_automated_at: string | null;
  latest_manual_at: string | null;
}

// ─── Database Users (Connection & Credentials) ──────────────

export type DatabaseUserRole = "admin" | "readwrite" | "readonly" | "replication";
export type DatabaseUserStatus = "active" | "suspended" | "deleted";

export interface DatabaseUser {
  id: number;
  database_id: number;
  username: string;
  role: DatabaseUserRole;
  status: DatabaseUserStatus;
  password_rotated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConnectionInfo {
  host: string;
  port: number;
  database: string;
  username: string;
  engine: string;
  ssl_enabled: boolean;
  network_mode: string;
  connection_strings: Record<string, string>;
}

export interface DatabasePoolingConfig {
  supported: boolean;
  pooler: string | null;
  enabled: boolean;
  pool_mode: string;
  pool_size: number;
  max_client_connections: number;
  idle_timeout: number;
  pooler_port: number | null;
}

export interface DatabaseSslCertificate {
  ssl_enabled: boolean;
  ca_certificate: string | null;
  expires_at: string | null;
  issued_at: string | null;
  issuer: string | null;
  subject: string | null;
  fingerprint: string | null;
}

// ─── Scaling & Replicas ─────────────────────────────────────

export type ReplicaStatus = "creating" | "available" | "syncing" | "error" | "deleting";
export type ParameterGroupStatus = "active" | "applying" | "pending-reboot";

export interface InstanceClass {
  name: string;
  label: string;
  vcpus: number;
  memory_mb: number;
  network_performance: string;
  storage_type: string;
  max_iops: number;
  price_per_hour: number;
  monthly_cost: number;
}

export interface DatabaseReplica {
  id: number;
  primary_database_id: number;
  database_id: number;
  database_name: string | null;
  region: string;
  status: ReplicaStatus;
  replication_lag_seconds: number | null;
  endpoint: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParameterGroup {
  id: number;
  name: string;
  engine: string;
  engine_version: string;
  description: string | null;
  parameters: Record<string, string | number | boolean>;
  is_default: boolean;
  database_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Alerts & Notifications ─────────────────────────────────

export type AlertMetric =
  | "cpu_percent"
  | "memory_percent"
  | "disk_percent"
  | "active_connections"
  | "replication_lag_seconds"
  | "query_latency_ms"
  | "iops_read"
  | "iops_write"
  | "network_in_bytes"
  | "network_out_bytes";

export type AlertOperator = "above" | "below" | "equal";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertEventStatus = "firing" | "acknowledged" | "resolved";
export type NotificationChannelType = "email" | "webhook" | "slack";

export interface AlertRule {
  id: number;
  database_id: number;
  name: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  duration_minutes: number;
  severity: AlertSeverity;
  notification_channels: number[];
  is_enabled: boolean;
  active_events_count: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertEvent {
  id: number;
  alert_rule_id: number;
  database_id: number;
  status: AlertEventStatus;
  severity: AlertSeverity;
  rule_name: string;
  metric: string;
  operator: string;
  threshold: number;
  metric_value: number;
  message: string;
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  notified_channels: number[];
  created_at: string;
}

export interface NotificationChannel {
  id: number;
  organization_id: number | null;
  name: string;
  type: NotificationChannelType;
  configuration: Record<string, unknown>;
  configuration_summary: Record<string, string> | null;
  is_enabled: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Billing & Metering ─────────────────────────────────────

export type MeteringDimension =
  | "compute_hours"
  | "storage_gb_hours"
  | "iops_read"
  | "iops_write"
  | "data_transfer_in_gb"
  | "data_transfer_out_gb"
  | "backup_storage_gb_hours"
  | "replica_compute_hours";

export interface UsageRecord {
  id: number;
  database_id: number;
  period_start: string;
  period_end: string;
  dimension: MeteringDimension;
  quantity: number;
  unit: string;
  unit_price: number;
  total_cost: number;
  instance_class: string | null;
  created_at: string;
}

export interface BillingSummary {
  id: number;
  organization_id: number;
  period_start: string;
  period_end: string;
  period_type: "daily" | "monthly";
  total_cost: number;
  compute_cost: number;
  storage_cost: number;
  io_cost: number;
  transfer_cost: number;
  backup_cost: number;
  replica_cost: number;
  database_count: number;
  currency: string;
}

export interface DatabaseCostEstimate {
  database_id: number;
  database_name: string;
  engine: string;
  instance_class: string | null;
  total_cost: number;
  projected_monthly_cost: number;
  days_elapsed: number;
  days_in_month: number;
  dimensions: Record<string, { quantity: number; total_cost: number; unit: string; record_count: number }>;
  daily_costs: Record<string, number>;
  currency: string;
}

export interface CurrentMonthEstimate {
  current_cost: number;
  projected_cost: number;
  daily_average: number;
  days_elapsed: number;
  days_remaining: number;
  days_in_month: number;
  period_start: string;
  period_end: string;
  currency: string;
  breakdown: Record<string, number>;
}

// ─── Webhooks & Events ──────────────────────────────────────

export interface WebhookEndpoint {
  id: number;
  url: string;
  description: string | null;
  events: string[];
  status: "active" | "paused" | "disabled";
  failure_count: number;
  last_delivery_at: string | null;
  last_failure_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: number;
  webhook_endpoint_id: number;
  event_type: string;
  event_id: string;
  payload: Record<string, unknown>;
  response_code: number | null;
  response_body: string | null;
  attempt: number;
  status: "pending" | "success" | "failed";
  delivered_at: string | null;
  next_retry_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface DatabaseEvent {
  id: string;
  type: string;
  database_id: number | null;
  organization_id: number | null;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

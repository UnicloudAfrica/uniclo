/**
 * useDatabaseProvisioningLogic — Orchestrates the database creation wizard flow.
 *
 * Follows the useClientProvisioningLogic pattern:
 * steps → form state → quote pricing → create order → payment → success.
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { isApiError } from "@/utils/apiError";
import {
  useDatabaseQuote,
  useCreateDatabaseOrder,
  useFetchAvailableEngines,
  useFetchAvailablePlans,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import { useFetchProjects } from "@/shared/hooks/resources";
import { useProjectMembershipSuggestions } from "@/shared/hooks/resources/projectHooks";
import { useFetchRegions, useFetchAvailabilityZones } from "@/shared/hooks/resources/regionHooks";
import { useFetchCountries } from "@/hooks/resource";
import { useCustomerContext } from "@/hooks/adminHooks/useCustomerContext";
import { useApiContext } from "@/hooks/useApiContext";
import { useFeatureFlags } from "@/hooks/featureFlagsHooks";
import useAuthStore from "@/stores/authStore";
import {
  normalizePaymentOptions,
  normalizeCountryCandidate,
  COUNTRY_FALLBACK,
} from "@/utils/instanceCreationUtils";
import { resolveCountryCodeFromEntity } from "@/hooks/objectStorageUtils";
import { sanitizeProviderLabel } from "@/utils/sanitizeProviderLabel";
import ToastUtils from "@/utils/toastUtil";
import type {
  DatabaseEngine,
  PlanSize,
  CustomerContext,
  DatabaseFormState,
  DatabaseQuoteResponse,
  DatabaseOrderResponse,
} from "@/types/managedDatabase";

// ─── Wizard Steps ──────────────────────────────────────────────────

export const DATABASE_WIZARD_STEPS = [
  { id: "engine", title: "Engine", desc: "Choose database engine" },
  { id: "configure", title: "Configure", desc: "Set plan, region & options" },
  { id: "review", title: "Review", desc: "Review pricing & confirm" },
  { id: "payment", title: "Payment", desc: "Complete payment" },
  { id: "success", title: "Done", desc: "Database created" },
] as const;

// ─── Engine Metadata (client-side fallback) ────────────────────────

/** Engine metadata shape used by the wizard. */
export interface EngineMetaEntry {
  label: string;
  category: string;
  license: string;
  description: string;
  versions: string[];
  defaultVersion: string;
  supportsReplication: boolean;
  supportsSharding: boolean;
  minReplicas: number;
  maxReplicas: number;
  requiresLicenseKey?: boolean;
  iconUrl?: string | null;
  port?: number;
  /**
   * Per-engine replication metadata mirrored from the BE engine
   * catalog (`config/managed_databases.engines.{engine}.replication`).
   * Drives the wizard's tier-aware copy + warnings. Optional during
   * the rollout — engines not yet migrated to the tier model leave
   * this undefined and the wizard falls back to the legacy
   * "Read Replicas" UX.
   */
  replication?: {
    tier:
      | "disk_backed"
      | "in_memory"
      | "native_distributed"
      | "consensus_kv"
      | "licensed"
      | null;
    pricing_dimension?: "storage_gb" | "memory_mb" | "node_count" | "pair_flat";
    backup_per_node?: boolean;
    native_mechanism?: string;
    topology?: Array<"active_passive" | "active_active">;
    cluster_minimum?: number;
    wan_sensitive?: boolean;
    recommended_odd?: boolean;
    same_region_only?: boolean;
    license_required?: boolean;
    caveats?: string[];
    unavailable_reason?: string;
  };
}

/**
 * Client-side engine fallback catalog. The wizard prefers server data from
 * useFetchAvailableEngines() but falls back to this when offline or loading.
 */
export const ENGINE_METADATA: Record<string, EngineMetaEntry> = {
  // ── Relational ──
  postgresql: { label: "PostgreSQL", category: "relational", license: "open_source", description: "Advanced relational database with full ACID compliance", versions: ["18", "17", "16", "15", "14"], defaultVersion: "17", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  mysql: { label: "MySQL", category: "relational", license: "open_source", description: "Popular relational database for web applications", versions: ["9.6", "8.4", "8.0"], defaultVersion: "8.4", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  mariadb: { label: "MariaDB", category: "relational", license: "open_source", description: "MySQL-compatible database with enhanced performance", versions: ["11.7", "11.6", "11.4", "10.11", "10.6"], defaultVersion: "11.4", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  cockroachdb: { label: "CockroachDB", category: "relational", license: "open_source", description: "Distributed SQL with automatic sharding and survivability", versions: ["24.3", "24.2", "24.1", "23.2", "23.1"], defaultVersion: "24.3", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  tidb: { label: "TiDB", category: "relational", license: "open_source", description: "MySQL-compatible distributed database with horizontal scaling", versions: ["8.5", "8.4", "8.1", "7.5", "7.1"], defaultVersion: "8.5", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  yugabytedb: { label: "YugabyteDB", category: "relational", license: "open_source", description: "PostgreSQL-compatible distributed database", versions: ["2.21", "2.20", "2.18"], defaultVersion: "2.21", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },

  // ── Time-Series ──
  timescaledb: { label: "TimescaleDB", category: "timeseries", license: "open_source", description: "PostgreSQL extension for time-series data at scale", versions: ["2.17", "2.16", "2.15"], defaultVersion: "2.17", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  influxdb: { label: "InfluxDB", category: "timeseries", license: "open_source", description: "Purpose-built time-series database for metrics and events", versions: ["2.7", "2.6"], defaultVersion: "2.7", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  questdb: { label: "QuestDB", category: "timeseries", license: "open_source", description: "High-performance time-series database with SQL support", versions: ["8.2", "8.1", "7.4"], defaultVersion: "8.2", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  victoriametrics: { label: "VictoriaMetrics", category: "timeseries", license: "open_source", description: "Fast and scalable monitoring and time-series database", versions: ["1.108", "1.106", "1.104", "1.102", "1.100"], defaultVersion: "1.108", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  prometheus: { label: "Prometheus", category: "timeseries", license: "open_source", description: "Monitoring system with built-in time-series database", versions: ["3.2", "3.1", "3.0", "2.55", "2.54"], defaultVersion: "3.2", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },

  // ── Document ──
  mongodb: { label: "MongoDB", category: "document", license: "open_source", description: "Document database for flexible schemas and horizontal scaling", versions: ["8.0", "7.0", "6.0"], defaultVersion: "8.0", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 7 },
  couchdb: { label: "CouchDB", category: "document", license: "open_source", description: "Document database with multi-master replication", versions: ["3.4", "3.3"], defaultVersion: "3.4", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  couchbase: { label: "Couchbase", category: "document", license: "open_source", description: "Distributed document database with integrated caching", versions: ["7.6", "7.2"], defaultVersion: "7.6", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  arangodb: { label: "ArangoDB", category: "document", license: "open_source", description: "Multi-model: documents, graphs, and key-value", versions: ["3.12", "3.11"], defaultVersion: "3.12", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  surrealdb: { label: "SurrealDB", category: "document", license: "open_source", description: "Multi-model database with real-time queries", versions: ["2.2", "2.1", "2.0", "1.5"], defaultVersion: "2.2", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  ferretdb: { label: "FerretDB", category: "document", license: "open_source", description: "MongoDB-compatible backed by PostgreSQL", versions: ["2.1", "2.0", "1.24", "1.23"], defaultVersion: "2.1", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  rethinkdb: { label: "RethinkDB", category: "document", license: "open_source", description: "Real-time document database with push-based change feeds", versions: ["2.4"], defaultVersion: "2.4", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },

  // ── Key-Value / Cache ──
  redis: { label: "Redis", category: "key_value", license: "open_source", description: "In-memory data store for caching and real-time analytics", versions: ["7.4", "7.2", "7.0"], defaultVersion: "7.4", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  valkey: { label: "Valkey", category: "key_value", license: "open_source", description: "Open-source Redis fork by the Linux Foundation", versions: ["8.1", "8.0", "7.2"], defaultVersion: "8.1", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  dragonflydb: { label: "DragonflyDB", category: "key_value", license: "open_source", description: "Modern Redis-compatible in-memory store", versions: ["1.25", "1.24", "1.23", "1.22"], defaultVersion: "1.25", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  keydb: { label: "KeyDB", category: "key_value", license: "open_source", description: "Multi-threaded Redis fork with active replication", versions: ["6.3", "6.2"], defaultVersion: "6.3", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  memcached: { label: "Memcached", category: "key_value", license: "open_source", description: "High-performance distributed memory caching", versions: ["1.6"], defaultVersion: "1.6", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },

  // ── Wide-Column ──
  cassandra: { label: "Apache Cassandra", category: "wide_column", license: "open_source", description: "Distributed wide-column store for massive scalability", versions: ["5.0", "4.1", "4.0"], defaultVersion: "5.0", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 7 },
  scylladb: { label: "ScyllaDB", category: "wide_column", license: "open_source", description: "Cassandra-compatible with C++ performance", versions: ["6.2", "6.1", "5.4"], defaultVersion: "6.2", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 7 },

  // ── Search ──
  elasticsearch: { label: "Elasticsearch", category: "search", license: "open_source", description: "Distributed search and analytics engine", versions: ["8.17", "8.16", "8.15", "7.17"], defaultVersion: "8.17", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  opensearch: { label: "OpenSearch", category: "search", license: "open_source", description: "Community-driven search and analytics suite", versions: ["2.19", "2.18", "2.17", "2.16"], defaultVersion: "2.19", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  meilisearch: { label: "Meilisearch", category: "search", license: "open_source", description: "Lightning-fast search with typo tolerance", versions: ["1.12", "1.11", "1.10"], defaultVersion: "1.12", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },

  // ── Vector ──
  milvus: { label: "Milvus", category: "vector", license: "open_source", description: "Vector database for AI similarity search at scale", versions: ["2.5", "2.4", "2.3"], defaultVersion: "2.5", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  qdrant: { label: "Qdrant", category: "vector", license: "open_source", description: "High-performance vector search with filtering", versions: ["1.13", "1.12", "1.11", "1.10"], defaultVersion: "1.13", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  weaviate: { label: "Weaviate", category: "vector", license: "open_source", description: "AI-native vector database with built-in ML", versions: ["1.28", "1.27", "1.26", "1.25"], defaultVersion: "1.28", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  chromadb: { label: "ChromaDB", category: "vector", license: "open_source", description: "Open-source embedding database for AI apps", versions: ["1.0", "0.6", "0.5", "0.4"], defaultVersion: "1.0", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },

  // ── Graph ──
  neo4j: { label: "Neo4j", category: "graph", license: "open_source", description: "Native graph database with Cypher query language", versions: ["5.26", "5.25", "5.24", "4.4"], defaultVersion: "5.26", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  dgraph: { label: "Dgraph", category: "graph", license: "open_source", description: "Distributed graph database with GraphQL support", versions: ["24.0", "23.1"], defaultVersion: "24.0", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },

  // ── Messaging ──
  kafka: { label: "Apache Kafka", category: "messaging", license: "open_source", description: "Distributed event streaming platform", versions: ["3.9", "3.8", "3.7"], defaultVersion: "3.9", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  rabbitmq: { label: "RabbitMQ", category: "messaging", license: "open_source", description: "Feature-rich message broker with multiple protocols", versions: ["4.1", "4.0", "3.13"], defaultVersion: "4.1", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  nats: { label: "NATS", category: "messaging", license: "open_source", description: "Cloud-native messaging with JetStream persistence", versions: ["2.10", "2.9"], defaultVersion: "2.10", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },

  // ── Analytics / Infrastructure ──
  clickhouse: { label: "ClickHouse", category: "analytics", license: "open_source", description: "Column-oriented OLAP database for real-time analytics", versions: ["25.1", "24.12", "24.11", "24.8"], defaultVersion: "25.1", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },
  etcd: { label: "etcd", category: "infrastructure", license: "open_source", description: "Distributed KV store for service discovery and config", versions: ["3.5", "3.4"], defaultVersion: "3.5", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  consul: { label: "Consul", category: "infrastructure", license: "open_source", description: "Service mesh and distributed KV with health checking", versions: ["1.20", "1.19", "1.18"], defaultVersion: "1.20", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  minio: { label: "MinIO", category: "object_storage", license: "open_source", description: "S3-compatible high-performance object storage", versions: ["2026.3", "2026.2", "2026.1"], defaultVersion: "2026.3", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  foundationdb: { label: "FoundationDB", category: "infrastructure", license: "open_source", description: "Distributed transactional key-value store", versions: ["7.3", "7.1"], defaultVersion: "7.3", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5 },

  // ── Commercial Free Editions ──
  mssql_express: { label: "SQL Server Express", category: "relational", license: "free_edition", description: "Free SQL Server (1 CPU, 1 GB RAM, 10 GB per database)", versions: ["2022", "2019"], defaultVersion: "2022", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  mssql_developer: { label: "SQL Server Developer", category: "relational", license: "free_edition", description: "Full SQL Server for dev/test (not for production)", versions: ["2022", "2019"], defaultVersion: "2022", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5 },
  oracle_xe: { label: "Oracle XE", category: "relational", license: "free_edition", description: "Free Oracle (2 CPUs, 2 GB RAM, 12 GB user data)", versions: ["21c", "18c"], defaultVersion: "21c", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },
  db2_community: { label: "Db2 Community", category: "relational", license: "free_edition", description: "Free IBM Db2 for community and development", versions: ["11.5"], defaultVersion: "11.5", supportsReplication: false, supportsSharding: false, minReplicas: 0, maxReplicas: 0 },

  // ── Licensed / BYOL ──
  mssql_standard: { label: "SQL Server Standard", category: "relational", license: "commercial", description: "Licensed SQL Server Standard edition", versions: ["2022", "2019"], defaultVersion: "2022", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5, requiresLicenseKey: true },
  mssql_enterprise: { label: "SQL Server Enterprise", category: "relational", license: "commercial", description: "Licensed SQL Server Enterprise with unlimited scale", versions: ["2022", "2019"], defaultVersion: "2022", supportsReplication: true, supportsSharding: false, minReplicas: 1, maxReplicas: 5, requiresLicenseKey: true },
  oracle_enterprise: { label: "Oracle Enterprise", category: "relational", license: "commercial", description: "Licensed Oracle with Data Guard and RAC", versions: ["23ai", "21c", "19c"], defaultVersion: "23ai", supportsReplication: true, supportsSharding: true, minReplicas: 1, maxReplicas: 5, requiresLicenseKey: true },
};

export const PLAN_SPECS: Record<
  PlanSize,
  { label: string; vcpu: number; memoryMb: number; storageGb: number }
> = {
  micro: { label: "Micro", vcpu: 1, memoryMb: 1024, storageGb: 10 },
  small: { label: "Small", vcpu: 2, memoryMb: 2048, storageGb: 25 },
  medium: { label: "Medium", vcpu: 4, memoryMb: 4096, storageGb: 50 },
  large: { label: "Large", vcpu: 8, memoryMb: 8192, storageGb: 100 },
  xlarge: { label: "XLarge", vcpu: 16, memoryMb: 16384, storageGb: 250 },
};

// ─── Helpers ────────────────────────────────────────────────────────

/** Look up a region label by code. Falls back to the code itself. */
export function getRegionLabel(
  regions: { value: string; label: string }[],
  code: string,
): string {
  const match = regions.find((r) => r.value === code);
  return match?.label || code;
}

/** Shape of an AZ option as stored in the wizard's in-memory list. */
export interface AzOption {
  value: string;
  label: string;
  /** Internal grouping key — NEVER rendered to the user. */
  provider: string;
}

/**
 * Replication mode reachable from the primary to a given replica AZ.
 *
 * Mirrors `App\Services\Replication\CrossProviderModeResolver` on the
 * backend. The FE renders a different badge / consent UX per mode.
 *
 *   - "same_provider"        — same availability group as primary.
 *                              No badge, no consent required.
 *   - "public_endpoint"      — cross-provider, async streaming over
 *                              TLS+auth over public internet. Selectable
 *                              if engine supports it; requires consent.
 *   - "orbit_overlay"        — cross-provider, AnyCloudFlow overlay.
 *                              Currently "coming soon" — selectable
 *                              once execution path ships.
 *   - "unavailable"          — cross-provider, engine cannot replicate
 *                              across providers at all (e.g. etcd Raft).
 *                              Shown disabled with a tooltip.
 */
export type ReplicaMode = "same_provider" | "public_endpoint" | "orbit_overlay" | "unavailable";

/** AZ option augmented with the replication mode reachable from the primary. */
export interface ReplicaAzOption extends AzOption {
  mode: ReplicaMode;
  /** True when this AZ can be selected as a replica target right now. */
  selectable: boolean;
}

/**
 * Per-tier mapping from the engine catalog → cross-provider modes
 * available. Mirrors the backend `CrossProviderModeResolver` tier
 * defaults so the FE doesn't need a round-trip to know whether to
 * grey out a button.
 *
 * Keep this in sync with `api/app/Services/Replication/CrossProviderModeResolver.php`
 * — the backend remains the source of truth and will reject a
 * cross-provider request the FE thinks is fine. The mirror is purely
 * for UX (badges, disabled states).
 */
const TIER_CROSS_PROVIDER_DEFAULTS: Record<
  string,
  { public_endpoint: boolean; orbit_overlay: boolean }
> = {
  disk_backed: { public_endpoint: true, orbit_overlay: true },
  in_memory: { public_endpoint: true, orbit_overlay: true },
  native_distributed: { public_endpoint: false, orbit_overlay: true },
  consensus_kv: { public_endpoint: false, orbit_overlay: false },
  licensed: { public_endpoint: true, orbit_overlay: true },
};

/**
 * Tag each AZ in the picker with the replication mode reachable from
 * the primary, and a `selectable` flag for the disabled-state UI.
 *
 * Rules:
 *   1. The primary AZ itself is excluded (replicas only).
 *   2. Same-provider AZs → mode="same_provider", selectable=true.
 *   3. Different-provider AZs branch on engine tier:
 *        - public_endpoint allowed → mode="public_endpoint", selectable=true
 *          (consent required at submit time, captured in the toggle).
 *        - orbit_overlay only → mode="orbit_overlay", selectable=false
 *          for now (flip on once execution path lands).
 *        - neither → mode="unavailable", selectable=false (tooltip).
 *   4. Unknown / missing tier falls back to "same_provider only" —
 *      conservative, mirrors the backend default.
 *
 * Exported so `__tests__/filterSameProviderReplicaAzs.test.ts` can pin
 * the behaviour without spinning up the whole hook.
 */
export function tagReplicaAzModes(
  availabilityZones: AzOption[],
  primaryAzCode: string,
  primaryAzProvider: string,
  engineTier: string | null | undefined,
  options: { crossProviderProvisioningEnabled?: boolean } = {},
): ReplicaAzOption[] {
  const tierDefaults = engineTier ? TIER_CROSS_PROVIDER_DEFAULTS[engineTier] : null;
  const flagOn = options.crossProviderProvisioningEnabled ?? false;

  const tagged: ReplicaAzOption[] = [];
  for (const az of availabilityZones) {
    if (primaryAzCode && az.value === primaryAzCode) continue;

    const sameProvider = !primaryAzProvider || !az.provider || az.provider === primaryAzProvider;
    if (sameProvider) {
      tagged.push({ ...az, mode: "same_provider", selectable: true });
      continue;
    }

    // Different provider — branch on engine tier
    if (tierDefaults?.public_endpoint && flagOn) {
      tagged.push({ ...az, mode: "public_endpoint", selectable: true });
    } else if (tierDefaults?.public_endpoint && !flagOn) {
      // Engine supports it, but the global feature flag is off →
      // shown as "coming soon" to the user.
      tagged.push({ ...az, mode: "public_endpoint", selectable: false });
    } else if (tierDefaults?.orbit_overlay) {
      tagged.push({ ...az, mode: "orbit_overlay", selectable: false });
    } else {
      tagged.push({ ...az, mode: "unavailable", selectable: false });
    }
  }
  return tagged;
}

/**
 * Legacy filter — returns only the AZs that are immediately selectable
 * as same-provider replicas. Kept for callers that want the pre-mode-
 * aware list (older code paths). New code should call `tagReplicaAzModes`
 * and render badges instead of hiding rows.
 */
export function filterSameProviderReplicaAzs(
  availabilityZones: AzOption[],
  primaryAzCode: string,
  primaryAzProvider: string,
): AzOption[] {
  if (!primaryAzCode) {
    return availabilityZones;
  }
  return availabilityZones.filter((az) => {
    if (az.value === primaryAzCode) return false;
    if (!primaryAzProvider || !az.provider) return true;
    return az.provider === primaryAzProvider;
  });
}

/**
 * Auto-assign replica regions by picking randomly from available regions
 * (excluding the primary).
 */
function _assignReplicaRegions(
  additionalReplicas: number,
  primaryRegion: string,
  allRegions: { value: string; label: string }[],
): string[] {
  if (additionalReplicas <= 0 || !primaryRegion) return [];
  const available = allRegions.filter((r) => r.value !== primaryRegion);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(additionalReplicas, available.length)).map((r) => r.value);
}

// ─── Hook ──────────────────────────────────────────────────────────

export const useDatabaseProvisioningLogic = () => {
  // API context and user profile
  const { context } = useApiContext();
  const user = useAuthStore((s) => s.user);

  // Platform feature flags (public /features endpoint). Drives whether
  // cross-provider replica AZs are selectable vs shown "coming soon".
  // Bound to the SAME backend flag the order-time 422 guard enforces
  // (config('managed_databases.cross_provider_provisioning_enabled')),
  // exposed as `managed_database_cross_provider` in config('features').
  const { data: featureFlags } = useFeatureFlags();
  const crossProviderProvisioningEnabled = featureFlags?.managed_database_cross_provider ?? false;

  // FE mirror of the order-time DR guard. The backend 422s a `dr_enabled`
  // payload unless `config('features.managed_database_dr_ordering')` is on
  // (InitiateManagedDatabaseAction + StoreManagedDatabaseRequest). Off by
  // default so the wizard's DR controls fail closed to "coming soon".
  const drOrderingEnabled = featureFlags?.managed_database_dr_ordering ?? false;

  // Derive billing country from user profile
  const profileCountry = useMemo(() => {
    if (!user) return "";
    return (user.country_iso as string) || (user.country as string) || "";
  }, [user]);

  // Derive default customer context based on role
  const defaultCustomerContext: CustomerContext = useMemo(() => {
    if (context === "client") return "user";
    if (context === "tenant") return "tenant";
    return "tenant"; // admin defaults to tenant
  }, [context]);

  // ─── Countries ─────────────────────────────────────────────────────
  const { data: rawCountries = [], isFetching: isCountriesLoading } = useFetchCountries();

  const countryOptions = useMemo(() => {
    const apiCountries = Array.isArray(rawCountries) ? rawCountries : [];
    if (apiCountries.length > 0) {
      const mapped = apiCountries
        .map((item: unknown) => {
          const code = normalizeCountryCandidate(
            item?.iso2 || item?.code || item?.country_code || item?.iso_code || item?.iso || ""
          );
          if (!code) return null;
          const name = item?.name || item?.country_name || item?.label || code;
          return { value: code, label: `${name} (${code})` };
        })
        .filter(Boolean) as { value: string; label: string }[];

      const hasUS = mapped.some((o) => String(o.value).toUpperCase() === "US");
      return hasUS
        ? mapped
        : [{ value: "US", label: "United States (US)" }, ...mapped];
    }
    return [...COUNTRY_FALLBACK] as { value: string; label: string }[];
  }, [rawCountries]);

  const isCountryLocked = context === "tenant" || context === "client";

  // ─── Customer Context (admin only) ────────────────────────────────
  const customerCtx = useCustomerContext({ enabled: context === "admin" });

  // Steps
  const steps = useMemo(() => [...DATABASE_WIZARD_STEPS], []);
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [form, setForm] = useState<DatabaseFormState>({
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
    assignmentScope: context === "admin" ? "internal" : context === "tenant" ? "tenant" : "client",
    licenseKey: "",
    licenseMode: "",
    cloudAccountId: null,
    // FR-031: keep the UI explicit so quotes and orders do not depend on
    // the current backend process' loaded default. UniCloud provisions the
    // VM, then StaqDB operates the engine through the partner handoff.
    planKind: "management_only" as "" | "bundled" | "management_only",
    replicationMode: "native_same_provider" as
      | "native_same_provider"
      | "native_public_endpoint"
      | "orbit_overlay",
    crossProviderConsent: false,
  });

  // Initialize billing country and customer context from profile once loaded
  useEffect(() => {
    setForm((prev) => {
      const resolvedCountry =
        prev.billingCountry ||
        resolveCountryCodeFromEntity(user, countryOptions as never) ||
        profileCountry;
      return {
        ...prev,
        billingCountry: resolvedCountry,
        customerContext:
          prev.customerContext === "tenant" ? defaultCustomerContext : prev.customerContext,
      };
    });
  }, [profileCountry, defaultCustomerContext, user, countryOptions]);

  // ─── Project Membership (mirrors addProject.tsx flow) ──────────────
  // Derive assignment scope from customer context
  const assignmentScope = useMemo(() => {
    if (context !== "admin") return context === "tenant" ? "tenant" : "client";
    if (customerCtx.contextType === "tenant") return "tenant" as const;
    if (customerCtx.contextType === "user") return "client" as const;
    return "internal" as const;
  }, [context, customerCtx.contextType]);

  // Sync assignmentScope into form
  useEffect(() => {
    setForm((prev) => (prev.assignmentScope !== assignmentScope ? { ...prev, assignmentScope } : prev));
  }, [assignmentScope]);

  // Membership suggestions query
  const membershipSuggestionsParams = useMemo(() => ({
    scope: assignmentScope,
    ...(assignmentScope === "tenant" && customerCtx.selectedTenantId
      ? { tenant_id: String(customerCtx.selectedTenantId) }
      : {}),
    ...(assignmentScope === "client" && customerCtx.selectedUserId
      ? { client_id: String(customerCtx.selectedUserId) }
      : {}),
  }), [assignmentScope, customerCtx.selectedTenantId, customerCtx.selectedUserId]);

  const shouldFetchMembers = assignmentScope === "internal"
    || (assignmentScope === "tenant" && !!customerCtx.selectedTenantId)
    || (assignmentScope === "client" && !!customerCtx.selectedUserId);

  const { data: suggestedMembersData, isFetching: isMembersFetching } =
    useProjectMembershipSuggestions(membershipSuggestionsParams, {
      enabled: shouldFetchMembers,
    });

  const suggestedMembers = useMemo(() => {
    const raw = (suggestedMembersData as unknown)?.members ?? (suggestedMembersData as { data?: unknown })?.data ?? suggestedMembersData;
    return Array.isArray(raw) ? raw : [];
  }, [suggestedMembersData]);

  // Auto-select all suggested members when they load
  const [memberSignature, setMemberSignature] = useState<string>("");
  useEffect(() => {
    const sig = suggestedMembers.map((m: unknown) => m.id).sort().join(",");
    if (sig && sig !== memberSignature) {
      setMemberSignature(sig);
      setForm((prev) => ({
        ...prev,
        memberUserIds: suggestedMembers.map((m: unknown) => String(m.id)),
      }));
    }
  }, [suggestedMembers, memberSignature]);

  const selectedMemberIds = useMemo(() => new Set(form.memberUserIds), [form.memberUserIds]);

  const selectedMembers = useMemo(
    () => suggestedMembers.filter((m: unknown) => selectedMemberIds.has(String(m.id))),
    [suggestedMembers, selectedMemberIds]
  );

  const toggleMember = useCallback((member: unknown) => {
    const id = String(member.id);
    setForm((prev) => ({
      ...prev,
      memberUserIds: prev.memberUserIds.includes(id)
        ? prev.memberUserIds.filter((mid) => mid !== id)
        : [...prev.memberUserIds, id],
    }));
  }, []);

  const restoreDefaultMembers = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      memberUserIds: suggestedMembers.map((m: unknown) => String(m.id)),
    }));
  }, [suggestedMembers]);

  const showRestoreMembers = useMemo(() => {
    const defaultIds = suggestedMembers.map((m: unknown) => String(m.id)).sort().join(",");
    const currentIds = [...form.memberUserIds].sort().join(",");
    return defaultIds !== currentIds;
  }, [suggestedMembers, form.memberUserIds]);

  // Data fetching
  const { data: enginesData } = useFetchAvailableEngines();
  const { data: plansData } = useFetchAvailablePlans(form.engine || undefined);
  const { data: projectsData } = useFetchProjects();
  const { data: regionsData } = useFetchRegions();

  // Fetch AZs using the shared hook when a region is selected
  const { data: fetchedAzsData } = useFetchAvailabilityZones(form.region || undefined);

  // Mutations
  const quoteMutation = useDatabaseQuote();
  const orderMutation = useCreateDatabaseOrder();
  const createOrderAction = useAsyncAction();

  // Order state
  const [quoteResult, setQuoteResult] = useState<DatabaseQuoteResponse | null>(null);
  const [submissionResult, setSubmissionResult] = useState<DatabaseOrderResponse | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<Record<string, unknown> | null>(null);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);

  // Step indices
  const paymentStepIndex = useMemo(() => steps.findIndex((s) => s.id === "payment"), [steps]);
  const reviewStepIndex = useMemo(() => steps.findIndex((s) => s.id === "review"), [steps]);
  const successStepIndex = useMemo(() => steps.findIndex((s) => s.id === "success"), [steps]);

  // Engine metadata — server data is primary, local ENGINE_METADATA is fallback.
  // This ensures new engines added on the backend appear without a frontend deploy.
  const engines = useMemo((): Record<string, EngineMetaEntry> => {
    if (enginesData && typeof enginesData === "object") {
      // Handle both keyed object and array formats from the API
      let serverEngines: Record<string, Record<string, unknown>>;
      if (Array.isArray(enginesData)) {
        // StaqDB returns an array with `name` key — normalize to keyed object
        serverEngines = {};
        for (const entry of enginesData as Record<string, unknown>[]) {
          const key = (entry.name as string) || (entry.engine as string);
          if (key) serverEngines[key] = entry;
        }
      } else {
        serverEngines = enginesData as Record<string, Record<string, unknown>>;
      }

      if (Object.keys(serverEngines).length === 0) return ENGINE_METADATA;

      const merged: Record<string, EngineMetaEntry> = {};

      // Include all engines from server — StaqDB is the single source of truth
      for (const [key, serverEntry] of Object.entries(serverEngines)) {
        const fallback = ENGINE_METADATA[key];
        merged[key] = {
          label: (serverEntry.label as string) || fallback?.label || key,
          category: (serverEntry.category as string) || fallback?.category || "relational",
          license: (serverEntry.license as string) || fallback?.license || "open_source",
          description: (serverEntry.description as string) || fallback?.description || "",
          versions: (serverEntry.versions as string[]) || fallback?.versions || [],
          defaultVersion: (serverEntry.default_version as string) || fallback?.defaultVersion || "",
          supportsReplication: (serverEntry.supports_replication as boolean) ?? fallback?.supportsReplication ?? false,
          supportsSharding: (serverEntry.supports_sharding as boolean) ?? fallback?.supportsSharding ?? false,
          minReplicas: (serverEntry.min_replicas as number) ?? fallback?.minReplicas ?? 0,
          maxReplicas: (serverEntry.max_replicas as number) ?? fallback?.maxReplicas ?? 0,
          requiresLicenseKey: (serverEntry.requires_license_key as boolean) ?? fallback?.requiresLicenseKey,
          iconUrl: (serverEntry.icon_url as string) || null,
          port: (serverEntry.port as number) || fallback?.port,
          // Replication metadata drives the tier-aware picker (Read
          // Replicas vs Cluster Size etc.) AND the cross-provider mode
          // tagger. Until this line existed, the FE silently dropped
          // the block and the wizard tagged every cross-provider AZ as
          // "Not supported" because the resolver couldn't find a tier.
          replication:
            (serverEntry.replication as EngineMetaEntry["replication"]) ??
            fallback?.replication,
        };
      }

      return merged;
    }
    return ENGINE_METADATA;
  }, [enginesData]);

  // Projects list
  const projects = useMemo(() => {
    if (!projectsData) return [];
    const list = Array.isArray(projectsData) ? projectsData : [];
    return list.map((p: Record<string, unknown>) => ({
      value: p.id as number,
      label: (p.name as string) || (p.identifier as string) || `Project #${p.id}`,
    }));
  }, [projectsData]);

  // Regions list (with raw data for AZ extraction)
  const regionsRaw = useMemo(() => {
    if (!regionsData) return [];
    return Array.isArray(regionsData) ? regionsData : [];
  }, [regionsData]);

  const regions = useMemo(() => {
    return regionsRaw
      .map((r: Record<string, unknown>) => ({
        value: (r.region as string) || (r.code as string) || "",
        label: (r.label as string) || (r.name as string) || (r.region as string) || "",
      }))
      .filter((r) => r.value);
  }, [regionsRaw]);

  // Availability zones for the selected region — prefers fetched AZ data, falls back to region-embedded data.
  //
  // INVARIANT: The `provider` field is carried internally so the replica
  // picker can filter to same-provider AZs (cross-provider replication is
  // not supported and the API rejects it). The provider name is NEVER
  // rendered in any user-visible label — `sanitizeProviderLabel()` strips
  // it from the display string. Treat `provider` as an opaque grouping
  // key, not a brand.
  const availabilityZones = useMemo(() => {
    if (!form.region) return [];

    // Prefer data from the dedicated AZ endpoint
    if (fetchedAzsData && Array.isArray(fetchedAzsData) && fetchedAzsData.length > 0) {
      return fetchedAzsData.map((az) => ({
        value: az.code || "",
        label: sanitizeProviderLabel(az.name || az.code || ""),
        provider: (az as { provider?: string }).provider ?? "",
      })).filter((az) => az.value);
    }

    // Fallback: extract from region data
    const regionData = regionsRaw.find(
      (r: Record<string, unknown>) =>
        (r.region as string) === form.region || (r.code as string) === form.region
    );
    if (!regionData) return [];
    const azs = (regionData as Record<string, unknown>).availability_zones;
    if (!Array.isArray(azs)) return [];
    return azs.map((az: Record<string, unknown>) => ({
      value: (az.code as string) || "",
      label: sanitizeProviderLabel((az.name as string) || (az.code as string) || ""),
      provider: (az.provider as string) ?? "",
    })).filter((az: { value: string }) => az.value);
  }, [form.region, regionsRaw, fetchedAzsData]);

  // Auto-select first AZ when AZs become available and none is selected
  useEffect(() => {
    if (availabilityZones.length > 0 && !form.availabilityZone) {
      setForm((prev) => ({
        ...prev,
        availabilityZone: availabilityZones[0].value,
      }));
    }
  }, [availabilityZones, form.availabilityZone]);

  // ─── Replica Logic ────────────────────────────────────────────────

  // Provider of the currently-selected primary AZ. Used as the grouping
  // key for replica AZs (cross-provider replication is not supported).
  // Never surfaced in the UI.
  const primaryAzProvider = useMemo(() => {
    if (!form.availabilityZone) return "";
    return availabilityZones.find((az) => az.value === form.availabilityZone)?.provider ?? "";
  }, [availabilityZones, form.availabilityZone]);

  // Tier of the selected engine — drives which cross-provider modes
  // appear in the picker. Pulled from the engine catalog as a hint;
  // the backend resolver is still authoritative at submit time.
  const selectedEngineTier = useMemo(() => {
    if (!form.engine) return null;
    return engines[form.engine as DatabaseEngine]?.replication?.tier ?? null;
  }, [form.engine, engines]);

  // Tagged AZ list — every AZ is included with a `mode` ("same_provider"
  // | "public_endpoint" | "orbit_overlay" | "unavailable") and a
  // `selectable` flag. The wizard renders badges + disabled states off
  // these tags; cross-provider AZs are visible but only selectable when
  // the engine + feature flag combination permits it.
  const taggedReplicaAzs = useMemo(
    () =>
      tagReplicaAzModes(availabilityZones, form.availabilityZone, primaryAzProvider, selectedEngineTier, {
        // FE-side mirror of the backend feature flag, sourced from the
        // public /features endpoint. Drives whether cross-provider AZs are
        // selectable or shown as "coming soon". The backend still enforces
        // the same gate at submit time.
        crossProviderProvisioningEnabled,
      }),
    [
      availabilityZones,
      form.availabilityZone,
      primaryAzProvider,
      selectedEngineTier,
      crossProviderProvisioningEnabled,
    ],
  );

  // Subset of tagged AZs that are currently SELECTABLE. The picker shows
  // ALL tagged AZs (with badges) but cap calculations and toggling work
  // off this narrower list.
  const replicaAvailableAzs = useMemo(
    () => taggedReplicaAzs.filter((az) => az.selectable),
    [taggedReplicaAzs],
  );

  // When the user picks a replica AZ that crosses providers, auto-set
  // replicationMode → native_public_endpoint so the backend accepts the
  // payload. Switch back to native_same_provider when no cross-provider
  // replica is selected. The consent toggle remains user-controlled —
  // we never auto-set consent.
  useEffect(() => {
    setForm((prev) => {
      const hasCrossProviderReplica = prev.replicaAzs.some((code) => {
        const az = taggedReplicaAzs.find((a) => a.value === code);
        return az?.mode === "public_endpoint" || az?.mode === "orbit_overlay";
      });
      const nextMode = hasCrossProviderReplica
        ? "native_public_endpoint"
        : "native_same_provider";
      if (prev.replicationMode === nextMode) return prev;
      return { ...prev, replicationMode: nextMode };
    });
  }, [taggedReplicaAzs]);

  // Fail closed on DR: if the DR-ordering flag is off, force `drEnabled`
  // back to false so a stale toggle can never submit a `dr_enabled`
  // payload the backend would reject with a 422. Keyed off `form.drEnabled`
  // too so a later toggle-on is corrected, not just the mount-time value.
  useEffect(() => {
    if (drOrderingEnabled) return;
    setForm((prev) => (prev.drEnabled ? { ...prev, drEnabled: false } : prev));
  }, [drOrderingEnabled, form.drEnabled]);

  // If the primary AZ changes such that previously-selected replicas
  // are no longer selectable (e.g. tier no longer supports the cross-
  // provider mode), drop the stale picks. Prevents resurrecting a
  // disabled state via stale form state.
  useEffect(() => {
    if (!primaryAzProvider) return;
    const allowed = new Set(replicaAvailableAzs.map((az) => az.value));
    setForm((prev) => {
      const filtered = prev.replicaAzs.filter((code) => allowed.has(code));
      if (filtered.length === prev.replicaAzs.length) return prev;
      return {
        ...prev,
        replicaAzs: filtered,
        replicaCount: filtered.length + 1,
        replicaRegions: filtered,
      };
    });
  }, [primaryAzProvider, replicaAvailableAzs]);

  /** Max additional replicas the user can select (limited by engine and available AZs). */
  const maxReplicaCount = useMemo(() => {
    if (!form.engine || !form.region || !form.availabilityZone) return 0;
    const engineMeta = engines[form.engine as DatabaseEngine];
    const maxByEngine = (engineMeta?.maxReplicas ?? 5) - 1;
    const maxByAzs = replicaAvailableAzs.length;
    return Math.max(0, Math.min(maxByEngine, maxByAzs));
  }, [form.engine, form.region, form.availabilityZone, engines, replicaAvailableAzs]);

  /**
   * Toggle an AZ for read replica placement.
   * Each selected AZ gets one replica.
   */
  const toggleReplicaAz = useCallback(
    (azCode: string) => {
      setForm((prev) => {
        const current = prev.replicaAzs;
        const isSelected = current.includes(azCode);
        let newAzs: string[];
        if (isSelected) {
          newAzs = current.filter((az) => az !== azCode);
        } else {
          if (current.length >= maxReplicaCount) return prev;
          newAzs = [...current, azCode];
        }
        return {
          ...prev,
          replicaAzs: newAzs,
          replicaCount: newAzs.length + 1, // total = primary + replicas
          replicaRegions: newAzs, // backward compat
        };
      });
    },
    [maxReplicaCount],
  );

  // Reset replica AZs when primary AZ changes
  useEffect(() => {
    if (!form.availabilityZone) return;
    // Remove any replica AZs that conflict with the new primary
    setForm((prev) => {
      const filtered = prev.replicaAzs.filter((az) => az !== form.availabilityZone);
      if (filtered.length === prev.replicaAzs.length) return prev;
      return {
        ...prev,
        replicaAzs: filtered,
        replicaCount: filtered.length + 1,
        replicaRegions: filtered,
      };
    });
  }, [form.availabilityZone]);

  // ─── Form Helpers ────────────────────────────────────────────────

  const updateForm = useCallback((patch: Partial<DatabaseFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectEngine = useCallback(
    (engine: DatabaseEngine) => {
      const meta = engines[engine as string];
      if (!meta) return; // Engine not in catalog — noop

      const defaultVersion = meta.defaultVersion || (meta.versions?.[0] ?? "");

      updateForm({
        engine,
        engineVersion: defaultVersion,
        replicaCount: 1,
        replicaAzs: [],
        replicaRegions: [],
        licenseKey: "",
        licenseMode: meta.requiresLicenseKey ? "byol" : "",
      });
    },
    [engines, updateForm]
  );

  // Currently selected engine metadata
  const selectedEngineMeta = useMemo(() => {
    if (!form.engine) return null;
    return engines[form.engine as string] ?? null;
  }, [form.engine, engines]);

  const resolvedPlanKind = useMemo<"bundled" | "management_only">(
    () => (form.cloudAccountId ? "management_only" : form.planKind || "management_only"),
    [form.cloudAccountId, form.planKind],
  );

  // ─── Validation ──────────────────────────────────────────────────

  const isEngineStepValid = useMemo(
    () => Boolean(form.engine && form.engineVersion),
    [form.engine, form.engineVersion]
  );

  const isConfigureStepValid = useMemo(() => {
    const baseValid = Boolean(form.planSize && form.region);
    // Commercial engines require a license key (BYOL) or purchase mode
    if (selectedEngineMeta?.requiresLicenseKey) {
      return baseValid && form.licenseMode === "byol" && form.licenseKey.trim().length > 0;
    }
    return baseValid;
  }, [form.planSize, form.region, form.licenseMode, form.licenseKey, selectedEngineMeta]);

  const canProceedToReview = isEngineStepValid && isConfigureStepValid;

  // ─── Quote Pricing ──────────────────────────────────────────────

  const fetchQuote = useCallback(async () => {
    if (!canProceedToReview) return;

    // CRITICAL: every input that affects pricing must be in the quote
    // payload. Previously this omitted `availability_zone` and
    // `plan_kind`, which routed /quote through the region's default
    // provider while /store used the AZ's provider — producing wildly
    // different prices for the same form state (e.g. ₦17k quote vs
    // ₦49k order in multi-cloud regions). The quote-vs-order parity is
    // also asserted in `tests/Unit/Services/Pricing/QuoteOrderParityTest.php`.
    const params: Record<string, unknown> = {
      engine: form.engine,
      plan_size: form.planSize,
      region: form.region,
      months: form.months,
      replica_count: form.replicaCount,
      backup_enabled: form.backupEnabled,
      dr_enabled: form.drEnabled,
      network_mode: form.networkMode,
      connection_pooling: form.connectionPooling,
      tls_enabled: form.tlsEnabled,
      dedicated_proxy: form.dedicatedProxy,
      vpn_gateway: form.vpnGateway,
      country_iso: form.billingCountry || undefined,
    };
    if (form.availabilityZone) params.availability_zone = form.availabilityZone;
    params.plan_kind = resolvedPlanKind;
    if (form.replicaAzs.length) params.replica_azs = form.replicaAzs;

    try {
      const result = await quoteMutation.mutateAsync(params);
      setQuoteResult(result);
    } catch {
      // Error handled by mutation
    }
  }, [canProceedToReview, form, quoteMutation, resolvedPlanKind]);

  // ─── Create Order ────────────────────────────────────────────────

  const handleCreateOrder = useCallback(async () => {
    // Re-entrancy guard. The submit button is `disabled={isSubmitting}`,
    // but React event batching + rapid clicks can dispatch multiple
    // handlers within the same render frame (before the disabled
    // attribute is reflected back to the DOM). Without this check we
    // ended up firing 2-3 concurrent mutations and stacking 2-3 error
    // toasts for the same failure.
    if (createOrderAction.isPending) return;

    await createOrderAction.run(
      async () => {
        if (!canProceedToReview) {
          throw new Error("Please complete all required fields before proceeding.");
        }

        const payload: Record<string, unknown> = {
          engine: form.engine,
          engine_version: form.engineVersion,
          plan_size: form.planSize,
          region: form.region,
          availability_zone: form.availabilityZone,
          deployment_type: form.deploymentType,
          replica_count: form.replicaCount,
          replica_azs: form.replicaAzs,
          backup_enabled: form.backupEnabled,
          dr_enabled: form.drEnabled,
          firewall_cidrs: form.firewallCidrs.filter(Boolean),
          months: form.months,
          fast_track: form.fastTrack,
          fast_track_ends_at: form.fastTrack && form.fastTrackEndsAt ? form.fastTrackEndsAt : undefined,
          country_iso: form.billingCountry || undefined,
          customer_context: form.customerContext,
          assignment_scope: form.assignmentScope,
          member_user_ids: form.memberUserIds,
          db_name: form.useDefaultCredentials ? undefined : form.dbName.trim() || undefined,
          db_user: form.useDefaultCredentials ? undefined : form.dbUser.trim() || undefined,
          db_password: form.useDefaultCredentials ? undefined : form.dbPassword || undefined,
          use_default_credentials: form.useDefaultCredentials,
          network_mode: form.networkMode,
          connection_pooling: form.connectionPooling,
          tls_enabled: form.tlsEnabled,
          dedicated_proxy: form.dedicatedProxy,
          vpn_gateway: form.vpnGateway,
        };

        if (form.name.trim()) payload.name = form.name.trim();
        if (form.projectId) payload.project_id = form.projectId;
        if (form.assignedTenantId) {
          payload.tenant_id = form.assignedTenantId;
          payload.customer_tenant_id = form.assignedTenantId;
        }
        if (form.assignedClientId) {
          payload.user_id = form.assignedClientId;
          payload.customer_user_id = form.assignedClientId;
        }
        if (form.licenseKey.trim()) payload.license_key = form.licenseKey.trim();
        if (form.licenseMode) payload.license_mode = form.licenseMode;
        if (form.cloudAccountId) payload.cloud_account_id = form.cloudAccountId;
        // FR-031: pass plan_kind so the API picks the right wholesale tier.
        // Keep this explicit because the running backend process may have
        // loaded a different default than the current environment.
        payload.plan_kind = resolvedPlanKind;
        // FR-CROSS-PROV: replication_mode + cross_provider_consent.
        // Mode auto-promotes to native_public_endpoint when the user picks
        // a cross-provider replica AZ; consent is opt-in via the toggle.
        // Backend re-validates both — the FE values are a hint, not a
        // bypass.
        payload.replication_mode = form.replicationMode;
        if (form.crossProviderConsent) payload.cross_provider_consent = true;

        // Price-lock — the backend re-quotes and rejects with 409 if
        // the resolved total doesn't match what the customer saw at
        // review time. Source of truth is `quoteResult` from /quote;
        // never trust the `pricingSummary` aggregate here because the
        // aggregate flips to orderReceipt.pricing_breakdown after
        // /store responds (which would be circular).
        //
        // `expected_currency` is OPTIONAL and only sent when the
        // quote carries one — DO NOT fall back to a country code
        // (NG, US, …). Country codes are not currency codes, and a
        // fallback like `form.billingCountry` produces nonsense
        // comparisons on the backend (NG ≠ NGN → 409). When the
        // currency is unknown, omit the field and let the total-
        // match guard alone protect the customer.
        // The backend REQUIRES expected_total on non-fast-track creates (it
        // 422s without it). Fast-track legitimately submits quote-less — it
        // skips payment and the backend exempts it. For everything else, a
        // missing/zero quote total means the customer never saw a confirmable
        // price: block the submit with the same re-quote UX as the 409 path
        // below instead of shipping a payload the backend will reject.
        if (!form.fastTrack && !quoteResult?.total) {
          await fetchQuote();
          setActiveStep(reviewStepIndex);
          ToastUtils.error(
            "We couldn't confirm the order total — please review the updated pricing and try again."
          );
          return { isPaymentRequired: false, requote: true };
        }

        if (quoteResult?.total) {
          payload.expected_total = quoteResult.total;
          if (typeof quoteResult.currency === "string" && quoteResult.currency.length === 3) {
            payload.expected_currency = quoteResult.currency;
          }
        }

        const response = await orderMutation.mutateAsync(payload).catch((err: unknown) => {
          // Price-lock 409: the backend re-quoted and the total drifted from
          // what the customer approved. Instead of a dead "Failed to create
          // order" toast, surface the NEW total and make them re-confirm —
          // upholding the invariant that no one is charged a price they didn't
          // see and approve. Any other error propagates to the generic handler.
          if (isApiError(err) && err.status === 409) {
            return "__REQUOTE__" as const;
          }
          throw err;
        });

        if (response === "__REQUOTE__") {
          await fetchQuote();
          setActiveStep(reviewStepIndex);
          ToastUtils.error(
            "Pricing changed since you last reviewed it — please check the updated total and confirm again."
          );
          return { isPaymentRequired: false, requote: true };
        }

        const data = response?.data ?? (response as unknown as DatabaseOrderResponse["data"]);

        // Normalize payment gateway options
        const normalizedGatewayOptions = normalizePaymentOptions(
          data?.payment?.payment_gateway_options || []
        );

        const mergedResult: DatabaseOrderResponse = {
          ...response,
          data: {
            ...data,
            payment: data?.payment
              ? { ...data.payment, payment_gateway_options: normalizedGatewayOptions }
              : undefined,
          },
        };

        setSubmissionResult(mergedResult);
        setOrderReceipt({
          transaction: data?.transaction || null,
          order: data?.order || null,
          payment: data?.payment
            ? { ...data.payment, payment_gateway_options: normalizedGatewayOptions }
            : null,
          pricing_breakdown: data?.pricing_breakdown || null,
          database: data?.database || null,
        });

        const isPaymentRequired = data?.payment?.required;
        if (isPaymentRequired) {
          setActiveStep(paymentStepIndex);
        } else {
          setIsPaymentSuccessful(true);
          setActiveStep(successStepIndex);
        }

        return { isPaymentRequired: Boolean(isPaymentRequired) };
      },
      {
        successToast: (result) =>
          result && "requote" in result && result.requote
            ? "" // re-quote already surfaced its own message; no success toast
            : result?.isPaymentRequired
              ? "Order created! Please complete payment."
              : "Database created! Provisioning is starting.",
        fallbackErrorMessage: "Failed to create database order.",
        rethrow: false,
      }
    );
  }, [
    canProceedToReview,
    form,
    resolvedPlanKind,
    orderMutation,
    createOrderAction,
    paymentStepIndex,
    successStepIndex,
    fetchQuote,
    reviewStepIndex,
  ]);

  // ─── Payment Completion ──────────────────────────────────────────

  const handlePaymentCompleted = useCallback(() => {
    setIsPaymentSuccessful(true);
    setActiveStep(successStepIndex);
    ToastUtils.success("Payment successful! Database provisioning is starting.");
  }, [successStepIndex]);

  // ─── Pricing Summary ────────────────────────────────────────────

  const pricingSummary = useMemo(() => {
    // Once an order exists, its `pricing_breakdown` is the source of
    // truth — that's the snapshot the backend actually billed against.
    // The wizard's earlier `quoteResult` is a preview that can drift
    // (e.g. if pricing inputs changed between preview and submit, or
    // if the quote payload was missing an input that affected the
    // order's price).
    //
    // Previously this was the opposite — quoteResult won — which is
    // what made the payment page show "estimated total: ₦17,748.25 /
    // total payable: ₦49,643.17 / gateway adjustment: ₦31,894.92" for
    // an order that was always going to cost ₦49,643.17. The "gateway
    // adjustment" was a misleading label for stale wizard state.
    const source =
      (orderReceipt?.pricing_breakdown as DatabaseQuoteResponse | null) || quoteResult;
    if (!source) {
      return {
        subtotal: 0,
        tax: 0,
        gatewayFees: 0,
        grandTotal: 0,
        currency: "USD",
        monthlyCost: 0,
      };
    }
    // Mirror the backend's per-line breakdown into the FE pricing
    // summary so the payment page can render the SAME line items the
    // wizard showed. Without this, the payment page falls back to a
    // single "Subtotal" line and the customer can't reconcile the
    // total to what they reviewed at quote time.
    const sourceLines = Array.isArray(source.lines) ? source.lines : [];
    const lineItems = sourceLines
      .filter((line) => Number(line.total) > 0)
      .map((line) => ({
        name: String(line.name ?? ""),
        total: Number(line.total ?? 0),
      }));

    return {
      subtotal: source.subtotal || 0,
      tax: source.tax || 0,
      gatewayFees: 0,
      grandTotal: source.total || 0,
      currency: source.currency || "USD",
      monthlyCost: source.monthly_cost || 0,
      lineItems,
    };
  }, [quoteResult, orderReceipt]);

  // ─── Step Navigation ─────────────────────────────────────────────

  const goToStep = useCallback(
    (step: number) => {
      // Prevent going forward past current validation
      if (step > activeStep) {
        if (step >= 1 && !isEngineStepValid) return;
        if (step >= 2 && !isConfigureStepValid) return;
      }
      setActiveStep(step);
    },
    [activeStep, isEngineStepValid, isConfigureStepValid]
  );

  const nextStep = useCallback(() => {
    goToStep(activeStep + 1);
  }, [activeStep, goToStep]);

  const prevStep = useCallback(() => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  }, [activeStep]);

  const currentStepId = steps[activeStep]?.id ?? "";

  return {
    // Steps
    steps,
    activeStep,
    setActiveStep: goToStep,
    nextStep,
    prevStep,
    currentStepId,

    // Form
    form,
    updateForm,
    selectEngine,
    selectedEngineMeta,

    // Context
    context,
    profileCountry,

    // Countries
    countryOptions,
    isCountriesLoading,
    isCountryLocked,

    // Customer context (admin)
    tenants: customerCtx.tenants,
    isTenantsFetching: customerCtx.isTenantsFetching,
    userPool: customerCtx.userPool,
    isUsersFetching: customerCtx.isUsersFetching,
    customerContextType: customerCtx.contextType,
    setCustomerContextType: customerCtx.setContextType,
    selectedTenantId: customerCtx.selectedTenantId,
    setSelectedTenantId: customerCtx.setSelectedTenantId,
    selectedUserId: customerCtx.selectedUserId,
    setSelectedUserId: customerCtx.setSelectedUserId,

    // Project Membership
    assignmentScope,
    shouldFetchMembers,
    isMembersFetching,
    selectedMembers,
    selectedMemberIds,
    suggestedMembers,
    showRestoreMembers,
    toggleMember,
    restoreDefaultMembers,

    // Data
    engines,
    projects,
    regions,
    availabilityZones,
    plansData,

    // Replicas
    maxReplicaCount,
    replicaAvailableAzs,
    taggedReplicaAzs,
    toggleReplicaAz,

    // Feature flags (FE mirror of backend config('features'))
    drOrderingEnabled,

    // Validation
    isEngineStepValid,
    isConfigureStepValid,
    canProceedToReview,

    // Quote
    quoteResult,
    fetchQuote,
    isQuoteLoading: quoteMutation.isPending,

    // Order
    submissionResult,
    orderReceipt,
    isSubmitting: createOrderAction.isPending,
    submissionErrorMessage: createOrderAction.errorMessage,
    isPaymentSuccessful,
    handleCreateOrder,
    handlePaymentCompleted,

    // Pricing
    pricingSummary,
  };
};

export default useDatabaseProvisioningLogic;

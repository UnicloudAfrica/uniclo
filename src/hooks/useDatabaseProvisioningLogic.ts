/**
 * useDatabaseProvisioningLogic — Orchestrates the database creation wizard flow.
 *
 * Follows the useClientProvisioningLogic pattern:
 * steps → form state → quote pricing → create order → payment → success.
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
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
    // FR-031: empty string means "use the platform default" (typically
    // `management_only`). Admin UI may set this explicitly to override
    // for a specific order.
    planKind: "" as "" | "bundled" | "management_only",
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
        memberUserIds: suggestedMembers.map((m: unknown) => Number(m.id)),
      }));
    }
  }, [suggestedMembers, memberSignature]);

  const selectedMemberIds = useMemo(() => new Set(form.memberUserIds), [form.memberUserIds]);

  const selectedMembers = useMemo(
    () => suggestedMembers.filter((m: unknown) => selectedMemberIds.has(Number(m.id))),
    [suggestedMembers, selectedMemberIds]
  );

  const toggleMember = useCallback((member: unknown) => {
    const id = Number(member.id);
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
      memberUserIds: suggestedMembers.map((m: unknown) => Number(m.id)),
    }));
  }, [suggestedMembers]);

  const showRestoreMembers = useMemo(() => {
    const defaultIds = suggestedMembers.map((m: unknown) => Number(m.id)).sort().join(",");
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
  const _reviewStepIndex = useMemo(() => steps.findIndex((s) => s.id === "review"), [steps]);
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

  // Availability zones for the selected region — prefers fetched AZ data, falls back to region-embedded data
  const availabilityZones = useMemo(() => {
    if (!form.region) return [];

    // Prefer data from the dedicated AZ endpoint
    if (fetchedAzsData && Array.isArray(fetchedAzsData) && fetchedAzsData.length > 0) {
      return fetchedAzsData.map((az) => ({
        value: az.code || "",
        label: sanitizeProviderLabel(az.name || az.code || ""),
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

  // AZs available for replicas: all AZs in the region except the primary
  // (Provider filtering is no longer needed — AZ codes no longer embed provider names.)
  const replicaAvailableAzs = useMemo(() => {
    if (!form.availabilityZone) return availabilityZones;
    return availabilityZones.filter((az) => az.value !== form.availabilityZone);
  }, [availabilityZones, form.availabilityZone]);

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

    const params = {
      engine: form.engine,
      plan_size: form.planSize,
      region: form.region,
      months: form.months,
      replica_count: form.replicaCount,
      backup_enabled: form.backupEnabled,
    };

    try {
      const result = await quoteMutation.mutateAsync(params);
      setQuoteResult(result);
    } catch {
      // Error handled by mutation
    }
  }, [canProceedToReview, form, quoteMutation]);

  // ─── Create Order ────────────────────────────────────────────────

  const handleCreateOrder = useCallback(async () => {
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
          firewall_cidrs: form.firewallCidrs.filter(Boolean),
          months: form.months,
          fast_track: form.fastTrack,
          fast_track_ends_at: form.fastTrack && form.fastTrackEndsAt ? form.fastTrackEndsAt : undefined,
          country_iso: form.billingCountry || undefined,
          customer_context: form.customerContext,
          network_mode: form.networkMode,
          connection_pooling: form.connectionPooling,
          tls_enabled: form.tlsEnabled,
          dedicated_proxy: form.dedicatedProxy,
          vpn_gateway: form.vpnGateway,
        };

        if (form.name.trim()) payload.name = form.name.trim();
        if (form.projectId) payload.project_id = form.projectId;
        if (form.assignedTenantId) payload.tenant_id = form.assignedTenantId;
        if (form.assignedClientId) payload.client_id = form.assignedClientId;
        if (form.licenseKey.trim()) payload.license_key = form.licenseKey.trim();
        if (form.licenseMode) payload.license_mode = form.licenseMode;
        if (form.cloudAccountId) payload.cloud_account_id = form.cloudAccountId;
        // FR-031: pass plan_kind so the API picks the right wholesale tier.
        // Defaults to platform default (`management_only`) on the backend
        // when the form leaves it unset.
        if (form.planKind) payload.plan_kind = form.planKind;

        const response = await orderMutation.mutateAsync(payload);
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
          result?.isPaymentRequired
            ? "Order created! Please complete payment."
            : "Database created! Provisioning is starting.",
        fallbackErrorMessage: "Failed to create database order.",
        rethrow: false,
      }
    );
  }, [
    canProceedToReview,
    form,
    orderMutation,
    createOrderAction,
    paymentStepIndex,
    successStepIndex,
  ]);

  // ─── Payment Completion ──────────────────────────────────────────

  const handlePaymentCompleted = useCallback(() => {
    setIsPaymentSuccessful(true);
    setActiveStep(successStepIndex);
    ToastUtils.success("Payment successful! Database provisioning is starting.");
  }, [successStepIndex]);

  // ─── Pricing Summary ────────────────────────────────────────────

  const pricingSummary = useMemo(() => {
    // Prefer quote result; fall back to order pricing_breakdown
    const source = quoteResult || (orderReceipt?.pricing_breakdown as DatabaseQuoteResponse | null);
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
    return {
      subtotal: source.subtotal || 0,
      tax: source.tax || 0,
      gatewayFees: 0,
      grandTotal: source.total || 0,
      currency: source.currency || "USD",
      monthlyCost: source.monthly_cost || 0,
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
    toggleReplicaAz,

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

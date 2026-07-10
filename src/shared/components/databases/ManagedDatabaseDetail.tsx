/**
 * ManagedDatabaseDetail — Detail view for a managed database.
 *
 * Tabs: Overview, Connection, Backups, Firewall, Settings.
 */
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useManagedDatabaseBroadcasting } from "@/hooks/useManagedDatabaseBroadcasting";
import {
  ArrowLeft,
  CalendarDays,
  Copy,
  Cpu,
  Check,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Pause,
  Play,
  Trash2,
  Shield,
  Settings,
  Database as DatabaseIcon,
  Link,
  HardDrive,
  Activity,
  ArrowUpCircle,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Globe2,
  MapPin,
  Server,
  Zap,
  Code,
  KeyRound,
  Loader2,
  Wand2,
} from "lucide-react";
import { SkeletonCard } from "../ui/Skeleton";
import EngineIcon, { getEngineLabel } from "./EngineIcon";
import DatabaseStatusBadge from "./DatabaseStatusBadge";
import DatabaseProvisioningPipeline from "./DatabaseProvisioningPipeline";
import OrbitReplicationModeSelector, {
  type OrbitReplicationMode,
} from "./OrbitReplicationModeSelector";
import {
  useFetchManagedDatabaseById,
  useUpdateManagedDatabase,
  useFetchDatabaseCredentials,
  useFetchDatabaseBackups,
  useCreateDatabaseBackup,
  useRestoreDatabaseBackup,
  useFetchDatabaseBackupPolicy,
  useUpdateDatabaseBackupPolicy,
  useDatabaseAction,
  useUpdateDatabaseFirewall,
  useDeleteManagedDatabase,
  useFetchDatabaseMetrics,
  useFetchAvailableUpgrades,
  useUpgradeDatabaseEngine,
  useFetchDrEligibility,
  useFetchOrbitEligibility,
  useFetchDrStatus,
  useEnableDr,
  useDrFailover,
  useDisableDr,
  useFetchDatabaseOperations,
  useRotateDatabaseCredentials,
  useRetryDatabaseOperation,
  useReconcileDatabaseOperation,
  useFetchDatabaseUsers,
  useCreateDatabaseUser,
  useDeleteDatabaseUser,
  useRotateDatabaseUserPassword,
  useRotateDatabaseMasterPassword,
  useFetchDatabasePoolingConfig,
  useUpdateDatabasePoolingConfig,
  useResizeDatabase,
  useFetchDatabaseReplicas,
  useCreateDatabaseReplica,
  usePromoteDatabaseReplica,
  useDeleteDatabaseReplica,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type {
  ManagedDatabase,
  ManagedDatabaseBackup,
  ManagedDatabaseOperation,
  ManagedDatabaseOperationProgressStep,
} from "@/types/managedDatabase";
import ResourceProtectionTab from "@/shared/components/integrations/ResourceProtectionTab";
import { useFeatureFlags } from "@/hooks/featureFlagsHooks";

interface ManagedDatabaseDetailProps {
  identifier: string;
  backPath?: string;
  listPath?: string;
  context?: "admin" | "tenant" | "client";
}

type Tab = "overview" | "lifecycle" | "connection" | "backups" | "metrics" | "firewall" | "dr" | "protection" | "integration" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <DatabaseIcon size={16} /> },
  { id: "lifecycle", label: "Lifecycle", icon: <Server size={16} /> },
  { id: "connection", label: "Connection", icon: <Link size={16} /> },
  { id: "backups", label: "Backups", icon: <HardDrive size={16} /> },
  { id: "metrics", label: "Metrics", icon: <Activity size={16} /> },
  { id: "firewall", label: "Firewall", icon: <Shield size={16} /> },
  { id: "dr", label: "Disaster Recovery", icon: <RefreshCw size={16} /> },
  { id: "protection", label: "Protection", icon: <ShieldCheck size={16} /> },
  { id: "integration", label: "Quick Start", icon: <Code size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

const ACTIVE_PROGRESS_STATUSES = new Set(["pending", "processing", "in_progress", "queued", "running"]);
const COMPLETED_PROGRESS_STATUSES = new Set(["completed"]);
const ACTIVE_OPERATION_STATUSES = new Set(["pending", "in_progress", "verifying"]);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asMetadata = (value: ManagedDatabase["metadata"]): Record<string, unknown> =>
  asRecord(value);

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return null;
};

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  }

  const stringValue = asString(value);
  return stringValue ? [stringValue] : [];
};

const asRecordArray = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.map(asRecord).filter((item) => Object.keys(item).length > 0);
  }

  const record = asRecord(value);
  const data = record.data;
  return Array.isArray(data) ? data.map(asRecord).filter((item) => Object.keys(item).length > 0) : [];
};

const asNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getPublicIp = (db: ManagedDatabase): string | null =>
  asString(db.public_ip) || asString(asMetadata(db.metadata).public_ip);

const getDatabaseNetworkMode = (db: ManagedDatabase): string => {
  const metadata = asMetadata(db.metadata);
  return asString(metadata.network_mode) || (getPublicIp(db) ? "public" : "managed");
};

const getPublicIpDisplay = (db: ManagedDatabase): string => {
  const publicIp = getPublicIp(db);
  if (publicIp) return publicIp;

  const networkMode = getDatabaseNetworkMode(db);
  if (networkMode === "public") return "Pending allocation";
  if (networkMode === "private") return "Not requested (private mode)";

  return "Not attached";
};

const getAvailabilityZone = (db: ManagedDatabase): string =>
  asString(asMetadata(db.metadata).availability_zone) ||
  asString(asMetadata(db.metadata).primary_az) ||
  asString(asMetadata(db.metadata).az) ||
  asString(asMetadata(db.metadata).vm_availability_zone) ||
  "Pending";

const getEnginePort = (engine: ManagedDatabase["engine"]): number => {
  const ports: Partial<Record<ManagedDatabase["engine"], number>> = {
    postgresql: 5432,
    timescaledb: 5432,
    mysql: 3306,
    mariadb: 3306,
    mongodb: 27017,
    ferretdb: 27017,
    redis: 6379,
    valkey: 6379,
    keydb: 6379,
    memcached: 11211,
    cassandra: 9042,
    scylladb: 9042,
    couchdb: 5984,
    clickhouse: 8123,
    kafka: 9092,
    rabbitmq: 5672,
    nats: 4222,
    qdrant: 6333,
    elasticsearch: 9200,
    opensearch: 9200,
    meilisearch: 7700,
    neo4j: 7687,
    minio: 9000,
  };

  return ports[engine] ?? 5432;
};

const formatMoney = (value: number | string | undefined, currency = "NGN"): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "—";
  }

  // Never hardcode a currency symbol — the platform bills in naira. Render the
  // amount in its own currency (the row carries `currency`).
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${currency || "NGN"} ${numeric.toFixed(2)}`;
  }
};

const formatDateLabel = (value: string | undefined): string => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString();
};

const formatDateTimeLabel = (value: string | null | undefined): string => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
};

const getProgressOverview = (steps: ManagedDatabase["provisioning_progress"]) => {
  const list = Array.isArray(steps) ? steps : [];

  return {
    total: list.length,
    completed: list.filter((step) => COMPLETED_PROGRESS_STATUSES.has(step.status)).length,
    current:
      list.find((step) => ACTIVE_PROGRESS_STATUSES.has(step.status)) ??
      list[list.length - 1] ??
      null,
  };
};

const ManagedDatabaseDetail: React.FC<ManagedDatabaseDetailProps> = ({
  identifier,
  backPath,
  listPath,
  context: _context,
}) => {
  const resolvedBackPath = backPath || listPath || "databases";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: dbData, isLoading } = useFetchManagedDatabaseById(identifier, {
    refetchInterval: 15000,
  });

  const db = useMemo<ManagedDatabase | null>(() => {
    if (!dbData) return null;
    if (typeof dbData === "object" && dbData !== null && "data" in dbData) {
      return (dbData as { data?: ManagedDatabase }).data ?? null;
    }

    return dbData as ManagedDatabase;
  }, [dbData]);

  // FR-031: subscribe to real-time provisioning progress via Echo. The
  // backend broadcasts `progress.updated` on every step transition (VM
  // provisioning, control-plane delegation, engine install, backup setup, ready)
  // — we patch the React Query cache so the UI re-renders instantly
  // without waiting for the next 15s poll.
  const queryClient = useQueryClient();
  const broadcastIds = useMemo(() => (db?.id ? [db.id] : []), [db?.id]);

  useManagedDatabaseBroadcasting(broadcastIds, useCallback((event: unknown) => {
    const payload = event as {
      database_id?: number;
      status?: string;
      progress?: unknown[];
    } | null;
    if (!payload || !db) return;

    queryClient.setQueryData(
      ["managedDatabase", identifier],
      (prev: unknown) => {
        const wrapper = prev as { data?: ManagedDatabase } | ManagedDatabase | null;
        if (!wrapper) return prev;

        const target = (typeof wrapper === "object" && wrapper !== null && "data" in wrapper)
          ? (wrapper as { data?: ManagedDatabase }).data
          : (wrapper as ManagedDatabase);

        if (!target) return prev;

        const updated = {
          ...target,
          status: payload.status ?? target.status,
          provisioning_progress: Array.isArray(payload.progress)
            ? payload.progress as ManagedDatabase["provisioning_progress"]
            : target.provisioning_progress,
        };

        if (typeof wrapper === "object" && wrapper !== null && "data" in wrapper) {
          return { ...wrapper, data: updated };
        }
        return updated;
      }
    );
  }, [db, identifier, queryClient]));

  if (isLoading) {
    return <SkeletonCard className="my-8" />;
  }

  if (!db) {
    return <div className="py-20 text-center text-gray-500">Database not found.</div>;
  }

  const metadata = asMetadata(db.metadata);
  const publicIp = getPublicIp(db);
  const endpointHost = db.dns_record_name || publicIp || db.private_ip || "Pending endpoint";
  const progress = getProgressOverview(db.provisioning_progress);
  const tlsEnabled = metadata.tls_enabled === true;
  const networkMode = getDatabaseNetworkMode(db);
  const currentStepLabel =
    db.status === "provisioning" && progress.current ? progress.current.label : db.status.replace("_", " ");

  return (
    <div className="space-y-6">
      <section className="db-surface-hero rounded-[28px] p-5 sm:p-6">
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(resolvedBackPath)}
                className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
              >
                <ArrowLeft size={18} />
                Back to Databases
              </button>
              <span className="db-brand-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
                <DatabaseIcon size={14} />
                Managed Database
              </span>
            </div>

            <div className="flex items-start gap-4">
              <EngineIcon engine={db.engine} size={24} className="mt-1" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-[var(--theme-heading-color)] sm:text-4xl">
                    {db.name}
                  </h1>
                  <DatabaseStatusBadge status={db.status} className="shadow-sm" />
                </div>
                <p className="mt-2 text-sm text-[var(--theme-muted-color)]">
                  {db.identifier} · {getEngineLabel(db.engine)} v{db.engine_version}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="db-muted-pill rounded-full px-3 py-1 text-xs font-medium">
                    {db.plan_size.toUpperCase()} shape
                  </span>
                  <span className="db-muted-pill rounded-full px-3 py-1 text-xs font-medium">
                    {db.deployment_type}
                  </span>
                  <span className="db-muted-pill rounded-full px-3 py-1 text-xs font-medium">
                    {db.region}
                  </span>
                  {db.dr_region && (
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                      DR in {db.dr_region}
                    </span>
                  )}
                  {tlsEnabled && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                      TLS enabled
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <HeroStatCard
                label="Access Endpoint"
                value={endpointHost}
                hint={db.status === "active" ? "Ready for client traffic" : currentStepLabel}
                icon={<Globe2 size={18} />}
              />
              <HeroStatCard
                label="Compute Shape"
                value={`${db.vcpu_count} vCPU · ${Math.round(db.memory_mb / 1024)} GB`}
                hint={`${db.storage_gb} GB attached storage`}
                icon={<Cpu size={18} />}
              />
              <HeroStatCard
                label="Topology"
                value={`${db.replica_count} replica${db.replica_count === 1 ? "" : "s"}`}
                hint={`${networkMode} network mode`}
                icon={<Server size={18} />}
              />
              <HeroStatCard
                label="Monthly Run Rate"
                value={formatMoney(db.monthly_cost, db.currency)}
                hint={
                  db.plan_kind === "management_only"
                    ? "Compute + database management"
                    : `Created ${formatDateLabel(db.created_at)}`
                }
                icon={<CalendarDays size={18} />}
              />
            </div>

            {/* FR-031: plan-kind indicator with admin-only wholesale view */}
            {db.plan_kind && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-3 py-1 font-medium ${
                    db.plan_kind === "management_only"
                      ? "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                  }`}
                  title={
                    db.plan_kind === "management_only"
                      ? "UniCloud provisioned the underlying VM and manages the database engine."
                      : "Provider-managed bundle with VM included."
                  }
                >
                  {db.plan_kind === "management_only" ? "Management-only" : "Bundled"}
                </span>
                {db.plan_kind === "management_only" && db.vm_instance_id && (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[10px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                    VM: {db.vm_instance_id.slice(0, 14)}…
                  </span>
                )}
                {_context === "admin" && (() => {
                  const pricing = (metadata.pricing_breakdown ?? null) as
                    | { lines?: Array<{ name?: string; unit_amount?: number; meta?: { kind?: string; wholesale_usd?: number; retail_usd?: number } }> }
                    | null;
                  const vmLine = pricing?.lines?.find((l) => l.meta?.kind === "compute_vm");
                  const mgmtLine = pricing?.lines?.find((l) => l.meta?.kind === "managed_db_fee");
                  if (!vmLine && !mgmtLine) return null;
                  return (
                    <span
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                      title={`Wholesale: VM ${formatMoney(vmLine?.unit_amount ?? 0)} + management ${mgmtLine?.meta?.wholesale_usd != null ? "$" + mgmtLine.meta.wholesale_usd.toFixed(2) : "—"}/mo`}
                    >
                      Admin · Wholesale visible
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
      </section>

      {/* Provisioning Pipeline — shown when database is still provisioning */}
      {(db.status === "provisioning" || db.status === "payment_pending") && (
        <DatabaseProvisioningPipeline
          databaseIdentifier={identifier}
          initialProgress={db.provisioning_progress ?? undefined}
        />
      )}

      {/* Tabs */}
      <div className="db-surface-card rounded-[28px] p-2">
        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab db={db} />}
      {activeTab === "lifecycle" && <LifecycleTab db={db} identifier={identifier} />}
      {activeTab === "connection" && <ConnectionTab db={db} identifier={identifier} />}
      {activeTab === "backups" && <BackupsTab db={db} identifier={identifier} />}
      {activeTab === "metrics" && <MetricsTab db={db} identifier={identifier} />}
      {activeTab === "firewall" && <FirewallTab db={db} identifier={identifier} />}
      {activeTab === "dr" && <DrTab db={db} identifier={identifier} />}
      {activeTab === "integration" && <IntegrationTab db={db} />}
      {activeTab === "protection" && (
        <ResourceProtectionTab
          resourceType="managed-databases"
          resourceId={identifier}
          resourceName={db.name}
        />
      )}
      {activeTab === "settings" && (
        <SettingsTab db={db} identifier={identifier} backPath={resolvedBackPath} />
      )}
    </div>
  );
};

// ─── Overview Tab ────────────────────────────────────────────────

const OverviewTab: React.FC<{ db: ManagedDatabase }> = ({ db }) => {
  const metadata = asMetadata(db.metadata);
  const publicIp = getPublicIp(db);
  const tlsEnabled = metadata.tls_enabled === true;
  const progress = getProgressOverview(db.provisioning_progress);
  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : db.status === "active" ? 100 : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HeroStatCard
            label="Primary Host"
            value={db.dns_record_name || "Pending"}
            hint={db.status === "active" ? "Published and routable" : "Awaiting final routing"}
            icon={<Globe2 size={18} />}
          />
          <HeroStatCard
            label="Private Address"
            value={db.private_ip || "Pending"}
            hint="Provider-internal service path"
            icon={<Server size={18} />}
          />
          <HeroStatCard
            label="Progress"
            value={`${progressPercent}%`}
            hint={`${progress.completed}/${progress.total || 0} tracked steps complete`}
            icon={<Activity size={18} />}
          />
          <HeroStatCard
            label="Spend"
            value={formatMoney(db.monthly_cost, db.currency)}
            hint="Current monthly run rate"
            icon={<CalendarDays size={18} />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SurfaceCard
            title="Configuration Matrix"
            subtitle="Core runtime shape and engine footprint."
          >
            <dl className="grid gap-3">
              <InfoRow label="Engine" value={`${getEngineLabel(db.engine)} v${db.engine_version}`} />
              <InfoRow label="Plan" value={db.plan_size?.toUpperCase()} />
              <InfoRow label="vCPUs" value={String(db.vcpu_count)} />
              <InfoRow label="Memory" value={`${Math.round(db.memory_mb / 1024)} GB`} />
              <InfoRow label="Storage" value={`${db.storage_gb} GB`} />
              <InfoRow label="Replicas" value={String(db.replica_count)} />
              <InfoRow label="Deployment" value={db.deployment_type} />
            </dl>
          </SurfaceCard>

          <SurfaceCard
            title="Access Surface"
            subtitle="What clients and operators will use to reach the service."
          >
            <dl className="grid gap-3">
              <InfoRow label="Hostname" value={db.dns_record_name ?? "Pending"} copyable={Boolean(db.dns_record_name)} />
              <InfoRow label="Private IP" value={db.private_ip ?? "Pending"} copyable={Boolean(db.private_ip)} />
              <InfoRow label="Public IP" value={getPublicIpDisplay(db)} copyable={Boolean(publicIp)} />
              <InfoRow label="TLS" value={tlsEnabled ? "Enabled" : "Disabled"} />
              <InfoRow
                label="Firewall Rules"
                value={`${db.firewall_cidrs?.length ?? 0} CIDR entries`}
              />
            </dl>
          </SurfaceCard>
        </div>

        {/* Operational Timeline removed: the provisioning steps already live in the
            collapsible "Pipeline Steps" panel (DatabaseProvisioningPipeline) — this
            was a duplicate 13-card list that bloated the page. */}
      </div>

      <div className="space-y-6">
        <SurfaceCard
          title="Platform Context"
          subtitle="Tracking identifiers and placement metadata."
        >
          <dl className="grid gap-3">
            <InfoRow label="Region" value={db.region} />
            <InfoRow label="Project" value={db.project?.name ?? "—"} />
            <InfoRow label="Created" value={formatDateLabel(db.created_at)} />
            <InfoRow label="Resource ID" value={db.provider_resource_id ?? "Pending"} copyable={Boolean(db.provider_resource_id)} />
            {db.vm_instance_id && <InfoRow label="Instance ID" value={db.vm_instance_id} copyable />}
            {db.vm_volume_id && <InfoRow label="Volume ID" value={db.vm_volume_id} copyable />}
            {db.vm_security_group_id && (
              <InfoRow label="Security Group" value={db.vm_security_group_id} copyable />
            )}
          </dl>
        </SurfaceCard>

        <SurfaceCard
          title="Resilience Posture"
          subtitle="Signals that describe continuity, protection, and operational intent."
        >
          <div className="space-y-3">
            <PostureRow
              icon={<ShieldCheck size={16} />}
              title="Traffic guardrails"
              description={`${db.firewall_cidrs?.length ?? 0} firewall rules protecting the service surface.`}
              tone={db.firewall_cidrs?.length ? "good" : "neutral"}
            />
            <PostureRow
              icon={<RefreshCw size={16} />}
              title="Disaster recovery"
              description={db.dr_region ? `Standby strategy configured in ${db.dr_region}.` : "No DR standby attached yet."}
              tone={db.dr_region ? "good" : "neutral"}
            />
            <PostureRow
              icon={<Link size={16} />}
              title="Connection posture"
              description={db.status === "active" ? "Connection details are available for handoff." : "Connection details unlock once provisioning finishes."}
              tone={db.status === "active" ? "good" : "neutral"}
            />
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
};

// ─── Lifecycle Tab ──────────────────────────────────────────────

type LifecyclePanel = "spec" | "workloads" | "services" | "secrets" | "events";

const LIFECYCLE_PANELS: { id: LifecyclePanel; label: string; icon: React.ReactNode }[] = [
  { id: "spec", label: "Spec", icon: <Code size={15} /> },
  { id: "workloads", label: "Workloads", icon: <Server size={15} /> },
  { id: "services", label: "Services", icon: <Globe2 size={15} /> },
  { id: "secrets", label: "Secrets", icon: <KeyRound size={15} /> },
  { id: "events", label: "Events", icon: <Activity size={15} /> },
];

const boolText = (value: unknown, fallback = false): string =>
  String(asBoolean(value) ?? fallback);

const getReplicaAzs = (db: ManagedDatabase): string[] =>
  asStringArray(asMetadata(db.metadata).replica_azs);

const buildLifecycleSpec = (db: ManagedDatabase): string => {
  const metadata = asMetadata(db.metadata);
  const backup = asRecord(metadata.backup);
  const primaryAz = getAvailabilityZone(db);
  const replicaAzs = getReplicaAzs(db);
  const publicIp = getPublicIp(db);
  const networkMode = getDatabaseNetworkMode(db);
  const endpoint = db.dns_record_name || "Pending";
  const port = getEnginePort(db.engine);
  const providerResourceId = db.provider_resource_id || "Pending";

  const lines = [
    "apiVersion: manageddb.unicloudafrica.ng/v1",
    "kind: ManagedDatabase",
    "metadata:",
    `  name: ${db.name}`,
    `  identifier: ${db.identifier}`,
    `  project: ${db.project?.identifier || db.project?.name || "Pending"}`,
    "spec:",
    `  engine: ${db.engine}`,
    `  version: ${db.engine_version}`,
    `  planKind: ${db.plan_kind || "management_only"}`,
    `  resourcesPreset: ${db.plan_size}`,
    `  replicas: ${db.replica_count}`,
    `  storage: ${db.storage_gb}Gi`,
    "  compute:",
    `    vcpu: ${db.vcpu_count}`,
    `    memory: ${Math.round(db.memory_mb / 1024)}Gi`,
    "  placement:",
    `    region: ${db.region}`,
    `    availabilityZone: ${primaryAz}`,
  ];

  if (replicaAzs.length > 0) {
    lines.push("    replicaAzs:", ...replicaAzs.map((az) => `      - ${az}`));
  } else {
    lines.push("    replicaAzs: []");
  }

  lines.push(
    "  network:",
    `    mode: ${networkMode}`,
    `    endpoint: ${endpoint}`,
    `    port: ${port}`,
    `    privateIp: ${db.private_ip || "Pending"}`,
    `    publicIp: ${publicIp || (networkMode === "public" ? "Pending" : "Not requested")}`,
    `    tlsEnabled: ${boolText(metadata.tls_enabled, true)}`,
    `    connectionPooling: ${boolText(metadata.connection_pooling, false)}`,
    `    dedicatedProxy: ${boolText(metadata.dedicated_proxy, false)}`,
    `    vpnGateway: ${boolText(metadata.vpn_gateway, false)}`,
    "  firewall:",
  );

  if (db.firewall_cidrs?.length) {
    lines.push(...db.firewall_cidrs.map((cidr) => `    - ${cidr}`));
  } else {
    lines.push("    []");
  }

  lines.push(
    "  backup:",
    `    enabled: ${boolText(backup.enabled ?? metadata.backup_enabled, false)}`,
    `    retentionDays: ${String(backup.retention_days ?? metadata.backup_retention_days ?? "Default")}`,
    "status:",
    `  phase: ${db.status}`,
    `  providerResourceId: ${providerResourceId}`,
    `  vmInstanceId: ${db.vm_instance_id || "Pending"}`,
    `  controlPlaneDelegated: ${boolText(metadata.staqdb_delegated, Boolean(db.provider_resource_id))}`,
  );

  return lines.join("\n");
};

const getRuntimeTone = (status: string): "good" | "warn" | "bad" | "neutral" => {
  if (["active", "running", "ready", "synced", "completed"].includes(status)) return "good";
  if (["provisioning", "pending", "queued", "processing", "in_progress"].includes(status)) return "warn";
  if (["error", "failed", "terminated", "deleting"].includes(status)) return "bad";
  return "neutral";
};

const formatLifecycleContext = (context: Record<string, unknown> | undefined): string => {
  const entries = Object.entries(context ?? {}).filter(([, value]) =>
    ["string", "number", "boolean"].includes(typeof value)
  );

  if (entries.length === 0) return "No additional context";

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`)
    .join(" · ");
};

const LifecycleTab: React.FC<{ db: ManagedDatabase; identifier: string }> = ({ db, identifier }) => {
  const [activePanel, setActivePanel] = useState<LifecyclePanel>("spec");
  const metadata = asMetadata(db.metadata);
  const publicIp = getPublicIp(db);
  const networkMode = getDatabaseNetworkMode(db);
  const delegated = asBoolean(metadata.staqdb_delegated) ?? Boolean(db.provider_resource_id);
  const primaryAz = getAvailabilityZone(db);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroStatCard
          label="Lifecycle Phase"
          value={db.status.replace(/_/g, " ")}
          hint={delegated ? "Database control plane attached" : "Awaiting control-plane handoff"}
          icon={<Activity size={18} />}
        />
        <HeroStatCard
          label="Availability Zone"
          value={primaryAz}
          hint="Provisioning is AZ-scoped"
          icon={<MapPin size={18} />}
        />
        <HeroStatCard
          label="Network"
          value={networkMode}
          hint={publicIp ? `Public ${publicIp}` : db.private_ip ? `Private ${db.private_ip}` : "Address pending"}
          icon={<Globe2 size={18} />}
        />
        <HeroStatCard
          label="Runtime Port"
          value={String(getEnginePort(db.engine))}
          hint={`${getEngineLabel(db.engine)} client protocol`}
          icon={<Link size={18} />}
        />
      </div>

      <SurfaceCard
        title="Lifecycle Console"
        subtitle="UniCloud control-plane view of the managed database runtime."
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {LIFECYCLE_PANELS.map((panel) => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                activePanel === panel.id
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                  : "db-surface-soft text-[var(--theme-muted-color)] hover:text-[var(--theme-heading-color)]"
              }`}
            >
              {panel.icon}
              {panel.label}
            </button>
          ))}
        </div>

        {activePanel === "spec" && <LifecycleSpecPanel db={db} />}
        {activePanel === "workloads" && <LifecycleWorkloadsPanel db={db} />}
        {activePanel === "services" && <LifecycleServicesPanel db={db} />}
        {activePanel === "secrets" && <LifecycleSecretsPanel db={db} identifier={identifier} />}
        {activePanel === "events" && <LifecycleEventsPanel db={db} />}
      </SurfaceCard>
    </div>
  );
};

const LifecycleSpecPanel: React.FC<{ db: ManagedDatabase }> = ({ db }) => {
  const spec = useMemo(() => buildLifecycleSpec(db), [db]);
  return <CopyableCodeBlock value={spec} />;
};

const LifecycleWorkloadsPanel: React.FC<{ db: ManagedDatabase }> = ({ db }) => {
  const metadata = asMetadata(db.metadata);
  const delegated = asBoolean(metadata.staqdb_delegated) ?? Boolean(db.provider_resource_id);
  const ready = db.status === "active" ? "1/1" : "0/1";
  const installReady = ["active", "paused"].includes(db.status) ? "1/1" : "0/1";
  const rows = [
    {
      name: db.vm_instance_id || `${db.name}-vm`,
      kind: "UniCloud VM",
      status: db.status === "active" ? "running" : db.status,
      ready,
      location: getAvailabilityZone(db),
      age: formatDateLabel(db.created_at),
    },
    {
      name: `${db.name}-db-agent`,
      kind: "Managed database agent",
      status: delegated ? "synced" : "pending",
      ready: delegated ? "1/1" : "0/1",
      location: db.provider_resource_id || "Awaiting provider resource",
      age: formatDateLabel(db.updated_at),
    },
    {
      name: `${db.name}-${db.engine}`,
      kind: `${getEngineLabel(db.engine)} runtime`,
      status: db.status === "active" ? "ready" : db.status,
      ready: installReady,
      location: db.private_ip || getPublicIp(db) || "Address pending",
      age: formatDateLabel(db.updated_at),
    },
  ];

  return <LifecycleTable columns={["Name", "Kind", "Status", "Ready", "Location", "Age"]} rows={rows} />;
};

const LifecycleServicesPanel: React.FC<{ db: ManagedDatabase }> = ({ db }) => {
  const networkMode = getDatabaseNetworkMode(db);
  const publicIp = getPublicIp(db);
  const port = getEnginePort(db.engine);
  const metadata = asMetadata(db.metadata);
  const connectionPooling = asBoolean(metadata.connection_pooling) ?? false;
  const rows = [
    {
      name: `${db.name}-dns`,
      kind: "UniCloud DNS",
      status: db.dns_record_name ? "ready" : "pending",
      address: db.dns_record_name || "Pending",
      ports: `${port}/TCP`,
      age: formatDateLabel(db.updated_at),
    },
    {
      name: `${db.name}-private`,
      kind: "Private service",
      status: db.private_ip ? "ready" : "pending",
      address: db.private_ip || "Pending",
      ports: `${port}/TCP`,
      age: formatDateLabel(db.updated_at),
    },
    {
      name: `${db.name}-public`,
      kind: "Public route",
      status: publicIp ? "ready" : networkMode === "public" ? "pending" : "not requested",
      address: publicIp || (networkMode === "public" ? "Pending" : "Private mode"),
      ports: `${port}/TCP`,
      age: formatDateLabel(db.updated_at),
    },
    {
      name: `${db.name}-pooler`,
      kind: "Connection pooler",
      status: connectionPooling ? "ready" : "disabled",
      address: connectionPooling ? db.dns_record_name || db.private_ip || "Pending" : "Disabled",
      ports: `${port}/TCP`,
      age: formatDateLabel(db.updated_at),
    },
  ];

  return <LifecycleTable columns={["Name", "Kind", "Status", "Address", "Ports", "Age"]} rows={rows} />;
};

const LifecycleSecretsPanel: React.FC<{ db: ManagedDatabase; identifier: string }> = ({ db, identifier }) => {
  const [showSecrets, setShowSecrets] = useState(false);
  const { data: credentialsData, refetch } = useFetchDatabaseCredentials(identifier, {
    enabled: showSecrets,
  });

  const handleReveal = useCallback(() => {
    setShowSecrets(true);
    refetch();
  }, [refetch]);

  const credentials = credentialsData?.credentials;
  const port = getEnginePort(db.engine);
  const secretName = `${db.name}-${db.engine}-credentials`;
  const rows = credentials
    ? [
        { label: "host", value: credentials.host, secret: false },
        { label: "port", value: String(credentials.port), secret: false },
        { label: "username", value: credentials.username, secret: false },
        { label: "password", value: credentials.password, secret: true },
        { label: "database", value: credentials.database, secret: false },
        {
          label: "connection_string",
          value: credentialsData.connection_string || credentials.connection_string || "",
          secret: true,
        },
      ].filter((row) => row.value)
    : [
        { label: "host", value: db.dns_record_name || getPublicIp(db) || db.private_ip || "Pending", secret: false },
        { label: "port", value: String(port), secret: false },
        { label: "username", value: "Hidden until reveal", secret: true },
        { label: "password", value: "Hidden until reveal", secret: true },
        { label: "database", value: "Hidden until reveal", secret: true },
      ];

  return (
    <div className="space-y-4">
      <div className="db-surface-soft rounded-[24px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--theme-heading-color)]">{secretName}</p>
            <p className="mt-1 text-xs text-[var(--theme-muted-color)]">
              Opaque credential set · {rows.length} key{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          {!showSecrets ? (
            <button
              onClick={handleReveal}
              className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium"
            >
              <Eye size={16} />
              Reveal
            </button>
          ) : (
            <button
              onClick={() => setShowSecrets(false)}
              className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium"
            >
              <EyeOff size={16} />
              Hide
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-200 overflow-hidden rounded-[24px] border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {rows.map((row) => (
          <SecretLifecycleRow
            key={row.label}
            label={row.label}
            value={row.value}
            masked={row.secret && !showSecrets}
            copyable={showSecrets && row.value !== "Hidden until reveal"}
          />
        ))}
      </div>
    </div>
  );
};

const LifecycleEventsPanel: React.FC<{ db: ManagedDatabase }> = ({ db }) => {
  const progress = Array.isArray(db.provisioning_progress) ? db.provisioning_progress : [];
  const rows = progress.length
    ? progress.map((step) => ({
        name: step.label,
        kind: step.id.replace(/_/g, " "),
        status: step.status,
        details: formatLifecycleContext(step.context),
        age: formatDateTimeLabel(asString(step.context?.updated_at) || asString(step.context?.timestamp) || db.updated_at),
      }))
    : [
        {
          name: "Database record created",
          kind: "lifecycle",
          status: "completed",
          details: db.identifier,
          age: formatDateTimeLabel(db.created_at),
        },
        {
          name: "Last control-plane sync",
          kind: "lifecycle",
          status: db.status,
          details: db.provider_resource_id || "Provider resource pending",
          age: formatDateTimeLabel(db.updated_at),
        },
      ];

  return <LifecycleTable columns={["Event", "Type", "Status", "Details", "Time"]} rows={rows} />;
};

// ─── Connection Tab ──────────────────────────────────────────────

const ConnectionTab: React.FC<{ db: ManagedDatabase; identifier: string }> = ({
  db,
  identifier,
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [poolingEnabled, setPoolingEnabled] = useState(false);
  const [poolMode, setPoolMode] = useState("transaction");
  const [poolSize, setPoolSize] = useState(20);
  const [maxClientConnections, setMaxClientConnections] = useState(200);
  const [idleTimeout, setIdleTimeout] = useState(300);
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("readwrite");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [oneTimePassword, setOneTimePassword] = useState<{ label: string; password: string } | null>(null);
  const { data: credentialsData, refetch: fetchCredentials } = useFetchDatabaseCredentials(
    identifier,
    { enabled: showCredentials }
  );
  const { data: poolingConfig } = useFetchDatabasePoolingConfig(identifier, {
    enabled: db.status === "active",
  });
  const updatePoolingMutation = useUpdateDatabasePoolingConfig();
  const { data: usersData, isLoading: usersLoading } = useFetchDatabaseUsers(identifier, {
    enabled: db.status === "active",
  });
  const createUserMutation = useCreateDatabaseUser();
  const deleteUserMutation = useDeleteDatabaseUser();
  const rotateUserPasswordMutation = useRotateDatabaseUserPassword();
  const rotateMasterPasswordMutation = useRotateDatabaseMasterPassword();
  const poolingRecord = asRecord(poolingConfig);
  const users = asRecordArray(usersData);

  const handleReveal = useCallback(() => {
    setShowCredentials(true);
    fetchCredentials();
  }, [fetchCredentials]);

  React.useEffect(() => {
    if (!poolingConfig) return;
    setPoolingEnabled(asBoolean(poolingRecord.enabled) ?? false);
    setPoolMode(asString(poolingRecord.pool_mode) ?? "transaction");
    setPoolSize(asNumber(poolingRecord.pool_size, 20));
    setMaxClientConnections(asNumber(poolingRecord.max_client_connections, 200));
    setIdleTimeout(asNumber(poolingRecord.idle_timeout, 300));
  }, [
    poolingConfig,
    poolingRecord.enabled,
    poolingRecord.idle_timeout,
    poolingRecord.max_client_connections,
    poolingRecord.pool_mode,
    poolingRecord.pool_size,
  ]);

  if (db.status !== "active") {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50/90 p-6 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Connection details appear here as soon as the service becomes active.
        </p>
      </div>
    );
  }

  const metadata = asMetadata(db.metadata);
  const publicIp = getPublicIp(db);
  const tlsEnabled = metadata.tls_enabled === true;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <div className="space-y-6">
        {db.connection_string && (
          <SurfaceCard
            title="Connection String"
            subtitle="Use this when your client accepts a direct URI."
          >
            <CopyableField value={db.connection_string} />
          </SurfaceCard>
        )}

        <SurfaceCard
          title="Credentials"
          subtitle="Reveal only when you need to hand the service to an operator or application team."
          action={
            !showCredentials ? (
              <button
                onClick={handleReveal}
                className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
              >
                <Eye size={16} />
                Reveal Credentials
              </button>
            ) : (
              <button
                onClick={() => setShowCredentials(false)}
                className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
              >
                <EyeOff size={16} />
                Hide
              </button>
            )
          }
        >
          {showCredentials && credentialsData?.credentials ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Host" value={credentialsData.credentials.host} copyable />
              <InfoRow label="Port" value={String(credentialsData.credentials.port)} copyable />
              <InfoRow label="Username" value={credentialsData.credentials.username} copyable />
              <InfoRow label="Password" value={credentialsData.credentials.password} copyable />
              <InfoRow label="Database" value={credentialsData.credentials.database} copyable />
            </dl>
          ) : showCredentials ? (
            <p className="text-sm text-slate-500">Loading credentials...</p>
          ) : (
            <p className="text-sm text-slate-500">
              Click &quot;Reveal Credentials&quot; to view connection details.
            </p>
          )}
        </SurfaceCard>

        <SurfaceCard
          title="Database Users"
          subtitle="Create application logins and rotate user passwords."
          action={
            <button
              onClick={() => {
                createUserMutation.mutate(
                  {
                    identifier,
                    username: newUserName.trim(),
                    role: newUserRole,
                    password: newUserPassword,
                  },
                  {
                    onSuccess: () => {
                      setNewUserName("");
                      setNewUserPassword("");
                    },
                  }
                );
              }}
              disabled={!newUserName.trim() || newUserPassword.length < 12 || createUserMutation.isPending}
              className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
            >
              {createUserMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add User
            </button>
          }
        >
          <div className="grid gap-3 md:grid-cols-[1fr_160px_1fr]">
            <input
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              placeholder="username"
              className="db-surface-soft rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
            />
            <select
              value={newUserRole}
              onChange={(event) => setNewUserRole(event.target.value)}
              className="db-surface-soft rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
            >
              <option value="readwrite">Read/write</option>
              <option value="readonly">Read only</option>
              <option value="admin">Admin</option>
            </select>
            <input
              type="password"
              value={newUserPassword}
              onChange={(event) => setNewUserPassword(event.target.value)}
              placeholder="minimum 12 characters"
              className="db-surface-soft rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
            />
          </div>

          <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-[24px] border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {usersLoading ? (
              <div className="px-4 py-4 text-sm text-[var(--theme-muted-color)]">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="px-4 py-4 text-sm text-[var(--theme-muted-color)]">No database users found.</div>
            ) : (
              users.map((user) => {
                const userId = asNumber(user.id, 0);
                const username = asString(user.username) ?? `user-${userId}`;
                return (
                  <div key={`${username}-${userId}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--theme-heading-color)]">{username}</p>
                      <p className="text-xs text-[var(--theme-muted-color)]">
                        {asString(user.role) ?? "role unknown"} · {asString(user.status) ?? "active"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          rotateUserPasswordMutation.mutate(
                            { identifier, userId },
                            {
                              onSuccess: (data) => {
                                const password = asString(asRecord(data).password);
                                if (password) setOneTimePassword({ label: username, password });
                              },
                            }
                          )
                        }
                        disabled={!userId || rotateUserPasswordMutation.isPending}
                        className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition disabled:opacity-60"
                      >
                        <RotateCcw size={14} />
                        Rotate
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete database user "${username}"?`)) {
                            deleteUserMutation.mutate({ identifier, userId });
                          }
                        }}
                        disabled={!userId || deleteUserMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SurfaceCard>
      </div>

      <div className="space-y-6">
        <SurfaceCard
          title="Connection Posture"
          subtitle="What the runtime currently exposes to clients."
        >
          <dl className="grid gap-3">
            <InfoRow label="Hostname" value={db.dns_record_name ?? "Pending"} copyable={Boolean(db.dns_record_name)} />
            <InfoRow label="Private IP" value={db.private_ip ?? "Pending"} copyable={Boolean(db.private_ip)} />
            <InfoRow label="Public IP" value={getPublicIpDisplay(db)} copyable={Boolean(publicIp)} />
            <InfoRow label="TLS" value={tlsEnabled ? "Enabled" : "Disabled"} />
            <InfoRow label="Firewall Rules" value={`${db.firewall_cidrs?.length ?? 0} CIDRs`} />
          </dl>
        </SurfaceCard>

        <SurfaceCard
          title="Operator Notes"
          subtitle="Quick pointers for GUI clients and handoff."
        >
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Use the published hostname where possible so DNS can absorb future address changes without
              reconfiguring clients.
            </p>
            <p>
              If TLS is disabled, configure your client explicitly instead of letting it guess.
            </p>
            <p>
              Credentials are fetched on demand and stay hidden until revealed in this view.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Pooling"
          subtitle="Connection pooling settings for supported engines."
          action={
            <button
              onClick={() =>
                updatePoolingMutation.mutate({
                  identifier,
                  config: {
                    enabled: poolingEnabled,
                    pool_mode: poolMode,
                    pool_size: poolSize,
                    max_client_connections: maxClientConnections,
                    idle_timeout: idleTimeout,
                  },
                })
              }
              disabled={updatePoolingMutation.isPending}
              className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
            >
              {updatePoolingMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save
            </button>
          }
        >
          <div className="space-y-4">
            <label className="db-surface-soft flex items-center justify-between rounded-[22px] px-4 py-4">
              <span className="text-sm font-semibold text-[var(--theme-heading-color)]">Enabled</span>
              <input
                type="checkbox"
                checked={poolingEnabled}
                onChange={(event) => setPoolingEnabled(event.target.checked)}
                className="h-5 w-5 accent-[var(--theme-color)]"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
                  Pool Mode
                </span>
                <select
                  value={poolMode}
                  onChange={(event) => setPoolMode(event.target.value)}
                  className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
                >
                  <option value="transaction">Transaction</option>
                  <option value="session">Session</option>
                  <option value="statement">Statement</option>
                  <option value="readwrite">Read/write</option>
                  <option value="readonly">Read only</option>
                </select>
              </label>
              <NumericSetting label="Pool Size" value={poolSize} min={1} max={500} onChange={setPoolSize} />
              <NumericSetting
                label="Max Clients"
                value={maxClientConnections}
                min={1}
                max={10000}
                onChange={setMaxClientConnections}
              />
              <NumericSetting label="Idle Timeout" value={idleTimeout} min={0} max={86400} onChange={setIdleTimeout} />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Master Password"
          subtitle="Rotate the stored admin password and copy the one-time value."
        >
          <button
            onClick={() =>
              rotateMasterPasswordMutation.mutate(
                { identifier },
                {
                  onSuccess: (data) => {
                    const password = asString(asRecord(data).password);
                    if (password) setOneTimePassword({ label: "master", password });
                    fetchCredentials();
                  },
                }
              )
            }
            disabled={rotateMasterPasswordMutation.isPending}
            className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
          >
            {rotateMasterPasswordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            Rotate Master Password
          </button>
        </SurfaceCard>
      </div>

      {oneTimePassword && (
        <OneTimePasswordModal
          label={oneTimePassword.label}
          password={oneTimePassword.password}
          onClose={() => setOneTimePassword(null)}
        />
      )}
    </div>
  );
};

// ─── Backups Tab ─────────────────────────────────────────────────

const BackupsTab: React.FC<{ db: ManagedDatabase; identifier: string }> = ({ db, identifier }) => {
  const { data: backups, isLoading } = useFetchDatabaseBackups(identifier);
  const { data: backupPolicy } = useFetchDatabaseBackupPolicy(identifier, {
    enabled: Boolean(identifier),
  });
  const createBackupMutation = useCreateDatabaseBackup();
  const restoreMutation = useRestoreDatabaseBackup();
  const updatePolicyMutation = useUpdateDatabaseBackupPolicy();
  const policyRecord = asRecord(backupPolicy);
  const metadataBackup = asRecord(asMetadata(db.metadata).backup);
  const [manualBackupName, setManualBackupName] = useState("");
  const [backupEnabled, setBackupEnabled] = useState(
    asBoolean(policyRecord.backup_enabled ?? metadataBackup.backup_enabled ?? metadataBackup.enabled) ??
      Boolean(db.backup_enabled)
  );
  const [retentionDays, setRetentionDays] = useState(
    asNumber(policyRecord.retention_days ?? metadataBackup.retention_days ?? db.backup_retention_days, 7)
  );
  const [preferredWindow, setPreferredWindow] = useState(
    asString(policyRecord.preferred_window ?? metadataBackup.preferred_window) ?? "02:00-04:00"
  );

  const backupList = useMemo(() => {
    if (!backups) return [];
    return Array.isArray(backups) ? backups : [];
  }, [backups]);

  React.useEffect(() => {
    setBackupEnabled(
      asBoolean(policyRecord.backup_enabled ?? metadataBackup.backup_enabled ?? metadataBackup.enabled) ??
        Boolean(db.backup_enabled)
    );
    setRetentionDays(
      asNumber(policyRecord.retention_days ?? metadataBackup.retention_days ?? db.backup_retention_days, 7)
    );
    setPreferredWindow(asString(policyRecord.preferred_window ?? metadataBackup.preferred_window) ?? "02:00-04:00");
  }, [
    db.backup_enabled,
    db.backup_retention_days,
    metadataBackup.backup_enabled,
    metadataBackup.enabled,
    metadataBackup.preferred_window,
    metadataBackup.retention_days,
    policyRecord.backup_enabled,
    policyRecord.preferred_window,
    policyRecord.retention_days,
  ]);

  return (
    <div className="space-y-6">
      <SurfaceCard
        title="Backup Policy"
        subtitle="Automated protection settings handed to the database control plane."
        action={
          <button
            onClick={() =>
              updatePolicyMutation.mutate({
                identifier,
                backup_enabled: backupEnabled,
                retention_days: retentionDays,
                preferred_window: preferredWindow,
              })
            }
            disabled={updatePolicyMutation.isPending}
            className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
          >
            {updatePolicyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save Policy
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="db-surface-soft flex items-center justify-between rounded-[22px] px-4 py-4">
            <span>
              <span className="block text-sm font-semibold text-[var(--theme-heading-color)]">Automated backups</span>
              <span className="text-xs text-[var(--theme-muted-color)]">Enable scheduled snapshots</span>
            </span>
            <input
              type="checkbox"
              checked={backupEnabled}
              onChange={(event) => setBackupEnabled(event.target.checked)}
              className="h-5 w-5 accent-[var(--theme-color)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
              Retention Days
            </span>
            <input
              type="number"
              min={1}
              max={35}
              value={retentionDays}
              onChange={(event) => setRetentionDays(Number(event.target.value))}
              className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
              Preferred Window
            </span>
            <input
              value={preferredWindow}
              onChange={(event) => setPreferredWindow(event.target.value)}
              placeholder="02:00-04:00"
              className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
            />
          </label>
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="Manual Snapshots"
        subtitle="Create on-demand restore points and restore completed backups."
        action={
          db.status === "active" ? (
            <button
              onClick={() => {
                createBackupMutation.mutate({ identifier, name: manualBackupName.trim() || undefined });
                setManualBackupName("");
              }}
              disabled={createBackupMutation.isPending}
              className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
            >
              {createBackupMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Create Backup
            </button>
          ) : null
        }
      >
        {db.status === "active" && (
          <label className="mb-4 block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
              Snapshot Name
            </span>
            <input
              value={manualBackupName}
              onChange={(event) => setManualBackupName(event.target.value)}
              placeholder={`${db.name}-${new Date().toISOString().slice(0, 10)}`}
              className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
            />
          </label>
        )}

        {isLoading ? (
          <p className="text-sm text-[var(--theme-muted-color)]">Loading backups...</p>
        ) : backupList.length === 0 ? (
          <div className="db-surface-soft rounded-[22px] px-4 py-8 text-center text-sm text-[var(--theme-muted-color)]">
            No backups found.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-[24px] border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {backupList.map((backup: ManagedDatabaseBackup) => (
              <div key={backup.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold capitalize text-[var(--theme-heading-color)]">
                      {backup.name || backup.type}
                    </span>
                    <RuntimeStatusPill status={backup.status} />
                  </div>
                  <div className="mt-1 text-xs text-[var(--theme-muted-color)]">
                    {backup.started_at ? new Date(backup.started_at).toLocaleString() : "—"}
                    {backup.size_mb ? ` · ${backup.size_mb.toFixed(1)} MB` : ""}
                  </div>
                </div>
                {["completed", "available"].includes(backup.status) && (
                  <button
                    onClick={() => {
                      if (confirm("Restore this backup? This will overwrite current data.")) {
                        restoreMutation.mutate({ identifier, backupId: backup.id });
                      }
                    }}
                    disabled={restoreMutation.isPending}
                    className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition disabled:opacity-60"
                  >
                    <RotateCcw size={14} />
                    Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
};

// ─── Metrics Tab ────────────────────────────────────────────────

const MetricsTab: React.FC<{ db: ManagedDatabase; identifier: string }> = ({ db, identifier }) => {
  const { data: metrics, isLoading: metricsLoading } = useFetchDatabaseMetrics(identifier, {
    enabled: db.status === "active",
  });
  const { data: upgrades, isLoading: upgradesLoading } = useFetchAvailableUpgrades(identifier, {
    enabled: db.status === "active",
  });
  const upgradeMutation = useUpgradeDatabaseEngine();
  const [selectedVersion, setSelectedVersion] = useState("");

  if (db.status !== "active") {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-yellow-800 dark:text-yellow-400">
          Metrics are available once the database is active.
        </p>
      </div>
    );
  }

  const rawConnections = metrics?.connections?.latest as
    | { active?: number; idle?: number; total?: number; max_connections?: number; max?: number }
    | undefined;
  const connections = rawConnections
    ? {
        active: rawConnections.active ?? 0,
        idle: rawConnections.idle ?? 0,
        total: rawConnections.total ?? 0,
        max: rawConnections.max ?? rawConnections.max_connections ?? 200,
      }
    : undefined;

  const rawDisk = metrics?.disk_usage?.latest as
    | { database?: { database_size_pretty?: string; database_size_bytes?: number }; database_size?: string; percentage_used?: number; top_tables?: unknown[] }
    | undefined;
  const diskUsage = rawDisk
    ? {
        database_size: rawDisk.database?.database_size_pretty ?? rawDisk.database_size ?? "—",
        database_size_bytes: rawDisk.database?.database_size_bytes ?? 0,
        percentage_used: rawDisk.percentage_used ?? (db.storage_gb ? Math.round(((rawDisk.database?.database_size_bytes ?? 0) / (db.storage_gb * 1024 * 1024 * 1024)) * 100) : undefined),
        top_tables: rawDisk.top_tables ?? [],
      }
    : undefined;

  const slowQueries = metrics?.slow_queries?.latest as
    | { count?: number; threshold_ms?: number; slow_queries?: unknown[] }
    | undefined;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Connections Card */}
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Connections
          </h3>
          {metricsLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : connections ? (
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Active</dt>
                <dd className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {connections.active}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Idle</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {connections.idle}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Total</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {connections.total}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Max Allowed</dt>
                <dd className="text-sm text-gray-600 dark:text-gray-300">
                  {connections.max}
                </dd>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Utilization</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {connections.max > 0 ? Math.round((connections.total / connections.max) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      connections.max > 0 && (connections.total / connections.max) > 0.9
                        ? "bg-red-500"
                        : connections.max > 0 && (connections.total / connections.max) > 0.7
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${connections.max > 0 ? Math.min(Math.round((connections.total / connections.max) * 100), 100) : 0}%` }}
                  />
                </div>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No connection data available.</p>
          )}
        </div>

        {/* Disk Usage Card */}
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Disk Usage
          </h3>
          {metricsLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : diskUsage ? (
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Database Size</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {diskUsage.database_size ?? "—"}
                </dd>
              </div>
              {diskUsage.percentage_used != null && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Usage</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {diskUsage.percentage_used}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${
                        diskUsage.percentage_used > 90
                          ? "bg-red-500"
                          : diskUsage.percentage_used > 70
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(diskUsage.percentage_used, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No disk usage data available.</p>
          )}
        </div>

        {/* Slow Queries Card */}
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Slow Queries
          </h3>
          {metricsLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : slowQueries ? (
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Detected</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {slowQueries.count ?? 0}
                </dd>
              </div>
              {slowQueries.threshold_ms != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Threshold</dt>
                  <dd className="text-sm text-gray-600 dark:text-gray-300">
                    {slowQueries.threshold_ms} ms
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No slow query data available.</p>
          )}
        </div>
      </div>

      {/* Engine Upgrade Section */}
      <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpCircle size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold">Engine Upgrade</h3>
        </div>
        {upgradesLoading ? (
          <p className="text-sm text-gray-500">Checking for available upgrades...</p>
        ) : upgrades && upgrades.available_versions && upgrades.available_versions.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current version:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {upgrades.current_version}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">Select target version</option>
                {upgrades.available_versions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (
                    selectedVersion &&
                    confirm(
                      `Upgrade to version ${selectedVersion}? The database will be temporarily unavailable during the upgrade.`
                    )
                  ) {
                    upgradeMutation.mutate({ identifier, targetVersion: selectedVersion });
                  }
                }}
                disabled={!selectedVersion || upgradeMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowUpCircle size={16} />
                {upgradeMutation.isPending ? "Upgrading..." : "Upgrade"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Running {db.engine_version} — no upgrades available.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Firewall Tab ────────────────────────────────────────────────

const FirewallTab: React.FC<{ db: ManagedDatabase; identifier: string }> = ({ db, identifier }) => {
  const [cidrs, setCidrs] = useState<string[]>(db.firewall_cidrs ?? ["0.0.0.0/0"]);
  const [newCidr, setNewCidr] = useState("");
  const updateFirewall = useUpdateDatabaseFirewall();

  const handleAdd = useCallback(() => {
    if (newCidr && !cidrs.includes(newCidr)) {
      setCidrs((prev) => [...prev, newCidr]);
      setNewCidr("");
    }
  }, [newCidr, cidrs]);

  const handleRemove = useCallback((cidr: string) => {
    setCidrs((prev) => prev.filter((c) => c !== cidr));
  }, []);

  const handleSave = useCallback(() => {
    updateFirewall.mutate({ identifier, firewallCidrs: cidrs });
  }, [identifier, cidrs, updateFirewall]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Firewall Rules</h3>
          <p className="text-sm text-gray-500">
            Control which IP addresses can connect to your database.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateFirewall.isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {updateFirewall.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newCidr}
          onChange={(e) => setNewCidr(e.target.value)}
          placeholder="e.g., 10.0.0.0/8"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Add
        </button>
      </div>

      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
        {cidrs.map((cidr) => (
          <div key={cidr} className="flex items-center justify-between px-4 py-3">
            <code className="text-sm">{cidr}</code>
            <button onClick={() => handleRemove(cidr)} className="text-red-500 hover:text-red-700">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {cidrs.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No firewall rules. All traffic will be blocked.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Disaster Recovery Tab ───────────────────────────────────────

const DrTab: React.FC<{ db: ManagedDatabase; identifier: string }> = ({ db, identifier }) => {
  // FE mirror of the backend `managed_database_dr_ordering` flag. Enabling DR
  // hits the same order-time guard that 422s when the flag is off, so we hide
  // the enable form (and fail closed to "coming soon") unless ordering is on.
  const { data: featureFlags } = useFeatureFlags();
  const drOrderingEnabled = featureFlags?.managed_database_dr_ordering ?? false;
  const { data: eligibility, isLoading: eligibilityLoading } = useFetchDrEligibility(identifier, {
    enabled: db.status === "active" && !db.dr_region,
  });
  // Orbit eligibility is fetched in parallel — same gating as DR. The
  // wizard renders Standard (same-provider AZs from `eligibility`) or
  // Orbit (cross-provider-aware AZs from `orbitEligibility`) based on
  // the mode selector below.
  const { data: orbitEligibility, isLoading: orbitEligibilityLoading } = useFetchOrbitEligibility(
    identifier,
    { enabled: db.status === "active" && !db.dr_region },
  );
  const { data: drStatus, isLoading: statusLoading } = useFetchDrStatus(identifier, {
    enabled: !!db.dr_region || !!db.dr_primary_id,
  });
  const enableDrMutation = useEnableDr();
  const failoverMutation = useDrFailover();
  const disableDrMutation = useDisableDr();
  const [selectedAz, setSelectedAz] = useState("");
  const [selectedMode, setSelectedMode] = useState<OrbitReplicationMode>("standard");

  // Switching mode invalidates the AZ pick — the AZ list shape changes
  // (standard shows same-provider only; Orbit shows cross-provider).
  // Clearing the selection forces the user to make an explicit choice
  // for the new mode rather than silently submitting a stale AZ that
  // doesn't belong to the current mode's list.
  const handleModeChange = useCallback((mode: OrbitReplicationMode) => {
    setSelectedMode(mode);
    setSelectedAz("");
  }, []);

  // This is a DR replica — show replica info
  if (db.dr_primary_id) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <RefreshCw className="mt-0.5 h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-300">DR Standby Replica</p>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              This database is a disaster recovery standby. It receives continuous replication from the
              primary and will be promoted automatically if the primary fails.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // DR is already enabled — show status
  if (db.dr_region || drStatus?.dr_enabled) {
    const standby = drStatus?.standby;

    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-green-800 dark:text-green-300">DR Enabled</p>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-800 dark:text-green-300">
                Active
              </span>
            </div>
            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
              A standby replica is maintaining continuous replication for disaster recovery.
            </p>
          </div>
        </div>

        {/* Standby Details */}
        {standby && (
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold">Standby Replica</h3>
            <dl className="space-y-3">
              <InfoRow label="Name" value={standby.name} />
              <InfoRow label="Status" value={standby.status} />
              <InfoRow label="Availability Zone" value={standby.availability_zone} />
              {standby.private_ip && <InfoRow label="Private IP" value={standby.private_ip} copyable />}
              <InfoRow label="Created" value={new Date(standby.created_at).toLocaleDateString()} />
            </dl>
          </div>
        )}

        {statusLoading && !standby && (
          <p className="text-sm text-gray-500">Loading DR status...</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (confirm("Initiate failover? The standby will become the new primary. This action cannot be automatically reversed.")) {
                failoverMutation.mutate({ identifier });
              }
            }}
            disabled={failoverMutation.isPending || !standby || standby.status !== "active"}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          >
            <Zap size={16} />
            {failoverMutation.isPending ? "Failing over..." : "Manual Failover"}
          </button>

          <button
            onClick={() => {
              if (confirm("Disable DR? The standby replica will be deleted. This cannot be undone.")) {
                disableDrMutation.mutate({ identifier });
              }
            }}
            disabled={disableDrMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {disableDrMutation.isPending ? "Disabling..." : "Disable DR"}
          </button>
        </div>
      </div>
    );
  }

  // DR not enabled — show eligibility + enable form
  if (db.status !== "active") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600 shrink-0" />
        <div>
          <p className="font-medium text-yellow-800 dark:text-yellow-300">Not Available</p>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
            Disaster Recovery can only be enabled on active databases.
          </p>
        </div>
      </div>
    );
  }

  // DR ordering not yet available for self-service — mirror the backend
  // guard and offer no enable controls that would 422.
  if (!drOrderingEnabled) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-gray-500 shrink-0" />
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">Disaster Recovery — Coming Soon</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Self-service disaster recovery ordering isn't available yet. Contact support for a manual DR work order.
          </p>
        </div>
      </div>
    );
  }

  if (eligibilityLoading) {
    return <p className="text-sm text-gray-500">Checking DR eligibility...</p>;
  }

  if (!eligibility?.eligible) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-gray-500 shrink-0" />
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">DR Not Available</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {eligibility?.reason || "No same-provider availability zones available for DR standby."}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            DR requires at least two availability zones on the same provider in this region.
            Deploy in a multi-AZ region to enable disaster recovery.
          </p>
        </div>
      </div>
    );
  }

  // Resolve the AZ list per selected mode. Standard reads from the
  // Phase-1 same-provider eligibility endpoint; Orbit reads from the
  // richer Phase-2 endpoint. The two have intentionally different
  // shapes — Orbit's row carries `available_modes`, `caveats`,
  // `plan_available`, `data_residency_ok` — so we don't try to
  // normalise them.
  type AzRow = {
    code: string;
    name: string | null;
    status?: string;
    provider?: string;
    caveats?: string[];
    disabled?: boolean;
    disabledReason?: string | null;
  };

  const orbitTenantBlocked =
    selectedMode === "orbit_overlay"
    && orbitEligibility
    && !orbitEligibility.eligible
    && orbitEligibility.reason;

  const azRows: AzRow[] =
    selectedMode === "orbit_overlay"
      ? (orbitEligibility?.target_azs ?? []).map((az) => {
          const blockedByPlan = !az.plan_available;
          const blockedByResidency = !az.data_residency_ok;
          const blockedReasons: string[] = [];
          if (blockedByPlan) {
            blockedReasons.push("No compatible plan on this AZ for your engine + size.");
          }
          if (blockedByResidency) {
            blockedReasons.push("Blocked by your data-residency policy.");
          }
          return {
            code: az.code,
            name: az.name,
            provider: az.provider,
            caveats: az.caveats,
            disabled: blockedByPlan || blockedByResidency,
            disabledReason: blockedReasons.length > 0 ? blockedReasons.join(" ") : null,
          };
        })
      : eligibility.available_azs.map((az) => ({
          code: az.code,
          name: az.name,
          status: az.status,
          provider: az.provider,
        }));

  const orbitBetaBlocked = Boolean(orbitTenantBlocked);
  const isOrbitMode = selectedMode === "orbit_overlay";

  const handleEnable = () => {
    if (!selectedAz) {
      return;
    }
    if (
      !confirm(
        isOrbitMode
          ? "Enable Orbit replication? A cross-provider replica will be provisioned via AnyCloudFlow."
          : "Enable DR? A standby replica will be provisioned in the selected AZ.",
      )
    ) {
      return;
    }
    enableDrMutation.mutate({
      identifier,
      targetAz: selectedAz,
      mode: isOrbitMode ? "orbit_overlay" : "standard",
      // Topology default — A-A is gated separately and not exposed on
      // the DR tab yet. When the topology selector lands, this becomes
      // a real state value.
      options: isOrbitMode ? { topology: "active_passive" } : undefined,
    });
  };

  // Eligible — show enable form
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold">Enable Disaster Recovery</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          A standby replica will run in a separate availability zone with continuous replication.
          If the primary fails, the standby promotes automatically and DNS switches over.
        </p>

        <div className="space-y-4">
          {/* Mode selector. Orbit is GA — the only reasons it's
              unavailable are:
                1. No cross-provider target exists for this primary
                   (engine.advanced_available is false → hide Orbit
                   entirely; Standard is the only useful path).
                2. Tenant has it explicitly disabled by CS (eligibility
                   returns eligible=false with the disable reason).
              No "beta access" or "join the cohort" copy paths. */}
          <OrbitReplicationModeSelector
            value={selectedMode}
            onChange={handleModeChange}
            orbitAvailable={Boolean(orbitEligibility?.engine?.advanced_available)}
            orbitDisabledReason={orbitBetaBlocked ? orbitEligibility?.reason ?? null : null}
            caveats={
              isOrbitMode && orbitEligibility?.engine?.caveats
                ? orbitEligibility.engine.caveats
                : []
            }
          />

          {/* AZ picker. The list source switches with mode; the row
              renderer is shared because we want a consistent visual
              affordance for "select an AZ". */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Availability Zone
            </label>
            {isOrbitMode && orbitEligibilityLoading && (
              <p className="text-sm text-gray-500" data-testid="orbit-az-loading">
                Loading cross-cloud availability zones…
              </p>
            )}
            {isOrbitMode && !orbitEligibilityLoading && azRows.length === 0 && !orbitBetaBlocked && (
              <p className="text-sm text-gray-500" data-testid="orbit-no-targets">
                No cross-provider targets available right now.
              </p>
            )}
            <div className="space-y-2">
              {azRows.map((az) => (
                <button
                  key={az.code}
                  onClick={() => !az.disabled && setSelectedAz(az.code)}
                  disabled={az.disabled}
                  title={az.disabledReason ?? undefined}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-all ${
                    selectedAz === az.code && !az.disabled
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : az.disabled
                        ? "border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900 cursor-not-allowed"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <MapPin
                    size={16}
                    className={selectedAz === az.code && !az.disabled ? "text-blue-600" : "text-gray-400"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {az.name || az.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {az.code}
                    </div>
                    {az.disabledReason && (
                      <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        {az.disabledReason}
                      </div>
                    )}
                  </div>
                  {!isOrbitMode && az.status && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                        az.status === "healthy"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {az.status}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Cost preview. Phase-1 surfaces a flat number; the Orbit
              path will route through the /quote endpoint in a later
              ticket so the per-pair + per-GB pricing is authoritative.
              For now we just hide the Phase-1 estimate when Orbit is
              selected — better no number than a misleading one. */}
          {!isOrbitMode && eligibility.estimated_monthly_cost != null && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estimated monthly cost</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                +${Number(eligibility.estimated_monthly_cost).toFixed(2)}/mo
              </span>
            </div>
          )}
          {isOrbitMode && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
              Orbit pricing is per-pair plus a per-GB data transfer rate.
              The exact cost will be quoted before you confirm.
            </div>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 text-amber-600 shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <p className="font-medium">Important</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Replication is asynchronous — up to ~60 seconds of data loss on failover (RPO)</li>
                  <li>Failover takes approximately 2-5 minutes (RTO)</li>
                  <li>The standby is read-only and cannot serve application traffic until promoted</li>
                  {isOrbitMode && (
                    <li>Orbit replication crosses cloud providers — expect additional WAN latency on writes</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleEnable}
            disabled={!selectedAz || enableDrMutation.isPending || orbitBetaBlocked}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enableDrMutation.isPending
              ? isOrbitMode ? "Enabling Orbit replication…" : "Enabling DR…"
              : isOrbitMode ? "Enable Orbit Replication" : "Enable Disaster Recovery"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Integration / Quick Start Tab ──────────────────────────────

const IntegrationTab: React.FC<{ db: ManagedDatabase }> = ({ db }) => {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState("laravel");
  const { data: credentialsData } = useFetchDatabaseCredentials(db.identifier, {
    enabled: db.status === "active",
  });

  const creds = credentialsData?.credentials as
    | { host?: string; port?: number; username?: string; password?: string; database?: string }
    | undefined;
  const host = creds?.host || db.dns_record_name || getPublicIp(db) || "your-db-host";
  const port = creds?.port || 5432;
  const user = creds?.username || "dbadmin";
  const pass = creds?.password || "your-password";
  const dbName = creds?.database || "defaultdb";
  const engineLower = db.engine?.toLowerCase() ?? "postgresql";

  const copySnippet = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const pgPort = engineLower === "mysql" || engineLower === "mariadb" ? 3306 : engineLower === "mongodb" ? 27017 : engineLower === "redis" ? 6379 : port;
  const pgDriver = engineLower === "mysql" || engineLower === "mariadb" ? "mysql" : engineLower === "mongodb" ? "mongodb" : engineLower === "redis" ? "redis" : "pgsql";
  const dsnScheme = engineLower === "mysql" || engineLower === "mariadb" ? "mysql" : engineLower === "mongodb" ? "mongodb" : engineLower === "redis" ? "redis" : "postgresql";

  const snippets: Record<string, { label: string; icon: string; code: string }> = {
    laravel: {
      label: "Laravel / PHP",
      icon: "🐘",
      code: `# .env file
DB_CONNECTION=${pgDriver}
DB_HOST=${host}
DB_PORT=${pgPort}
DB_DATABASE=${dbName}
DB_USERNAME=${user}
DB_PASSWORD=${pass}`,
    },
    nodejs: {
      label: "Node.js",
      icon: "🟢",
      code: engineLower === "postgresql"
        ? `// npm install pg
const { Pool } = require('pg');

const pool = new Pool({
  host: '${host}',
  port: ${pgPort},
  database: '${dbName}',
  user: '${user}',
  password: '${pass}',
  ssl: false,
});

const result = await pool.query('SELECT NOW()');
console.log(result.rows[0]);`
        : engineLower === "mysql" || engineLower === "mariadb"
        ? `// npm install mysql2
const mysql = require('mysql2/promise');

const connection = await mysql.createConnection({
  host: '${host}',
  port: ${pgPort},
  database: '${dbName}',
  user: '${user}',
  password: '${pass}',
});

const [rows] = await connection.execute('SELECT NOW()');
console.log(rows);`
        : engineLower === "mongodb"
        ? `// npm install mongodb
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://${user}:${pass}@${host}:${pgPort}/${dbName}');
await client.connect();

const db = client.db('${dbName}');
console.log(await db.command({ ping: 1 }));`
        : `// npm install ioredis
const Redis = require('ioredis');

const redis = new Redis({
  host: '${host}',
  port: ${pgPort},
  password: '${pass}',
});

await redis.set('key', 'value');
console.log(await redis.get('key'));`,
    },
    python: {
      label: "Python",
      icon: "🐍",
      code: engineLower === "postgresql"
        ? `# pip install psycopg2-binary
import psycopg2

conn = psycopg2.connect(
    host="${host}",
    port=${pgPort},
    dbname="${dbName}",
    user="${user}",
    password="${pass}"
)

cur = conn.cursor()
cur.execute("SELECT version()")
print(cur.fetchone())`
        : engineLower === "mysql" || engineLower === "mariadb"
        ? `# pip install mysql-connector-python
import mysql.connector

conn = mysql.connector.connect(
    host="${host}",
    port=${pgPort},
    database="${dbName}",
    user="${user}",
    password="${pass}"
)

cursor = conn.cursor()
cursor.execute("SELECT VERSION()")
print(cursor.fetchone())`
        : `# pip install pymongo / redis
# Connection string:
# ${dsnScheme}://${user}:${pass}@${host}:${pgPort}/${dbName}`,
    },
    go: {
      label: "Go",
      icon: "🔵",
      code: engineLower === "postgresql"
        ? `// go get github.com/lib/pq
import (
    "database/sql"
    _ "github.com/lib/pq"
)

connStr := "host=${host} port=${pgPort} user=${user} password=${pass} dbname=${dbName} sslmode=disable"
db, err := sql.Open("postgres", connStr)`
        : `// Connection string:
// ${dsnScheme}://${user}:${pass}@${host}:${pgPort}/${dbName}`,
    },
    connectionstring: {
      label: "Connection String",
      icon: "🔗",
      code: `${dsnScheme}://${user}:${pass}@${host}:${pgPort}/${dbName}`,
    },
    cli: {
      label: "CLI",
      icon: "⌨️",
      code: engineLower === "postgresql"
        ? `# Connect via psql
psql "postgresql://${user}:${pass}@${host}:${pgPort}/${dbName}"

# Or with flags
PGPASSWORD='${pass}' psql -h ${host} -p ${pgPort} -U ${user} -d ${dbName}`
        : engineLower === "mysql" || engineLower === "mariadb"
        ? `# Connect via mysql client
mysql -h ${host} -P ${pgPort} -u ${user} -p${pass} ${dbName}`
        : engineLower === "mongodb"
        ? `# Connect via mongosh
mongosh "mongodb://${user}:${pass}@${host}:${pgPort}/${dbName}"`
        : `# Connect via redis-cli
redis-cli -h ${host} -p ${pgPort} -a ${pass}`,
    },
    dbeaver: {
      label: "DBeaver / pgAdmin",
      icon: "🗄️",
      code: `Host:     ${host}
Port:     ${pgPort}
Database: ${dbName}
Username: ${user}
Password: ${pass}

SSL Mode: Disable (or Prefer for TLS-enabled instances)`,
    },
  };

  if (db.status !== "active") {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50/90 p-6 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Integration snippets are available once the database is active.
        </p>
      </div>
    );
  }

  const languages = Object.entries(snippets);

  return (
    <div className="space-y-6">
      <SurfaceCard
        title="Quick Start Integration"
        subtitle="Copy ready-to-use connection snippets for your application framework."
      >
        {/* Language Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {languages.map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => setActiveLanguage(key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeLanguage === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Code Block */}
        {snippets[activeLanguage] && (
          <div className="relative">
            <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-200 dark:bg-black">
              <code>{snippets[activeLanguage].code}</code>
            </pre>
            <button
              onClick={() => copySnippet(activeLanguage, snippets[activeLanguage].code)}
              className="absolute right-3 top-3 rounded-lg bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
              title="Copy to clipboard"
            >
              {copiedSnippet === activeLanguage ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard
        title="Environment Variables"
        subtitle="Standard environment variables for containerized deployments."
      >
        <div className="relative">
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-200 dark:bg-black">
            <code>{`DATABASE_URL="${dsnScheme}://${user}:${pass}@${host}:${pgPort}/${dbName}"
DB_HOST="${host}"
DB_PORT="${pgPort}"
DB_NAME="${dbName}"
DB_USER="${user}"
DB_PASSWORD="${pass}"`}</code>
          </pre>
          <button
            onClick={() =>
              copySnippet(
                "env",
                `DATABASE_URL="${dsnScheme}://${user}:${pass}@${host}:${pgPort}/${dbName}"\nDB_HOST="${host}"\nDB_PORT="${pgPort}"\nDB_NAME="${dbName}"\nDB_USER="${user}"\nDB_PASSWORD="${pass}"`
              )
            }
            className="absolute right-3 top-3 rounded-lg bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            title="Copy to clipboard"
          >
            {copiedSnippet === "env" ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="Docker Compose"
        subtitle="Add your database to a Docker Compose stack."
      >
        <div className="relative">
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-200 dark:bg-black">
            <code>{`# docker-compose.yml — connect your app to the managed database
services:
  app:
    environment:
      DATABASE_URL: "${dsnScheme}://${user}:${pass}@${host}:${pgPort}/${dbName}"
    # No need for a local db service — your managed database is remote`}</code>
          </pre>
          <button
            onClick={() =>
              copySnippet(
                "docker",
                `services:\n  app:\n    environment:\n      DATABASE_URL: "${dsnScheme}://${user}:${pass}@${host}:${pgPort}/${dbName}"`
              )
            }
            className="absolute right-3 top-3 rounded-lg bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            title="Copy to clipboard"
          >
            {copiedSnippet === "docker" ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
};

// ─── Settings Tab ────────────────────────────────────────────────

const SettingsTab: React.FC<{
  db: ManagedDatabase;
  identifier: string;
  backPath: string;
}> = ({ db, identifier, backPath }) => {
  const navigate = useNavigate();
  const updateDatabaseMutation = useUpdateManagedDatabase();
  const actionMutation = useDatabaseAction();
  const deleteMutation = useDeleteManagedDatabase();
  const rotateMutation = useRotateDatabaseCredentials();
  const retryMutation = useRetryDatabaseOperation();
  const reconcileMutation = useReconcileDatabaseOperation();
  const resizeMutation = useResizeDatabase();
  const { data: replicasData, isLoading: replicasLoading } = useFetchDatabaseReplicas(identifier, {
    enabled: db.status === "active",
  });
  const createReplicaMutation = useCreateDatabaseReplica();
  const promoteReplicaMutation = usePromoteDatabaseReplica();
  const deleteReplicaMutation = useDeleteDatabaseReplica();
  // FR-031: refetch creds after rotation so the modal can show the new password.
  // `enabled: false` keeps it from running on mount; we call refetch() manually.
  const { refetch: fetchCredentials } = useFetchDatabaseCredentials(identifier, {
    enabled: false,
  });
  const [databaseName, setDatabaseName] = useState(db.name);
  const [resizeStorageGb, setResizeStorageGb] = useState(db.storage_gb);
  const [resizeInstanceClass, setResizeInstanceClass] = useState(db.plan_size);
  const [replicaAz, setReplicaAz] = useState("uni-ng-lag-az1");
  const replicas = asRecordArray(replicasData);
  const [rotationUsername, setRotationUsername] = useState("");
  const [rotationPassword, setRotationPassword] = useState("");
  const [generatePassword, setGeneratePassword] = useState(true);
  // FR-031: rotated-credentials modal — surfaces the freshly minted
  // password to the user exactly once. Triggered by useRotateDatabaseCredentials
  // success; the next live credentials fetch (triggered by the provider webhook)
  // populates the password in this modal so the user can copy it before close.
  const [rotatedModalOpen, setRotatedModalOpen] = useState(false);
  const [rotatedSnapshot, setRotatedSnapshot] = useState<{
    username?: string;
    password?: string;
    host?: string;
    port?: number;
    database?: string;
  } | null>(null);
  const [rotatedCopied, setRotatedCopied] = useState(false);
  const operationSeed = useMemo<ManagedDatabaseOperation[]>(
    () => (Array.isArray(db.operations) ? db.operations : []),
    [db.operations]
  );
  const [activeOperationKnown, setActiveOperationKnown] = useState(
    operationSeed.some((operation) => ACTIVE_OPERATION_STATUSES.has(operation.status))
  );
  const { data: operationsData, isLoading: operationsLoading } = useFetchDatabaseOperations(
    identifier,
    {
      refetchInterval: activeOperationKnown ? 10000 : 30000,
    }
  );

  const operations = useMemo<ManagedDatabaseOperation[]>(() => {
    if (Array.isArray(operationsData)) {
      return operationsData;
    }

    return operationSeed;
  }, [operationSeed, operationsData]);

  const rotationBlockedReason =
    db.status !== "active"
      ? "Credential rotation is available only when the database is active."
      : null;

  const canSubmitRotation =
    !rotationBlockedReason &&
    (generatePassword ||
      rotationPassword.trim().length > 0 ||
      rotationUsername.trim().length > 0);

  React.useEffect(() => {
    setDatabaseName(db.name);
    setResizeStorageGb(db.storage_gb);
    setResizeInstanceClass(db.plan_size);
  }, [db.name, db.plan_size, db.storage_gb]);

  React.useEffect(() => {
    setActiveOperationKnown(operations.some((operation) => ACTIVE_OPERATION_STATUSES.has(operation.status)));
  }, [operations]);

  return (
    <div className="space-y-6">
      <SurfaceCard
        title="General"
        subtitle="Editable metadata shown across the UniCloud control surface."
        action={
          <button
            onClick={() =>
              updateDatabaseMutation.mutate({
                id: identifier,
                data: { name: databaseName.trim() },
              })
            }
            disabled={!databaseName.trim() || databaseName.trim() === db.name || updateDatabaseMutation.isPending}
            className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
          >
            {updateDatabaseMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save
          </button>
        }
      >
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
            Database Name
          </span>
          <input
            value={databaseName}
            onChange={(event) => setDatabaseName(event.target.value)}
            className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
          />
        </label>
      </SurfaceCard>

      <SurfaceCard
        title="Lifecycle"
        subtitle="Pause, resume, or restart the service without leaving the control surface."
      >
        <div className="flex flex-wrap gap-3">
          {db.status === "active" && (
            <>
              <button
                onClick={() => actionMutation.mutate({ identifier, action: "pause" })}
                disabled={actionMutation.isPending}
                className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
              >
                <Pause size={16} />
                Pause Database
              </button>
              <button
                onClick={() => {
                  if (confirm("Restart this database runtime? Active connections may reconnect.")) {
                    actionMutation.mutate({ identifier, action: "restart" });
                  }
                }}
                disabled={actionMutation.isPending}
                className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
              >
                <RefreshCw size={16} />
                Restart Database
              </button>
            </>
          )}
          {db.status === "paused" && (
            <button
              onClick={() => actionMutation.mutate({ identifier, action: "resume" })}
              disabled={actionMutation.isPending}
              className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
            >
              <Play size={16} />
              Resume Database
            </button>
          )}
          {db.status !== "active" && db.status !== "paused" && (
            <div className="db-surface-soft rounded-[22px] px-4 py-3 text-sm text-[var(--theme-muted-color)]">
              Lifecycle actions unlock when the service is active or paused.
            </div>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="Scaling"
        subtitle="Resize storage and control replica lifecycle through the StaqDB control plane."
        action={
          <button
            onClick={() =>
              resizeMutation.mutate({
                identifier,
                instance_class: resizeInstanceClass,
                storage_gb: resizeStorageGb,
                apply_immediately: true,
              })
            }
            disabled={db.status !== "active" || resizeMutation.isPending}
            className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
          >
            {resizeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpCircle size={16} />}
            Apply Resize
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
              Instance Class
            </span>
            <select
              value={resizeInstanceClass}
              onChange={(event) => setResizeInstanceClass(event.target.value)}
              className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
            >
              <option value="micro">Micro</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">XLarge</option>
            </select>
          </label>
          <NumericSetting label="Storage GB" value={resizeStorageGb} min={10} max={16384} onChange={setResizeStorageGb} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
              Replica Availability Zone
            </span>
            <select
              value={replicaAz}
              onChange={(event) => setReplicaAz(event.target.value)}
              className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
            >
              <option value="uni-ng-lag-az1">uni-ng-lag-az1</option>
            </select>
          </label>
          <button
            onClick={() =>
              createReplicaMutation.mutate({
                identifier,
                region: db.region,
                instance_class: resizeInstanceClass,
                availability_zone: replicaAz,
              })
            }
            disabled={db.status !== "active" || createReplicaMutation.isPending}
            className="db-secondary-button inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
          >
            {createReplicaMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add Replica
          </button>
        </div>

        <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-[24px] border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {replicasLoading ? (
            <div className="px-4 py-4 text-sm text-[var(--theme-muted-color)]">Loading replicas...</div>
          ) : replicas.length === 0 ? (
            <div className="px-4 py-4 text-sm text-[var(--theme-muted-color)]">No read replicas attached.</div>
          ) : (
            replicas.map((replica) => {
              const replicaId = asNumber(replica.id, 0);
              const replicaName = asString(replica.name) ?? asString(replica.identifier) ?? `Replica ${replicaId}`;
              return (
                <div key={`${replicaName}-${replicaId}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--theme-heading-color)]">{replicaName}</p>
                    <p className="text-xs text-[var(--theme-muted-color)]">
                      {asString(replica.region) ?? db.region} · {asString(replica.status) ?? "pending"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (confirm(`Promote "${replicaName}" to standalone?`)) {
                          promoteReplicaMutation.mutate({ identifier, replicaId });
                        }
                      }}
                      disabled={!replicaId || promoteReplicaMutation.isPending}
                      className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition disabled:opacity-60"
                    >
                      <ArrowUpCircle size={14} />
                      Promote
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete replica "${replicaName}"?`)) {
                          deleteReplicaMutation.mutate({ identifier, replicaId });
                        }
                      }}
                      disabled={!replicaId || deleteReplicaMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="Credential Rotation"
        subtitle="Queue a tracked credential-change operation and follow it through verification."
        action={
          <span className="db-brand-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <KeyRound size={14} />
            Runtime credential op
          </span>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4">
            {rotationBlockedReason ? (
              <div className="rounded-[22px] border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                {rotationBlockedReason}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
                      New Username
                    </span>
                    <input
                      value={rotationUsername}
                      onChange={(event) => setRotationUsername(event.target.value)}
                      placeholder="Leave blank to keep the current login"
                      className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
                      Password Mode
                    </span>
                    <div className="db-surface-soft flex items-center justify-between rounded-2xl px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--theme-heading-color)]">
                          {generatePassword ? "Generate secure password" : "Provide password"}
                        </div>
                        <div className="text-xs text-[var(--theme-muted-color)]">
                          Generated passwords are persisted only after runtime verification.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGeneratePassword((current) => {
                            const next = !current;
                            if (next) {
                              setRotationPassword("");
                            }
                            return next;
                          });
                        }}
                        className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition ${
                          generatePassword ? "bg-[var(--theme-color)]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                            generatePassword ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </label>
                </div>

                {!generatePassword && (
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
                      New Password
                    </span>
                    <input
                      type="password"
                      value={rotationPassword}
                      onChange={(event) => setRotationPassword(event.target.value)}
                      placeholder="Minimum 12 characters"
                      className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
                    />
                  </label>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      // FR-031: open rotated-credentials modal IMMEDIATELY on click
                      // so we begin watching for the password to change. We capture
                      // the current password as the baseline; whatever lands different
                      // is the new rotated value (regardless of whether the mutation
                      // resolves successfully — the queue+webhook chain is the source
                      // of truth, and the React Query mutation can race ahead of it).
                      const currentDbCreds: unknown = (db as { credentials?: unknown })?.credentials;
                      const baselinePassword =
                        (typeof currentDbCreds === "object" && currentDbCreds?.password) ||
                        (typeof currentDbCreds === "string"
                          ? (() => {
                              try {
                                return JSON.parse(currentDbCreds)?.password;
                              } catch {
                                return null;
                              }
                            })()
                          : null);
                      setRotatedSnapshot(null);
                      setRotatedCopied(false);
                      setRotatedModalOpen(true);
                      const startedAt = Date.now();
                      const watchTick = async () => {
                        try {
                          const r = await fetchCredentials();
                          const data: unknown = r.data;
                          const c = data?.credentials ?? data?.data?.credentials ?? data;
                          if (c?.password && c.password !== baselinePassword) {
                            setRotatedSnapshot({
                              username: c.username,
                              password: c.password,
                              host: c.host,
                              port: c.port,
                              database: c.database,
                            });
                            return;
                          }
                        } catch (_e) {
                          /* ignore error during poll */
                        }
                        if (Date.now() - startedAt < 90000) {
                          setTimeout(watchTick, 2000);
                        }
                      };
                      setTimeout(watchTick, 1500);

                      rotateMutation.mutate(
                        {
                          identifier,
                          username: rotationUsername.trim() || undefined,
                          password: generatePassword ? undefined : rotationPassword,
                          generatePassword,
                        },
                        {
                          onSuccess: () => {
                            setRotationUsername("");
                            setRotationPassword("");
                            setGeneratePassword(true);
                            setActiveOperationKnown(true);
                            // FR-031: poll the credentials endpoint until
                            // the new password lands. The provider short-circuits
                            // the round-trip when isOnExternalVm so this
                            // doesn't deadlock under single-worker dev.
                            const startedAt = Date.now();
                            const tick = async () => {
                              try {
                                const r = await fetchCredentials();
                                const data: unknown = r.data;
                                console.log('[rotate-modal-poll] data:', data);
                                // Endpoint shape: { success, data: { credentials: {...} } }
                                // Also handle the flat shape some clients return.
                                const creds =
                                  data?.data?.credentials ??
                                  data?.credentials ??
                                  data?.data ??
                                  data;
                                const password = creds?.password;
                                console.log('[rotate-modal-poll] password found:', !!password);
                                if (password) {
                                  setRotatedSnapshot({
                                    username: creds.username,
                                    password,
                                    host: creds.host,
                                    port: creds.port,
                                    database: creds.database,
                                  });
                                  return;
                              }
                              } catch {
                                /* ignore error during poll */
                              }
                              if (Date.now() - startedAt < 60000) {
                                setTimeout(tick, 2000);
                              }
                            };
                            setTimeout(tick, 1500);
                          },
                        }
                      );
                    }}
                    disabled={!canSubmitRotation || rotateMutation.isPending}
                    className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {rotateMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Wand2 size={16} />
                    )}
                    {rotateMutation.isPending ? "Queueing..." : "Rotate Credentials"}
                  </button>
                  <p className="text-sm text-[var(--theme-muted-color)]">
                    The connection tab will show the verified credential set after the operation completes.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="db-surface-soft rounded-[24px] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-muted-color)]">
                Operation Flow
              </div>
              <div className="mt-3 space-y-3">
                <OperationSummaryRow
                  label="1. Request"
                  value="Persist the pending secret before touching the runtime."
                />
                <OperationSummaryRow
                  label="2. Apply"
                  value="Update the live engine login using the current working credentials."
                />
                <OperationSummaryRow
                  label="3. Verify"
                  value="Reconnect with the target credentials before local state is updated."
                />
                <OperationSummaryRow
                  label="4. Reconcile"
                  value="If the runtime changed but local persistence failed, the operation waits for reconciliation."
                />
              </div>
            </div>

            <div className="db-surface-soft rounded-[24px] p-4 text-sm text-[var(--theme-muted-color)]">
              Retry is available only for failed runs. Reconcile is available only when the runtime
              changed but the platform still needs to persist the verified credentials locally.
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="Recent Operations"
        subtitle="Tracked post-provision actions for this service."
      >
        {operationsLoading && operations.length === 0 ? (
          <div className="db-surface-soft rounded-[22px] px-4 py-4 text-sm text-[var(--theme-muted-color)]">
            Loading operation history...
          </div>
        ) : operations.length === 0 ? (
          <div className="db-surface-soft rounded-[22px] px-4 py-4 text-sm text-[var(--theme-muted-color)]">
            No post-provision operations have been recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {operations.map((operation) => (
              <OperationCard
                key={operation.id}
                operation={operation}
                onRetry={() =>
                  retryMutation.mutate({
                    identifier,
                    operationIdentifier: operation.identifier,
                  })
                }
                onReconcile={() =>
                  reconcileMutation.mutate({
                    identifier,
                    operationIdentifier: operation.identifier,
                  })
                }
                retryPending={
                  retryMutation.isPending &&
                  retryMutation.variables?.operationIdentifier === operation.identifier
                }
                reconcilePending={
                  reconcileMutation.isPending &&
                  reconcileMutation.variables?.operationIdentifier === operation.identifier
                }
              />
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard
        title="Danger Zone"
        subtitle="Deleting a database is permanent and removes the managed service and its data."
      >
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${db.name}"? This cannot be undone.`)) {
              deleteMutation.mutate({ id: identifier }, { onSuccess: () => navigate(backPath) });
            }
          }}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {deleteMutation.isPending ? "Deleting..." : "Delete Database"}
        </button>
      </SurfaceCard>

      {rotatedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          data-testid="rotated-credentials-modal"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              New credentials issued
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Copy the password now — it will not be shown in cleartext again. Old credentials
              are revoked and any clients using them will fail authentication.
            </p>

            {!rotatedSnapshot ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Loader2 size={16} className="animate-spin" />
                <span>Waiting for credential rotation to complete...</span>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <RotatedField label="Username" value={rotatedSnapshot.username ?? ""} mono />
                <RotatedField label="Password" value={rotatedSnapshot.password ?? ""} mono mask />
                <RotatedField label="Host" value={rotatedSnapshot.host ?? ""} mono />
                <RotatedField label="Port" value={String(rotatedSnapshot.port ?? "")} mono />
                <RotatedField label="Database" value={rotatedSnapshot.database ?? ""} mono />
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              {rotatedSnapshot && (
                <button
                  type="button"
                  onClick={async () => {
                    const lines = [
                      `host=${rotatedSnapshot.host}`,
                      `port=${rotatedSnapshot.port}`,
                      `database=${rotatedSnapshot.database}`,
                      `username=${rotatedSnapshot.username}`,
                      `password=${rotatedSnapshot.password}`,
                    ].join("\n");
                    try {
                      await navigator.clipboard.writeText(lines);
                      setRotatedCopied(true);
                      setTimeout(() => setRotatedCopied(false), 2500);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  {rotatedCopied ? "Copied" : "Copy all"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setRotatedModalOpen(false);
                  setRotatedSnapshot(null);
                }}
                className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium"
              >
                I&apos;ve saved them
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RotatedField: React.FC<{ label: string; value: string; mono?: boolean; mask?: boolean }> = ({
  label,
  value,
  mono,
  mask,
}) => {
  const [revealed, setRevealed] = useState(!mask);
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <code
          className={`flex-1 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800 ${
            mono ? "font-mono" : ""
          }`}
        >
          {revealed || !mask ? value : "•".repeat(Math.min(24, value.length))}
        </code>
        {mask && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="rounded-xl bg-slate-200 px-3 py-2 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
};

const NumericSetting: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, onChange }) => (
  <label className="space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
      {label}
    </span>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="db-surface-soft w-full rounded-2xl border border-transparent px-4 py-3 text-sm text-[var(--theme-heading-color)] outline-none transition focus:border-[var(--theme-color)]"
    />
  </label>
);

const OneTimePasswordModal: React.FC<{
  label: string;
  password: string;
  onClose: () => void;
}> = ({ label, password, onClose }) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Password rotated
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Copy the new password for {label}. It is shown once.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
          <code className="min-w-0 flex-1 break-all text-sm text-slate-900 dark:text-slate-100">{password}</code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(password);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              } catch {
                /* ignore */
              }
            }}
            className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            title="Copy password"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Utility Components ──────────────────────────────────────────

const OperationSummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-3 rounded-[18px] bg-[var(--theme-color-05)] px-3 py-3">
    <span className="min-w-[84px] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-color)]">
      {label}
    </span>
    <p className="text-sm text-[var(--theme-heading-color)]">{value}</p>
  </div>
);

const OperationCard: React.FC<{
  operation: ManagedDatabaseOperation;
  onRetry: () => void;
  onReconcile: () => void;
  retryPending: boolean;
  reconcilePending: boolean;
}> = ({ operation, onRetry, onReconcile, retryPending, reconcilePending }) => {
  const progressSteps = Array.isArray(operation.progress) ? operation.progress : [];
  const requestedMode =
    typeof operation.payload?.requested_mode === "string" ? operation.payload.requested_mode : null;
  const targetUsername =
    typeof operation.payload?.username === "string" ? operation.payload.username : null;

  return (
    <div className="db-surface-soft rounded-[26px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-base font-semibold text-[var(--theme-heading-color)]">
              Credential Rotation
            </h4>
            <OperationStatusBadge status={operation.status} />
          </div>
          <p className="text-sm text-[var(--theme-muted-color)]">
            {operation.identifier}
            {requestedMode ? ` · ${requestedMode.replace(/_/g, " ")}` : ""}
            {targetUsername ? ` · target user ${targetUsername}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {operation.status === "failed" && (
            <button
              onClick={onRetry}
              disabled={retryPending}
              className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition disabled:opacity-60"
            >
              {retryPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Retry
            </button>
          )}
          {operation.status === "needs_reconcile" && (
            <button
              onClick={onReconcile}
              disabled={reconcilePending}
              className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition disabled:opacity-60"
            >
              {reconcilePending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Reconcile
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${
            operation.status === "failed"
              ? "bg-red-500"
              : operation.status === "needs_reconcile"
                ? "bg-amber-500"
                : operation.status === "completed"
                  ? "bg-emerald-500"
                  : "bg-[var(--theme-color)]"
          }`}
          style={{ width: `${Math.min(Math.max(operation.progress_percent ?? 0, 4), 100)}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <InfoRow label="Progress" value={`${operation.progress_percent ?? 0}%`} />
        <InfoRow label="Retries" value={String(operation.retry_count ?? 0)} />
        <InfoRow label="Started" value={formatDateTimeLabel(operation.started_at)} />
        <InfoRow label="Completed" value={formatDateTimeLabel(operation.completed_at)} />
      </div>

      {operation.error_message && (
        <div className="mt-4 rounded-[20px] border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
          {operation.error_message}
        </div>
      )}

      {progressSteps.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {progressSteps.map((step) => (
            <OperationProgressCard key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
};

const OperationProgressCard: React.FC<{ step: ManagedDatabaseOperationProgressStep }> = ({ step }) => (
  <div className="rounded-[20px] border border-slate-200/80 bg-white/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-muted-color)]">
        {step.id.replace(/_/g, " ")}
      </span>
      <OperationStatusBadge status={step.status} compact />
    </div>
    <p className="mt-3 text-sm font-medium text-[var(--theme-heading-color)]">{step.label}</p>
    <p className="mt-2 text-xs text-[var(--theme-muted-color)]">
      {formatDateTimeLabel(step.updated_at ?? (typeof step.context?.last_checked_at === "string" ? step.context.last_checked_at : null))}
    </p>
  </div>
);

const OperationStatusBadge: React.FC<{
  status: string;
  compact?: boolean;
}> = ({ status, compact = false }) => {
  const normalized = status.replace(/_/g, " ");
  const styles =
    status === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
      : status === "failed"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
        : status === "needs_reconcile"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border py-1 text-xs font-semibold uppercase tracking-[0.14em] ${compact ? "px-2.5" : "px-3"} ${styles}`}
    >
      {ACTIVE_OPERATION_STATUSES.has(status) && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {normalized}
    </span>
  );
};

const HeroStatCard: React.FC<{
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}> = ({ label, value, hint, icon }) => (
  <div className="db-surface-inset rounded-[24px] p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
        {label}
      </span>
      <div className="rounded-2xl bg-[var(--theme-color-10)] p-2 text-[var(--theme-color)]">
        {icon}
      </div>
    </div>
    <div className="mt-3 break-words text-base font-semibold text-[var(--theme-heading-color)]">{value}</div>
    <p className="mt-2 text-xs text-[var(--theme-muted-color)]">{hint}</p>
  </div>
);

const SurfaceCard: React.FC<{
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, action, children }) => (
  <div className="db-surface-card rounded-[30px] p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-[var(--theme-heading-color)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--theme-muted-color)]">{subtitle}</p>
      </div>
      {action}
    </div>
    {children}
  </div>
);

const PostureRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "good" | "neutral";
}> = ({ icon, title, description, tone }) => (
  <div
    className={`flex items-start gap-3 rounded-[22px] border px-4 py-4 ${
      tone === "good"
        ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20"
        : "db-surface-soft"
    }`}
  >
    <div
      className={`mt-0.5 rounded-2xl p-2 ${
        tone === "good"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  </div>
);

const InfoRow: React.FC<{
  label: string;
  value: string | undefined;
  copyable?: boolean;
}> = ({ label, value, copyable }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
  <div className="db-surface-soft flex flex-col gap-2 rounded-[20px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--theme-muted-color)]">
        {label}
      </dt>
      <dd className="flex w-full min-w-0 items-start gap-2 text-left text-sm font-medium text-[var(--theme-heading-color)] sm:ml-auto sm:w-auto sm:max-w-[68%] sm:items-center sm:justify-end sm:text-right">
        <span className="min-w-0 break-all">{value ?? "—"}</span>
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-slate-950 dark:hover:text-slate-200"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </dd>
    </div>
  );
};

const CopyableField: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="db-surface-soft flex flex-col gap-2 rounded-[24px] p-3 sm:flex-row sm:items-center">
      <code className="db-surface-inset flex-1 overflow-x-auto break-all rounded-2xl px-3 py-3 text-sm text-[var(--theme-heading-color)]">
        {value}
      </code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="self-end rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-slate-950 dark:hover:text-slate-200 sm:self-auto"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
};

type LifecycleTableRow = Record<string, string>;

const getLifecycleColumnValue = (row: LifecycleTableRow, column: string): string => {
  const normalized = column.toLowerCase();
  if (normalized === "event") return row.name ?? "";
  if (normalized === "type") return row.kind ?? "";
  if (normalized === "time") return row.age ?? "";
  return row[normalized] ?? "";
};

const LifecycleTable: React.FC<{ columns: string[]; rows: LifecycleTableRow[] }> = ({ columns, rows }) => (
  <div className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50/80 dark:bg-slate-900/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white/70 dark:divide-slate-800 dark:bg-slate-950/40">
          {rows.map((row, index) => (
            <tr key={`${row.name}-${index}`} className="align-top">
              {columns.map((column) => {
                const value = getLifecycleColumnValue(row, column);
                const normalized = column.toLowerCase();
                return (
                  <td
                    key={column}
                    className="max-w-[320px] break-words px-4 py-3 text-[var(--theme-heading-color)]"
                  >
                    {normalized === "status" ? (
                      <RuntimeStatusPill status={value} />
                    ) : normalized === "name" || normalized === "event" ? (
                      <span className="font-medium">{value}</span>
                    ) : normalized === "address" || normalized === "location" || normalized === "details" ? (
                      <span className="font-mono text-xs">{value}</span>
                    ) : (
                      value || "—"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const RuntimeStatusPill: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.replace(/_/g, " ");
  const tone = getRuntimeTone(status);
  const styles =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
        : tone === "bad"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${styles}`}>
      {tone === "warn" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {normalized}
    </span>
  );
};

const CopyableCodeBlock: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative">
      <pre className="max-h-[560px] overflow-auto rounded-[24px] bg-slate-950 p-5 text-sm leading-relaxed text-slate-200 dark:bg-black">
        <code>{value}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="absolute right-3 top-3 rounded-xl bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white"
        title="Copy spec"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
};

const SecretLifecycleRow: React.FC<{
  label: string;
  value: string;
  masked: boolean;
  copyable: boolean;
}> = ({ label, value, masked, copyable }) => {
  const [copied, setCopied] = useState(false);
  const displayValue = masked ? "•".repeat(Math.min(24, Math.max(value.length, 12))) : value;

  return (
    <div className="grid gap-2 bg-white/70 px-4 py-3 dark:bg-slate-950/40 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-center">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-muted-color)]">
        {label}
      </span>
      <code className="min-w-0 break-all rounded-xl bg-slate-100 px-3 py-2 text-xs text-[var(--theme-heading-color)] dark:bg-slate-900">
        {displayValue || "—"}
      </code>
      {copyable && value && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="justify-self-end rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          title={`Copy ${label}`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      )}
    </div>
  );
};

export default ManagedDatabaseDetail;

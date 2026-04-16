/**
 * ManagedDatabaseDetail — Detail view for a managed database.
 *
 * Tabs: Overview, Connection, Backups, Firewall, Settings.
 */
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import EngineIcon, { getEngineLabel } from "./EngineIcon";
import DatabaseStatusBadge from "./DatabaseStatusBadge";
import DatabaseProvisioningPipeline from "./DatabaseProvisioningPipeline";
import {
  useFetchManagedDatabaseById,
  useFetchDatabaseCredentials,
  useFetchDatabaseBackups,
  useCreateDatabaseBackup,
  useRestoreDatabaseBackup,
  useDatabaseAction,
  useUpdateDatabaseFirewall,
  useDeleteManagedDatabase,
  useFetchDatabaseMetrics,
  useFetchAvailableUpgrades,
  useUpgradeDatabaseEngine,
  useFetchDrEligibility,
  useFetchDrStatus,
  useEnableDr,
  useDrFailover,
  useDisableDr,
  useFetchDatabaseOperations,
  useRotateDatabaseCredentials,
  useRetryDatabaseOperation,
  useReconcileDatabaseOperation,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type {
  ManagedDatabase,
  ManagedDatabaseBackup,
  ManagedDatabaseOperation,
  ManagedDatabaseOperationProgressStep,
} from "@/types/managedDatabase";
import ResourceProtectionTab from "@/shared/components/integrations/ResourceProtectionTab";

interface ManagedDatabaseDetailProps {
  identifier: string;
  backPath?: string;
  listPath?: string;
  context?: "admin" | "tenant" | "client";
}

type Tab = "overview" | "connection" | "backups" | "metrics" | "firewall" | "dr" | "protection" | "integration" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <DatabaseIcon size={16} /> },
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

const asMetadata = (value: ManagedDatabase["metadata"]): Record<string, unknown> =>
  value && typeof value === "object" ? value : {};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const formatMoney = (value: number | string | undefined): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "—";
  }

  return `$${numeric.toFixed(2)}`;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!db) {
    return <div className="py-20 text-center text-gray-500">Database not found.</div>;
  }

  const metadata = asMetadata(db.metadata);
  const publicIp = asString(metadata.public_ip);
  const endpointHost = db.dns_record_name || publicIp || db.private_ip || "Pending endpoint";
  const progress = getProgressOverview(db.provisioning_progress);
  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : db.status === "active" ? 100 : 0;
  const tlsEnabled = metadata.tls_enabled === true;
  const networkMode = asString(metadata.network_mode) || "managed";
  const currentStepLabel =
    db.status === "provisioning" && progress.current ? progress.current.label : db.status.replace("_", " ");

  return (
    <div className="space-y-6">
      <section className="db-surface-hero rounded-[32px] p-6">
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
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

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
                value={formatMoney(db.monthly_cost)}
                hint={`Created ${formatDateLabel(db.created_at)}`}
                icon={<CalendarDays size={18} />}
              />
            </div>
          </div>

          <div className="db-signal-panel rounded-[28px] p-5 shadow-[0_18px_50px_-34px_rgb(var(--theme-color-rgb)_/_0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Runtime Signal
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {db.status === "active" ? "Connection-ready surface" : "Provisioning orchestra"}
                </h2>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-white dark:text-slate-950">
                {progressPercent}%
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  db.status === "error"
                    ? "bg-red-500"
                    : db.status === "active"
                      ? "bg-emerald-500"
                      : "bg-[linear-gradient(90deg,#0f172a_0%,#0ea5e9_50%,#22c55e_100%)]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-5 space-y-3">
              <RuntimeSignalRow label="Current phase" value={currentStepLabel} />
              <RuntimeSignalRow label="Hostname" value={db.dns_record_name || "Pending"} />
              <RuntimeSignalRow label="Private IP" value={db.private_ip || "Pending"} />
              <RuntimeSignalRow label="Public IP" value={publicIp || "Managed automatically"} />
            </div>

            {progress.current && (
              <div className="mt-5 rounded-[22px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Latest step signal
                </div>
                <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">
                  {progress.current.label}
                </p>
                {typeof progress.current.context?.elapsed_seconds === "number" && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {progress.current.context.elapsed_seconds}s tracked on this flow so far
                  </p>
                )}
              </div>
            )}
          </div>
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
  const publicIp = asString(metadata.public_ip);
  const tlsEnabled = metadata.tls_enabled === true;
  const progress = getProgressOverview(db.provisioning_progress);
  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : db.status === "active" ? 100 : 0;

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
            value={formatMoney(db.monthly_cost)}
            hint="Current monthly run rate"
            icon={<CalendarDays size={18} />}
          />
        </div>

        <div className="grid gap-6 2xl:grid-cols-2">
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
              <InfoRow label="Public IP" value={publicIp ?? "Managed automatically"} copyable={Boolean(publicIp)} />
              <InfoRow label="TLS" value={tlsEnabled ? "Enabled" : "Disabled"} />
              <InfoRow
                label="Firewall Rules"
                value={`${db.firewall_cidrs?.length ?? 0} CIDR entries`}
              />
            </dl>
          </SurfaceCard>
        </div>

        {db.provisioning_progress && db.provisioning_progress.length > 0 && (
          <SurfaceCard
            title="Operational Timeline"
            subtitle="The exact provisioning steps recorded for this database."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {db.provisioning_progress.map((step, index) => (
                <div
                  key={step.id}
                  className={`rounded-[22px] border p-4 ${
                    step.status === "completed"
                      ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : step.status === "failed"
                        ? "border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20"
                        : "border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Step {index + 1}
                    </span>
                    <DatabaseStatusBadge status={step.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">
                    {step.label}
                  </p>
                  {typeof step.context?.elapsed_seconds === "number" && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {step.context.elapsed_seconds}s elapsed in provider telemetry
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SurfaceCard>
        )}
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

// ─── Connection Tab ──────────────────────────────────────────────

const ConnectionTab: React.FC<{ db: ManagedDatabase; identifier: string }> = ({
  db,
  identifier,
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const { data: credentialsData, refetch: fetchCredentials } = useFetchDatabaseCredentials(
    identifier,
    { enabled: showCredentials }
  );

  const handleReveal = useCallback(() => {
    setShowCredentials(true);
    fetchCredentials();
  }, [fetchCredentials]);

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
  const publicIp = asString(metadata.public_ip);
  const tlsEnabled = metadata.tls_enabled === true;

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
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
      </div>

      <div className="space-y-6">
        <SurfaceCard
          title="Connection Posture"
          subtitle="What the runtime currently exposes to clients."
        >
          <dl className="grid gap-3">
            <InfoRow label="Hostname" value={db.dns_record_name ?? "Pending"} copyable={Boolean(db.dns_record_name)} />
            <InfoRow label="Private IP" value={db.private_ip ?? "Pending"} copyable={Boolean(db.private_ip)} />
            <InfoRow label="Public IP" value={publicIp ?? "Managed automatically"} copyable={Boolean(publicIp)} />
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
      </div>
    </div>
  );
};

// ─── Backups Tab ─────────────────────────────────────────────────

const BackupsTab: React.FC<{ db: ManagedDatabase; identifier: string }> = ({ db, identifier }) => {
  const { data: backups, isLoading } = useFetchDatabaseBackups(identifier);
  const createBackupMutation = useCreateDatabaseBackup();
  const restoreMutation = useRestoreDatabaseBackup();

  const backupList = useMemo(() => {
    if (!backups) return [];
    return Array.isArray(backups) ? backups : [];
  }, [backups]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Backups</h3>
        {db.status === "active" && (
          <button
            onClick={() => createBackupMutation.mutate({ identifier })}
            disabled={createBackupMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {createBackupMutation.isPending ? "Creating..." : "Create Backup"}
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading backups...</p>
      ) : backupList.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No backups found.</p>
      ) : (
        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {backupList.map((backup: ManagedDatabaseBackup) => (
            <div key={backup.id} className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{backup.type}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      backup.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : backup.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {backup.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {backup.started_at ? new Date(backup.started_at).toLocaleString() : "—"}
                  {backup.size_mb ? ` · ${backup.size_mb.toFixed(1)} MB` : ""}
                </div>
              </div>
              {backup.status === "completed" && (
                <button
                  onClick={() => {
                    if (confirm("Restore this backup? This will overwrite current data.")) {
                      restoreMutation.mutate({ identifier, backupId: backup.id });
                    }
                  }}
                  disabled={restoreMutation.isPending}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
              )}
            </div>
          ))}
        </div>
      )}
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
  const { data: eligibility, isLoading: eligibilityLoading } = useFetchDrEligibility(identifier, {
    enabled: db.status === "active" && !db.dr_region,
  });
  const { data: drStatus, isLoading: statusLoading } = useFetchDrStatus(identifier, {
    enabled: !!db.dr_region || !!db.dr_primary_id,
  });
  const enableDrMutation = useEnableDr();
  const failoverMutation = useDrFailover();
  const disableDrMutation = useDisableDr();
  const [selectedAz, setSelectedAz] = useState("");

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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Availability Zone
            </label>
            <div className="space-y-2">
              {eligibility.available_azs.map((az) => (
                <button
                  key={az.code}
                  onClick={() => setSelectedAz(az.code)}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-all ${
                    selectedAz === az.code
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <MapPin size={16} className={selectedAz === az.code ? "text-blue-600" : "text-gray-400"} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{az.name}</div>
                    <div className="text-xs text-gray-500">{az.code}</div>
                  </div>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                    az.status === "healthy"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {az.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {eligibility.estimated_monthly_cost != null && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estimated monthly cost</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                +${Number(eligibility.estimated_monthly_cost).toFixed(2)}/mo
              </span>
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
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedAz && confirm("Enable DR? A standby replica will be provisioned in the selected AZ.")) {
                enableDrMutation.mutate({ identifier, targetAz: selectedAz });
              }
            }}
            disabled={!selectedAz || enableDrMutation.isPending}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enableDrMutation.isPending ? "Enabling DR..." : "Enable Disaster Recovery"}
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
  const metadata = asMetadata(db.metadata);
  const host = creds?.host || db.dns_record_name || asString(metadata.public_ip) || "your-db-host";
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
  const actionMutation = useDatabaseAction();
  const deleteMutation = useDeleteManagedDatabase();
  const rotateMutation = useRotateDatabaseCredentials();
  const retryMutation = useRetryDatabaseOperation();
  const reconcileMutation = useReconcileDatabaseOperation();
  const [rotationUsername, setRotationUsername] = useState("");
  const [rotationPassword, setRotationPassword] = useState("");
  const [generatePassword, setGeneratePassword] = useState(true);
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
      : db.engine !== "postgresql"
        ? `Credential rotation is not yet supported for ${getEngineLabel(db.engine)}.`
        : null;

  const canSubmitRotation =
    !rotationBlockedReason &&
    (generatePassword ||
      rotationPassword.trim().length > 0 ||
      rotationUsername.trim().length > 0);

  React.useEffect(() => {
    setActiveOperationKnown(operations.some((operation) => ACTIVE_OPERATION_STATUSES.has(operation.status)));
  }, [operations]);

  return (
    <div className="space-y-6">
      <SurfaceCard
        title="Lifecycle"
        subtitle="Pause or resume the service without leaving the control surface."
      >
        <div className="flex flex-wrap gap-3">
          {db.status === "active" && (
            <button
              onClick={() => actionMutation.mutate({ identifier, action: "pause" })}
              disabled={actionMutation.isPending}
              className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
            >
              <Pause size={16} />
              Pause Database
            </button>
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
        title="Credential Rotation"
        subtitle="Queue a tracked credential-change operation and follow it through verification."
        action={
          <span className="db-brand-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <KeyRound size={14} />
            PostgreSQL runtime op
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
                    onClick={() =>
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
                          },
                        }
                      )
                    }
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
                  value="Update the live PostgreSQL login using the current working credentials."
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

const RuntimeSignalRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="db-surface-soft flex flex-col gap-2 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">{label}</span>
    <span className="w-full break-all text-left text-sm font-medium text-[var(--theme-heading-color)] sm:max-w-[65%] sm:text-right">
      {value}
    </span>
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

export default ManagedDatabaseDetail;

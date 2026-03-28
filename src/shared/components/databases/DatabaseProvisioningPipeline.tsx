/**
 * DatabaseProvisioningPipeline — Displays real-time provisioning progress
 * for a managed database, polling the API until status reaches 'active' or 'error'.
 */
import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleCheckBig,
  Clock,
  CloudCog,
  Copy,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  KeyRound,
  Loader2,
  Lock,
  MonitorUp,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";
import { useFetchDatabaseCredentials } from "@/shared/hooks/resources/managedDatabaseHooks";
import type {
  ManagedDatabase,
  DatabaseEngine,
  ProvisioningStep,
  DatabaseCredentials,
} from "@/types/managedDatabase";

type StepStatus = "pending" | "in_progress" | "completed" | "failed" | "warning";

interface PipelineStepDef {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface DatabaseProvisioningPipelineProps {
  databaseIdentifier: string;
  initialProgress?: ProvisioningStep[];
}

const PIPELINE_STEPS: PipelineStepDef[] = [
  {
    key: "auth",
    label: "Authenticating with provider",
    description: "Validating the cloud credentials and tenant scope.",
    icon: <KeyRound size={16} />,
  },
  {
    key: "create_volume",
    label: "Creating data volume",
    description: "Provisioning dedicated storage for the database payload.",
    icon: <HardDrive size={16} />,
  },
  {
    key: "create_sg",
    label: "Resolving security group",
    description: "Selecting the traffic boundary for the service.",
    icon: <ShieldCheck size={16} />,
  },
  {
    key: "sg_rules",
    label: "Configuring firewall rules",
    description: "Opening the minimum ports needed for bootstrap and DB traffic.",
    icon: <Settings2 size={16} />,
  },
  {
    key: "cloud_init",
    label: "Building installation script",
    description: "Assembling the guest bootstrap instructions.",
    icon: <CloudCog size={16} />,
  },
  {
    key: "create_instance",
    label: "Launching VM instance",
    description: "Creating the compute host that will run the engine.",
    icon: <Server size={16} />,
  },
  {
    key: "elastic_ip",
    label: "Allocating Elastic IP",
    description: "Reserving a routable address for external access.",
    icon: <Zap size={16} />,
  },
  {
    key: "create_dns",
    label: "Creating DNS record",
    description: "Publishing the endpoint that clients will connect to.",
    icon: <Globe size={16} />,
  },
  {
    key: "boot_install",
    label: "Booting and installing DB",
    description: "The guest is booting, mounting storage, and installing the engine.",
    icon: <MonitorUp size={16} />,
  },
  {
    key: "create_cluster",
    label: "Creating database cluster",
    description: "Verifying runtime readiness and internal service health.",
    icon: <Wifi size={16} />,
  },
  {
    key: "fetch_credentials",
    label: "Fetching credentials",
    description: "Pulling the first usable connection details from the provider.",
    icon: <Lock size={16} />,
  },
  {
    key: "configure_firewall",
    label: "Applying firewall policy",
    description: "Applying the approved CIDR rules to the final database service.",
    icon: <ShieldCheck size={16} />,
  },
  {
    key: "database_ready",
    label: "Database ready",
    description: "The cluster is live and ready for application traffic.",
    icon: <CircleCheckBig size={16} />,
  },
];

const IN_PROGRESS_STATUSES = new Set(["in_progress", "processing", "queued", "running"]);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function resolveStepStatus(apiStatus: string | undefined): StepStatus {
  if (!apiStatus) return "pending";
  if (apiStatus === "completed") return "completed";
  if (apiStatus === "failed") return "failed";
  if (apiStatus === "warning") return "warning";
  if (IN_PROGRESS_STATUSES.has(apiStatus)) return "in_progress";

  return "pending";
}

const formatDateTime = (value: unknown): string | null => {
  const text = readString(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString();
};

const formatElapsed = (value: unknown): string | null => {
  const seconds = readNumber(value);
  if (seconds == null) return null;

  if (seconds < 60) return `${seconds}s elapsed`;

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) {
    return remainder > 0 ? `${minutes}m ${remainder}s elapsed` : `${minutes}m elapsed`;
  }

  const hours = Math.floor(minutes / 60);
  const minutesRemainder = minutes % 60;

  return minutesRemainder > 0
    ? `${hours}h ${minutesRemainder}m elapsed`
    : `${hours}h elapsed`;
};

function buildCliExample(
  engine: DatabaseEngine,
  creds: DatabaseCredentials,
  connectionString?: string | null
): string {
  switch (engine) {
    case "postgresql":
      return `psql -h ${creds.host} -p ${creds.port} -U ${creds.username} -d ${creds.database}`;
    case "mysql":
    case "mariadb":
      return `mysql -h ${creds.host} -P ${creds.port} -u ${creds.username} -p`;
    case "mongodb":
      return `mongosh "${connectionString || `mongodb://${creds.username}@${creds.host}:${creds.port}/${creds.database}`}"`;
    case "redis":
      return `redis-cli -h ${creds.host} -p ${creds.port} -a ${creds.password}`;
    default:
      return "";
  }
}

function getStatusBadge(status: StepStatus) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 size={12} />
          Completed
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
          <Loader2 size={12} className="animate-spin" />
          Running
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <XCircle size={12} />
          Failed
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle size={12} />
          Warning
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <Clock size={12} />
          Pending
        </span>
      );
  }
}

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

const CopyableCodeField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="db-surface-soft rounded-2xl p-4">
    <dt className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
      {label}
    </dt>
    <dd className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="db-surface-inset flex-1 overflow-x-auto break-all rounded-2xl px-3 py-3 text-sm text-[var(--theme-heading-color)]">
        {value}
      </code>
      <div className="self-end sm:self-auto">
        <CopyButton value={value} />
      </div>
    </dd>
  </div>
);

const MaskedField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="db-surface-soft rounded-2xl p-4">
      <dt className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
        {label}
      </dt>
      <dd className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="db-surface-inset flex-1 overflow-x-auto break-all rounded-2xl px-3 py-3 text-sm text-[var(--theme-heading-color)]">
          {revealed ? value : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
        </code>
        <button
          onClick={() => setRevealed((prev) => !prev)}
          className="self-end rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 sm:self-auto"
          title={revealed ? "Hide" : "Reveal"}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <div className="self-end sm:self-auto">
          <CopyButton value={value} />
        </div>
      </dd>
    </div>
  );
};

const ContextPill: React.FC<{ children: React.ReactNode; tone?: "slate" | "sky" | "emerald" | "amber" }> = ({
  children,
  tone = "slate",
}) => {
  const toneClasses = {
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
};

const CredentialsPanel: React.FC<{
  identifier: string;
  engine: DatabaseEngine;
  connectionString: string | null;
}> = ({ identifier, engine, connectionString }) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const { data: credentialsData, refetch } = useFetchDatabaseCredentials(identifier, {
    enabled: showCredentials,
  });

  const handleReveal = useCallback(() => {
    setShowCredentials(true);
    refetch();
  }, [refetch]);

  const creds = credentialsData?.credentials;
  const connStr = credentialsData?.connection_string || connectionString;

  return (
    <section className="db-surface-hero rounded-[30px] p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="db-brand-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
            <CircleCheckBig size={14} />
            Database Ready
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--theme-heading-color)]">
            Connection handoff
          </h3>
          <p className="mt-1 text-sm text-[var(--theme-text-color)]">
            The cluster is live. Reveal the runtime credentials when you are ready to connect.
          </p>
        </div>

        {!showCredentials ? (
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
        )}
      </div>

      {showCredentials && creds ? (
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            {connStr && <CopyableCodeField label="Connection String" value={connStr} />}
            <div className="grid gap-4 xl:grid-cols-2">
              <CopyableCodeField label="Host" value={creds.host} />
              <CopyableCodeField label="Port" value={String(creds.port)} />
              <CopyableCodeField label="Username" value={creds.username} />
              <MaskedField label="Password" value={creds.password} />
            </div>
            {creds.database && <CopyableCodeField label="Database" value={creds.database} />}
          </div>

          <div className="db-signal-panel rounded-[28px] p-5 shadow-inner">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
              <Terminal size={14} />
              Quick Connect
            </div>
            <code className="mt-4 block overflow-x-auto rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-emerald-300">
              {buildCliExample(engine, creds, connStr)}
            </code>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Direct client connection</span>
              <CopyButton value={buildCliExample(engine, creds, connStr)} />
            </div>
          </div>
        </div>
      ) : showCredentials ? (
        <div className="db-surface-soft flex items-center gap-2 rounded-2xl px-4 py-4 text-sm text-[var(--theme-muted-color)]">
          <Loader2 size={16} className="animate-spin" />
          Loading credentials...
        </div>
      ) : (
        <div className="db-surface-soft rounded-2xl px-4 py-4 text-sm text-[var(--theme-text-color)]">
          Credentials stay hidden until explicitly revealed. This view is intended for operator handoff only.
        </div>
      )}
    </section>
  );
};

const DatabaseProvisioningPipeline: React.FC<DatabaseProvisioningPipelineProps> = ({
  databaseIdentifier,
  initialProgress,
}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const { data: dbData } = useQuery<ManagedDatabase>({
    queryKey: ["managedDatabase-provisioning", context, databaseIdentifier],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${databaseIdentifier}`;
      const res = await entry.silentApi.get<Record<string, unknown>>(uri);
      const envelope = (res ?? {}) as { data?: ManagedDatabase };

      return envelope.data ?? (res as unknown as ManagedDatabase);
    },
    refetchInterval: (query) => {
      const db = query.state.data;
      if (db?.status === "active" || db?.status === "error") return false;

      return 5000;
    },
    staleTime: 0,
  });

  const db = dbData ?? null;
  const apiSteps = useMemo(
    () => db?.provisioning_progress ?? initialProgress ?? [],
    [db?.provisioning_progress, initialProgress]
  );
  const isTerminal = db?.status === "active" || db?.status === "error";

  const mergedSteps = useMemo(() => {
    const stepMap = new Map<string, ProvisioningStep>();
    for (const step of apiSteps) {
      stepMap.set(step.id, step);
    }

    return PIPELINE_STEPS.map((definition) => {
      const apiStep = stepMap.get(definition.key);
      const status = apiStep
        ? resolveStepStatus(apiStep.status)
        : isTerminal && db?.status === "active"
          ? "completed"
          : "pending";

      return {
        ...definition,
        status,
        context: asRecord(apiStep?.context),
      };
    });
  }, [apiSteps, db?.status, isTerminal]);

  const completedCount = mergedSteps.filter((step) => step.status === "completed").length;
  const totalCount = mergedSteps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const hasFailed = mergedSteps.some((step) => step.status === "failed") || db?.status === "error";

  const currentStep = useMemo(
    () =>
      mergedSteps.find((step) => step.status === "in_progress") ||
      mergedSteps.find((step) => step.status === "warning") ||
      mergedSteps.find((step) => step.status === "pending") ||
      mergedSteps[mergedSteps.length - 1],
    [mergedSteps]
  );

  const currentContext = asRecord(currentStep?.context);
  const readiness = asRecord(currentContext.readiness);
  const endpoint =
    readString(currentContext.dns_name) ||
    readString(currentContext.public_ip) ||
    readString(currentContext.ip_address) ||
    readString(db?.dns_record_name) ||
    "Endpoint pending";
  const elapsed = formatElapsed(currentContext.elapsed_seconds);
  const checkedAt = formatDateTime(currentContext.checked_at || currentContext.last_checked_at);
  const nextPollAt = formatDateTime(currentContext.next_poll_at);
  const attempt = readNumber(currentContext.attempt);
  const maxAttempts = readNumber(currentContext.max_attempts);
  const pollSeconds = readNumber(currentContext.poll_interval_seconds);
  const clusterStatus = readString(currentContext.cluster_status) || db?.status || "provisioning";
  const stepError =
    readString(currentContext.error) ||
    readString(currentContext.error_message) ||
    readString(readiness.error_message);
  const privateIp = readString(currentContext.private_ip) || readString(db?.private_ip);
  const publicIp =
    readString(currentContext.public_ip) ||
    readString(asRecord(db?.metadata).public_ip);

  return (
    <div className="space-y-6">
      <section className="db-surface-hero rounded-[32px] p-6">
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <div className="db-brand-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] shadow-sm">
              <Sparkles size={14} />
              Live Provisioning Flow
            </div>

            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-[var(--theme-heading-color)]">
                {hasFailed
                  ? "Provisioning needs operator attention"
                  : progressPct === 100
                    ? "Provisioning completed successfully"
                    : currentStep?.label || "Provisioning in progress"}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--theme-text-color)]">
                {hasFailed
                  ? "The flow stopped on a failed step. Inspect the error signal below before retrying."
                  : progressPct === 100
                    ? "The database has crossed the bootstrap line and is ready to hand over to application teams."
                    : currentStep?.description}
              </p>
            </div>

            <div className="db-surface-inset rounded-[26px] p-5 shadow-[0_16px_50px_-34px_rgb(var(--theme-color-rgb)_/_0.18)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[var(--theme-button-primary-bg)] p-3 text-[var(--theme-button-primary-text)]">
                    {currentStep?.icon || <Activity size={18} />}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-muted-color)]">
                      Current phase
                    </p>
                    <p className="text-lg font-semibold text-[var(--theme-heading-color)]">
                      {currentStep?.label || "Awaiting orchestration"}
                    </p>
                  </div>
                </div>
                {getStatusBadge(currentStep?.status || "pending")}
              </div>

              <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    hasFailed
                      ? "bg-red-500"
                      : progressPct === 100
                        ? "bg-emerald-500"
                        : "bg-[linear-gradient(90deg,#0f172a_0%,#0ea5e9_50%,#22c55e_100%)]"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ContextPill tone={hasFailed ? "amber" : "sky"}>{progressPct}% complete</ContextPill>
                <ContextPill>{`${completedCount}/${totalCount} steps complete`}</ContextPill>
                <ContextPill tone={progressPct === 100 ? "emerald" : "slate"}>
                  Cluster status: {clusterStatus}
                </ContextPill>
                {readiness.ready === true && (
                  <ContextPill tone="emerald">Readiness passed</ContextPill>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="db-surface-inset rounded-[24px] p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
                Endpoint
              </div>
              <div className="mt-2 break-all text-sm font-semibold text-[var(--theme-heading-color)]">
                {endpoint}
              </div>
              <div className="mt-2 text-xs text-[var(--theme-muted-color)]">
                {publicIp || privateIp || "Address pending"}
              </div>
            </div>

            <div className="db-surface-inset rounded-[24px] p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
                Poll Rhythm
              </div>
              <div className="mt-2 text-sm font-semibold text-[var(--theme-heading-color)]">
                {pollSeconds ? `Every ${pollSeconds}s` : "Live polling"}
              </div>
              <div className="mt-2 text-xs text-[var(--theme-muted-color)]">{nextPollAt || "Waiting for next refresh"}</div>
            </div>

            <div className="db-surface-inset rounded-[24px] p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
                Runtime Clock
              </div>
              <div className="mt-2 text-sm font-semibold text-[var(--theme-heading-color)]">
                {elapsed || "Bootstrap in motion"}
              </div>
              <div className="mt-2 text-xs text-[var(--theme-muted-color)]">{checkedAt || "Awaiting first check"}</div>
            </div>

            <div className="db-surface-inset rounded-[24px] p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
                Attempts
              </div>
              <div className="mt-2 text-sm font-semibold text-[var(--theme-heading-color)]">
                {attempt != null && maxAttempts != null ? `${attempt}/${maxAttempts}` : "Tracking"}
              </div>
              <div className="mt-2 text-xs text-[var(--theme-muted-color)]">
                {stepError ? "Latest signal captured below" : "No blocking error signal"}
              </div>
            </div>
          </div>
        </div>

        {stepError && (
          <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Latest error signal</p>
                <p className="mt-1">{stepError}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="db-surface-card rounded-[30px] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-heading-color)]">Pipeline Steps</h3>
            <p className="text-sm text-[var(--theme-muted-color)]">
              Every step is backed by the provider progress payload and refreshed in real time.
            </p>
          </div>
          <div className="db-muted-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <Activity size={14} />
            Provider-synced telemetry
          </div>
        </div>

        <div className="grid gap-4 2xl:grid-cols-2">
          {mergedSteps.map((step, index) => {
            const context = asRecord(step.context);
            const readinessContext = asRecord(context.readiness);
            const detailPills = [
              formatElapsed(context.elapsed_seconds),
              attempt != null && step === currentStep && maxAttempts != null ? `Attempt ${attempt}/${maxAttempts}` : null,
              formatDateTime(context.checked_at),
            ].filter(Boolean) as string[];

            const toneClasses = {
              completed:
                "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",
              in_progress:
                "border-sky-200/80 bg-sky-50/60 shadow-[0_18px_50px_-36px_rgba(14,165,233,0.45)] dark:border-sky-900 dark:bg-sky-950/20",
              failed:
                "border-red-200/80 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20",
              warning:
                "border-amber-200/80 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20",
              pending:
                "border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60",
            } as const;

            return (
              <div
                key={step.key}
                className={`rounded-[26px] border p-5 transition duration-300 ${toneClasses[step.status]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl ${
                        step.status === "completed"
                          ? "bg-emerald-600 text-white"
                          : step.status === "in_progress"
                            ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                            : step.status === "failed"
                              ? "bg-red-600 text-white"
                              : step.status === "warning"
                                ? "bg-amber-500 text-slate-950"
                                : "bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-300"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Step {index + 1}
                      </div>
                      <h4 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                        {step.label}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {getStatusBadge(step.status)}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {detailPills.map((pill) => (
                    <ContextPill key={pill}>{pill}</ContextPill>
                  ))}
                  {readinessContext.port_open === true && (
                    <ContextPill tone="emerald">Port open</ContextPill>
                  )}
                  {readinessContext.port_open === false && (
                    <ContextPill tone="amber">Port closed</ContextPill>
                  )}
                  {readString(context.public_ip) && <ContextPill tone="sky">Public route attached</ContextPill>}
                </div>

                {(readString(context.error) ||
                  readString(context.error_message) ||
                  readString(readinessContext.error_message)) && (
                  <p className="mt-4 text-sm text-red-700 dark:text-red-300">
                    {readString(context.error) ||
                      readString(context.error_message) ||
                      readString(readinessContext.error_message)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {db?.status === "active" && (
        <CredentialsPanel
          identifier={databaseIdentifier}
          engine={db.engine}
          connectionString={db.connection_string}
        />
      )}
    </div>
  );
};

export default DatabaseProvisioningPipeline;

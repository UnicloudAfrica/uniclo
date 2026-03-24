/**
 * DatabaseProvisioningPipeline — Displays real-time provisioning progress
 * for a managed database, polling the API until status reaches 'active' or 'error'.
 *
 * Follows the same pattern as the instance provisioning pipeline
 * (see order-success/ProvisioningPipelineSection.tsx).
 */
import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  HardDrive,
  ShieldCheck,
  Settings2,
  CloudCog,
  Server,
  Globe,
  MonitorUp,
  Wifi,
  Lock,
  Link2,
  Flame,
  CreditCard,
  CircleCheckBig,
  Terminal,
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

// ─── Types ──────────────────────────────────────────────────────

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

// ─── Pipeline Step Definitions ──────────────────────────────────

const PIPELINE_STEPS: PipelineStepDef[] = [
  { key: "auth", label: "Authenticating with provider", description: "Resolving cloud credentials", icon: <KeyRound size={16} /> },
  { key: "create_volume", label: "Creating data volume", description: "Provisioning dedicated storage", icon: <HardDrive size={16} /> },
  { key: "create_sg", label: "Creating security group", description: "Setting up firewall rules", icon: <ShieldCheck size={16} /> },
  { key: "sg_rules", label: "Configuring firewall rules", description: "Opening database port", icon: <Settings2 size={16} /> },
  { key: "cloud_init", label: "Building installation script", description: "Generating DB install script", icon: <CloudCog size={16} /> },
  { key: "create_instance", label: "Launching VM instance", description: "Creating compute instance", icon: <Server size={16} /> },
  { key: "create_dns", label: "Creating DNS record", description: "Setting up hostname", icon: <Globe size={16} /> },
  { key: "boot_install", label: "Booting and installing DB", description: "VM boots + engine install", icon: <MonitorUp size={16} /> },
  { key: "readiness_check", label: "Database readiness check", description: "Checking port connectivity", icon: <Wifi size={16} /> },
  { key: "fetch_credentials", label: "Fetching credentials", description: "Retrieving access details", icon: <Lock size={16} /> },
  { key: "connection_string", label: "Building connection string", description: "Generating connection URL", icon: <Link2 size={16} /> },
  { key: "firewall", label: "Applying firewall rules", description: "Setting CIDR whitelist", icon: <Flame size={16} /> },
  { key: "billing", label: "Processing billing", description: "Confirming charges", icon: <CreditCard size={16} /> },
  { key: "ready", label: "Database ready", description: "Provisioning complete", icon: <CircleCheckBig size={16} /> },
];

// ─── Helpers ────────────────────────────────────────────────────

function resolveStepStatus(apiStatus: string | undefined): StepStatus {
  switch (apiStatus) {
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "in_progress":
      return "in_progress";
    case "warning":
      return "warning";
    case "pending":
    default:
      return "pending";
  }
}

function getStatusBadge(status: StepStatus) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 size={12} />
          Completed
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Loader2 size={12} className="animate-spin" />
          In Progress
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <XCircle size={12} />
          Failed
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <AlertTriangle size={12} />
          Warning
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <Clock size={12} />
          Pending
        </span>
      );
  }
}

function buildCliExample(
  engine: DatabaseEngine,
  creds: DatabaseCredentials,
  connectionString?: string | null
): string {
  switch (engine) {
    case "postgresql":
      return `psql -h ${creds.host} -p ${creds.port} -U ${creds.username} -d ${creds.database}`;
    case "mysql":
      return `mysql -h ${creds.host} -P ${creds.port} -u ${creds.username} -p`;
    case "mongodb":
      return `mongosh "${connectionString || `mongodb://${creds.username}@${creds.host}:${creds.port}/${creds.database}`}"`;
    case "redis":
      return `redis-cli -h ${creds.host} -p ${creds.port} -a ${creds.password}`;
    default:
      return "";
  }
}

// ─── Sub-components ─────────────────────────────────────────────

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
      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

const CopyableCodeField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
        {value}
      </code>
      <CopyButton value={value} />
    </dd>
  </div>
);

const MaskedField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <dt className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
          {revealed ? value : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
        </code>
        <button
          onClick={() => setRevealed((prev) => !prev)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          title={revealed ? "Hide" : "Reveal"}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <CopyButton value={value} />
      </dd>
    </div>
  );
};

// ─── Credentials Panel ──────────────────────────────────────────

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
    <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 dark:border-green-800 dark:bg-green-900/10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleCheckBig size={20} className="text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Database Ready
          </h3>
        </div>
        {!showCredentials ? (
          <button
            onClick={handleReveal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Eye size={16} />
            Reveal Credentials
          </button>
        ) : (
          <button
            onClick={() => setShowCredentials(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            <EyeOff size={16} />
            Hide
          </button>
        )}
      </div>

      {showCredentials && creds ? (
        <dl className="space-y-4">
          {connStr && <CopyableCodeField label="Connection String" value={connStr} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <CopyableCodeField label="Host" value={creds.host} />
            <CopyableCodeField label="Port" value={String(creds.port)} />
            <CopyableCodeField label="Username" value={creds.username} />
            <MaskedField label="Password" value={creds.password} />
          </div>
          {creds.database && <CopyableCodeField label="Database" value={creds.database} />}

          {/* CLI Example */}
          <div className="border-t border-green-200 pt-4 dark:border-green-800">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Terminal size={14} />
              Quick Connect
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 text-sm text-green-400 dark:bg-gray-950">
                {buildCliExample(engine, creds, connStr)}
              </code>
              <CopyButton value={buildCliExample(engine, creds, connStr)} />
            </div>
          </div>
        </dl>
      ) : showCredentials ? (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading credentials...
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your database is active and ready to accept connections. Click &quot;Reveal Credentials&quot; to view connection details.
        </p>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────

const DatabaseProvisioningPipeline: React.FC<DatabaseProvisioningPipelineProps> = ({
  databaseIdentifier,
  initialProgress,
}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  // Poll the database endpoint every 5 seconds
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
  const apiSteps = db?.provisioning_progress ?? initialProgress ?? [];
  const isTerminal = db?.status === "active" || db?.status === "error";

  // Merge API steps into the pipeline definition
  const mergedSteps = useMemo(() => {
    const stepMap = new Map<string, ProvisioningStep>();
    for (const s of apiSteps) {
      stepMap.set(s.id, s);
    }

    // Determine which step is currently active to show in_progress
    let foundIncomplete = false;

    return PIPELINE_STEPS.map((def) => {
      const apiStep = stepMap.get(def.key);
      let status: StepStatus;

      if (apiStep) {
        status = resolveStepStatus(apiStep.status);
      } else if (isTerminal && db?.status === "active") {
        status = "completed";
      } else if (!foundIncomplete) {
        // First step without a match and prior steps are complete -> pending
        status = "pending";
      } else {
        status = "pending";
      }

      if (status !== "completed" && status !== "failed") {
        foundIncomplete = true;
      }

      return {
        ...def,
        status,
        context: apiStep?.context,
      };
    });
  }, [apiSteps, isTerminal, db?.status]);

  // Calculate progress percentage
  const completedCount = mergedSteps.filter((s) => s.status === "completed").length;
  const totalCount = mergedSteps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Determine if we have a failure
  const hasFailed = mergedSteps.some((s) => s.status === "failed") || db?.status === "error";

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Provisioning Progress
          </h3>
          <span
            className={`text-sm font-medium ${
              hasFailed
                ? "text-red-600"
                : progressPct === 100
                  ? "text-green-600"
                  : "text-blue-600"
            }`}
          >
            {progressPct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              hasFailed
                ? "bg-red-500"
                : progressPct === 100
                  ? "bg-green-500"
                  : "bg-blue-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {hasFailed
            ? "Provisioning encountered an error."
            : progressPct === 100
              ? "All steps completed successfully."
              : `${completedCount} of ${totalCount} steps completed.`}
        </p>
      </div>

      {/* Vertical Pipeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
          Pipeline Steps
        </h3>
        <div className="relative">
          {mergedSteps.map((step, idx) => {
            const isLast = idx === mergedSteps.length - 1;
            return (
              <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Vertical connector line */}
                {!isLast && (
                  <div
                    className={`absolute left-[15px] top-[32px] h-[calc(100%-20px)] w-0.5 ${
                      step.status === "completed"
                        ? "bg-green-300 dark:bg-green-700"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}

                {/* Step icon */}
                <div
                  className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    step.status === "completed"
                      ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-900/30"
                      : step.status === "in_progress"
                        ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30"
                        : step.status === "failed"
                          ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-900/30"
                          : step.status === "warning"
                            ? "border-yellow-500 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30"
                            : "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  {step.icon}
                </div>

                {/* Step content */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {step.label}
                    </p>
                    {getStatusBadge(step.status)}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                  {step.context?.error && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {String(step.context.error)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credentials panel — shown when database is active */}
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

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle,
  Database,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  XCircle,
  Zap,
} from "lucide-react";
import {
  useCreateDatabaseReplicationGroup,
  useDatabaseEngines,
  useDatabaseReplicationGroups,
  usePreflightDatabaseReplication,
  useSyncDatabaseReplication,
  usePauseDatabaseReplication,
  useResumeDatabaseReplication,
} from "@/shared/hooks/resources/integrationHooks";
import { useFetchExternalEndpoints } from "@/shared/hooks/resources";

interface ShellProps {
  title: string;
  description?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

interface DatabaseReplicationWorkspaceProps {
  PageShell: React.ComponentType<ShellProps>;
  title: string;
  description: string;
}

const ENGINE_META: Record<string, { label: string; color: string; bg: string; darkBg: string }> = {
  postgresql: {
    label: "PostgreSQL",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100",
    darkBg: "dark:bg-blue-900/40",
  },
  mysql: {
    label: "MySQL",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100",
    darkBg: "dark:bg-orange-900/40",
  },
  mongodb: {
    label: "MongoDB",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100",
    darkBg: "dark:bg-green-900/40",
  },
  redis: {
    label: "Redis",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100",
    darkBg: "dark:bg-red-900/40",
  },
  sqlserver: {
    label: "SQL Server",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100",
    darkBg: "dark:bg-purple-900/40",
  },
  mssql: {
    label: "SQL Server",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100",
    darkBg: "dark:bg-purple-900/40",
  },
};

const ENGINE_ICON: Record<string, React.ReactNode> = {
  postgresql: <Database size={18} />,
  mysql: <Server size={18} />,
  mongodb: <Zap size={18} />,
  redis: <Zap size={18} />,
  sqlserver: <Server size={18} />,
  mssql: <Server size={18} />,
};

const MODE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  full: { label: "Full Dump", icon: <Camera size={14} /> },
  cdc: { label: "CDC", icon: <RefreshCw size={14} /> },
};

const DEFAULT_PORTS: Record<string, string> = {
  postgresql: "5432",
  mysql: "3306",
  mongodb: "27017",
  redis: "6379",
  sqlserver: "1433",
  mssql: "1433",
};

const INITIAL_FORM = {
  name: "",
  engine: "postgresql",
  sync_mode: "full",
  source_endpoint_id: "",
  source_host: "",
  source_port: "5432",
  source_database: "",
  source_username: "",
  source_password: "",
  replica_endpoint_id: "",
  replica_host: "",
  replica_port: "5432",
  replica_database: "",
  replica_username: "",
  replica_password: "",
};

function statusMeta(status: string) {
  switch (status) {
    case "healthy":
    case "active":
      return {
        label: status,
        dot: "bg-emerald-500",
        badge:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-600/20",
      };
    case "degraded":
    case "lagging":
      return {
        label: status,
        dot: "bg-amber-500",
        badge:
          "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-600/20",
      };
    case "error":
    case "failed":
      return {
        label: status,
        dot: "bg-red-500",
        badge:
          "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-600/20",
      };
    default:
      return {
        label: status || "unknown",
        dot: "bg-gray-400",
        badge:
          "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 ring-gray-600/20",
      };
  }
}

function lagBadge(seconds: unknown) {
  if (seconds == null) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">N/A</span>;
  }

  const lag = Number(seconds);
  let className =
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400";

  if (lag >= 30) {
    className =
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400";
  }
  if (lag >= 120) {
    className =
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {lag}s
    </span>
  );
}

export default function DatabaseReplicationWorkspace({
  PageShell,
  title,
  description,
}: DatabaseReplicationWorkspaceProps) {
  const { data: replicationsResponse, isLoading } = useDatabaseReplicationGroups();
  const { data: engineCatalog } = useDatabaseEngines();
  const { data: endpointResponse = [] } = useFetchExternalEndpoints({ extra: { per_page: 100, type: "vm", status: "connected" } });
  const { mutate: createReplication, isPending: creating } = useCreateDatabaseReplicationGroup();
  const { mutate: runPreflight, isPending: preflighting } = usePreflightDatabaseReplication();
  const { mutate: syncReplication } = useSyncDatabaseReplication();
  const { mutate: pauseReplication } = usePauseDatabaseReplication();
  const { mutate: resumeReplication } = useResumeDatabaseReplication();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [preflightResult, setPreflightResult] = useState<Record<string, unknown> | null>(null);
  const [preflightIdentifier, setPreflightIdentifier] = useState<string | null>(null);
  const replications = Array.isArray(replicationsResponse)
    ? replicationsResponse
    : Array.isArray((replicationsResponse as Record<string, unknown> | undefined)?.data)
      ? ((replicationsResponse as Record<string, unknown>).data as Record<string, unknown>[])
      : [];
  const externalEndpoints = Array.isArray(endpointResponse)
    ? endpointResponse
    : Array.isArray((endpointResponse as Record<string, unknown> | undefined)?.data)
      ? ((endpointResponse as Record<string, unknown>).data as Record<string, unknown>[])
      : [];

  const canSubmit =
    form.name &&
    form.source_endpoint_id &&
    form.source_host &&
    form.source_database &&
    form.source_username &&
    form.source_password &&
    form.replica_endpoint_id &&
    form.replica_host &&
    form.replica_database &&
    form.replica_username &&
    form.replica_password;

  const stats = useMemo(() => {
    const total = replications.length;
    let active = 0;
    let degraded = 0;
    let failed = 0;

    replications.forEach((replication: Record<string, unknown>) => {
      const status = replication.status as string;
      if (status === "healthy" || status === "active") {
        active++;
      } else if (status === "degraded" || status === "lagging") {
        degraded++;
      } else if (status === "error" || status === "failed") {
        failed++;
      }
    });

    return { total, active, degraded, failed };
  }, [replications]);

  const handleCreate = () => {
    createReplication(
      {
        name: form.name,
        engine: form.engine,
        sync_mode: form.sync_mode as "full" | "cdc",
        source_endpoint_id: form.source_endpoint_id,
        source_config: {
          host: form.source_host,
          port: Number(form.source_port),
          database: form.source_database,
          username: form.source_username,
          password: form.source_password,
        },
        replica_endpoint_id: form.replica_endpoint_id,
        replica_config: {
          host: form.replica_host,
          port: Number(form.replica_port),
          database: form.replica_database,
          username: form.replica_username,
          password: form.replica_password,
        },
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm(INITIAL_FORM);
        },
      },
    );
  };

  return (
    <PageShell title={title} description={description} contentClassName="space-y-6">
      {/* Plain English Explanation */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/30">
        <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-200">What is Database Replication?</h4>
        <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-300">
          Database replication keeps an exact copy of your database running on a second server at all times.
          Every time data changes on your <strong>source</strong> (original) database, those changes are automatically
          sent to the <strong>replica</strong> (copy) database. If your main database goes down, you can switch
          to the replica with minimal downtime. It also helps with performance — you can send read-heavy
          queries to the replica instead of overloading your main database.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
            <CheckCircle size={14} className="mt-0.5 shrink-0" />
            <span><strong>High Availability:</strong> If the source fails, the replica takes over automatically</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
            <CheckCircle size={14} className="mt-0.5 shrink-0" />
            <span><strong>Load Balancing:</strong> Spread read queries across source and replicas</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
            <CheckCircle size={14} className="mt-0.5 shrink-0" />
            <span><strong>Data Safety:</strong> Your data exists in multiple places — no single point of failure</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Replications",
            value: stats.total,
            iconBg: "bg-blue-100 dark:bg-blue-900/40",
            iconColor: "text-blue-600 dark:text-blue-400",
            icon: <Database size={20} />,
          },
          {
            label: "Active",
            value: stats.active,
            iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            icon: <CheckCircle size={20} />,
          },
          {
            label: "Degraded",
            value: stats.degraded,
            iconBg: "bg-amber-100 dark:bg-amber-900/40",
            iconColor: "text-amber-600 dark:text-amber-400",
            icon: <AlertTriangle size={20} />,
          },
          {
            label: "Failed",
            value: stats.failed,
            iconBg: "bg-red-100 dark:bg-red-900/40",
            iconColor: "text-red-600 dark:text-red-400",
            icon: <XCircle size={20} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stat.iconBg} ${stat.iconColor}`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {replications.length} replication{replications.length !== 1 ? "s" : ""} configured
        </p>
        <button
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Database Replication
        </button>
      </div>

      {showCreate && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="p-6">
            <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-50">
              Create Database Replication
            </h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Configure a new replication group between two database endpoints.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <Database size={13} /> Replication Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. prod-db-replication"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Database Engine
                </label>
                <div className="flex flex-wrap gap-3">
                  {(engineCatalog && engineCatalog.length > 0
                    ? engineCatalog.map((e: Record<string, unknown>) => e.key as string)
                    : ["postgresql", "mysql", "mongodb", "redis", "sqlserver"]
                  ).map((engine: string) => {
                    const selected = form.engine === engine;
                    const meta = ENGINE_META[engine] ?? {
                      label: (engineCatalog?.find((e: Record<string, unknown>) => e.key === engine) as Record<string, unknown>)?.label ?? engine,
                      color: "text-gray-600 dark:text-gray-400",
                      bg: "bg-gray-100",
                      darkBg: "dark:bg-gray-900/40",
                    };
                    const catalogEntry = engineCatalog?.find((e: Record<string, unknown>) => e.key === engine) as Record<string, unknown> | undefined;
                    const port = String(catalogEntry?.port ?? DEFAULT_PORTS[engine] ?? "5432");

                    return (
                      <button
                        key={engine}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            engine,
                            source_port: port,
                            replica_port: port,
                          })
                        }
                        className={`inline-flex items-center gap-2.5 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.bg} ${meta.darkBg} ${meta.color}`}
                        >
                          {ENGINE_ICON[engine] ?? <Database size={18} />}
                        </span>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Replication Mode
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["full", "cdc"] as const).map((mode: string) => {
                    const selected = form.sync_mode === mode;
                    const meta = MODE_META[mode];

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setForm({ ...form, sync_mode: mode })}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                        }`}
                      >
                        {meta.icon}
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-side Source ↔ Replica columns */}
              <div className="sm:col-span-2 mt-2">
                <div className="mb-3 flex items-center justify-center gap-3">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    <Server size={13} /> Source
                    <ArrowRight size={13} className="text-gray-300 dark:text-gray-600" />
                    <Database size={13} /> Replica
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {/* LEFT COLUMN — Source Database */}
                  <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800/40 dark:bg-blue-900/10">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <Server size={14} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      Source Database
                      <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">Original</span>
                    </h4>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                      This is your main database — the one with the data you want to copy from.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                          Source VM Endpoint
                        </label>
                        <select
                          value={form.source_endpoint_id}
                          onChange={(event) => setForm({ ...form, source_endpoint_id: event.target.value })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">Select connected VM endpoint</option>
                          {externalEndpoints.map((endpoint) => (
                            <option key={String(endpoint.id)} value={String(endpoint.id)}>
                              {String(endpoint.name || endpoint.label || endpoint.identifier)} ({String(endpoint.host)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField
                          label="Host"
                          value={form.source_host}
                          onChange={(value) => setForm({ ...form, source_host: value })}
                          placeholder="db.source.example.com"
                        />
                        <InputField
                          label="Port"
                          value={form.source_port}
                          onChange={(value) => setForm({ ...form, source_port: value })}
                          placeholder={DEFAULT_PORTS[form.engine]}
                        />
                      </div>
                      <InputField
                        label="Database Name"
                        value={form.source_database}
                        onChange={(value) => setForm({ ...form, source_database: value })}
                        placeholder="mydb"
                      />
                      <InputField
                        label="Username"
                        value={form.source_username}
                        onChange={(value) => setForm({ ...form, source_username: value })}
                        placeholder="replication_user"
                      />
                      <InputField
                        label="Password"
                        type="password"
                        value={form.source_password}
                        onChange={(value) => setForm({ ...form, source_password: value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN — Replica Database */}
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/10">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                        <ArrowRight size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Replica Database
                      <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Copy</span>
                    </h4>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                      This is where your data will be copied to — your backup or read-only copy.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                          Target VM Endpoint
                        </label>
                        <select
                          value={form.replica_endpoint_id}
                          onChange={(event) => setForm({ ...form, replica_endpoint_id: event.target.value })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">Select connected VM endpoint</option>
                          {externalEndpoints.map((endpoint) => (
                            <option key={String(endpoint.id)} value={String(endpoint.id)}>
                              {String(endpoint.name || endpoint.label || endpoint.identifier)} ({String(endpoint.host)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField
                          label="Host"
                          value={form.replica_host}
                          onChange={(value) => setForm({ ...form, replica_host: value })}
                          placeholder="db.replica.example.com"
                        />
                        <InputField
                          label="Port"
                          value={form.replica_port}
                          onChange={(value) => setForm({ ...form, replica_port: value })}
                          placeholder={DEFAULT_PORTS[form.engine]}
                        />
                      </div>
                      <InputField
                        label="Database Name"
                        value={form.replica_database}
                        onChange={(value) => setForm({ ...form, replica_database: value })}
                        placeholder="mydb_replica"
                      />
                      <InputField
                        label="Username"
                        value={form.replica_username}
                        onChange={(value) => setForm({ ...form, replica_username: value })}
                        placeholder="replication_user"
                      />
                      <InputField
                        label="Password"
                        type="password"
                        value={form.replica_password}
                        onChange={(value) => setForm({ ...form, replica_password: value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <button
                onClick={handleCreate}
                disabled={creating || !canSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Create Replication
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={28} className="mb-3 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading database replications...
            </p>
          </div>
        ) : replications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
              <Database size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
              No replications yet
            </h3>
            <p className="mb-5 max-w-xs text-center text-sm text-gray-500 dark:text-gray-400">
              Create your first database replication group to keep your data synchronized
              across endpoints.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:brightness-110"
            >
              <Plus size={16} strokeWidth={2.5} />
              New Database Replication
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  {["ID", "Engine", "Mode", "Source", "Target", "Status", "Lag", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {replications.map((replication: Record<string, unknown>) => {
                  const status = statusMeta(replication.status as string);
                  const engine =
                    ENGINE_META[replication.engine as string] ?? ENGINE_META.postgresql;

                  return (
                    <tr
                      key={replication.identifier as string}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-5 py-3.5 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                        {replication.identifier as string}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${engine.bg} ${engine.darkBg} ${engine.color}`}
                        >
                          {ENGINE_ICON[replication.engine as string] ?? <Database size={13} />}
                          {engine.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm capitalize text-gray-600 dark:text-gray-400">
                        {(replication.sync_mode as string) || "full"}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-mono text-gray-500 dark:text-gray-400">
                        {(replication.source_host as string) || "\u2014"}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-mono text-gray-500 dark:text-gray-400">
                        {Array.isArray(replication.targets) && replication.targets.length > 0
                          ? String((replication.targets[0] as Record<string, unknown>).target_host ?? "\u2014")
                          : "\u2014"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${status.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {lagBadge(replication.replication_lag_seconds)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const id = replication.identifier as string;
                              setPreflightIdentifier(id);
                              runPreflight({ identifier: id }, {
                                onSuccess: (data) => setPreflightResult(data as Record<string, unknown>),
                              });
                            }}
                            disabled={preflighting && preflightIdentifier === (replication.identifier as string)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 disabled:opacity-50"
                            title="Run binary preflight check"
                          >
                            {preflighting && preflightIdentifier === (replication.identifier as string) ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle size={13} />
                            )}
                            Preflight
                          </button>
                          <button
                            onClick={() => syncReplication({ identifier: replication.identifier as string })}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                            title="Trigger sync"
                          >
                            <RefreshCw size={13} />
                            Sync
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preflight Results Panel */}
      {preflightResult && preflightIdentifier && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className={preflightResult.ready ? "text-green-500" : "text-red-500"} />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Preflight Results — {preflightIdentifier}
              </h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                preflightResult.ready
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {preflightResult.ready ? "Ready" : "Not Ready"}
              </span>
            </div>
            <button
              onClick={() => { setPreflightResult(null); setPreflightIdentifier(null); }}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <XCircle size={16} />
            </button>
          </div>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Engine: <strong className="capitalize text-gray-900 dark:text-gray-100">{String(preflightResult.engine ?? "")}</strong></span>
              <span>Mode: <strong className="capitalize text-gray-900 dark:text-gray-100">{String(preflightResult.sync_mode ?? "full")}</strong></span>
              <span>Checks: <strong className="text-gray-900 dark:text-gray-100">{String(preflightResult.checks_passed ?? 0)}/{String(preflightResult.checks_total ?? 0)}</strong> passed</span>
            </div>
            {Array.isArray(preflightResult.missing_binaries) && (preflightResult.missing_binaries as string[]).length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-red-600 dark:text-red-400">Missing binaries:</span>
                {(preflightResult.missing_binaries as string[]).map((bin: string) => (
                  <span key={bin} className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 font-mono text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">{bin}</span>
                ))}
              </div>
            )}
            {Array.isArray(preflightResult.checks) && (
              <div className="space-y-1.5">
                {(preflightResult.checks as Record<string, unknown>[]).map((check: Record<string, unknown>, idx: number) => (
                  <div key={idx} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                    check.passed ? "bg-green-50/50 dark:bg-green-900/10" : "bg-red-50/50 dark:bg-red-900/10"
                  }`}>
                    {check.passed ? <CheckCircle size={14} className="text-green-500 shrink-0" /> : <XCircle size={14} className="text-red-500 shrink-0" />}
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                      check.role === "source"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>{String(check.role)}</span>
                    <span className="font-mono text-gray-500 dark:text-gray-400">{String(check.host)}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{String(check.operation)}</span>
                    {Array.isArray(check.missing) && (check.missing as string[]).length > 0 && (
                      <span className="text-xs text-red-500">missing: {(check.missing as string[]).join(", ")}</span>
                    )}
                    {check.error && <span className="text-xs text-red-500">{String(check.error)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  wrapperClassName?: string;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  wrapperClassName = "",
}: InputFieldProps) {
  return (
    <div className={wrapperClassName}>
      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

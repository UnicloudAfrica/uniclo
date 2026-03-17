/**
 * ManagedDatabaseDetail — Detail view for a managed database.
 *
 * Tabs: Overview, Connection, Backups, Firewall, Settings.
 */
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
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
} from "lucide-react";
import EngineIcon, { getEngineLabel } from "./EngineIcon";
import DatabaseStatusBadge from "./DatabaseStatusBadge";
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
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { ManagedDatabase, ManagedDatabaseBackup } from "@/types/managedDatabase";
import ResourceProtectionTab from "@/shared/components/integrations/ResourceProtectionTab";

interface ManagedDatabaseDetailProps {
  identifier: string;
  backPath?: string;
  listPath?: string;
  context?: "admin" | "tenant" | "client";
}

type Tab = "overview" | "connection" | "backups" | "metrics" | "firewall" | "protection" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <DatabaseIcon size={16} /> },
  { id: "connection", label: "Connection", icon: <Link size={16} /> },
  { id: "backups", label: "Backups", icon: <HardDrive size={16} /> },
  { id: "metrics", label: "Metrics", icon: <Activity size={16} /> },
  { id: "firewall", label: "Firewall", icon: <Shield size={16} /> },
  { id: "protection", label: "Protection", icon: <ShieldCheck size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

const ManagedDatabaseDetail: React.FC<ManagedDatabaseDetailProps> = ({
  identifier,
  backPath,
  listPath,
  context: _context,
}) => {
  const resolvedBackPath = backPath || listPath || "databases";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: dbData, isLoading } = useFetchManagedDatabaseById(identifier);

  const db = useMemo(() => {
    if (!dbData) return null;
    // Handle both direct data and envelope
    return (dbData as any)?.data ?? dbData;
  }, [dbData]) as ManagedDatabase | null;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(resolvedBackPath)}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <EngineIcon engine={db.engine} size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{db.name}</h1>
              <p className="text-sm text-gray-500">
                {db.identifier} · {getEngineLabel(db.engine)} v{db.engine_version}
              </p>
            </div>
          </div>
        </div>
        <DatabaseStatusBadge status={db.status} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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

const OverviewTab: React.FC<{ db: ManagedDatabase }> = ({ db }) => (
  <div className="grid gap-6 md:grid-cols-2">
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold">Configuration</h3>
      <dl className="space-y-3">
        <InfoRow label="Engine" value={`${getEngineLabel(db.engine)} v${db.engine_version}`} />
        <InfoRow label="Plan" value={db.plan_size?.toUpperCase()} />
        <InfoRow label="vCPUs" value={String(db.vcpu_count)} />
        <InfoRow label="Memory" value={`${Math.round(db.memory_mb / 1024)} GB`} />
        <InfoRow label="Storage" value={`${db.storage_gb} GB`} />
        <InfoRow label="Replicas" value={String(db.replica_count)} />
        <InfoRow label="Deployment" value={db.deployment_type} />
      </dl>
    </div>

    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold">Details</h3>
      <dl className="space-y-3">
        <InfoRow label="Provider" value={db.provider?.toUpperCase()} />
        <InfoRow label="Region" value={db.region} />
        <InfoRow
          label="Monthly Cost"
          value={db.monthly_cost > 0 ? `$${Number(db.monthly_cost).toFixed(2)}` : "—"}
        />
        <InfoRow label="Created" value={new Date(db.created_at).toLocaleDateString()} />
        <InfoRow label="Project" value={db.project?.name ?? "—"} />
        {db.dns_record_name && <InfoRow label="Hostname" value={db.dns_record_name} copyable />}
        {db.private_ip && <InfoRow label="Private IP" value={db.private_ip} copyable />}
        {db.dr_region && <InfoRow label="DR Region" value={db.dr_region} />}
      </dl>
    </div>

    {/* VM Infrastructure (collapsible) */}
    {(db.vm_instance_id || db.vm_volume_id) && (
      <div className="rounded-lg border border-gray-200 p-6 md:col-span-2 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold">Infrastructure</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          {db.vm_instance_id && <InfoRow label="Instance ID" value={db.vm_instance_id} copyable />}
          {db.vm_volume_id && <InfoRow label="Volume ID" value={db.vm_volume_id} copyable />}
          {db.vm_security_group_id && (
            <InfoRow label="Security Group" value={db.vm_security_group_id} copyable />
          )}
        </dl>
      </div>
    )}

    {/* Provisioning Progress */}
    {db.provisioning_progress && db.provisioning_progress.length > 0 && (
      <div className="rounded-lg border border-gray-200 p-6 md:col-span-2 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold">Provisioning Progress</h3>
        <div className="space-y-2">
          {db.provisioning_progress.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${
                  step.status === "completed"
                    ? "bg-green-500"
                    : step.status === "failed"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              />
              <span className="text-sm">{step.label}</span>
              <span className="text-xs capitalize text-gray-500">{step.status}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

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
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-yellow-800 dark:text-yellow-400">
          Connection details are available once the database is active.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {db.connection_string && (
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="mb-3 text-lg font-semibold">Connection String</h3>
          <CopyableField value={db.connection_string} />
        </div>
      )}

      <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Credentials</h3>
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

        {showCredentials && credentialsData?.credentials ? (
          <dl className="space-y-3">
            <InfoRow label="Host" value={credentialsData.credentials.host} copyable />
            <InfoRow label="Port" value={String(credentialsData.credentials.port)} copyable />
            <InfoRow label="Username" value={credentialsData.credentials.username} copyable />
            <InfoRow label="Password" value={credentialsData.credentials.password} copyable />
            <InfoRow label="Database" value={credentialsData.credentials.database} copyable />
          </dl>
        ) : showCredentials ? (
          <p className="text-sm text-gray-500">Loading credentials...</p>
        ) : (
          <p className="text-sm text-gray-500">
            Click &quot;Reveal Credentials&quot; to view connection details.
          </p>
        )}
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
                  {backup.size_bytes ? ` · ${(backup.size_bytes / 1024 / 1024).toFixed(1)} MB` : ""}
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

  const connections = metrics?.connections?.latest as
    | { active?: number; idle?: number; max?: number }
    | undefined;
  const diskUsage = metrics?.disk_usage?.latest as
    | { database_size?: string; percentage_used?: number }
    | undefined;
  const slowQueries = metrics?.slow_queries?.latest as
    | { count?: number; threshold_ms?: number }
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
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {connections.active ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Idle</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {connections.idle ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Max</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {connections.max ?? "—"}
                </dd>
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

// ─── Settings Tab ────────────────────────────────────────────────

const SettingsTab: React.FC<{
  db: ManagedDatabase;
  identifier: string;
  backPath: string;
}> = ({ db, identifier, backPath }) => {
  const navigate = useNavigate();
  const actionMutation = useDatabaseAction();
  const deleteMutation = useDeleteManagedDatabase();

  return (
    <div className="space-y-6">
      {/* Lifecycle Actions */}
      <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold">Lifecycle</h3>
        <div className="flex gap-3">
          {db.status === "active" && (
            <button
              onClick={() => actionMutation.mutate({ identifier, action: "pause" })}
              disabled={actionMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-100"
            >
              <Pause size={16} />
              Pause Database
            </button>
          )}
          {db.status === "paused" && (
            <button
              onClick={() => actionMutation.mutate({ identifier, action: "resume" })}
              disabled={actionMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
            >
              <Play size={16} />
              Resume Database
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 p-6 dark:border-red-800">
        <h3 className="mb-2 text-lg font-semibold text-red-600">Danger Zone</h3>
        <p className="mb-4 text-sm text-gray-500">
          Deleting a database is permanent and cannot be undone. All data will be lost.
        </p>
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${db.name}"? This cannot be undone.`)) {
              deleteMutation.mutate({ id: identifier }, { onSuccess: () => navigate(backPath) });
            }
          }}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {deleteMutation.isPending ? "Deleting..." : "Delete Database"}
        </button>
      </div>
    </div>
  );
};

// ─── Utility Components ──────────────────────────────────────────

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
    <div className="flex items-center justify-between">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        {value ?? "—"}
        {copyable && value && (
          <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600">
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
    <div className="flex items-center gap-2">
      <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
        {value}
      </code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
};

export default ManagedDatabaseDetail;

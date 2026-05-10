import React from "react";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Camera,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  Activity,
  Loader2,
} from "lucide-react";
import { RESILIENCE } from "@/shared/branding";
import {
  useBackupStatus,
  useReplicationStatus,
  useEnableBackup,
  useDisableBackup,
  useTriggerBackup,
  useEnableReplication,
  useDisableReplication,
} from "@/shared/hooks/resources/integrationHooks";
import type { BackupStatus, ReplicationStatus } from "@/shared/hooks/resources/integrationHooks";
import ToastUtils from "@/utils/toastUtil";

interface ObjectStorageProtectionProps {
  accountId: string;
  accountName: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as Record<string, unknown>)["message"];
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
};

const formatDateTime = (value: unknown): string => {
  if (!value) return "—";
  try {
    return new Date(String(value)).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
};

const ObjectStorageProtection: React.FC<ObjectStorageProtectionProps> = ({
  accountId,
  accountName,
}) => {
  const { data: backupStatusRaw, isLoading: loadingBackup } = useBackupStatus(
    "anycloudflow",
    "object_storage",
    accountId,
  );
  const { data: replicationStatusRaw, isLoading: loadingReplication } = useReplicationStatus(
    "anycloudflow",
    "object_storage",
    accountId,
  );
  const backupStatus = backupStatusRaw as BackupStatus | undefined;
  const replicationStatus = replicationStatusRaw as ReplicationStatus | undefined;

  const enableBackup = useEnableBackup();
  const disableBackup = useDisableBackup();
  const triggerBackup = useTriggerBackup();
  const enableReplication = useEnableReplication();
  const disableReplication = useDisableReplication();

  const backupEnabled = backupStatus?.enabled ?? false;
  const replicationEnabled = replicationStatus?.enabled ?? false;
  const replicationHealth = replicationStatus?.health ?? "unknown";
  const replicationLag = replicationStatus?.lag_seconds;
  const replicationTarget = replicationStatus?.target_region;

  const protectionLevel = replicationEnabled
    ? "dr_replication"
    : backupEnabled
      ? "backup_only"
      : "none";

  const protectionLevelLabel: Record<string, string> = {
    none: "No Protection",
    backup_only: "Backup Only",
    dr_replication: "Cross-Region Replication",
  };

  const protectionLevelColor: Record<string, string> = {
    none: "text-red-600 bg-red-50 border-red-200",
    backup_only: "text-amber-600 bg-amber-50 border-amber-200",
    dr_replication: "text-green-600 bg-green-50 border-green-200",
  };

  const handleEnableBackup = async () => {
    try {
      await enableBackup.mutateAsync({
        integrationKey: "anycloudflow",
        resourceType: "object_storage",
        resourceId: accountId,
        config: { schedule: "daily", retention_days: 30 },
      });
      ToastUtils.success("Backup protection enabled for " + accountName);
    } catch (e) {
      ToastUtils.error(getErrorMessage(e, "Failed to enable backup"));
    }
  };

  const handleDisableBackup = async () => {
    if (!globalThis.confirm("Disable backup protection? Existing snapshots will be retained.")) return;
    try {
      await disableBackup.mutateAsync({
        integrationKey: "anycloudflow",
        resourceType: "object_storage",
        resourceId: accountId,
      });
      ToastUtils.success("Backup protection disabled");
    } catch (e) {
      ToastUtils.error(getErrorMessage(e, "Failed to disable backup"));
    }
  };

  const handleTriggerBackup = async () => {
    try {
      await triggerBackup.mutateAsync({
        integrationKey: "anycloudflow",
        resourceType: "object_storage",
        resourceId: accountId,
      });
      ToastUtils.success("Manual backup triggered");
    } catch (e) {
      ToastUtils.error(getErrorMessage(e, "Failed to trigger backup"));
    }
  };

  const handleEnableReplication = async () => {
    try {
      await enableReplication.mutateAsync({
        integrationKey: "anycloudflow",
        resourceType: "object_storage",
        resourceId: accountId,
        config: { mode: "cross_region" },
      });
      ToastUtils.success("Cross-region replication enabled");
    } catch (e) {
      ToastUtils.error(getErrorMessage(e, "Failed to enable replication"));
    }
  };

  const handleDisableReplication = async () => {
    if (!globalThis.confirm("Disable cross-region replication?")) return;
    try {
      await disableReplication.mutateAsync({
        integrationKey: "anycloudflow",
        resourceType: "object_storage",
        resourceId: accountId,
      });
      ToastUtils.success("Replication disabled");
    } catch (e) {
      ToastUtils.error(getErrorMessage(e, "Failed to disable replication"));
    }
  };

  if (loadingBackup || loadingReplication) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Protection Plan Status */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">Protection Plan</h3>
        </div>

        <div className={`flex items-center justify-between rounded-lg border p-4 ${protectionLevelColor[protectionLevel]}`}>
          <div>
            <p className="text-sm font-semibold">{protectionLevelLabel[protectionLevel]}</p>
            <p className="mt-0.5 text-xs opacity-75">
              {protectionLevel === "none" && "This storage account has no active protection. Enable backup or replication to protect your data."}
              {protectionLevel === "backup_only" && "Scheduled backups are active. Consider enabling cross-region replication for full DR."}
              {protectionLevel === "dr_replication" && "Your data is replicated across regions for disaster recovery."}
            </p>
          </div>
          {protectionLevel === "none" && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </span>
          )}
          {protectionLevel === "backup_only" && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <Shield className="h-4 w-4 text-amber-500" />
            </span>
          )}
          {protectionLevel === "dr_replication" && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </span>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Backup card */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-gray-900">Backup</h4>
            </div>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${backupEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {backupEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          {backupEnabled ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 space-y-1">
                {backupStatus?.next_backup_at && (
                  <p>Next backup: {formatDateTime(backupStatus.next_backup_at)}</p>
                )}
                {backupStatus?.snapshots_count != null && (
                  <p>{backupStatus.snapshots_count} snapshot{backupStatus.snapshots_count !== 1 ? "s" : ""} available</p>
                )}
                {backupStatus?.last_backup?.completed_at && (
                  <p>Last backup: {formatDateTime(backupStatus.last_backup.completed_at)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleTriggerBackup}
                  disabled={triggerBackup.isPending}
                  className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Camera className="h-3.5 w-3.5" /> Backup Now
                </button>
                <button
                  onClick={handleDisableBackup}
                  disabled={disableBackup.isPending}
                  className="flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5" /> Disable
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Enable daily backups to protect against accidental deletion and data corruption.
              </p>
              <button
                onClick={handleEnableBackup}
                disabled={enableBackup.isPending}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Shield className="h-3.5 w-3.5" /> Enable Backup
              </button>
            </div>
          )}
        </div>

        {/* Replication card */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-gray-900">Cross-Region Replication</h4>
            </div>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${replicationEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {replicationEnabled ? "Active" : "Disabled"}
            </span>
          </div>

          {replicationEnabled ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Activity className={`h-3 w-3 ${replicationHealth === "healthy" ? "text-green-500" : replicationHealth === "degraded" ? "text-amber-500" : "text-red-500"}`} />
                  <span className="capitalize">{replicationHealth}</span>
                </div>
                {replicationLag != null && <p>Replication lag: {replicationLag}s</p>}
                {replicationTarget && <p>Target region: {replicationTarget}</p>}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDisableReplication}
                  disabled={disableReplication.isPending}
                  className="flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5" /> Disable
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Replicate your storage data to another region for disaster recovery. Ensures data availability if the primary region becomes unavailable.
              </p>
              <button
                onClick={handleEnableReplication}
                disabled={enableReplication.isPending}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                <ArrowUpDown className="h-3.5 w-3.5" /> Enable Replication
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resilience product call-out (Orbit / white-label) */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="h-4 w-4 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-700">{RESILIENCE}</h4>
        </div>
        <p className="text-xs text-gray-500">
          {replicationEnabled
            ? `Cross-region replication is managed by ${RESILIENCE} with continuous data synchronization.`
            : backupEnabled
              ? `Scheduled backups are managed by ${RESILIENCE} with configurable retention policies.`
              : `${RESILIENCE} provides backup, replication, and disaster recovery services for your storage. Enable a protection plan above to get started.`}
        </p>
      </div>
    </div>
  );
};

export default ObjectStorageProtection;

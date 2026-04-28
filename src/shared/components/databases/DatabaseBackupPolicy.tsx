/**
 * DatabaseBackupPolicy -- Automated backup configuration panel.
 *
 * Shows/edits automated backup settings: enabled toggle, retention days slider,
 * preferred backup window selector, and summary stats.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Clock,
  Calendar,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  HardDrive,
  Archive,
  CheckCircle2,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchDatabaseBackupPolicy,
  useUpdateDatabaseBackupPolicy,
} from "@/shared/hooks/resources/managedDatabaseHooks";

// ─── Types ────────────────────────────────────────────────────────

interface BackupPolicy {
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

// ─── Backup Window Options ────────────────────────────────────────

const BACKUP_WINDOWS = [
  { value: "00:00-01:00", label: "12:00 AM - 1:00 AM" },
  { value: "01:00-02:00", label: "1:00 AM - 2:00 AM" },
  { value: "02:00-03:00", label: "2:00 AM - 3:00 AM" },
  { value: "03:00-04:00", label: "3:00 AM - 4:00 AM (default)" },
  { value: "04:00-05:00", label: "4:00 AM - 5:00 AM" },
  { value: "05:00-06:00", label: "5:00 AM - 6:00 AM" },
  { value: "06:00-07:00", label: "6:00 AM - 7:00 AM" },
  { value: "08:00-09:00", label: "8:00 AM - 9:00 AM" },
  { value: "12:00-13:00", label: "12:00 PM - 1:00 PM" },
  { value: "18:00-19:00", label: "6:00 PM - 7:00 PM" },
  { value: "22:00-23:00", label: "10:00 PM - 11:00 PM" },
];

// ─── Helpers ─────────────────────────────────────────────────────

const formatSize = (sizeMb: number): string => {
  if (!sizeMb) return "0 MB";
  if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
  return `${(sizeMb / 1024).toFixed(2)} GB`;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Main Component ───────────────────────────────────────────────

interface DatabaseBackupPolicyProps {
  databaseId: number | string;
}

const DatabaseBackupPolicy: React.FC<DatabaseBackupPolicyProps> = ({ databaseId }) => {
  const { data: policyRaw, isLoading, refetch } = useFetchDatabaseBackupPolicy(databaseId);
  const updateMutation = useUpdateDatabaseBackupPolicy();

  const policy = (policyRaw ?? {}) as unknown as BackupPolicy;

  const [enabled, setEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState(7);
  const [preferredWindow, setPreferredWindow] = useState("03:00-04:00");
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync form state from API
  useEffect(() => {
    if (policyRaw) {
      setEnabled(policy.backup_enabled ?? true);
      setRetentionDays(policy.retention_days ?? 7);
      setPreferredWindow(policy.preferred_window ?? "03:00-04:00");
      setHasChanges(false);
    }
  }, [policyRaw]);

  const handleToggle = useCallback(() => {
    setEnabled((prev) => !prev);
    setHasChanges(true);
    setSaved(false);
  }, []);

  const handleRetentionChange = useCallback((value: number) => {
    setRetentionDays(value);
    setHasChanges(true);
    setSaved(false);
  }, []);

  const handleWindowChange = useCallback((value: string) => {
    setPreferredWindow(value);
    setHasChanges(true);
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync({
        identifier: databaseId,
        backup_enabled: enabled,
        retention_days: retentionDays,
        preferred_window: preferredWindow,
      });
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      refetch();
    } catch {
      // handled by mutation
    }
  }, [updateMutation, databaseId, enabled, retentionDays, preferredWindow, refetch]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading backup policy...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ModernCard className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            <Archive size={14} />
            Total Backups
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {policy.total_backups ?? 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {policy.automated_backups ?? 0} automated, {policy.manual_snapshots ?? 0} manual
          </p>
        </ModernCard>

        <ModernCard className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            <HardDrive size={14} />
            Storage Used
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatSize(policy.total_size_mb ?? 0)}
          </div>
          <p className="text-xs text-gray-400 mt-1">across all available backups</p>
        </ModernCard>

        <ModernCard className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            <Clock size={14} />
            Latest Backup
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {formatDate(policy.latest_automated_at ?? policy.latest_manual_at)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {policy.latest_automated_at ? "Automated" : policy.latest_manual_at ? "Manual" : "No backups yet"}
          </p>
        </ModernCard>
      </div>

      {/* Configuration */}
      <ModernCard className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield size={16} />
            Automated Backup Configuration
          </h3>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Saved
              </span>
            )}
            <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </ModernButton>
          </div>
        </div>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Automated Daily Backups
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Automatically create a backup of your database every day
            </p>
          </div>
          <button
            onClick={handleToggle}
            className="focus:outline-none"
          >
            {enabled ? (
              <ToggleRight size={32} className="text-blue-500" />
            ) : (
              <ToggleLeft size={32} className="text-gray-400" />
            )}
          </button>
        </div>

        {/* Retention Days Slider */}
        <div className={`space-y-2 transition-opacity ${enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar size={14} />
              Retention Period
            </label>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {retentionDays} day{retentionDays !== 1 ? "s" : ""}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={35}
            value={retentionDays}
            onChange={(e) => handleRetentionChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>1 day</span>
            <span>7 days</span>
            <span>14 days</span>
            <span>21 days</span>
            <span>35 days</span>
          </div>
        </div>

        {/* Preferred Backup Window */}
        <div className={`space-y-2 transition-opacity ${enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Clock size={14} />
            Preferred Backup Window (UTC)
          </label>
          <select
            value={preferredWindow}
            onChange={(e) => handleWindowChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {BACKUP_WINDOWS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400">
            Backups will start within this window. The exact start time may vary by a few minutes.
          </p>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-2">
            <ModernButton
              variant="primary"
              loading={updateMutation.isPending}
              onClick={handleSave}
            >
              <Save size={14} className="mr-1.5" />
              Save Configuration
            </ModernButton>
          </div>
        )}
      </ModernCard>
    </div>
  );
};

export default DatabaseBackupPolicy;

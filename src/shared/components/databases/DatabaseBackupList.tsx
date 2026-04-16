/**
 * DatabaseBackupList -- Backup & snapshot management for a specific database.
 *
 * Shows automated backups and manual snapshots with type badges, status indicators,
 * size, timestamps, restore/delete actions, and a "Create Snapshot" flow.
 */
import React, { useState, useMemo, useCallback } from "react";
import {
  Archive,
  Plus,
  RefreshCw,
  Trash2,
  RotateCcw,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  HardDrive,
  Camera,
  Timer,
  Download,
  Filter,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchDatabaseBackups,
  useCreateDatabaseBackup,
  useRestoreDatabaseBackup,
  useDeleteDatabaseBackup,
} from "@/shared/hooks/resources/managedDatabaseHooks";

// ─── Types ────────────────────────────────────────────────────────

interface DatabaseBackup {
  id: number;
  database_id: number;
  type: "automated" | "manual";
  status: "creating" | "available" | "restoring" | "deleting" | "deleted" | "error";
  name: string | null;
  description: string | null;
  size_mb: number | null;
  engine: string | null;
  engine_version: string | null;
  snapshot_identifier: string | null;
  retention_days: number | null;
  restore_count: number;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  last_restored_at: string | null;
  error_message: string | null;
  is_restorable: boolean;
  created_at: string;
}

// ─── Status Badge ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { icon: React.FC<{ size: number; className?: string }>; label: string; className: string }> = {
  creating: { icon: Loader2, label: "Creating", className: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-blue-500/20" },
  available: { icon: CheckCircle2, label: "Available", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20" },
  restoring: { icon: RotateCcw, label: "Restoring", className: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-500/20" },
  deleting: { icon: Loader2, label: "Deleting", className: "bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 ring-gray-500/20" },
  error: { icon: XCircle, label: "Error", className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-red-500/20" },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? { icon: Clock, label: status, className: "bg-gray-100 text-gray-600 ring-gray-500/20" };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}>
      <Icon size={12} className={status === "creating" || status === "deleting" || status === "restoring" ? "animate-spin" : ""} />
      {config.label}
    </span>
  );
};

// ─── Type Badge ──────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: "automated" | "manual" }> = ({ type }) => {
  if (type === "automated") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
        <Timer size={11} />
        Automated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-0.5 text-xs font-medium text-cyan-700 dark:text-cyan-300">
      <Camera size={11} />
      Manual
    </span>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const formatSize = (sizeMb: number | null): string => {
  if (!sizeMb) return "--";
  if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
  return `${(sizeMb / 1024).toFixed(2)} GB`;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Create Snapshot Dialog ──────────────────────────────────────

const CreateSnapshotForm: React.FC<{
  databaseId: number | string;
  onClose: () => void;
}> = ({ databaseId, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = useCreateDatabaseBackup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createMutation.mutateAsync({
        identifier: databaseId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch {
      // handled by mutation
    }
  };

  return (
    <ModernCard className="border-blue-200 dark:border-blue-800 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Create Manual Snapshot
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Snapshot Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. pre-migration-backup"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            maxLength={255}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Reason for this snapshot..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            rows={2}
            maxLength={1000}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <ModernButton
            type="submit"
            variant="primary"
            size="sm"
            loading={createMutation.isPending}
            disabled={!name.trim()}
          >
            <Camera size={14} className="mr-1" />
            Create Snapshot
          </ModernButton>
          <ModernButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </ModernButton>
        </div>
      </form>
    </ModernCard>
  );
};

// ─── Main Component ───────────────────────────────────────────────

interface DatabaseBackupListProps {
  databaseId: number | string;
}

const DatabaseBackupList: React.FC<DatabaseBackupListProps> = ({ databaseId }) => {
  const { data: backupsRaw, isLoading, refetch } = useFetchDatabaseBackups(databaseId);
  const deleteMutation = useDeleteDatabaseBackup();
  const restoreMutation = useRestoreDatabaseBackup();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "automated" | "manual">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<number | null>(null);

  const backups = useMemo(() => {
    const list = Array.isArray(backupsRaw) ? (backupsRaw as DatabaseBackup[]) : [];
    let filtered = list;

    if (typeFilter !== "all") {
      filtered = filtered.filter((b) => b.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          (b.name ?? "").toLowerCase().includes(q) ||
          (b.description ?? "").toLowerCase().includes(q) ||
          (b.snapshot_identifier ?? "").toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [backupsRaw, typeFilter, searchQuery]);

  const handleDelete = useCallback(async (backupId: number) => {
    try {
      await deleteMutation.mutateAsync({ identifier: databaseId, backupId });
      setConfirmDeleteId(null);
    } catch {
      // handled by mutation
    }
  }, [deleteMutation, databaseId]);

  const handleRestore = useCallback(async (backupId: number) => {
    try {
      await restoreMutation.mutateAsync({ identifier: databaseId, backupId });
      setConfirmRestoreId(null);
    } catch {
      // handled by mutation
    }
  }, [restoreMutation, databaseId]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading backups...</p>
      </div>
    );
  }

  // ── Empty State ──
  const allBackups = Array.isArray(backupsRaw) ? backupsRaw : [];
  if (!allBackups.length && !showCreateForm) {
    return (
      <div className="space-y-4">
        <ModernCard className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
            <Archive className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Backups Yet
          </h3>
          <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400 mb-6">
            Create a manual snapshot to capture a point-in-time backup of your database.
            Automated backups run daily when enabled.
          </p>
          <ModernButton variant="primary" onClick={() => setShowCreateForm(true)}>
            <Camera size={16} className="mr-1.5" />
            Create Snapshot
          </ModernButton>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Snapshot Form */}
      {showCreateForm && (
        <CreateSnapshotForm
          databaseId={databaseId}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search backups..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {(["all", "automated", "manual"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {t === "all" ? "All" : t === "automated" ? "Automated" : "Manual"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
          </ModernButton>
          {!showCreateForm && (
            <ModernButton variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
              <Camera size={14} className="mr-1" />
              Create Snapshot
            </ModernButton>
          )}
        </div>
      </div>

      {/* Backup Cards */}
      <div className="space-y-3">
        {backups.map((backup) => {
          const isDeleting = confirmDeleteId === backup.id;
          const isRestoring = confirmRestoreId === backup.id;

          return (
            <ModernCard
              key={backup.id}
              className={`relative overflow-hidden transition-all duration-200 ${
                backup.status === "error" ? "ring-1 ring-red-200 dark:ring-red-800" : ""
              }`}
            >
              {/* Color strip based on type */}
              <div className={`absolute inset-y-0 left-0 w-1 ${
                backup.type === "automated" ? "bg-violet-500" : "bg-cyan-500"
              }`} />

              <div className="p-4 pl-5 space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {backup.name || backup.snapshot_identifier || `Backup #${backup.id}`}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <TypeBadge type={backup.type} />
                      <StatusBadge status={backup.status} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                {backup.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {backup.description}
                  </p>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <HardDrive size={11} />
                    <span>{formatSize(backup.size_mb)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>{backup.completed_at ? timeAgo(backup.completed_at) : "In progress"}</span>
                  </div>
                  {backup.expires_at && (
                    <div className="flex items-center gap-1">
                      <Timer size={11} />
                      <span>Expires {formatDate(backup.expires_at)}</span>
                    </div>
                  )}
                  {backup.restore_count > 0 && (
                    <div className="flex items-center gap-1">
                      <RotateCcw size={11} />
                      <span>Restored {backup.restore_count}x</span>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {backup.status === "error" && backup.error_message && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 px-3 py-2">
                    <p className="text-[11px] text-red-600 dark:text-red-400 line-clamp-2">
                      {backup.error_message}
                    </p>
                  </div>
                )}

                {/* Confirm Delete */}
                {isDeleting && (
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Delete this snapshot permanently?
                    </p>
                    <div className="flex gap-2">
                      <ModernButton
                        variant="danger"
                        size="xs"
                        loading={deleteMutation.isPending}
                        onClick={() => handleDelete(backup.id)}
                      >
                        Confirm Delete
                      </ModernButton>
                      <ModernButton variant="ghost" size="xs" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                )}

                {/* Confirm Restore */}
                {isRestoring && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Restore database from this backup? This will overwrite current data.
                    </p>
                    <div className="flex gap-2">
                      <ModernButton
                        variant="primary"
                        size="xs"
                        loading={restoreMutation.isPending}
                        onClick={() => handleRestore(backup.id)}
                      >
                        <RotateCcw size={12} className="mr-1" />
                        Confirm Restore
                      </ModernButton>
                      <ModernButton variant="ghost" size="xs" onClick={() => setConfirmRestoreId(null)}>
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!isDeleting && !isRestoring && (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                    {backup.is_restorable && (
                      <ModernButton
                        variant="outline"
                        size="xs"
                        onClick={() => setConfirmRestoreId(backup.id)}
                      >
                        <RotateCcw size={12} className="mr-1" />
                        Restore
                      </ModernButton>
                    )}
                    <div className="flex-1" />
                    {backup.type === "manual" && backup.status !== "deleting" && (
                      <button
                        onClick={() => setConfirmDeleteId(backup.id)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </ModernCard>
          );
        })}
      </div>

      {/* Search no results */}
      {(searchQuery || typeFilter !== "all") && backups.length === 0 && (
        <ModernCard className="py-10 text-center">
          <Filter size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No backups matching the current filters.</p>
        </ModernCard>
      )}
    </div>
  );
};

export default DatabaseBackupList;

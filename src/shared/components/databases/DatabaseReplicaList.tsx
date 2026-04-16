/**
 * DatabaseReplicaList -- Manage read replicas for a database.
 *
 * Displays replica list with status, region, replication lag indicator.
 * Supports create, promote, and delete actions.
 */
import React, { useState } from "react";
import {
  Copy,
  Plus,
  Trash2,
  ArrowUpCircle,
  Globe,
  Activity,
  Loader2,
  RefreshCw,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchDatabaseReplicas,
  useCreateDatabaseReplica,
  usePromoteDatabaseReplica,
  useDeleteDatabaseReplica,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { ManagedDatabase, DatabaseReplica } from "@/types/managedDatabase";

// ─── Types ──────────────────────────────────────────────────────

interface DatabaseReplicaListProps {
  database: ManagedDatabase;
  onRefresh?: () => void;
}

// ─── Status Badge ───────────────────────────────────────────────

const ReplicaStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { icon: React.FC<{ size: number; className?: string }>; label: string; className: string }> = {
    creating: { icon: Loader2, label: "Creating", className: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-blue-500/20" },
    available: { icon: CheckCircle2, label: "Available", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20" },
    syncing: { icon: RefreshCw, label: "Syncing", className: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-500/20" },
    error: { icon: XCircle, label: "Error", className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-red-500/20" },
    deleting: { icon: Clock, label: "Deleting", className: "bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 ring-gray-500/20" },
  };

  const entry = config[status] ?? { icon: Clock, label: status, className: "bg-gray-100 text-gray-600 ring-gray-500/20" };
  const Icon = entry.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${entry.className}`}>
      <Icon size={12} className={status === "creating" ? "animate-spin" : ""} />
      {entry.label}
    </span>
  );
};

// ─── Replication Lag Indicator ──────────────────────────────────

const LagIndicator: React.FC<{ lagSeconds: number | null }> = ({ lagSeconds }) => {
  if (lagSeconds === null || lagSeconds === undefined) {
    return <span className="text-xs text-gray-400">N/A</span>;
  }

  let color: string;
  let label: string;
  if (lagSeconds < 1) {
    color = "text-emerald-500";
    label = "< 1s";
  } else if (lagSeconds < 5) {
    color = "text-amber-500";
    label = `${lagSeconds.toFixed(1)}s`;
  } else {
    color = "text-red-500";
    label = `${lagSeconds.toFixed(1)}s`;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Activity size={12} className={color} />
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  );
};

// ─── Time Ago ───────────────────────────────────────────────────

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ─── Main Component ─────────────────────────────────────────────

const DatabaseReplicaList: React.FC<DatabaseReplicaListProps> = ({ database, onRefresh }) => {
  const identifier = database.identifier ?? database.id;
  const { data: replicasRaw, isLoading, refetch } = useFetchDatabaseReplicas(identifier);
  const createMutation = useCreateDatabaseReplica();
  const promoteMutation = usePromoteDatabaseReplica();
  const deleteMutation = useDeleteDatabaseReplica();

  const replicas = Array.isArray(replicasRaw) ? (replicasRaw as DatabaseReplica[]) : [];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createRegion, setCreateRegion] = useState("");
  const [createInstanceClass, setCreateInstanceClass] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmPromoteId, setConfirmPromoteId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!createRegion.trim()) return;
    try {
      await createMutation.mutateAsync({
        identifier,
        region: createRegion.trim(),
        instance_class: createInstanceClass.trim() || undefined,
      });
      setShowCreateForm(false);
      setCreateRegion("");
      setCreateInstanceClass("");
      onRefresh?.();
    } catch {
      // handled by mutation
    }
  };

  const handlePromote = async (replicaId: number) => {
    try {
      await promoteMutation.mutateAsync({ identifier, replicaId });
      setConfirmPromoteId(null);
      onRefresh?.();
    } catch {
      // handled by mutation
    }
  };

  const handleDelete = async (replicaId: number) => {
    try {
      await deleteMutation.mutateAsync({ identifier, replicaId });
      setConfirmDeleteId(null);
      onRefresh?.();
    } catch {
      // handled by mutation
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <ModernCard className="p-6 text-center">
        <Loader2 size={20} className="mx-auto mb-2 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading replicas...</p>
      </ModernCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Copy size={16} className="text-violet-500" />
          Read Replicas
          {replicas.length > 0 && (
            <span className="ml-1 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              {replicas.length}
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </ModernButton>
          {!showCreateForm && (
            <ModernButton variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus size={14} className="mr-1" />
              Add Replica
            </ModernButton>
          )}
        </div>
      </div>

      {/* Create Replica Form */}
      {showCreateForm && (
        <ModernCard className="p-5 border-violet-200 dark:border-violet-800">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Create Read Replica
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createRegion}
                onChange={(e) => setCreateRegion(e.target.value)}
                placeholder="e.g. us-east-1, eu-west-1"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Instance Class (optional)
              </label>
              <input
                type="text"
                value={createInstanceClass}
                onChange={(e) => setCreateInstanceClass(e.target.value)}
                placeholder="Same as primary if empty"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <ModernButton
                variant="primary"
                size="sm"
                disabled={!createRegion.trim()}
                loading={createMutation.isPending}
                onClick={handleCreate}
              >
                Create Replica
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateRegion("");
                  setCreateInstanceClass("");
                }}
              >
                Cancel
              </ModernButton>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Replica List */}
      {replicas.length === 0 && !showCreateForm ? (
        <ModernCard className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
            <Copy className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
            No Read Replicas
          </h3>
          <p className="mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400 mb-4">
            Read replicas distribute read traffic and improve query performance.
            Create one to get started.
          </p>
          <ModernButton variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus size={14} className="mr-1" />
            Create First Replica
          </ModernButton>
        </ModernCard>
      ) : (
        <div className="space-y-3">
          {replicas.map((replica) => {
            const isDeleting = confirmDeleteId === replica.id;
            const isPromoting = confirmPromoteId === replica.id;

            return (
              <ModernCard key={replica.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Replica Info */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {replica.database_name ?? `Replica #${replica.id}`}
                      </span>
                      <ReplicaStatusBadge status={replica.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Globe size={11} />
                        <span className="font-mono">{replica.region}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity size={11} />
                        <span>Lag:</span>
                        <LagIndicator lagSeconds={replica.replication_lag_seconds} />
                      </div>
                      {replica.endpoint && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Endpoint:</span>
                          <span className="font-mono text-[11px] truncate max-w-[200px]">
                            {replica.endpoint}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>Created {timeAgo(replica.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {replica.status === "available" && !isDeleting && !isPromoting && (
                      <ModernButton
                        variant="outline"
                        size="xs"
                        onClick={() => setConfirmPromoteId(replica.id)}
                      >
                        <ArrowUpCircle size={12} className="mr-1" />
                        Promote
                      </ModernButton>
                    )}
                    {!isDeleting && !isPromoting && (
                      <button
                        onClick={() => setConfirmDeleteId(replica.id)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Promote Confirmation */}
                {isPromoting && (
                  <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Promote this replica to a standalone primary database?
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400">
                      This will disconnect it from the primary and make it an independent database.
                    </p>
                    <div className="flex gap-2">
                      <ModernButton
                        variant="primary"
                        size="xs"
                        loading={promoteMutation.isPending}
                        onClick={() => handlePromote(replica.id)}
                      >
                        Confirm Promote
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setConfirmPromoteId(null)}
                      >
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {isDeleting && (
                  <div className="mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Delete this read replica?
                    </p>
                    <p className="text-[11px] text-red-500">
                      This action cannot be undone. The replica and its data will be permanently removed.
                    </p>
                    <div className="flex gap-2">
                      <ModernButton
                        variant="danger"
                        size="xs"
                        loading={deleteMutation.isPending}
                        onClick={() => handleDelete(replica.id)}
                      >
                        Confirm Delete
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                )}
              </ModernCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DatabaseReplicaList;

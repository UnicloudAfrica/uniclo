/**
 * BatchMigrationDetail -- Detail view for a single batch migration.
 *
 * Shows header with actions, overview stats, N+1 consolidation card,
 * wave timeline, and detail card. Auto-refreshes every 15s.
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pause,
  Play,
  XCircle,
  Server,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Clock,
  Info,
  ShieldAlert,
  HardDrive,
  Merge,
  SplitSquareHorizontal,
  Wifi,
  Database,
  FileWarning,
  RefreshCw,
} from "lucide-react";
import {
  MoodIndicator,
  StatusBadge,
  ConfirmActionDialog,
  friendlyStatus,
} from "@/shared/components/orbit";
import {
  useBatchMigration,
  useStartBatchMigration,
  usePauseBatchMigration,
  useResumeBatchMigration,
  useCancelBatchMigration,
  useRevalidateBatchMigration,
} from "@/shared/hooks/resources";

type AnyRecord = Record<string, unknown>;

interface BatchMigrationDetailProps {
  identifier: string;
  context: "admin" | "tenant" | "client";
  backPath: string;
}

const BatchMigrationDetail: React.FC<BatchMigrationDetailProps> = ({
  identifier,
  context: _context,
  backPath,
}) => {
  const navigate = useNavigate();
  const { data: raw, isLoading } = useBatchMigration(identifier);
  const startMutation = useStartBatchMigration();
  const pauseMutation = usePauseBatchMigration();
  const resumeMutation = useResumeBatchMigration();
  const [confirmStart, setConfirmStart] = useState(false);
  const cancelMutation = useCancelBatchMigration();
  const revalidateMutation = useRevalidateBatchMigration();

  const data = (raw ?? {}) as AnyRecord;
  const status = String(data.status ?? "pending");
  const name = String(data.name ?? identifier);

  // Overview stats
  const totalVMs = Number(data.total_jobs ?? 0);
  const completedVMs = Number(data.completed_jobs ?? 0);
  const failedVMs = Number(data.failed_jobs ?? 0);
  const currentWave = useMemo(() => {
    if (!Array.isArray(data.waves)) return 0;
    return (data.waves as AnyRecord[]).filter(
      (w) => String(w.status ?? "pending") !== "pending",
    ).length;
  }, [data.waves]);
  const progressPct = Number(data.progress_percent ?? 0);

  // Consolidation
  const consolidation = data.consolidation as AnyRecord | undefined;

  // Waves
  const waves = useMemo(() => {
    const w = data.waves;
    return Array.isArray(w) ? (w as AnyRecord[]) : [];
  }, [data.waves]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const isDraft = status === "draft";
  const isActive = status === "in_progress" || status === "queued" || status === "running";
  const isPaused = status === "paused";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(backPath)}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={16} />
          </button>
          {(() => {
            const fs = friendlyStatus("batch-migration", status);
            return (
              <div className="flex items-center gap-3">
                <MoodIndicator mood={fs.mood} size="lg" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{name}</h1>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge tone={fs.tone} label={fs.technical} friendlyLabel={fs.friendly} size="sm" />
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{identifier}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={() => setConfirmStart(true)}
              disabled={startMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40"
            >
              <Play size={14} />
              Start migration
            </button>
          )}
          {isActive && (
            <button
              onClick={() => pauseMutation.mutate({ identifier })}
              disabled={pauseMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
            >
              <Pause size={14} />
              Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => resumeMutation.mutate({ identifier })}
              disabled={resumeMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
            >
              <Play size={14} />
              Resume
            </button>
          )}
          {(isActive || isPaused) && (
            <button
              onClick={() => {
                if (confirm(`Cancel batch migration "${name}"?`)) {
                  cancelMutation.mutate({ identifier });
                }
              }}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <XCircle size={14} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Total VMs" value={totalVMs} icon={<Server size={16} />} />
        <StatCard
          label="Completed"
          value={completedVMs}
          icon={<CheckCircle2 size={16} />}
          color="green"
        />
        <StatCard
          label="Failed"
          value={failedVMs}
          icon={<XCircle size={16} />}
          color="red"
        />
        <StatCard
          label="Current Wave"
          value={currentWave}
          icon={<Layers size={16} />}
        />
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Progress
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {progressPct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                status === "completed"
                  ? "bg-green-500"
                  : status === "failed"
                    ? "bg-red-500"
                    : status === "paused"
                      ? "bg-amber-500"
                      : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* N+1 Consolidation Card */}
      {consolidation && (
        <ConsolidationCard
          consolidation={consolidation}
          isDraft={isDraft}
          onRevalidate={() => {
            revalidateMutation.mutate({ identifier });
          }}
        />
      )}

      {/* Wave Timeline */}
      {waves.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Wave Timeline
          </h2>
          {waves.map((wave, idx) => (
            <WaveCard key={idx} wave={wave} index={idx} />
          ))}
        </div>
      )}

      {/* Detail Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Identifier" value={String(data.identifier ?? "--")} />
          <DetailItem label="Strategy" value={String(data.strategy ?? "--")} />
          <DetailItem
            label="Concurrency / Wave Size"
            value={`${data.max_concurrent ?? "--"} parallel / ${data.wave_size ?? "--"} per wave`}
          />
          <DetailItem
            label="Created"
            value={
              data.created_at
                ? new Date(String(data.created_at)).toLocaleString()
                : "--"
            }
          />
          <DetailItem
            label="Started"
            value={
              data.started_at
                ? new Date(String(data.started_at)).toLocaleString()
                : "--"
            }
          />
          <DetailItem
            label="Completed"
            value={
              data.completed_at
                ? new Date(String(data.completed_at)).toLocaleString()
                : "--"
            }
          />
        </div>
      </div>

      {/* Friendly start-confirmation dialog */}
      <ConfirmActionDialog
        open={confirmStart}
        onClose={() => setConfirmStart(false)}
        onConfirm={async () => {
          await startMutation.mutateAsync({ identifier });
          setConfirmStart(false);
        }}
        title={`Start "${name}"?`}
        description="We'll begin moving every server in this batch through its waves. You can pause at any time, but in-flight migrations will keep going."
        severity="warning"
        confirmLabel="Yes, start moving"
        cancelLabel="Not yet"
      />
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: "green" | "red";
}> = ({ label, value, icon, color }) => {
  const iconColor =
    color === "green"
      ? "text-green-500"
      : color === "red"
        ? "text-red-500"
        : "text-gray-400 dark:text-gray-500";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <span className={iconColor}>{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
    <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);

const ConsolidationCard: React.FC<{ consolidation: AnyRecord; isDraft?: boolean; onRevalidate?: () => void }> = ({
  consolidation,
  isDraft,
  onRevalidate,
}) => {
  const mode = String(consolidation.mode ?? "namespace_isolated");
  const diskCheck = consolidation.disk_check as AnyRecord | undefined;
  const portConflicts = consolidation.port_conflicts as
    | Array<{ port: number; sources: string[]; conflict: boolean }>
    | undefined;
  const serviceConflicts = consolidation.service_conflicts as
    | Array<{ service: string; sources: string[]; conflict: boolean }>
    | undefined;
  const warnings = consolidation.warnings as string[] | undefined;
  const validationMeta = consolidation.validation_metadata as AnyRecord | undefined;
  const mergeManifest = consolidation.merge_conflict_manifest as
    | Array<{ path: string; sources: string[] }>
    | undefined;
  const mergeOrder = consolidation.merge_order as number[] | undefined;

  const diskPassed = diskCheck ? Boolean(diskCheck.passed) : null;
  const totalSourceGb = diskCheck ? Number(diskCheck.total_source_gb ?? 0) : 0;
  const targetAvailGb = diskCheck ? Number(diskCheck.target_avail_gb ?? 0) : 0;
  const hasStaleData = validationMeta ? Boolean(validationMeta.has_stale_data) : false;
  const dataSources = (validationMeta?.data_sources ?? []) as Array<{ ip: string; source: string; scan_age_hours: number | null }>;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800/50 dark:bg-amber-900/10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Merge size={18} className="text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            N+1 Consolidation
          </h3>
        </div>
        {isDraft && onRevalidate && (
          <button
            onClick={onRevalidate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
          >
            <RefreshCw size={12} />
            Re-validate
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Data Freshness Indicator */}
        {validationMeta && (
          <div className={`rounded-lg p-3 ${
            hasStaleData
              ? "border border-amber-200 bg-amber-100/50 dark:border-amber-800 dark:bg-amber-900/30"
              : "border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
          }`}>
            <div className="mb-2 flex items-center gap-2">
              {hasStaleData ? (
                <Clock size={14} className="text-amber-500" />
              ) : (
                <Wifi size={14} className="text-green-500" />
              )}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {hasStaleData
                  ? "Some checks used cached scan data — results may be outdated"
                  : "All checks used live SSH data"}
              </span>
              {validationMeta.validated_at && (
                <span className="ml-auto text-[10px] text-gray-400">
                  {new Date(String(validationMeta.validated_at)).toLocaleString()}
                </span>
              )}
            </div>
            {dataSources.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dataSources.map((ds, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                      ds.source === "live_ssh"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : ds.scan_age_hours && ds.scan_age_hours > 24
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {ds.source === "live_ssh" ? <Wifi size={8} /> : <Database size={8} />}
                    {ds.ip}
                    {ds.source === "cached_scan" && ds.scan_age_hours != null && (
                      <span>({Math.round(ds.scan_age_hours)}h ago)</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mode */}
        <div className="flex items-center gap-2">
          {mode === "merge" ? (
            <Merge size={14} className="text-amber-600 dark:text-amber-400" />
          ) : (
            <SplitSquareHorizontal size={14} className="text-amber-600 dark:text-amber-400" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Mode:{" "}
            <span className="capitalize">
              {mode === "namespace_isolated"
                ? "Namespace Isolated"
                : "Merge"}
            </span>
          </span>
        </div>

        {/* Disk Check */}
        {diskCheck && (
          <div className="flex items-center gap-2">
            <HardDrive size={14} className={diskPassed ? "text-green-500" : "text-red-500"} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Disk Check:{" "}
              <span
                className={`font-medium ${
                  diskPassed
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {diskPassed ? "Passed" : "Failed"}
              </span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({totalSourceGb.toFixed(1)} GB source / {targetAvailGb.toFixed(1)} GB available)
              </span>
            </span>
          </div>
        )}

        {/* Port Conflicts */}
        {portConflicts && portConflicts.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              <AlertTriangle size={14} className="text-amber-500" />
              Port Conflicts
            </p>
            <ul className="ml-5 list-disc space-y-0.5">
              {portConflicts.map((c, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-600 dark:text-gray-400"
                >
                  Port {c.port}: {c.sources.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Service Conflicts */}
        {serviceConflicts && serviceConflicts.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              <ShieldAlert size={14} className="text-amber-500" />
              Service Conflicts
            </p>
            <ul className="ml-5 list-disc space-y-0.5">
              {serviceConflicts.map((c, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-600 dark:text-gray-400"
                >
                  {c.service}: {c.sources.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Merge Conflict Manifest */}
        {mode === "merge" && mergeManifest && mergeManifest.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-red-700 dark:text-red-400">
              <FileWarning size={14} />
              File Conflict Preview ({mergeManifest.length} paths)
            </p>
            <p className="mb-2 text-xs text-red-600 dark:text-red-400">
              These files exist on multiple sources. The last source in write order overwrites earlier versions.
            </p>
            <div className="space-y-0.5">
              {mergeManifest.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <code className="text-red-600 dark:text-red-400">{c.path}</code>
                  <span className="text-gray-400">({c.sources.join(", ")})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merge Write Order */}
        {mode === "merge" && mergeOrder && mergeOrder.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Write Order</p>
            <p className="mb-2 text-xs text-gray-400">Last source wins file conflicts.</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {mergeOrder.map((sourceId, i) => (
                <span key={sourceId} className="flex items-center gap-1">
                  {i > 0 && <ArrowRight size={10} className="text-gray-300" />}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                    i === mergeOrder.length - 1
                      ? "bg-amber-100 font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    #{sourceId}{i === mergeOrder.length - 1 && " (wins)"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Info size={14} className="text-amber-500" />
              Warnings
            </p>
            <ul className="ml-5 list-disc space-y-0.5">
              {warnings.map((w, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-600 dark:text-gray-400"
                >
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const WaveCard: React.FC<{ wave: AnyRecord; index: number }> = ({
  wave,
  index,
}) => {
  const migrations = Array.isArray(wave.jobs)
    ? (wave.jobs as AnyRecord[])
    : [];
  const waveStatus = String(wave.status ?? "pending");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Wave {index + 1}
          </span>
        </div>
        {(() => {
          const fs = friendlyStatus("batch-migration", waveStatus);
          return (
            <div className="flex items-center gap-2">
              <MoodIndicator mood={fs.mood} size="sm" />
              <StatusBadge tone={fs.tone} label={fs.technical} friendlyLabel={fs.friendly} size="sm" />
            </div>
          );
        })()}
      </div>

      {migrations.length > 0 ? (
        <div className="space-y-2">
          {migrations.map((mig, mIdx) => {
            const migStatus = String(mig.status ?? "pending");
            const migPct = Number(mig.progress_percent ?? 0);
            return (
              <div
                key={mIdx}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                  <span className="truncate font-mono text-xs text-gray-600 dark:text-gray-400">
                    {String(mig.source_ip ?? mig.source_host ?? "source")}
                  </span>
                  <ArrowRight size={12} className="shrink-0 text-gray-400" />
                  <span className="truncate font-mono text-xs text-gray-600 dark:text-gray-400">
                    {String(mig.target_ip ?? mig.target_host ?? "target")}
                  </span>
                </div>

                {(() => {
                  const fs = friendlyStatus("workload-migration", migStatus);
                  return (
                    <StatusBadge tone={fs.tone} label={fs.technical} friendlyLabel={fs.friendly} size="sm" />
                  );
                })()}

                {["in_progress", "paused"].includes(migStatus) && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-12 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(migPct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {migPct}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          No migrations in this wave.
        </p>
      )}
    </div>
  );
};

export default BatchMigrationDetail;

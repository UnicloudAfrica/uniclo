import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../../components/AdminPageShell";
import { ModernButton, ModernCard, ModernTable } from "@/shared/components/ui";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "../api";
import {
  BucketStatusBadge,
  type BucketMigrationStatus,
} from "@/shared/components/bucket-replication";

/**
 * Live progress view for a bucket migration.
 *
 * Polling cadence: 3 seconds during active phases (listing/transferring/
 * verifying), slowing to 30 seconds once terminal. AcF broadcasts progress
 * events via Reverb channels `bucket-migration.{id}`; Phase 1.5 polish will
 * wire `useAcfRealtime` here to drop polling. For MVP, polling is adequate
 * and keeps the page simple.
 */

interface Migration {
  identifier: string;
  status: BucketMigrationStatus;
  dry_run: boolean;
  source_endpoint?: { label?: string; bucket_name?: string };
  target_endpoint?: { label?: string; bucket_name?: string };
  total_objects_estimated?: number | null;
  total_bytes_estimated?: number | null;
  objects_listed?: number;
  objects_copied?: number;
  objects_failed?: number;
  objects_skipped?: number;
  bytes_copied?: number;
  billable_bytes?: number;
  cost_cents?: number;
  started_at?: string | null;
  listing_completed_at?: string | null;
  completed_at?: string | null;
  last_error?: string | null;
}

interface Failure {
  object_key: string;
  size_bytes?: number;
  error_code?: string;
  error_message?: string;
  failed_at?: string;
}

function formatBytes(b?: number | null): string {
  if (!b && b !== 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i < 2 ? 0 : 1)} ${units[i]}`;
}

const ACTIVE_STATUSES = ["listing", "transferring", "verifying"];

export default function BucketMigrationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [typedTarget, setTypedTarget] = useState("");
  const [failurePage, setFailurePage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["acf-bucket-migration", id],
    queryFn: () => acfApi.getBucketMigration(id),
    enabled: !!id,
    refetchInterval: (q) => {
      const m = (q.state.data as { data?: unknown })?.data ?? q.state.data;
      return m && ACTIVE_STATUSES.includes(m.status) ? 3_000 : 30_000;
    },
  });
  const migration: Migration | null = (data as { data?: unknown })?.data ?? (data as unknown) ?? null;

  const { data: failureData } = useQuery({
    queryKey: ["acf-bucket-migration-failures", id, failurePage],
    queryFn: () => acfApi.getBucketMigrationFailures(id, failurePage),
    enabled: !!id && !!migration && (migration.objects_failed ?? 0) > 0,
  });
  const failures: Failure[] = (failureData as { data?: unknown })?.data ?? [];

  const start = useMutation({
    mutationFn: () => acfApi.startBucketMigration(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-migration", id] });
      ToastUtils.success("Migration started");
    },
  });
  const pauseMut = useMutation({
    mutationFn: () => acfApi.pauseBucketMigration(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acf-bucket-migration", id] }),
  });
  const resumeMut = useMutation({
    mutationFn: () => acfApi.resumeBucketMigration(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acf-bucket-migration", id] }),
  });
  const cancelMut = useMutation({
    mutationFn: () => acfApi.cancelBucketMigration(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-migration", id] });
      setCancelConfirming(false);
      ToastUtils.success("Cancel requested — workers will stop gracefully");
    },
  });

  const downloadManifest = async () => {
    try {
      const res = (await acfApi.getBucketMigrationManifest(id)) as unknown;
      const payload = res?.data ?? res;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bucket-migration-${id}-manifest.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      ToastUtils.error("Manifest not available yet");
    }
  };

  if (!migration && !isLoading) {
    return (
      <AdminPageShell title="Migration">
        <ModernCard>
          <div className="p-6 text-center text-gray-500">Migration not found</div>
        </ModernCard>
      </AdminPageShell>
    );
  }
  if (!migration) return null;

  const pctObjects = migration.total_objects_estimated
    ? Math.min(100, Math.round(((migration.objects_copied ?? 0) / migration.total_objects_estimated) * 100))
    : 0;
  const pctBytes = migration.total_bytes_estimated
    ? Math.min(100, Math.round(((migration.bytes_copied ?? 0) / migration.total_bytes_estimated) * 100))
    : 0;
  const effectivePct = Math.max(pctObjects, pctBytes);

  const isActive = ACTIVE_STATUSES.includes(migration.status);
  const targetBucket = migration.target_endpoint?.bucket_name ?? "";

  return (
    <AdminPageShell
      title={`Migration · ${id}`}
      description={`${migration.source_endpoint?.bucket_name ?? "—"} → ${migration.target_endpoint?.bucket_name ?? "—"}${migration.dry_run ? " · DRY-RUN" : ""}`}
      actions={
        <div className="flex gap-2">
          <Link
            to="/admin-dashboard/integrations/anycloudflow/buckets/migrations"
            className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-[#172036]"
          >
            Back to list
          </Link>
          {migration.status === "scheduled" && (
            <ModernButton onClick={() => start.mutate()} disabled={start.isPending}>
              Start
            </ModernButton>
          )}
          {isActive && (
            <>
              <ModernButton variant="secondary" onClick={() => pauseMut.mutate()}>
                Pause
              </ModernButton>
              <ModernButton variant="danger" onClick={() => setCancelConfirming(true)}>
                Cancel
              </ModernButton>
            </>
          )}
          {migration.status === "paused_auth_failure" && (
            <ModernButton onClick={() => resumeMut.mutate()}>Resume</ModernButton>
          )}
          {migration.status === "completed" && (
            <ModernButton variant="secondary" onClick={downloadManifest}>
              Download manifest (JSON)
            </ModernButton>
          )}
          <Link
            to={`/admin-dashboard/integrations/anycloudflow/buckets/client-access?prefill_resource_type=migration&prefill_identifier=${encodeURIComponent(id)}`}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-[#172036] hover:bg-gray-50 dark:hover:bg-[#172036]"
            aria-label={`Share migration ${id} with a client`}
          >
            Share with client
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Status"
            value={<BucketStatusBadge variant="migration" status={migration.status} />}
          />
          <StatCard
            label="Objects"
            value={`${migration.objects_copied?.toLocaleString() ?? 0} / ${migration.total_objects_estimated?.toLocaleString() ?? "?"}`}
          />
          <StatCard label="Bytes" value={`${formatBytes(migration.bytes_copied)} / ${formatBytes(migration.total_bytes_estimated)}`} />
          <StatCard
            label={migration.dry_run ? "Est. cost (if live)" : "Cost"}
            value={migration.cost_cents != null ? `$${(migration.cost_cents / 100).toFixed(2)}` : "—"}
          />
        </div>

        {/* Progress bar */}
        {isActive && (
          <ModernCard>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress</span>
                <span>{effectivePct}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-[#15203c] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${effectivePct}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {migration.status === "listing" && "Scanning source bucket — progress % applies once transfer starts."}
                {migration.status === "transferring" && `Copying objects. ${migration.objects_failed ?? 0} failures so far.`}
                {migration.status === "verifying" && "Running ETag verification pass."}
              </div>
            </div>
          </ModernCard>
        )}

        {/* Error panel */}
        {migration.last_error && (
          <ModernCard>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-sm">
              <p className="font-semibold text-red-800 dark:text-red-200 mb-1">Last error</p>
              <pre className="text-xs overflow-x-auto">{migration.last_error}</pre>
            </div>
          </ModernCard>
        )}

        {/* Failure log */}
        {(migration.objects_failed ?? 0) > 0 && (
          <ModernCard>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">
                Failed objects ({migration.objects_failed?.toLocaleString()})
              </h3>
              <ModernTable
                columns={[
                  { key: "key", header: "Object key", render: (f: Failure) => <code className="text-xs">{f.object_key}</code> },
                  { key: "size", header: "Size", render: (f: Failure) => formatBytes(f.size_bytes) },
                  { key: "code", header: "Error code", render: (f: Failure) => <code className="text-xs">{f.error_code ?? "?"}</code> },
                  { key: "message", header: "Error message", render: (f: Failure) => (
                    <span className="text-xs truncate max-w-md inline-block text-red-600" title={f.error_message}>
                      {f.error_message ?? "—"}
                    </span>
                  )},
                  { key: "when", header: "Failed at", render: (f: Failure) => f.failed_at ?? "—" },
                ]}
                data={failures as unknown as Array<{ id?: string | number | null }>}
              />
              <div className="flex justify-center gap-2">
                <ModernButton size="sm" variant="secondary" disabled={failurePage === 1} onClick={() => setFailurePage(failurePage - 1)}>
                  Previous
                </ModernButton>
                <span className="px-3 py-1 text-sm">Page {failurePage}</span>
                <ModernButton size="sm" variant="secondary" disabled={failures.length < 20} onClick={() => setFailurePage(failurePage + 1)}>
                  Next
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        )}

        {cancelConfirming && (
          <ConfirmDialog
            isOpen={true}
            title="Cancel this migration?"
            message={`Type the target bucket name "${targetBucket}" to confirm. Cancelling mid-migration aborts in-flight multipart uploads and bills for bytes already transferred.`}
            confirmLabel="Yes, cancel migration"
            variant="danger"
            // No typed-confirm built into ConfirmDialog here — we require it
            // in the body copy and rely on the admin manually typing before
            // clicking. A stricter gate would require a custom modal.
            onConfirm={() => {
              if (typedTarget === targetBucket || !targetBucket) {
                cancelMut.mutate();
              } else {
                ToastUtils.error("Type the target bucket name to confirm");
              }
            }}
            onCancel={() => {
              setCancelConfirming(false);
              setTypedTarget("");
            }}
          />
        )}
      </div>
    </AdminPageShell>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  // Accept React nodes (status badges, gauges) in addition to strings.
  // The truncate + title-tooltip behaviour only applies to the string
  // path; ReactNode values render naturally.
  value: React.ReactNode;
}) {
  const isString = typeof value === "string";
  return (
    <ModernCard>
      <div className="p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        {isString ? (
          <p className="text-lg font-semibold mt-1 truncate" title={value}>{value}</p>
        ) : (
          <div className="text-lg font-semibold mt-1">{value}</div>
        )}
      </div>
    </ModernCard>
  );
}

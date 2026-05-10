import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../../components/AdminPageShell";
import { ModernButton, ModernCard, ModernTable } from "@/shared/components/ui";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "../api";
import {
  BucketStatusBadge,
  EgressMeter,
  FailoverWizard,
  RpoGauge,
  useBucketHealthPolling,
  useBucketReplicationRealtime,
  type BucketReplicationHealth,
  type BucketReplicationStatus,
} from "@/shared/components/bucket-replication";
import { MoodIndicator } from "@/shared/components/orbit";

/**
 * Map AcF bucket-replication status → orbit mood for the at-a-glance row indicator.
 * Active states pulse working/happy; degraded states warn; failover/error states alarm.
 */
function bucketReplicationMood(s: string): "happy" | "working" | "thinking" | "worried" | "alarmed" | "idle" {
  switch (s) {
    case "active":
      return "happy";
    case "draining":
    case "fencing":
      return "working";
    case "paused":
      return "thinking";
    case "paused_error":
    case "reconcile_required":
      return "worried";
    case "failed":
    case "switched_over":
      return "alarmed";
    default:
      return "thinking";
  }
}

/**
 * Live detail page for a bucket replication. Mirrors the AcF native UI but
 * scoped to admin proxy endpoints. Shows:
 *   - Status + lifecycle badge
 *   - Health panel with RPO / mode (steady|catchup EC-39) / queue depth /
 *     monthly egress vs cap (EC-40) / last heartbeat (EC-37)
 *   - Change-feed recent events
 *   - Conflict inbox (empty when conflict_policy=reject_active_active)
 *   - EC-38 two-phase failover: fence → drain (queue=0 gate) → promote
 *     (typed target bucket name gate)
 *   - Reconcile (EC-35/EC-58)
 *   - Pause/Resume/Delete actions
 */

interface Replication {
  identifier: string;
  label: string;
  // G3: narrowed from `string` to the typed union so the FailoverWizard
  // call site no longer needs `as never`. Backend ships these exact
  // values; if a new state lands, BucketStatusBadge handles unknown
  // gracefully but TS errors here force a deliberate update.
  status: BucketReplicationStatus;
  conflict_policy: string;
  bandwidth_cap_mbps: number | null;
  monthly_egress_cap_usd: number | null;
  rpo_target_seconds: number;
  change_feed_source: string;
  source_endpoint?: { label?: string; bucket_name?: string; region?: string };
  target_endpoint?: { label?: string; bucket_name?: string; region?: string };
  last_event_applied_at?: string | null;
  fenced_at?: string | null;
  drain_completed_at?: string | null;
  promoted_at?: string | null;
  created_at?: string;
}

// Health is now BucketReplicationHealth from the bucket-replication
// component package — single source of truth across admin/tenant/client.
type _Health = BucketReplicationHealth;

interface ChangeFeedEvent {
  event_id: string;
  event_type: string;
  object_key: string;
  status: string;
  received_at: string;
  last_error?: string | null;
}

interface Conflict {
  id: string;
  object_key: string;
  detected_at: string;
  resolved_at?: string | null;
  resolution?: string | null;
}

// ACTIVE_STATUSES + STATUS_COLORS removed — BucketStatusBadge owns the
// tone mapping; useBucketHealthPolling owns the active-vs-terminal cadence.

// Reserved path segments that are NOT replication identifiers. These
// are sibling wizard routes that previously fell through to this
// detail page when Vite's dev-server HMR hadn't picked up a newly
// added lazy `<Route path=".../new">` — producing scary "could not
// be found" toasts because the API was hit with id="new". Keeping
// the guard here so the page is robust regardless of route ordering
// or HMR state.
const RESERVED_ID_SEGMENTS = new Set(["new", "create"]);

export default function BucketReplicationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [failoverOpen, setFailoverOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isReserved = RESERVED_ID_SEGMENTS.has(id);

  // Belt-and-suspenders: if this page mounted with a reserved segment
  // as `:id`, force a full-page reload so Vite re-evaluates the route
  // table. The fresh bundle picks up the static wizard route and
  // short-circuits before this component remounts.
  //
  // Loop guard: if we already reloaded once and this page still won
  // the route match, route ranking is genuinely broken — fall back
  // to the listing page so the user has a way out.
  useEffect(() => {
    if (!isReserved) return;
    if (typeof window === "undefined") return;
    const RELOAD_KEY = "bucket-replication-detail-reserved-reload";
    const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === window.location.pathname;
    if (alreadyReloaded) {
      sessionStorage.removeItem(RELOAD_KEY);
      window.location.replace("/admin-dashboard/integrations/orbit/buckets/replications");
      return;
    }
    sessionStorage.setItem(RELOAD_KEY, window.location.pathname);
    window.location.replace(window.location.pathname + window.location.search);
  }, [isReserved]);

  // Clear the reload-loop marker on any successful detail mount so a
  // future false-positive reload doesn't bounce the user out.
  useEffect(() => {
    if (isReserved || typeof window === "undefined") return;
    sessionStorage.removeItem("bucket-replication-detail-reserved-reload");
  }, [isReserved]);

  const { data: repData, isLoading } = useQuery({
    queryKey: ["acf-bucket-replication", id],
    queryFn: () => acfApi.getBucketReplication(id),
    enabled: !!id && !isReserved,
  });
  const rep: Replication | null = (repData as { data?: unknown })?.data ?? (repData as unknown) ?? null;

  // Visibility-aware polling — 5s active, 30s terminal, paused when tab
  // hidden. The hook centralizes the cadence selection.
  const {
    data: health = null,
    error: healthError,
    refetch: refetchHealth,
  } = useBucketHealthPolling({
    identifier: id,
    currentStatus: rep?.status,
    enabled: !!rep,
    fetcher: () => acfApi.getBucketReplicationHealth(id),
  });

  // Reverb subscription on bucket-replication.{id} — realtime updates for
  // failover steps, egress cap hits, conflicts, etc. Polling is the
  // fallback if the WebSocket drops. Channel auth is server-side
  // (belongsToOrganization), so cross-org subs are rejected at the
  // upgrade step.
  useBucketReplicationRealtime({ identifier: id, enabled: !!rep });

  const { data: feedData } = useQuery({
    queryKey: ["acf-bucket-replication-feed", id],
    queryFn: () => acfApi.getBucketReplicationChangeFeed(id, { per_page: 50 }),
    enabled: !!id && !isReserved,
    refetchInterval: 10_000,
  });
  const feed: ChangeFeedEvent[] = (feedData as { data?: unknown })?.data ?? [];

  const { data: conflictData } = useQuery({
    queryKey: ["acf-bucket-replication-conflicts", id],
    queryFn: () => acfApi.listBucketReplicationConflicts(id, 1),
    enabled: !!id && !!rep && rep.conflict_policy !== "reject_active_active",
  });
  const conflicts: Conflict[] = (conflictData as { data?: unknown })?.data ?? [];

  const pauseMut = useMutation({
    mutationFn: () => acfApi.pauseBucketReplication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acf-bucket-replication", id] }),
  });
  const resumeMut = useMutation({
    mutationFn: () => acfApi.resumeBucketReplication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acf-bucket-replication", id] }),
  });
  const reconcileMut = useMutation({
    mutationFn: () => acfApi.reconcileBucketReplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-replication", id] });
      ToastUtils.success("Reconcile pass queued");
    },
  });
  const deleteMut = useMutation({
    mutationFn: () => acfApi.deleteBucketReplication(id),
    onSuccess: () => {
      setConfirmDelete(false);
      ToastUtils.success("Replication deleted — billing ends at end of current calendar month");
      window.location.href = "/admin-dashboard/integrations/orbit/buckets/replications";
    },
  });

  // Reserved-segment short-circuit: render a quiet shell while the
  // useEffect above triggers a full reload. No "not found" message,
  // no API noise, no toast spam.
  if (isReserved) {
    return (
      <AdminPageShell title="">
        <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-500 dark:text-gray-400">
          <span aria-hidden="true" className="text-3xl animate-pulse">🔁</span>
          <p className="text-sm">One sec — taking you to the wizard…</p>
        </div>
      </AdminPageShell>
    );
  }

  if (!rep && !isLoading) {
    return (
      <AdminPageShell title="Replication">
        <ModernCard>
          <div className="p-6 text-center text-gray-500">Replication not found</div>
        </ModernCard>
      </AdminPageShell>
    );
  }
  if (!rep) return null;

  // RPO + egress visualization is now handled by RpoGauge + EgressMeter
  // from @/shared/components/bucket-replication. Inline math removed.

  return (
    <AdminPageShell
      title={`Replication · ${rep.label}`}
      description={`${rep.source_endpoint?.bucket_name ?? "—"} (${rep.source_endpoint?.region ?? "?"}) → ${rep.target_endpoint?.bucket_name ?? "—"} (${rep.target_endpoint?.region ?? "?"})`}
      actions={
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/admin-dashboard/integrations/anycloudflow/buckets/replications"
            className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-[#172036]"
          >
            Back
          </Link>
          {rep.status === "active" && (
            <>
              <ModernButton variant="secondary" onClick={() => pauseMut.mutate()}>Pause mirroring</ModernButton>
              <ModernButton variant="danger" onClick={() => setFailoverOpen(true)}>Switch to backup</ModernButton>
            </>
          )}
          {(rep.status === "paused" || rep.status === "paused_error") && (
            <ModernButton onClick={() => resumeMut.mutate()}>Continue mirroring</ModernButton>
          )}
          {rep.status === "reconcile_required" && (
            <ModernButton onClick={() => reconcileMut.mutate()}>Sync them up again</ModernButton>
          )}
          {(rep.status === "fencing" || rep.status === "draining") && (
            <ModernButton onClick={() => setFailoverOpen(true)}>Finish switching over</ModernButton>
          )}
          {rep.status !== "active" && rep.status !== "fencing" && rep.status !== "draining" && (
            <ModernButton variant="danger" onClick={() => setConfirmDelete(true)}>Delete this mirror</ModernButton>
          )}
          <Link
            to={`/admin-dashboard/integrations/anycloudflow/buckets/client-access?prefill_resource_type=replication&prefill_identifier=${encodeURIComponent(rep.identifier)}`}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-[#172036] hover:bg-gray-50 dark:hover:bg-[#172036]"
            aria-label={`Share replication ${rep.identifier} with a client`}
          >
            Share with client
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Status"
            value={
              <div className="flex items-center gap-2">
                <MoodIndicator mood={bucketReplicationMood(rep.status)} size="md" />
                <BucketStatusBadge variant="replication" status={rep.status} />
              </div>
            }
          />
          <StatCard
            label="RPO"
            value={
              <RpoGauge
                health={health}
                error={healthError ?? null}
                onRetry={() => refetchHealth()}
                size="sm"
              />
            }
          />
          <StatCard
            label="Queue depth"
            value={
              <span className="text-lg">
                {health?.queue_depth ?? 0}
                {(health?.bulk_queue_depth ?? 0) > 0 && (
                  <span className="ml-2 text-xs text-gray-500">({health?.interactive_queue_depth ?? 0} int / {health?.bulk_queue_depth} bulk)</span>
                )}
              </span>
            }
          />
          <StatCard
            label="Conflict policy"
            value={<code className="text-xs">{rep.conflict_policy}</code>}
          />
        </div>

        {/* Egress meter — uses the shared EgressMeter primitive which
            owns the threshold logic + ARIA + auto-pause messaging */}
        {health && (
          <ModernCard>
            <div className="p-4">
              <EgressMeter
                monthToDateUsd={health.egress_month_to_date_usd}
                capUsd={health.egress_cap_usd}
              />
            </div>
          </ModernCard>
        )}

        {/* Heartbeat health (EC-37) */}
        {health && (
          <ModernCard>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last heartbeat</p>
                <p className="font-mono">{health.last_heartbeat_at ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last applied</p>
                <p className="font-mono">{health.last_event_applied_at ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Ingestion lag</p>
                <p className="font-mono">{health.ingestion_lag_seconds != null ? `${health.ingestion_lag_seconds}s` : "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Apply lag</p>
                <p className="font-mono">{health.apply_lag_seconds != null ? `${health.apply_lag_seconds}s` : "—"}</p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Change feed */}
        {feed.length > 0 && (
          <ModernCard>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Recent change-feed events</h3>
              <ModernTable
                columns={[
                  { key: "type", header: "Event", render: (e: ChangeFeedEvent) => <code className="text-xs">{e.event_type}</code> },
                  { key: "key", header: "Object", render: (e: ChangeFeedEvent) => <code className="text-xs">{e.object_key}</code> },
                  {
                    key: "status",
                    header: "Status",
                    render: (e: ChangeFeedEvent) => (
                      <span className={`text-xs ${e.status === "applied" ? "text-green-600" : e.status === "failed" ? "text-red-600" : "text-gray-500"}`}>
                        {e.status}
                      </span>
                    ),
                  },
                  { key: "received", header: "Received", render: (e: ChangeFeedEvent) => <span className="text-xs">{e.received_at}</span> },
                ]}
                data={feed as unknown as Array<{ id?: string | number | null }>}
              />
            </div>
          </ModernCard>
        )}

        {/* Conflict inbox */}
        {rep.conflict_policy !== "reject_active_active" && (
          <ModernCard>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Conflict inbox (EC-54/55/77)</h3>
              {conflicts.length === 0 ? (
                <p className="text-xs text-gray-500">No active conflicts.</p>
              ) : (
                <ModernTable
                  columns={[
                    { key: "key", header: "Object", render: (c: Conflict) => <code className="text-xs">{c.object_key}</code> },
                    { key: "when", header: "Detected", render: (c: Conflict) => <span className="text-xs">{c.detected_at}</span> },
                    { key: "resolved", header: "Resolution", render: (c: Conflict) => <span className="text-xs">{c.resolved_at ? c.resolution : "pending"}</span> },
                  ]}
                  data={conflicts as unknown as Array<{ id?: string | number | null }>}
                />
              )}
            </div>
          </ModernCard>
        )}

        {/* Two-phase failover modal (EC-38) — shared component owns
            focus, step gating, typed-confirm, and ARIA. */}
        <FailoverWizard
          isOpen={failoverOpen}
          state={{
            status: rep.status,
            queueDepth: health?.queue_depth ?? 0,
            targetBucketName: rep.target_endpoint?.bucket_name ?? "",
          }}
          resourceLabel={rep.label}
          onInitiate={async () => {
            await acfApi.initiateBucketReplicationFailover(id);
            // N3: invalidate BOTH the replication record AND the health
            // snapshot so queue depth + state badge update immediately,
            // not on the next 5s poll tick.
            qc.invalidateQueries({ queryKey: ["acf-bucket-replication", id] });
            qc.invalidateQueries({ queryKey: ["acf-bucket-replication-health", id] });
          }}
          onCompleteDrain={async (typed) => {
            await acfApi.completeBucketReplicationDrain(id, typed);
            qc.invalidateQueries({ queryKey: ["acf-bucket-replication", id] });
            qc.invalidateQueries({ queryKey: ["acf-bucket-replication-health", id] });
          }}
          onCancel={async () => {
            await acfApi.cancelBucketReplicationFailover(id);
            qc.invalidateQueries({ queryKey: ["acf-bucket-replication", id] });
            qc.invalidateQueries({ queryKey: ["acf-bucket-replication-health", id] });
          }}
          onClose={() => setFailoverOpen(false)}
        />


        {confirmDelete && (
          <ConfirmDialog
            isOpen={true}
            title="Delete replication?"
            message={`Delete "${rep.label}"? Billing ends at the end of the current calendar month. Monthly fee for this month is still charged per EC-46.`}
            confirmLabel="Yes, delete"
            variant="danger"
            onConfirm={() => deleteMut.mutate()}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>
    </AdminPageShell>
  );
}

// FailoverWizardModal + StepPill removed — replaced by the imported
// `FailoverWizard` from @/shared/components/bucket-replication, which
// adds proper ARIA + step-resume logic + typed-confirm. See package
// README for the contract.

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <ModernCard>
      <div className="p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="text-lg font-semibold mt-1 truncate">{value}</div>
      </div>
    </ModernCard>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../../components/AdminPageShell";
import {
  ModernButton,
  ModernInput,
  ModernSelect,
  ModernCard,
  ModernTable,
  ModernModal,
} from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "../api";
import { translateBucketError } from "../bucketErrorTranslator";
import { BucketStatusBadge } from "@/shared/components/bucket-replication";

/**
 * UniCloud admin UI for AnyCloudFlow bucket REPLICATION (Phase 2 active-passive).
 *
 * This page is the tenant-facing shell for ongoing cross-region DR. It does
 * NOT implement the full two-phase failover flow or conflict inbox — those
 * live on the detail page and only load when the replication is in the right
 * state. See edge-cases.md EC-33 through EC-82 for the full design contract
 * this page mirrors.
 *
 * Pricing: $8/bucket/month flat (bucket_active_passive tier). Billed per
 * calendar month — pause does not prorate (EC-46). Fan-out = N × $8 (EC-47).
 */

interface BucketReplication {
  identifier: string;
  label: string;
  status: string;
  conflict_policy: string;
  bandwidth_cap_mbps: number | null;
  monthly_egress_cap_usd: number | null;
  rpo_target_seconds: number;
  source_endpoint?: { label?: string; bucket_name?: string; region?: string };
  target_endpoint?: { label?: string; bucket_name?: string; region?: string };
  last_event_applied_at?: string | null;
  created_at?: string;
}

interface BucketEndpoint {
  identifier: string;
  label: string;
  bucket_name: string;
  region?: string | null;
}

// STATUS_COLORS removed — BucketStatusBadge owns the tone mapping.

export default function BucketReplicationsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["acf-bucket-replications", statusFilter],
    queryFn: () => acfApi.listBucketReplications({ status: statusFilter || undefined }),
  });
  const rows: BucketReplication[] = (data as { data?: unknown })?.data ?? (data as unknown) ?? [];

  const pause = useMutation({
    mutationFn: (id: string) => acfApi.pauseBucketReplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-replications"] });
      ToastUtils.success("Paused — billing continues per EC-46 (calendar month)");
    },
  });
  const resume = useMutation({
    mutationFn: (id: string) => acfApi.resumeBucketReplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-replications"] });
      ToastUtils.success("Resumed");
    },
  });

  const columns = [
    {
      key: "label",
      header: "Label",
      render: (r: BucketReplication) => (
        <Link to={`/admin-dashboard/integrations/anycloudflow/buckets/replications/${r.identifier}`} className="text-indigo-600 hover:underline">
          {r.label}
        </Link>
      ),
    },
    {
      key: "route",
      header: "Source → Target",
      render: (r: BucketReplication) => (
        <div className="text-xs font-mono">
          <code>{r.source_endpoint?.bucket_name ?? "—"}</code>
          {r.source_endpoint?.region && <span className="text-gray-400"> ({r.source_endpoint.region})</span>}
          <span className="mx-1">→</span>
          <code>{r.target_endpoint?.bucket_name ?? "—"}</code>
          {r.target_endpoint?.region && <span className="text-gray-400"> ({r.target_endpoint.region})</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: BucketReplication) => (
        <BucketStatusBadge variant="replication" status={r.status} />
      ),
    },
    {
      key: "rpo",
      header: "RPO target",
      render: (r: BucketReplication) => <span className="text-xs">{r.rpo_target_seconds}s</span>,
    },
    {
      key: "bandwidth",
      header: "BW cap",
      render: (r: BucketReplication) => r.bandwidth_cap_mbps ? `${r.bandwidth_cap_mbps} Mbps` : "—",
    },
    {
      key: "egress",
      header: "Egress cap/mo",
      render: (r: BucketReplication) => r.monthly_egress_cap_usd != null ? `$${r.monthly_egress_cap_usd}` : "—",
    },
    {
      key: "actions",
      header: "",
      render: (r: BucketReplication) => (
        <div className="flex gap-1">
          {r.status === "active" && (
            <ModernButton size="sm" variant="secondary" disabled={pause.isPending} onClick={() => pause.mutate(r.identifier)}>
              Pause
            </ModernButton>
          )}
          {(r.status === "paused" || r.status === "paused_error") && (
            <ModernButton size="sm" disabled={resume.isPending} onClick={() => resume.mutate(r.identifier)}>
              Resume
            </ModernButton>
          )}
          <Link
            to={`/admin-dashboard/integrations/anycloudflow/buckets/replications/${r.identifier}`}
            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-[#172036] hover:bg-gray-50 dark:hover:bg-[#172036]"
          >
            Details
          </Link>
        </div>
      ),
    },
  ];

  const totalMonthlyCost = useMemo(() => {
    // Flat $8 per active-or-paused replication (EC-46/47)
    const billable = rows.filter((r) => r.status !== "draft" && r.status !== "promoted" && r.status !== "failed");
    return billable.length * 8;
  }, [rows]);

  return (
    <AdminPageShell
      title="Bucket Replications"
      description={`Phase 2 cross-region active-passive continuous replication · $8/bucket/mo · ${rows.length} total · Est. $${totalMonthlyCost}/mo`}
      actions={<ModernButton onClick={() => setCreating(true)}>+ New replication</ModernButton>}
    >
      <div className="space-y-4">
        {/* Brutal-honesty banner */}
        <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-xs text-amber-900 dark:text-amber-200">
          <strong>Phase 2 scope:</strong> same-provider same-account cross-region S3 → S3 one-way active-passive only.
          Active-active, cross-provider (GCS/Azure/Swift), versioning, Object Lock, and SSE-KMS re-encryption
          are <strong>designed-not-built</strong> and rejected at preflight. See docs/code-audit/09-bucket-replication/edge-cases.md EC-49–82.
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 dark:text-gray-400">Status:</label>
          <ModernSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "paused_error", label: "Paused (error)" },
              { value: "reconcile_required", label: "Reconcile required" },
              { value: "fencing", label: "Fencing" },
              { value: "draining", label: "Draining" },
              { value: "promoted", label: "Promoted (post-failover)" },
              { value: "failed", label: "Failed" },
            ]}
          />
        </div>

        {rows.length === 0 && !isLoading ? (
          <ModernCard>
            <div className="p-8 text-center">
              <p className="font-semibold text-gray-800 dark:text-gray-200">No replications configured</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Continuous DR between two bucket endpoints. Register endpoints first, then create a replication.
              </p>
              <div className="mt-4">
                <ModernButton onClick={() => setCreating(true)}>Create first replication</ModernButton>
              </div>
            </div>
          </ModernCard>
        ) : (
          <ModernTable columns={columns} data={rows as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />
        )}

        {creating && (
          <CreateReplicationModal
            onClose={() => setCreating(false)}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ["acf-bucket-replications"] });
              setCreating(false);
            }}
          />
        )}
      </div>
    </AdminPageShell>
  );
}

function CreateReplicationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [label, setLabel] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [rpoSeconds, setRpoSeconds] = useState(300);
  const [bandwidthMbps, setBandwidthMbps] = useState<number | "">("");
  const [egressCapUsd, setEgressCapUsd] = useState<number | "">("");
  const [changeFeedSource, setChangeFeedSource] = useState<"polling" | "eventbridge_sqs">("polling");
  const [ackLegalHold, _setAckLegalHold] = useState(false);
  const [ackDpa, setAckDpa] = useState(false);
  const [ackCrr, _setAckCrr] = useState(false);

  const { data: endpointsData } = useQuery({
    queryKey: ["acf-bucket-endpoints"],
    queryFn: () => acfApi.listBucketEndpoints(),
  });
  const endpoints: BucketEndpoint[] = (endpointsData as { data?: unknown })?.data ?? (endpointsData as unknown) ?? [];

  const source = endpoints.find((e) => e.identifier === sourceId);
  const target = endpoints.find((e) => e.identifier === targetId);
  const sameRegion = source?.region && target?.region && source.region === target.region;
  const crossJurisdiction = source?.region && target?.region && /^eu-/.test(source.region) !== /^eu-/.test(target.region);

  const create = useMutation({
    mutationFn: () => acfApi.createBucketReplication({
      label,
      source_endpoint_id: sourceId,
      target_endpoint_id: targetId,
      conflict_policy: "reject_active_active",
      bandwidth_cap_mbps: bandwidthMbps === "" ? undefined : Number(bandwidthMbps),
      monthly_egress_cap_usd: egressCapUsd === "" ? undefined : Number(egressCapUsd),
      rpo_target_seconds: rpoSeconds,
      change_feed_source: changeFeedSource,
      acknowledge_legal_hold_identity_rewrite: ackLegalHold || undefined,
      data_sovereignty_ack_signed_at: ackDpa ? new Date().toISOString() : undefined,
      acknowledge_crr_coexistence: ackCrr || undefined,
    }),
    onSuccess: () => {
      ToastUtils.success("Replication created. Preflight must pass before it activates.");
      onCreated();
    },
    onError: (err: unknown) => ToastUtils.error(translateBucketError(err, "Create failed")),
  });

  // EC-42 bandwidth cap validation
  const bwMbps = bandwidthMbps === "" ? 0 : Number(bandwidthMbps);
  const bwTooLow = bwMbps > 0 && bwMbps < 128;

  const canSubmit =
    label &&
    sourceId &&
    targetId &&
    sourceId !== targetId &&
    (!bwTooLow) &&
    (!crossJurisdiction || ackDpa);

  return (
    <ModernModal isOpen={true} onClose={onClose} title="Create bucket replication">
      <div className="p-4 space-y-3">
        <ModernInput
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="prod-us-to-eu-dr"
        />

        <ModernSelect
          label="Source endpoint"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          options={[
            { value: "", label: "— Select source —" },
            ...endpoints.map((e) => ({ value: e.identifier, label: `${e.label} (${e.bucket_name}${e.region ? ` · ${e.region}` : ""})` })),
          ]}
        />

        <ModernSelect
          label="Target endpoint"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          options={[
            { value: "", label: "— Select target —" },
            ...endpoints.map((e) => ({ value: e.identifier, label: `${e.label} (${e.bucket_name}${e.region ? ` · ${e.region}` : ""})` })),
          ]}
        />

        {sourceId && sourceId === targetId && (
          <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-800 dark:text-red-200">
            Source and target cannot be the same endpoint.
          </div>
        )}

        {sameRegion && (
          <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200">
            ⚠ Source and target are in the same region. This defeats the cross-region DR purpose.
          </div>
        )}

        {crossJurisdiction && (
          <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-800 dark:text-red-200 space-y-2">
            <p className="font-semibold">⚠ Cross-jurisdiction replication (EC-80)</p>
            <p>
              Source and target regions cross GDPR/sovereignty boundaries. You are acting as data processor
              and must have appropriate DPA / SCCs in place before enabling this replication.
            </p>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={ackDpa} onChange={(e) => setAckDpa(e.target.checked)} className="mt-0.5" />
              <span>I acknowledge the DPA/SCC requirement and have it in place.</span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <ModernInput
            label="RPO target (seconds)"
            type="number"
            value={String(rpoSeconds)}
            onChange={(e) => setRpoSeconds(Math.max(30, Number(e.target.value) || 300))}
          />
          <ModernInput
            label="Bandwidth cap (Mbps)"
            type="number"
            value={String(bandwidthMbps)}
            onChange={(e) => setBandwidthMbps(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Optional"
          />
        </div>

        {bwTooLow && (
          <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-800 dark:text-red-200">
            EC-42: bandwidth cap × 0.25s must be ≥ 2× max multipart part size (16 MB). Use ≥ 128 Mbps.
          </div>
        )}

        <ModernInput
          label="Monthly egress cap (USD)"
          type="number"
          value={String(egressCapUsd)}
          onChange={(e) => setEgressCapUsd(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Optional — auto-pauses replication if exceeded (EC-40)"
        />

        <ModernSelect
          label="Change-feed source"
          value={changeFeedSource}
          onChange={(e) => setChangeFeedSource(e.target.value as "polling" | "eventbridge_sqs")}
          options={[
            { value: "polling", label: "Polling (MVP default — no AWS config needed)" },
            { value: "eventbridge_sqs", label: "EventBridge + SQS (opt-in, requires IAM setup)" },
          ]}
        />

        <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <p><strong>Conflict policy:</strong> reject_active_active (locked in Phase 2)</p>
          <p>Other policies (source_wins, target_wins, lww_hlc, manual_inbox) require the Phase 3 active-active feature flag.</p>
          <p><strong>Billing:</strong> $8/month flat per replication, billed per calendar month. Pause does not prorate (EC-46).</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ModernButton variant="secondary" onClick={onClose}>Cancel</ModernButton>
          <ModernButton onClick={() => create.mutate()} disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Creating…" : "Create replication"}
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
}

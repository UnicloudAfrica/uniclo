import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../../components/AdminPageShell";
import { ResilienceHero } from "@/shared/components/orbit";
import {
  ModernButton,
  ModernSelect,
  ModernCard,
  ModernTable,
} from "@/shared/components/ui";
import { acfApi } from "../api";
import { BucketStatusBadge } from "@/shared/components/bucket-replication";
import ToastUtils from "@/utils/toastUtil";

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
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const newPath = "/admin-dashboard/integrations/orbit/buckets/replications/new";
  const goNew = () => navigate(newPath);

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
      title=""
      description=""
      actions={<ModernButton onClick={goNew}>Mirror a bucket</ModernButton>}
    >
      <div className="space-y-4">
        <ResilienceHero
          topic="bucket-replications"
          role="admin"
          primaryCta={{ label: "Mirror a bucket", onClick: goNew }}
        />

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
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <span aria-hidden="true" className="text-5xl">🔁</span>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                No bucket mirroring yet
              </p>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                Pick a source and a target bucket — every change to the source will land in the target within seconds. Pause, fail over, or see what's lagging anytime.
              </p>
              <div className="mt-2">
                <ModernButton onClick={goNew}>Mirror a bucket</ModernButton>
              </div>
            </div>
          </ModernCard>
        ) : (
          <ModernTable columns={columns} data={rows as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />
        )}

      </div>
    </AdminPageShell>
  );
}

// Note: the create flow now lives at /admin-dashboard/integrations/orbit/buckets/replications/new
// as a standalone wizard page (BucketReplicationWizard). The old in-page
// CreateReplicationModal was removed — modals were the wrong shape for a
// 4-step setup with dynamic warnings (same-region, cross-jurisdiction).


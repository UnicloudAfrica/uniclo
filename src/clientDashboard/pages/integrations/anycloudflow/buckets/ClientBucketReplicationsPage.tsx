import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ClientPageShell from "../../../../components/ClientPageShell";
import { ModernCard, ModernSelect, ModernTable } from "@/shared/components/ui";
import { acfApi } from "../../../../../adminDashboard/pages/integrations/anycloudflow/api";
import {
  BucketStatusBadge,
  type BucketReplicationStatus,
} from "@/shared/components/bucket-replication";

/**
 * Client-facing (Path C) read-only list of Phase 2 bucket replications.
 * Same field set as the admin/tenant pages minus the pause/resume/
 * failover/delete action column. Clients can monitor their continuous
 * DR replications but cannot mutate them from this surface.
 */

interface BucketReplication {
  identifier: string;
  label: string;
  status: BucketReplicationStatus;
  conflict_policy: string;
  bandwidth_cap_mbps: number | null;
  monthly_egress_cap_usd: number | null;
  rpo_target_seconds: number;
  source_endpoint?: { label?: string; bucket_name?: string; region?: string };
  target_endpoint?: { label?: string; bucket_name?: string; region?: string };
  last_event_applied_at?: string | null;
  created_at?: string;
}

// STATUS_COLORS removed — BucketStatusBadge owns the tone mapping.

export default function ClientBucketReplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["client-acf-bucket-replications", statusFilter],
    queryFn: () =>
      acfApi.listClientBucketReplications(statusFilter ? { status: statusFilter } : {}),
  });
  const rows: BucketReplication[] =
    (data as { data?: { data?: unknown[] } })?.data?.data ?? (data as { data?: unknown })?.data ?? [];

  const columns = [
    {
      key: "label",
      header: "Label",
      render: (r: BucketReplication) => r.label,
    },
    {
      key: "route",
      header: "Source → Target",
      render: (r: BucketReplication) => (
        <div className="text-xs font-mono">
          <code>{r.source_endpoint?.bucket_name ?? "—"}</code>
          {r.source_endpoint?.region && (
            <span className="text-gray-400"> ({r.source_endpoint.region})</span>
          )}
          <span className="mx-1">→</span>
          <code>{r.target_endpoint?.bucket_name ?? "—"}</code>
          {r.target_endpoint?.region && (
            <span className="text-gray-400"> ({r.target_endpoint.region})</span>
          )}
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
      render: (r: BucketReplication) => (
        <span className="text-xs">{r.rpo_target_seconds}s</span>
      ),
    },
    {
      key: "bandwidth",
      header: "BW cap",
      render: (r: BucketReplication) =>
        r.bandwidth_cap_mbps ? `${r.bandwidth_cap_mbps} Mbps` : "—",
    },
    {
      key: "egress",
      header: "Egress cap/mo",
      render: (r: BucketReplication) =>
        r.monthly_egress_cap_usd != null ? `$${r.monthly_egress_cap_usd}` : "—",
    },
  ];

  return (
    <ClientPageShell
      title="Bucket Replications"
      description="Continuous cross-region DR replications on your account. Read-only view — contact your platform admin to pause, resume, or fail over."
    >
      <div className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="w-48">
            <ModernSelect
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All" },
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
                { value: "paused_error", label: "Paused (error)" },
                { value: "fencing", label: "Fencing" },
                { value: "draining", label: "Draining" },
                { value: "promoted", label: "Promoted" },
                { value: "reconcile_required", label: "Reconcile required" },
                { value: "failed", label: "Failed" },
              ]}
            />
          </div>
        </div>

        {rows.length === 0 && !isLoading ? (
          <ModernCard>
            <div className="p-8 text-center">
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                No replications visible
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Continuous bucket replications associated with your account will
                appear here once configured.
              </p>
            </div>
          </ModernCard>
        ) : (
          <ModernTable
            columns={columns}
            data={rows as unknown as Array<{ id?: string | number | null }>}
            loading={isLoading}
          />
        )}
      </div>
    </ClientPageShell>
  );
}

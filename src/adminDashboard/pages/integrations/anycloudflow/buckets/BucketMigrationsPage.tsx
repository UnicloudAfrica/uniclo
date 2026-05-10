import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminPageShell from "../../../../components/AdminPageShell";
import { ResilienceHero } from "@/shared/components/orbit";
import {
  ModernButton,
  ModernCard,
  ModernSelect,
  ModernTable,
} from "@/shared/components/ui";
import { acfApi } from "../api";
import {
  BucketStatusBadge,
  type BucketMigrationStatus,
} from "@/shared/components/bucket-replication";

/**
 * List all bucket migrations with a live status badge. Admins click through
 * to the detail page for progress + failure log + actions.
 *
 * Egress-cost warning: the creation flow enforces explicit-acknowledge before
 * live migrations start. This list page just surfaces state — it doesn't
 * re-warn. If we added a "re-run" button here we'd have to re-prompt.
 */

interface Migration {
  identifier: string;
  status: BucketMigrationStatus;
  dry_run: boolean;
  source_endpoint?: { label?: string; bucket_name?: string };
  target_endpoint?: { label?: string; bucket_name?: string };
  objects_copied?: number;
  bytes_copied?: number;
  started_at?: string | null;
  completed_at?: string | null;
}

interface EndpointLite {
  identifier: string;
  label: string;
  bucket_name: string;
  provider: string;
  preflight_passed_at?: string | null;
}

// statusBadge() removed — BucketStatusBadge owns the migration status mapping.

function formatBytes(b?: number): string {
  if (!b) return "—";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i < 2 ? 0 : 1)} ${units[i]}`;
}

export default function BucketMigrationsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("");
  // The "create" flow now lives at a real URL (RES-162). The old
  // CreateMigrationModal failed every test of the modal-vs-wizard
  // rule — see tracker for the full audit. Keep this list page
  // focused on listing + filtering; navigate for creation.
  const newPath = "/admin-dashboard/integrations/orbit/buckets/migrations/new";
  const goNew = () => navigate(newPath);

  const { data, isLoading } = useQuery({
    queryKey: ["acf-bucket-migrations", statusFilter],
    queryFn: () => acfApi.listBucketMigrations(statusFilter ? { status: statusFilter } : {}),
    // Poll every 15s so in-flight migrations show live status without
    // requiring the tenant to refresh. Detail page polls faster (3s).
    refetchInterval: 15_000,
  });
  const rows: Migration[] = (data as { data?: unknown })?.data ?? (data as unknown) ?? [];

  const { data: endpointsData } = useQuery({
    queryKey: ["acf-bucket-endpoints-lite"],
    queryFn: () => acfApi.listBucketEndpoints(),
  });
  const endpoints: EndpointLite[] = (endpointsData as { data?: unknown })?.data ?? (endpointsData as unknown) ?? [];
  const hasEnoughEndpoints = endpoints.filter((e) => !!e.preflight_passed_at).length >= 2;

  const columns = [
    { key: "src", header: "Source → Target", render: (m: Migration) => (
      <div className="text-xs">
        <div className="font-mono">{m.source_endpoint?.bucket_name ?? "—"}</div>
        <div className="text-gray-500 dark:text-gray-400">→ {m.target_endpoint?.bucket_name ?? "—"}</div>
      </div>
    )},
    { key: "mode", header: "Mode", render: (m: Migration) => (
      <span className="text-xs">{m.dry_run ? "Dry-run" : "Live"}</span>
    )},
    { key: "status", header: "Status", render: (m: Migration) => (
      <BucketStatusBadge variant="migration" status={m.status} />
    )},
    { key: "progress", header: "Objects / Bytes", render: (m: Migration) => (
      <span className="text-xs">
        {m.objects_copied?.toLocaleString() ?? 0} · {formatBytes(m.bytes_copied)}
      </span>
    )},
    { key: "started", header: "Started", render: (m: Migration) => m.started_at ?? "—" },
    { key: "actions", header: "", render: (m: Migration) => (
      <ModernButton size="sm" onClick={() => navigate(`/admin-dashboard/integrations/orbit/buckets/migrations/${m.identifier}`)}>
        View
      </ModernButton>
    )},
  ];

  return (
    <AdminPageShell
      title=""
      description=""
      actions={
        <ModernButton
          onClick={goNew}
          disabled={!hasEnoughEndpoints}
          title={!hasEnoughEndpoints ? "Need at least 2 preflight-passed endpoints" : undefined}
        >
          Move a bucket
        </ModernButton>
      }
    >
      <div className="space-y-4">
        <ResilienceHero
          topic="bucket-migrations"
          role="admin"
          primaryCta={{ label: "Move a bucket", onClick: goNew }}
        />
        <div className="flex gap-2 items-end">
          <div className="w-48">
            <ModernSelect
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All" },
                { value: "scheduled", label: "Scheduled" },
                { value: "listing", label: "Listing" },
                { value: "transferring", label: "Transferring" },
                { value: "verifying", label: "Verifying" },
                { value: "completed", label: "Completed" },
                { value: "failed", label: "Failed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>

        {!hasEnoughEndpoints && (
          <ModernCard>
            <div className="p-4 text-sm text-yellow-900 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              You need at least 2 bucket endpoints with passing preflights to run a migration.{" "}
              <a href="/admin-dashboard/integrations/orbit/buckets/endpoints" className="underline font-semibold">
                Register endpoints →
              </a>
            </div>
          </ModernCard>
        )}

        {rows.length === 0 && !isLoading && hasEnoughEndpoints ? (
          <ModernCard>
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <span aria-hidden="true" className="text-5xl">📂</span>
              <p className="text-base font-semibold">No bucket migrations yet</p>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                Start with a dry-run to preview what would be copied — nothing actually moves until you say go, and dry-runs are free.
              </p>
              <div className="mt-2">
                <ModernButton onClick={() => goNew()}>Move a bucket</ModernButton>
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

// Note: the create flow now lives at /admin-dashboard/integrations/orbit/buckets/migrations/new
// as a standalone wizard page (BucketMigrationWizard). The old in-page
// CreateMigrationModal was removed per RES-162 — modals were the wrong
// shape for a 4-field form with provider-mismatch warning + dry-run /
// live branching + type-to-confirm gate.


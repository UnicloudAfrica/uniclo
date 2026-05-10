import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ClientPageShell from "../../../../components/ClientPageShell";
import { ModernCard, ModernSelect, ModernTable } from "@/shared/components/ui";
import { ResilienceHero } from "@/shared/components/orbit";
import { acfApi } from "../../../../../adminDashboard/pages/integrations/anycloudflow/api";
import {
  BucketStatusBadge,
  type BucketMigrationStatus,
} from "@/shared/components/bucket-replication";

/**
 * Client-facing (Path C) read-only list of bucket migrations. Polls every
 * 15s so in-flight migrations show live status without manual refresh.
 * Writes (create/start/cancel/pause/resume) are NOT exposed on the client
 * surface — those stay tenant-only.
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

// statusBadge() removed — BucketStatusBadge owns the migration status
// → tone + label mapping (see types.ts MIGRATION_STATUS_TONE/_LABEL).

function formatBytes(b?: number): string {
  if (!b) return "—";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i < 2 ? 0 : 1)} ${units[i]}`;
}

export default function ClientBucketMigrationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["client-acf-bucket-migrations", statusFilter],
    queryFn: () =>
      acfApi.listClientBucketMigrations(statusFilter ? { status: statusFilter } : {}),
    refetchInterval: 15_000,
  });
  const rows: Migration[] = (data as { data?: { data?: unknown[] } })?.data?.data ?? (data as { data?: unknown })?.data ?? [];

  const columns = [
    {
      key: "src",
      header: "Source → Target",
      render: (m: Migration) => (
        <div className="text-xs">
          <div className="font-mono">{m.source_endpoint?.bucket_name ?? "—"}</div>
          <div className="text-gray-500 dark:text-gray-400">
            → {m.target_endpoint?.bucket_name ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "mode",
      header: "Mode",
      render: (m: Migration) => (
        <span className="text-xs">{m.dry_run ? "Dry-run" : "Live"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m: Migration) => (
        <BucketStatusBadge variant="migration" status={m.status} />
      ),
    },
    {
      key: "progress",
      header: "Objects / Bytes",
      render: (m: Migration) => (
        <span className="text-xs">
          {m.objects_copied?.toLocaleString() ?? 0} · {formatBytes(m.bytes_copied)}
        </span>
      ),
    },
    {
      key: "started",
      header: "Started",
      render: (m: Migration) => m.started_at ?? "—",
    },
  ];

  return (
    <ClientPageShell title="" description="">
      <div className="space-y-4">
        <ResilienceHero topic="bucket-migrations" role="client" />
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

        {rows.length === 0 && !isLoading ? (
          <ModernCard>
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <span aria-hidden="true" className="text-5xl">📂</span>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                No bucket migrations to show
              </p>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                When your provider runs a migration on your behalf, it'll show up here with full progress tracking.
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

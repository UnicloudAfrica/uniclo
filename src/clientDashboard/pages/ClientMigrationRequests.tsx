import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, Sparkles } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import {
  ModernTable,
  type Column,
  StatusPill,
  ResourceEmptyState,
  ModernButton,
  InfoCallout,
} from "@/shared/components/ui";
import {
  useMigrationRequests,
  type MigrationRequest,
} from "@/hooks/migrationRequestHooks";
import NewMigrationRequestModal from "@/shared/components/migrations/NewMigrationRequestModal";

/**
 * Customer-facing migration requests list. Shows the tenant's pending +
 * approved + completed migration requests with linked ProviderMigration
 * progress when an admin has approved + planned the move.
 *
 * Designed to be the customer's "single pane of glass" while a migration
 * is in flight — they see live status (via the broadcast hook) without
 * needing to refresh.
 */
export default function ClientMigrationRequests() {
  const requests = useMigrationRequests();
  const [open, setOpen] = useState(false);

  const columns: Column<MigrationRequest>[] = [
    {
      key: "identifier",
      header: "Request",
      render: (_, row) => (
        <Link
          to={`/client-dashboard/migration-requests/${row.identifier}`}
          className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          {row.identifier}
        </Link>
      ),
    },
    {
      key: "route",
      header: "Route",
      render: (_, row) => (
        <span className="inline-flex items-center gap-2 text-xs">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {row.source_region}
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {row.target_region}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_, row) => (
        <StatusPill
          status={row.status}
          label={
            row.status === "approved" && row.provider_migration?.status
              ? row.provider_migration.status
              : row.status
          }
        />
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (_, row) => {
        const pct = row.provider_migration?.progress?.percent ?? 0;
        if (row.status !== "approved" || !row.provider_migration) {
          return <span className="text-xs text-slate-400">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "preferred_window_start",
      header: "Window",
      render: (_, row) =>
        row.preferred_window_start ? (
          <span className="text-xs text-slate-500">
            {new Date(row.preferred_window_start).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-xs text-slate-400">flexible</span>
        ),
    },
    {
      key: "created_at",
      header: "Submitted",
      render: (_, row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const rows = requests.data ?? [];

  return (
    <ClientPageShell
      title="Migration Requests"
      description="Move workloads to a new region. We do the heavy lifting."
      contentClassName="space-y-6"
      actions={
        <ModernButton
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setOpen(true)}
        >
          New Migration Request
        </ModernButton>
      }
    >
      <InfoCallout
        tone="info"
        icon={<Sparkles className="h-4 w-4" />}
        title="Explained simply"
      >
        Tell us where your workload is and where you want it to live next. We
        plan the move, give you a cost preview, and run it during a window
        that doesn't disturb your users. You'll see progress in real time
        right here — no refresh needed.
      </InfoCallout>

      <ModernTable<MigrationRequest>
        data={rows}
        columns={columns}
        loading={requests.isLoading}
        searchable
        searchKeys={["identifier", "source_region", "target_region", "status"]}
        searchPlaceholder="Search by id, region, or status…"
        emptyState={{
          title: "No migration requests yet",
          description:
            "Submit your first request and our team will reach out within one business day.",
          action: { label: "Start a migration", onClick: () => setOpen(true) },
        }}
        paginated
        pageSize={25}
        onRowClick={(row) => {
          window.location.href = `/client-dashboard/migration-requests/${row.identifier}`;
        }}
      />

      {requests.isError && rows.length === 0 && (
        <ResourceEmptyState
          title="Couldn't load your migration requests"
          message="We hit an issue talking to the server. Refresh and try again."
        />
      )}

      <NewMigrationRequestModal open={open} onClose={() => setOpen(false)} />
    </ClientPageShell>
  );
}

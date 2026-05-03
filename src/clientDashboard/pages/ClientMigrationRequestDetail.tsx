import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import {
  StatusPill,
  ProgressBar,
  InfoCallout,
  KpiTile,
  SurfaceCard,
  SectionHeader,
  DescriptionList,
} from "@/shared/components/ui";
import {
  useMigrationRequest,
  type ProviderMigrationLite,
} from "@/hooks/migrationRequestHooks";
import {
  useMigrationBroadcasting,
  type MigrationStatusEvent,
} from "@/hooks/useMigrationBroadcasting";
import { useRealtimeConnection } from "@/hooks/useRealtimeConnection";

/**
 * Customer view of a single migration request, with real-time progress.
 *
 * Subscribes to the per-migration broadcast channel
 * (`provider-migration.{identifier}`) and patches the React Query cache
 * directly when status events arrive — no polling, no full refetch.
 */
const STAGE_ORDER = [
  "pending",
  "preflight",
  "snapshotting",
  "exporting",
  "importing",
  "provisioning",
  "finalising",
  "completed",
];

const STAGE_LABEL: Record<string, string> = {
  pending: "Queued",
  preflight: "Pre-flight checks",
  snapshotting: "Taking snapshots",
  exporting: "Exporting source",
  importing: "Importing to target",
  provisioning: "Provisioning new resources",
  finalising: "Final verification",
  completed: "Done",
  failed: "Failed",
  rolled_back: "Rolled back",
  rolled_back_with_errors: "Rolled back (with errors)",
};

export default function ClientMigrationRequestDetail() {
  const { identifier } = useParams<{ identifier: string }>();
  const qc = useQueryClient();
  const request = useMigrationRequest(identifier);

  const linkedMigration = request.data?.provider_migration ?? null;
  const liveIdentifier = linkedMigration?.identifier ?? null;

  // Track the most recent broadcast event so we can flash an inline note
  // when something changed since the user opened the page.
  const [lastEvent, setLastEvent] =
    useState<MigrationStatusEvent | null>(null);

  // Surface real-time channel health so the customer knows when live
  // updates have stalled and a manual refresh is warranted.
  const realtime = useRealtimeConnection();

  useMigrationBroadcasting({
    migrationIdentifier: liveIdentifier,
    onUpdate: (event) => {
      setLastEvent(event);
      // Patch the linked provider migration on the cached request.
      qc.setQueryData<{ data: typeof request.data }>(
        ["migration-request", identifier],
        (prev) => {
          if (!prev?.data?.provider_migration) return prev;
          return {
            ...prev,
            data: {
              ...prev.data,
              provider_migration: {
                ...prev.data.provider_migration,
                status: event.status,
                progress: event.progress,
                resource_summary:
                  event.resource_summary ?? prev.data.provider_migration.resource_summary,
                error_message:
                  event.error_message ?? prev.data.provider_migration.error_message,
                completed_at:
                  event.completed_at ?? prev.data.provider_migration.completed_at,
              },
            },
          };
        }
      );
    },
  });

  // Auto-clear the flash banner after 6s.
  useEffect(() => {
    if (!lastEvent) return;
    const t = setTimeout(() => setLastEvent(null), 6000);
    return () => clearTimeout(t);
  }, [lastEvent]);

  if (request.isLoading) {
    return (
      <ClientPageShell
        title="Loading migration…"
        description=""
        contentClassName="space-y-6"
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </ClientPageShell>
    );
  }

  if (!request.data) {
    return (
      <ClientPageShell
        title="Migration not found"
        description="We couldn't find a migration with that identifier."
        contentClassName="space-y-6"
      >
        <Link
          to="/client-dashboard/migration-requests"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to migrations
        </Link>
      </ClientPageShell>
    );
  }

  const r = request.data;
  const m = linkedMigration;
  const overallStatus = m?.status ?? r.status;
  const stage = m?.progress?.stage ?? overallStatus;
  const percent = m?.progress?.percent ?? (r.status === "completed" ? 100 : 0);

  return (
    <ClientPageShell
      title={`Migration ${r.identifier}`}
      description={`From ${r.source_region} to ${r.target_region}`}
      contentClassName="space-y-6"
      actions={
        <Link
          to="/client-dashboard/migration-requests"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline dark:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All migrations
        </Link>
      }
    >
      {lastEvent && (
        <InfoCallout
          tone="info"
          icon={<Loader2 className="h-4 w-4 animate-spin" />}
          title="Status updated"
        >
          {STAGE_LABEL[lastEvent.status] ?? lastEvent.status}
          {lastEvent.previous_status && (
            <span className="ml-1 text-slate-500">
              (was {STAGE_LABEL[lastEvent.previous_status] ?? lastEvent.previous_status})
            </span>
          )}
        </InfoCallout>
      )}

      {!realtime.isHealthy && realtime.status !== "initialized" && (
        <InfoCallout
          tone="warning"
          icon={<AlertCircle className="h-4 w-4" />}
          title="Live updates paused"
        >
          We've lost the real-time connection ({realtime.status}). The browser
          will keep retrying. Refresh the page if it stays this way for more
          than a minute.
        </InfoCallout>
      )}

      <SurfaceCard>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <SectionHeader title="Status" description="Where things stand right now" />
            <StatusPill status={overallStatus} />
          </div>

          <ProgressBar value={percent} label="Migration progress" showLabel />

          <p className="text-sm text-slate-600 dark:text-slate-300">
            {STAGE_LABEL[stage] ?? stage}
          </p>

          {m?.error_message && (
            <InfoCallout tone="danger" icon={<AlertCircle className="h-4 w-4" />} title="Issue">
              {m.error_message}
            </InfoCallout>
          )}
        </div>
      </SurfaceCard>

      <ResourceSummary migration={m} />

      <Timeline overallStatus={overallStatus} />

      <SurfaceCard>
        <div className="p-5">
          <SectionHeader title="Request details" />
          <DescriptionList
            items={[
              { term: "Identifier", description: <span className="font-mono text-xs">{r.identifier}</span> },
              {
                term: "Source",
                description: (
                  <span className="inline-flex items-center gap-1.5">
                    <span>{r.source_region}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-medium text-emerald-600">{r.target_region}</span>
                  </span>
                ),
              },
              {
                term: "Submitted",
                description: new Date(r.created_at).toLocaleString(),
              },
              {
                term: "Preferred window",
                description: r.preferred_window_start
                  ? `${new Date(r.preferred_window_start).toLocaleString()} → ${
                      r.preferred_window_end
                        ? new Date(r.preferred_window_end).toLocaleString()
                        : "open-ended"
                    }`
                  : "Flexible",
              },
              { term: "Notes", description: r.customer_notes || "—" },
              { term: "Admin notes", description: r.admin_notes || "—" },
            ]}
          />
        </div>
      </SurfaceCard>
    </ClientPageShell>
  );
}

function ResourceSummary({ migration }: { migration: ProviderMigrationLite | null }) {
  if (!migration?.resource_summary) {
    return null;
  }

  const summary = migration.resource_summary;
  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  if (total === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Object.entries(summary).map(([type, count]) => (
        <KpiTile
          key={type}
          label={type.replace(/_/g, " ")}
          value={String(count)}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      ))}
    </div>
  );
}

function Timeline({ overallStatus }: { overallStatus: string }) {
  const currentIdx = STAGE_ORDER.indexOf(overallStatus);
  const isFailed = ["failed", "rolled_back", "rolled_back_with_errors"].includes(overallStatus);

  return (
    <SurfaceCard>
      <div className="p-5">
        <SectionHeader title="Migration timeline" />
        <div className="mt-4 space-y-2">
          {STAGE_ORDER.slice(0, -1).map((stage, idx) => {
            const isComplete =
              currentIdx === -1 ? false : idx < currentIdx || overallStatus === "completed";
            const isCurrent = idx === currentIdx && overallStatus !== "completed";
            const isPending = !isComplete && !isCurrent;

            return (
              <div
                key={stage}
                className="flex items-center gap-3 text-sm"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    isComplete
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950"
                        : isFailed && idx > currentIdx
                          ? "border-slate-200 bg-slate-50 text-slate-300 dark:bg-slate-900"
                          : "border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                </span>
                <span
                  className={
                    isCurrent
                      ? "font-medium text-slate-900 dark:text-slate-100"
                      : isPending
                        ? "text-slate-400"
                        : "text-slate-600 dark:text-slate-300"
                  }
                >
                  {STAGE_LABEL[stage]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </SurfaceCard>
  );
}

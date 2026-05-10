import React, { useState } from "react";
import { Server, Plus, Search, Telescope, ScanLine, Trash2 } from "lucide-react";
import {
  HeroBanner,
  ResourceShell,
  StatusBadge,
  MoodIndicator,
  AsyncButton,
  ConfirmActionDialog,
  FriendlyTooltip,
  RESILIENCE,
} from "@/shared/components/orbit";
import {
  useFetchVmEndpoints,
  useDeleteVmEndpoint,
  useStartVmScan,
} from "@/shared/hooks/resources/orbit/vmEndpointHooks";
import type { VmEndpoint, VmEndpointHealth } from "@/shared/types/orbit/vmEndpoint";

/**
 * VmEndpointsPage — shared component (used by all 3 roles).
 *
 * Lift-and-shift step served:
 *   Step 1 — register / list / scan source-VM endpoints.
 *
 * Each role wraps this in a thin shell (`AdminPageShell`, `TenantPageShell`,
 * `ClientPageShell`) and passes role-aware navigation handlers as props
 * (e.g., where to go when "Add a server" is clicked).
 *
 * Friendly-mode UX:
 *   - HeroBanner introduces the feature in plain English
 *   - Each row shows a MoodIndicator for at-a-glance health
 *   - Empty state has illustrated CTA
 *   - Destructive actions use ConfirmActionDialog with severity="danger"
 *   - Scan button uses AsyncButton; resolves with success-state
 */

export interface VmEndpointsPageProps {
  /** Role-aware path to the "Add a server" wizard. */
  registerPath: string;
  /** Role-aware path to a single endpoint's detail page. */
  detailPath: (id: string) => string;
  /** Whether the current user can edit (false for client role). */
  canEdit: boolean;
  /** Optional friendly headline override. */
  headline?: string;
  /** Optional sub-headline override. */
  subheadline?: string;
}

export function VmEndpointsPage({
  registerPath,
  detailPath,
  canEdit,
  headline,
  subheadline,
}: VmEndpointsPageProps): React.JSX.Element {
  const list = useFetchVmEndpoints();
  const deleteEp = useDeleteVmEndpoint();
  const startScan = useStartVmScan();

  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<VmEndpoint | null>(null);

  const endpoints = list.data?.data ?? [];
  const filtered = search
    ? endpoints.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.host.toLowerCase().includes(search.toLowerCase()),
      )
    : endpoints;

  return (
    <div className="space-y-6">
      <HeroBanner
        eyebrow={`${RESILIENCE} · Sources`}
        title={headline ?? "Your servers, ready to move"}
        subtitle={
          subheadline ??
          "These are the machines you've connected. We can move any of them to the cloud, or check if they're ready to go."
        }
        technicalNote="Source-VM endpoints — registered with credentials in your vault. Used by Migrations, Replication, BMR, and DR Drills."
        mode="calm"
        primaryCta={
          canEdit
            ? {
                label: "Add a server",
                onClick: () => (window.location.href = registerPath),
                icon: <Plus className="h-4 w-4" aria-hidden="true" />,
              }
            : undefined
        }
        secondaryCta={{
          label: "Why register a source?",
          onClick: () => window.alert("Registering a source lets us scan it, size the migration, and check if it'll boot cleanly on the target. Nothing happens to your server until you press the button."),
        }}
        illustration={
          <span aria-hidden="true" className="text-7xl">
            🛰️
          </span>
        }
      />

      {/* ─── Toolbar: search + bulk scan ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a server by name or address"
            aria-label="Search source VMs"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        {canEdit && endpoints.length > 0 && (
          <AsyncButton
            variant="secondary"
            size="md"
            icon={<ScanLine className="h-4 w-4" aria-hidden="true" />}
            loadingLabel="Starting scans…"
            successLabel="Scans started"
            onClick={async () => {
              await startScan.mutateAsync({
                endpoint_ids: endpoints.map((e) => e.identifier),
                scan_type: "quick",
              });
            }}
          >
            Scan all servers
          </AsyncButton>
        )}
      </div>

      {/* ─── Body ─── */}
      <ResourceShell
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        empty={!list.isLoading && filtered.length === 0}
        emptyTitle={
          search
            ? "No servers match that search"
            : "No servers connected yet"
        }
        emptyDescription={
          search
            ? "Try a different name or address."
            : "Connect a server you'd like to move to the cloud. We'll scan it, size it up, and tell you what we find — without touching anything."
        }
        emptyIcon={<span aria-hidden="true" className="text-5xl">🔭</span>}
        emptyAction={
          canEdit && !search
            ? { label: "Connect your first server", onClick: () => (window.location.href = registerPath) }
            : undefined
        }
      >
        <ul
          aria-label="Connected source VMs"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((ep) => (
            <li key={ep.identifier}>
              <VmEndpointCard
                endpoint={ep}
                detailHref={detailPath(ep.identifier)}
                onDelete={canEdit ? () => setConfirmDelete(ep) : undefined}
              />
            </li>
          ))}
        </ul>
      </ResourceShell>

      {/* ─── Delete confirm dialog ─── */}
      <ConfirmActionDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteEp.mutateAsync(confirmDelete.identifier);
          setConfirmDelete(null);
        }}
        title={`Forget "${confirmDelete?.name ?? ""}"?`}
        description="We'll remove this server from your list. Any active migrations or replications using it will stop you from doing this — finish or cancel those first."
        severity="danger"
        confirmLabel="Yes, forget it"
        cancelLabel="No, keep it"
      />
    </div>
  );
}

// ─── Single endpoint card — friendly + compact ───────────────────────────────

function VmEndpointCard({
  endpoint,
  detailHref,
  onDelete,
}: {
  endpoint: VmEndpoint;
  detailHref: string;
  onDelete?: () => void;
}): React.JSX.Element {
  const mood = healthToMood(endpoint.health);
  const tone = healthToTone(endpoint.health);

  return (
    <article
      className="group relative flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary-500 hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-500"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/15 to-primary-700/15 text-primary-700 dark:text-white"
          >
            <Server className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <a
              href={detailHref}
              className="text-sm font-semibold text-gray-900 outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline dark:text-gray-100"
            >
              {endpoint.name}
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {endpoint.host}
              {endpoint.port !== 22 && `:${endpoint.port}`}
            </p>
          </div>
        </div>
        <MoodIndicator mood={mood} size="md" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          tone={tone}
          label={`Health: ${endpoint.health}`}
          friendlyLabel={
            endpoint.health === "healthy"
              ? "Looks great"
              : endpoint.health === "degraded"
              ? "Needs a check"
              : endpoint.health === "unreachable"
              ? "Can't reach it"
              : "Unknown"
          }
          size="sm"
        />
        <SourceTypeBadge type={endpoint.source_type} />
        {typeof endpoint.scan_progress_percent === "number" && (
          <StatusBadge tone="running" label={`Scanning ${endpoint.scan_progress_percent}%`} size="sm" />
        )}
      </div>

      {endpoint.tags && endpoint.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {endpoint.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {onDelete && (
        <div className="relative z-10 flex justify-end pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Remove ${endpoint.name}`}
            className="rounded-md p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}

// ─── small helpers ───────────────────────────────────────────────────────────

function healthToMood(h: VmEndpointHealth): "happy" | "worried" | "alarmed" | "thinking" {
  switch (h) {
    case "healthy":
      return "happy";
    case "degraded":
      return "worried";
    case "unreachable":
      return "alarmed";
    default:
      return "thinking";
  }
}

function healthToTone(h: VmEndpointHealth): "success" | "warning" | "danger" | "neutral" {
  switch (h) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "unreachable":
      return "danger";
    default:
      return "neutral";
  }
}

function SourceTypeBadge({ type }: { type: string }): React.JSX.Element {
  const FRIENDLY: Record<string, string> = {
    linux: "Linux server",
    windows: "Windows server",
    vmware: "VMware",
    hyperv: "Hyper-V",
    kvm: "KVM",
    on_prem: "On-prem",
    aws_ec2: "AWS EC2",
    azure_vm: "Azure VM",
    gcp_vm: "GCP VM",
  };
  return (
    <FriendlyTooltip
      mode="inline"
      term={
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <Telescope className="h-3 w-3" aria-hidden="true" />
          {FRIENDLY[type] ?? type}
        </span>
      }
      definition={`Source type controls how we move the server. We pick the right migration path automatically based on this.`}
    />
  );
}

export default VmEndpointsPage;

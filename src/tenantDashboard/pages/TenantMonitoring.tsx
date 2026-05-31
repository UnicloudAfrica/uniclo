/**
 * Tenant CuberWatch monitoring page.
 *
 * Surfaces every host attached to the tenant's monitoring subscription —
 * status badge, last-seen timestamp, and the persisted install command for
 * any host whose agent hasn't yet been installed (see
 * `InstallCuberWatchAgentJob` for the producer side that writes
 * `assigned_hosts[i].pending_install_command` + flips
 * `subscription.config.requires_operator_install`).
 *
 * Data source: `useTenantMonitoring` (composes /monitoring/status,
 * /monitoring/tiers, /monitoring/hosts under the tenant prefix).
 */
import { useCallback, useMemo, useState } from "react";
import { Activity, AlertTriangle, Check, Copy, RefreshCw, Server, Terminal } from "lucide-react";

import TenantPageShell from "@/shared/layouts/TenantPageShell";
import {
  Eyebrow,
  ErrorState,
  IconTile,
  LoadingState,
  ModernButton,
  ModernModal,
  ModernTable,
  ProgressBar,
  ResourceEmptyState,
  StatTile,
  StatusPill,
  SurfaceCard,
  type Column,
} from "@/shared/components/ui";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";
import InstanceLiveMetricsPanel from "@/shared/components/monitoring/InstanceLiveMetricsPanel";
import ToastUtils from "@/utils/toastUtil";

import {
  useTenantMonitoring,
  type TenantMonitoringHost,
  type TenantMonitoringHostStatus,
} from "../hooks/useTenantMonitoring";

// ─── Status badge tone mapping ────────────────────────────────────────

const STATUS_LABELS: Record<TenantMonitoringHostStatus, string> = {
  pending: "Pending install",
  connected: "Connected",
  disconnected: "Disconnected",
  unknown: "Unknown",
};

const STATUS_TONES: Record<
  TenantMonitoringHostStatus,
  "warning" | "success" | "danger" | "neutral"
> = {
  pending: "warning",
  connected: "success",
  disconnected: "danger",
  unknown: "neutral",
};

// ─── Helpers ──────────────────────────────────────────────────────────

const formatLastSeen = (iso: string | null): string => {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const titleCase = (value: string): string =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

// ─── Install command modal ────────────────────────────────────────────

interface InstallCommandModalProps {
  host: TenantMonitoringHost | null;
  onClose: () => void;
}

const InstallCommandModal = ({ host, onClose }: InstallCommandModalProps) => {
  const [copied, setCopied] = useState(false);

  const command = host?.install_command ?? "";

  const handleCopy = useCallback(async () => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      ToastUtils.success("Install command copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      ToastUtils.error("Unable to copy — copy the command manually.");
    }
  }, [command]);

  return (
    <ModernModal
      isOpen={host !== null}
      onClose={onClose}
      title={host ? `Install monitoring agent on ${host.name}` : "Install command"}
      subtitle="Run this command on the VM as root (or via sudo) to install the CuberWatch agent."
      size="lg"
      actions={[{ label: "Close", variant: "ghost", onClick: onClose }]}
    >
      <div className="space-y-4">
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">Run on the target VM only.</p>
            <p>
              The command contains a one-time enrollment token tied to this host. Copying it
              elsewhere will leak credentials — keep it on the box where the agent should report
              from.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="install-command"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Shell command
          </label>
          <div className="relative">
            <pre
              id="install-command"
              className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-200 bg-slate-900 p-3 pr-12 text-[12px] leading-relaxed text-slate-100 font-mono"
            >
              {command || "Install command not yet available — try refreshing."}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!command}
              aria-label="Copy install command"
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModernModal>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────

const TenantMonitoring = () => {
  const { data, isLoading, isError, error, refetch } = useTenantMonitoring();
  const [activeHost, setActiveHost] = useState<TenantMonitoringHost | null>(null);

  const subscription = data?.subscription ?? null;
  const hosts = data?.hosts ?? [];

  const slotUsagePercent =
    subscription && subscription.host_limit > 0
      ? Math.min(100, Math.round((subscription.host_count / subscription.host_limit) * 100))
      : 0;

  const columns: Column<TenantMonitoringHost>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Instance",
        render: (_value, row) => (
          <div className="flex items-center gap-2">
            <IconTile icon={<Server className="h-3.5 w-3.5" />} tone="neutral" size="sm" />
            <span className="text-sm font-medium text-gray-900 font-outfit">{row.name}</span>
          </div>
        ),
      },
      {
        key: "ip",
        header: "IP address",
        render: (_value, row) => (
          <span className="text-xs font-mono text-gray-500">{row.ip ?? "—"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (_value, row) => (
          <StatusPill label={STATUS_LABELS[row.status]} tone={STATUS_TONES[row.status]} />
        ),
      },
      {
        key: "last_seen_at",
        header: "Last seen",
        render: (_value, row) => (
          <span className="text-xs text-gray-500">{formatLastSeen(row.last_seen_at)}</span>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (_value, row) =>
          row.requires_operator_install && row.install_command ? (
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => setActiveHost(row)}
              leftIcon={<Terminal className="h-3.5 w-3.5" />}
            >
              Install command
            </ModernButton>
          ) : null,
      },
    ],
    []
  );

  return (
    <TenantPageShell
      title="Monitoring"
      description="Hosts attached to your CuberWatch organisation, their connection status, and the install command for any agent still pending operator setup."
    >
      {isLoading ? (
        <LoadingState message="Loading monitoring subscription…" />
      ) : isError ? (
        <ErrorState
          title="Unable to load monitoring"
          message={
            error?.message ?? "Try refreshing — if the problem persists, check your network."
          }
          onRetry={() => refetch()}
          retryLabel="Retry"
        />
      ) : (
        <div className="space-y-6">
          {/* Hero — plan summary */}
          <SurfaceCard variant="signal-panel" padding="lg" radius="2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "rgb(255 255 255 / 0.10)" }}
                  aria-hidden="true"
                >
                  <Activity
                    className="h-6 w-6"
                    style={{ color: "rgb(var(--secondary-color-500))" }}
                  />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white font-outfit">
                    {subscription?.hasActivePlan
                      ? `${titleCase(subscription.plan)} plan`
                      : "Basic monitoring"}
                  </h2>
                  <p className="text-sm text-white/70 font-outfit">
                    {subscription?.hasActivePlan
                      ? "Paid plan active — full host telemetry enabled."
                      : "Free basic monitoring on all VMs. Upgrade for extended retention and per-host alerting."}
                  </p>
                </div>
              </div>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                className="text-white"
              >
                Refresh
              </ModernButton>
            </div>
          </SurfaceCard>

          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SurfaceCard variant="card" padding="md" radius="lg">
              <div className="flex items-center gap-3">
                <IconTile icon={<Server className="h-5 w-5" />} tone="primary" size="lg" />
                <div>
                  <p className="text-2xl font-semibold text-gray-900 font-outfit">
                    {subscription
                      ? `${subscription.host_count} / ${subscription.host_limit || "—"}`
                      : "0 / 0"}
                  </p>
                  <Eyebrow size="xs">Hosts attached</Eyebrow>
                </div>
              </div>
              {subscription && subscription.host_limit > 0 && (
                <div className="mt-3">
                  <ProgressBar value={slotUsagePercent} label="Slot usage" showLabel={false} />
                  <p className="mt-1 text-[11px] text-gray-400 font-outfit">
                    {Math.max(0, subscription.host_limit - subscription.host_count)} slots available
                  </p>
                </div>
              )}
            </SurfaceCard>

            <StatTile
              label="Price per host"
              value={
                subscription && subscription.price_per_host > 0 ? (
                  <PriceLabel
                    amount={subscription.price_per_host}
                    sourceCurrency={subscription.currency}
                  />
                ) : (
                  "Free"
                )
              }
              icon={<Activity className="h-3 w-3" />}
              tone="primary"
            />

            <StatTile
              label="Monthly cost"
              value={
                subscription && subscription.monthly_cost > 0 ? (
                  <PriceLabel
                    amount={subscription.monthly_cost}
                    sourceCurrency={subscription.currency}
                  />
                ) : (
                  "—"
                )
              }
              icon={<Activity className="h-3 w-3" />}
              tone="success"
            />
          </div>

          {/* Hosts table */}
          <SurfaceCard variant="card" padding="none" radius="lg">
            {hosts.length === 0 ? (
              <ResourceEmptyState
                title="No monitored hosts yet"
                message="No monitored hosts yet. Provision a VM with monitoring enabled to see it here."
              />
            ) : (
              <ModernTable<TenantMonitoringHost>
                data={hosts}
                columns={columns}
                title={`Monitored hosts (${hosts.length})`}
                searchable={hosts.length > 5}
                searchKeys={["name", "ip"]}
                paginated={hosts.length > 10}
                pageSize={10}
                sortable
                expandable
                renderExpandedRow={(row) => (
                  <div className="px-4 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 font-outfit">
                      Live metrics
                    </p>
                    <InstanceLiveMetricsPanel instanceId={row.id} />
                  </div>
                )}
              />
            )}
          </SurfaceCard>
        </div>
      )}

      <InstallCommandModal host={activeHost} onClose={() => setActiveHost(null)} />
    </TenantPageShell>
  );
};

export default TenantMonitoring;

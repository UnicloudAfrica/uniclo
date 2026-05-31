import { useCallback, useState } from "react";
import {
  Activity,
  Server,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowUpCircle,
  ExternalLink,
  BarChart3,
  Terminal,
} from "lucide-react";
import {
  SurfaceCard,
  SectionHeader,
  StatTile,
  ProgressBar,
  IconTile,
  StatusPill,
  Eyebrow,
  LoadingState,
  ResourceEmptyState,
  ModernButton,
} from "@/shared/components/ui";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import {
  useFetchMonitoringStatus,
  useFetchMonitoringTiers,
  useFetchMonitoringHosts,
  useSubscribeMonitoring,
  useUpgradeMonitoring,
  useCancelMonitoring,
  useUnassignMonitoringHost,
  type MonitoringTier,
} from "@/hooks/monitoringSubscriptionHooks";

interface MonitoringDashboardProps {
  context: "admin" | "tenant" | "client";
}

/**
 * Derive the data-retention label for a tier from its feature list, rather
 * than hardcoding a tier→value map. The tiers API (`/monitoring/tiers`,
 * written by `MonitoringSubscriptionController@tiers`, consumed via
 * `useFetchMonitoringTiers`) carries no numeric `retention_days` field —
 * retention is only surfaced as a feature string such as "30-day retention"
 * / "24-hour retention" / "1-year retention". We parse that into a compact
 * label ("30d" / "24h" / "1yr"). Returns "—" when no retention feature is
 * present (e.g. an unknown/future tier, or a tier with no matching record).
 */
export const retentionLabelFromTier = (
  tier: { features?: string[] } | undefined
): string => {
  const match = (tier?.features ?? [])
    .map((f) => /(\d+)[-\s]?(hour|day|year)/i.exec(f))
    .find((m): m is RegExpExecArray => m !== null);
  if (!match) return "—";

  const unit = match[2].toLowerCase();
  const suffix = unit === "hour" ? "h" : unit === "day" ? "d" : "yr";
  return `${match[1]}${suffix}`;
};

const MonitoringDashboard = ({ context: _context }: MonitoringDashboardProps) => {
  const [showTiers, setShowTiers] = useState(false);
  const { data: status, isLoading: statusLoading } = useFetchMonitoringStatus();
  const { data: tiers } = useFetchMonitoringTiers();
  const { data: hostsData } = useFetchMonitoringHosts();
  const subscribeMutation = useSubscribeMonitoring();
  const upgradeMutation = useUpgradeMonitoring();
  const cancelMutation = useCancelMonitoring();
  const unassignMutation = useUnassignMonitoringHost();

  // Re-entrancy guards. React's event batching can dispatch multiple
  // `onClick` handlers within a single render frame; the disabled-button
  // prop only updates on the next render, which is too late. Short-circuit
  // at the top of each handler on `action.isPending`.
  const subscribeAction = useAsyncAction();
  const cancelAction = useAsyncAction();
  const unassignAction = useAsyncAction();

  const hosts = (hostsData as unknown as Record<string, unknown>)?.hosts as Record<string, unknown>[] ?? [];
  const currentTier = (status as unknown as Record<string, unknown>)?.tier as string ?? "basic";
  const maxHosts = (status as unknown as Record<string, unknown>)?.max_hosts as number ?? 0;
  const usedHosts = (status as unknown as Record<string, unknown>)?.used_hosts as number ?? 0;
  const availableHosts = (status as unknown as Record<string, unknown>)?.available_hosts as number ?? 0;
  const subscription = (status as unknown as Record<string, unknown>)?.subscription as Record<string, unknown> | null;
  const tiersList = Array.isArray(tiers) ? tiers : [];

  const usagePercent = maxHosts > 0 ? Math.round((usedHosts / maxHosts) * 100) : 0;

  const activeTier = tiersList.find(
    (t: MonitoringTier) => t.service_type.replace("monitoring_", "") === currentTier
  );
  const retentionLabel = retentionLabelFromTier(activeTier);

  const handleSubscribe = useCallback(
    async (serviceType: string) => {
      if (subscribeAction.isPending) return;
      await subscribeAction.run(
        () =>
          currentTier === "basic"
            ? subscribeMutation.mutateAsync({ service_type: serviceType })
            : upgradeMutation.mutateAsync({ service_type: serviceType }),
        { rethrow: false }
      );
      setShowTiers(false);
    },
    [subscribeAction, currentTier, subscribeMutation, upgradeMutation]
  );

  const handleCancel = useCallback(async () => {
    if (cancelAction.isPending) return;
    if (
      !window.confirm(
        "Cancel monitoring subscription? Basic free monitoring will remain."
      )
    ) {
      return;
    }
    await cancelAction.run(() => cancelMutation.mutateAsync(), { rethrow: false });
  }, [cancelAction, cancelMutation]);

  const handleUnassign = useCallback(
    async (instanceId: number) => {
      if (unassignAction.isPending) return;
      await unassignAction.run(() => unassignMutation.mutateAsync(instanceId), {
        rethrow: false,
      });
    },
    [unassignAction, unassignMutation]
  );

  if (statusLoading) {
    return <LoadingState message="Loading monitoring status…" />;
  }

  const cuberwatchBase =
    (import.meta.env.VITE_CUBERWATCH_URL as string | undefined) ?? "https://app.cuberwatch.com";

  return (
    <div className="space-y-6">
      {/* Hero — brand-themed signal panel replaces the inline dark gradient */}
      <SurfaceCard variant="signal-panel" padding="lg" radius="2xl">
        <div className="flex items-start justify-between gap-4">
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
                Infrastructure Monitoring
              </h2>
              <p className="text-sm text-white/70 font-outfit">
                {currentTier === "basic"
                  ? "Basic monitoring active on all VMs. Upgrade for extended features."
                  : `${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} plan active`}
              </p>
            </div>
          </div>
          <StatusPill
            label={currentTier}
            tone={currentTier === "basic" ? "neutral" : "success"}
            showIcon={false}
          />
        </div>
      </SurfaceCard>

      {/* Stats — three StatTile composing IconTile + ProgressBar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SurfaceCard variant="card" padding="md" radius="lg">
          <div className="flex items-center gap-3">
            <IconTile icon={<Server className="h-5 w-5" />} tone="primary" size="lg" />
            <div>
              <p className="text-2xl font-semibold text-gray-900 font-outfit">
                {currentTier === "basic" ? "All VMs" : `${usedHosts} / ${maxHosts}`}
              </p>
              <Eyebrow size="xs">Monitored VMs</Eyebrow>
            </div>
          </div>
          {maxHosts > 0 && (
            <div className="mt-3">
              <ProgressBar
                value={usagePercent}
                label="Slot usage"
                showLabel={false}
              />
              <p className="mt-1 text-[11px] text-gray-400 font-outfit">
                {availableHosts} slots available
              </p>
            </div>
          )}
        </SurfaceCard>

        <StatTile
          label="Monthly cost"
          value={subscription ? `$${subscription.monthly_cost}` : "$0"}
          icon={<CheckCircle className="h-3 w-3" />}
          tone="success"
        />

        <StatTile
          label="Data retention"
          value={retentionLabel}
          icon={<AlertTriangle className="h-3 w-3" />}
          tone="warning"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <ModernButton
          variant="primary"
          onClick={() => setShowTiers((v) => !v)}
          leftIcon={<ArrowUpCircle className="h-4 w-4" />}
        >
          {currentTier === "basic" ? "Subscribe to Paid Plan" : "Change Plan"}
        </ModernButton>
        {subscription && (
          <ModernButton
            variant="outlineDanger"
            onClick={handleCancel}
            isLoading={cancelAction.isPending}
            disabled={cancelAction.isPending}
          >
            Cancel Subscription
          </ModernButton>
        )}
      </div>

      {/* CuberWatch external links */}
      {currentTier !== "basic" && (
        <SurfaceCard variant="card" padding="lg" radius="lg">
          <SectionHeader title="Monitoring dashboards" size="sm" />
          <div className="mt-3 flex flex-wrap gap-3">
            <ModernButton
              variant="outline"
              size="sm"
              leftIcon={<Activity className="h-4 w-4" />}
              rightIcon={<ExternalLink className="h-3 w-3" />}
              onClick={() => window.open(`${cuberwatchBase}/dashboard`, "_blank", "noopener")}
            >
              Open Full Dashboard
            </ModernButton>
            {(currentTier === "standard" ||
              currentTier === "professional" ||
              currentTier === "enterprise") && (
              <ModernButton
                variant="outline"
                size="sm"
                leftIcon={<BarChart3 className="h-4 w-4" />}
                rightIcon={<ExternalLink className="h-3 w-3" />}
                onClick={() => window.open(`${cuberwatchBase}/grafana`, "_blank", "noopener")}
              >
                View in Grafana
              </ModernButton>
            )}
            {currentTier === "enterprise" && (
              <ModernButton
                variant="outline"
                size="sm"
                leftIcon={<Terminal className="h-4 w-4" />}
                rightIcon={<ExternalLink className="h-3 w-3" />}
                onClick={() => window.open(`${cuberwatchBase}/prometheus`, "_blank", "noopener")}
              >
                Prometheus Query Browser
              </ModernButton>
            )}
          </div>
          <p className="mt-3 text-[11px] text-gray-400 font-outfit">
            {currentTier === "standard" &&
              "Upgrade to Professional for custom Grafana dashboards. Enterprise for raw Prometheus access."}
            {currentTier === "professional" &&
              "Upgrade to Enterprise for raw Prometheus query access."}
            {currentTier === "enterprise" && "Full access to all monitoring tools."}
          </p>
        </SurfaceCard>
      )}

      {/* Tier selection */}
      {showTiers && tiersList.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiersList.map((tier: MonitoringTier) => {
            const tierKey = tier.service_type.replace("monitoring_", "");
            const isCurrent = tierKey === currentTier;
            return (
              <SurfaceCard
                key={tier.service_type}
                variant={isCurrent ? "hero" : "card"}
                padding="lg"
                radius="lg"
              >
                <h4 className="text-sm font-semibold text-gray-900 font-outfit">{tier.name}</h4>
                <p className="mt-1 text-2xl font-semibold font-outfit" style={{ color: "rgb(var(--theme-color-700))" }}>
                  {tier.price_per_host === 0 ? "Free" : `$${tier.price_per_host}`}
                  {tier.price_per_host > 0 && (
                    <span className="text-sm font-normal text-gray-400">/VM/mo</span>
                  )}
                </p>
                <ul className="mt-3 space-y-1">
                  {tier.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-gray-600 font-outfit"
                    >
                      <CheckCircle
                        className="mt-0.5 h-3 w-3 shrink-0"
                        style={{ color: "rgb(var(--theme-success-500))" }}
                        aria-hidden="true"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && tier.service_type !== "monitoring_basic" && (
                  <ModernButton
                    variant="primary"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => handleSubscribe(tier.service_type)}
                    isLoading={
                      subscribeAction.isPending ||
                      subscribeMutation.isPending ||
                      upgradeMutation.isPending
                    }
                    disabled={subscribeAction.isPending}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    {currentTier === "basic" ? "Subscribe" : "Switch to this plan"}
                  </ModernButton>
                )}
                {isCurrent && (
                  <div
                    className="mt-4 rounded-lg py-2 text-center text-xs font-semibold font-outfit"
                    style={{
                      background: "var(--theme-color-10)",
                      color: "rgb(var(--theme-color-700))",
                    }}
                  >
                    Current Plan
                  </div>
                )}
              </SurfaceCard>
            );
          })}
        </div>
      )}

      {/* Assigned hosts */}
      {subscription && (
        <SurfaceCard variant="card" padding="none" radius="lg">
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{ borderColor: "var(--theme-border-color)" }}
          >
            <SectionHeader title="Monitored VMs" count={usedHosts} size="md" />
          </div>
          {hosts.length === 0 ? (
            <ResourceEmptyState
              title="No VMs assigned yet"
              message="VMs are auto-assigned when provisioned."
            />
          ) : (
            <ul
              className="divide-y"
              style={{ borderColor: "var(--theme-border-color)" }}
              role="list"
            >
              {hosts.map((host) => (
                <li
                  key={String(host.id)}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <IconTile icon={<Server className="h-4 w-4" />} tone="neutral" size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-outfit">
                        {String(host.name)}
                      </p>
                      <p className="text-xs font-mono text-gray-400">
                        {String(host.ip_address ?? "")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnassign(Number(host.id))}
                    disabled={unassignAction.isPending}
                    className="rounded p-1 text-gray-400 hover:bg-danger-500/10 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Remove ${String(host.name)} from monitoring`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>
      )}
    </div>
  );
};

export default MonitoringDashboard;

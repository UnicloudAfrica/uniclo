import { useState } from "react";
import { Activity, Server, CheckCircle, AlertTriangle, Plus, Trash2, ArrowUpCircle, ExternalLink, BarChart3, Terminal } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
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

const MonitoringDashboard = ({ context }: MonitoringDashboardProps) => {
  const [showTiers, setShowTiers] = useState(false);
  const { data: status, isLoading: statusLoading } = useFetchMonitoringStatus();
  const { data: tiers } = useFetchMonitoringTiers();
  const { data: hostsData } = useFetchMonitoringHosts();
  const subscribeMutation = useSubscribeMonitoring();
  const upgradeMutation = useUpgradeMonitoring();
  const cancelMutation = useCancelMonitoring();
  const unassignMutation = useUnassignMonitoringHost();

  const hosts = (hostsData as Record<string, unknown>)?.hosts as Record<string, unknown>[] ?? [];
  const currentTier = (status as Record<string, unknown>)?.tier as string ?? "basic";
  const maxHosts = (status as Record<string, unknown>)?.max_hosts as number ?? 0;
  const usedHosts = (status as Record<string, unknown>)?.used_hosts as number ?? 0;
  const availableHosts = (status as Record<string, unknown>)?.available_hosts as number ?? 0;
  const subscription = (status as Record<string, unknown>)?.subscription as Record<string, unknown> | null;
  const tiersList = Array.isArray(tiers) ? tiers : [];

  const usagePercent = maxHosts > 0 ? Math.round((usedHosts / maxHosts) * 100) : 0;
  const usageColor = usagePercent > 85 ? designTokens.colors.error[500] : usagePercent > 60 ? designTokens.colors.warning[500] : designTokens.colors.success[500];

  const handleSubscribe = (serviceType: string) => {
    if (currentTier === "basic") {
      subscribeMutation.mutate({ service_type: serviceType });
    } else {
      upgradeMutation.mutate({ service_type: serviceType });
    }
    setShowTiers(false);
  };

  if (statusLoading) {
    return <div className="flex items-center justify-center p-12 text-gray-400">Loading monitoring status...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-6"
        style={{
          background: `linear-gradient(135deg, ${designTokens.colors.neutral[900]} 0%, #0f766e 50%, ${designTokens.colors.neutral[800]} 100%)`,
        }}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Activity className="h-6 w-6 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Infrastructure Monitoring</h2>
              <p className="text-sm text-gray-300">
                {currentTier === "basic"
                  ? "Basic monitoring active on all VMs. Upgrade for extended features."
                  : `${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} plan active`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase"
              style={{
                backgroundColor: currentTier === "basic" ? "rgba(255,255,255,0.15)" : "rgba(16,185,129,0.2)",
                color: currentTier === "basic" ? "#d1d5db" : "#6ee7b7",
              }}
            >
              {currentTier}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: designTokens.colors.primary[50] }}>
              <Server className="h-5 w-5" style={{ color: designTokens.colors.primary[600] }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: designTokens.colors.neutral[900] }}>
                {currentTier === "basic" ? "All VMs" : `${usedHosts} / ${maxHosts}`}
              </p>
              <p className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>Monitored VMs</p>
            </div>
          </div>
          {maxHosts > 0 && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: designTokens.colors.neutral[100] }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${usagePercent}%`, backgroundColor: usageColor }} />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: designTokens.colors.neutral[400] }}>{availableHosts} slots available</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: designTokens.colors.success[50] }}>
              <CheckCircle className="h-5 w-5" style={{ color: designTokens.colors.success[600] }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: designTokens.colors.neutral[900] }}>
                {subscription ? `$${subscription.monthly_cost}` : "$0"}
              </p>
              <p className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>Monthly cost</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: designTokens.colors.warning[50] }}>
              <AlertTriangle className="h-5 w-5" style={{ color: designTokens.colors.warning[600] }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: designTokens.colors.neutral[900] }}>
                {currentTier === "basic" ? "24h" : currentTier === "standard" ? "30d" : currentTier === "professional" ? "90d" : "1yr"}
              </p>
              <p className="text-xs" style={{ color: designTokens.colors.neutral[500] }}>Data retention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowTiers(!showTiers)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: designTokens.colors.primary[600] }}
        >
          <ArrowUpCircle className="h-4 w-4" />
          {currentTier === "basic" ? "Subscribe to Paid Plan" : "Change Plan"}
        </button>
        {subscription && (
          <button
            onClick={() => { if (confirm("Cancel monitoring subscription? Basic free monitoring will remain.")) cancelMutation.mutate(); }}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: designTokens.colors.error[300], color: designTokens.colors.error[600] }}
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* CuberWatch External Links */}
      {currentTier !== "basic" && (
        <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: designTokens.colors.neutral[900] }}>Monitoring Dashboards</h3>
          <div className="flex flex-wrap gap-3">
            {/* CuberWatch Full Dashboard — available on all paid tiers */}
            <a
              href={`${import.meta.env.VITE_CUBERWATCH_URL || "https://app.cuberwatch.com"}/dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: designTokens.colors.neutral[300], color: designTokens.colors.neutral[700] }}
            >
              <Activity className="h-4 w-4" style={{ color: designTokens.colors.primary[600] }} />
              Open Full Dashboard
              <ExternalLink className="h-3 w-3" style={{ color: designTokens.colors.neutral[400] }} />
            </a>

            {/* Grafana Dashboards — Standard tier and above */}
            {(currentTier === "standard" || currentTier === "professional" || currentTier === "enterprise") && (
              <a
                href={`${import.meta.env.VITE_CUBERWATCH_URL || "https://app.cuberwatch.com"}/grafana`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: designTokens.colors.warning[300], color: designTokens.colors.warning[700] }}
              >
                <BarChart3 className="h-4 w-4" />
                View in Grafana
                <ExternalLink className="h-3 w-3" style={{ color: designTokens.colors.neutral[400] }} />
              </a>
            )}

            {/* Raw Prometheus — Enterprise only */}
            {currentTier === "enterprise" && (
              <a
                href={`${import.meta.env.VITE_CUBERWATCH_URL || "https://app.cuberwatch.com"}/prometheus`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: designTokens.colors.neutral[300], color: designTokens.colors.neutral[600] }}
              >
                <Terminal className="h-4 w-4" />
                Prometheus Query Browser
                <ExternalLink className="h-3 w-3" style={{ color: designTokens.colors.neutral[400] }} />
              </a>
            )}
          </div>
          <p className="mt-2 text-[11px]" style={{ color: designTokens.colors.neutral[400] }}>
            {currentTier === "standard" && "Upgrade to Professional for custom Grafana dashboards. Enterprise for raw Prometheus access."}
            {currentTier === "professional" && "Upgrade to Enterprise for raw Prometheus query access."}
            {currentTier === "enterprise" && "Full access to all monitoring tools."}
          </p>
        </div>
      )}

      {/* Tier Selection */}
      {showTiers && tiersList.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiersList.map((tier: MonitoringTier) => {
            const tierKey = tier.service_type.replace("monitoring_", "");
            const isCurrent = tierKey === currentTier;
            return (
              <div
                key={tier.service_type}
                className="rounded-xl border-2 p-5 transition-all"
                style={{
                  borderColor: isCurrent ? designTokens.colors.primary[500] : designTokens.colors.neutral[200],
                  backgroundColor: isCurrent ? designTokens.colors.primary[50] : "#fff",
                }}
              >
                <h4 className="text-sm font-bold" style={{ color: designTokens.colors.neutral[900] }}>{tier.name}</h4>
                <p className="mt-1 text-2xl font-bold" style={{ color: designTokens.colors.primary[700] }}>
                  {tier.price_per_host === 0 ? "Free" : `$${tier.price_per_host}`}
                  {tier.price_per_host > 0 && <span className="text-sm font-normal text-gray-400">/VM/mo</span>}
                </p>
                <ul className="mt-3 space-y-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                      <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" style={{ color: designTokens.colors.success[500] }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && tier.service_type !== "monitoring_basic" && (
                  <button
                    onClick={() => handleSubscribe(tier.service_type)}
                    disabled={subscribeMutation.isPending || upgradeMutation.isPending}
                    className="mt-4 w-full rounded-lg px-3 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: designTokens.colors.primary[600] }}
                  >
                    {currentTier === "basic" ? "Subscribe" : "Switch to this plan"}
                  </button>
                )}
                {isCurrent && (
                  <div className="mt-4 rounded-lg py-2 text-center text-xs font-semibold" style={{ backgroundColor: designTokens.colors.primary[100], color: designTokens.colors.primary[700] }}>
                    Current Plan
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assigned Hosts */}
      {subscription && (
        <div className="rounded-xl border bg-white shadow-sm" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: designTokens.colors.neutral[100] }}>
            <h3 className="text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>Monitored VMs ({usedHosts})</h3>
          </div>
          {hosts.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm" style={{ color: designTokens.colors.neutral[400] }}>No VMs assigned yet. VMs are auto-assigned when provisioned.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: designTokens.colors.neutral[100] }}>
              {hosts.map((host) => (
                <div key={String(host.id)} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4" style={{ color: designTokens.colors.neutral[400] }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: designTokens.colors.neutral[900] }}>{String(host.name)}</p>
                      <p className="text-xs font-mono" style={{ color: designTokens.colors.neutral[400] }}>{String(host.ip_address ?? "")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => unassignMutation.mutate(Number(host.id))}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Remove from monitoring"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;

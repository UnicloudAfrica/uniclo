/**
 * UniCloudFlow Dashboard — shared component used across admin, tenant, and client dashboards.
 *
 * Matches the visual style of adminInventory, adminPricing, and TenantPricingOverrides:
 *   - ResourceHero with metrics strip
 *   - ModernCard for content sections
 *   - Side-menu navigation for sub-sections (servers, sites, git providers, etc.)
 */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useFlowApi,
  type FlowPlan,
  type FlowStatus,
  type FlowServer,
} from "@/shared/hooks/useFlowApi";
import ResourceHero from "@/shared/components/ui/ResourceHero";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  Server,
  Globe,
  GitBranch,
  Rocket,
  Database,
  Shield,
  CreditCard,
  Layers,
  Check,
  Loader2,
} from "lucide-react";

interface FlowDashboardProps {
  /** Base path for Flow sub-pages (e.g., "/dashboard/flow" or "/admin-dashboard/flow") */
  basePath: string;
}

const formatKobo = (kobo: number): string => `\u20A6${(kobo / 100).toLocaleString()}`;

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    past_due: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}
    >
      {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
};

// ── Side menu tabs (matching inventory/pricing pattern) ──────
interface FlowTab {
  id: string;
  name: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FLOW_TABS: FlowTab[] = [
  { id: "overview", name: "Overview", caption: "Subscription status", icon: Layers },
  { id: "servers", name: "Servers", caption: "Linked servers", icon: Server },
  { id: "sites", name: "Sites & Deployments", caption: "Deploy to sites", icon: Globe },
  { id: "git-providers", name: "Git Providers", caption: "Source control", icon: GitBranch },
  { id: "databases", name: "Databases", caption: "Database management", icon: Database },
  { id: "ssl", name: "SSL Certificates", caption: "Certificate management", icon: Shield },
];

const FlowDashboard: React.FC<FlowDashboardProps> = ({ basePath }) => {
  const navigate = useNavigate();
  const api = useFlowApi();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<FlowStatus | null>(null);
  const [plans, setPlans] = useState<FlowPlan[]>([]);
  const [servers, setServers] = useState<FlowServer[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, plansRes] = await Promise.all([api.getStatus(), api.getPlans()]);
      setStatus(statusRes.data);
      setPlans(plansRes.data);

      if (statusRes.data.subscribed && statusRes.data.is_usable) {
        try {
          const serversRes = await api.getServers();
          setServers(serversRes.data.servers);
        } catch {
          // May fail if subscription is newly created
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load Flow data.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubscribe = async (planSlug: string) => {
    setSubscribing(true);
    setError(null);
    try {
      await api.subscribe(planSlug);
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start trial.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your UniCloudFlow subscription?")) return;
    try {
      await api.cancel();
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // ── Hero Metrics ──────────────────────────────────────
  const sub = status?.subscription;
  const heroMetrics = status?.subscribed
    ? [
        {
          label: "Plan",
          value: sub?.plan?.name || "—",
          description: "Current plan",
          icon: <CreditCard className="h-5 w-5" />,
        },
        {
          label: "Servers",
          value: servers.length,
          description: `of ${sub?.plan?.max_servers || "—"} limit`,
          icon: <Server className="h-5 w-5" />,
        },
        {
          label: "Site Limit",
          value: sub?.plan?.max_sites || "—",
          description: "Max sites allowed",
          icon: <Globe className="h-5 w-5" />,
        },
        {
          label: "Status",
          value: sub?.status?.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "—",
          description: status?.is_on_trial
            ? `${status.trial_days_remaining} days remaining`
            : "Subscription status",
          icon: <Rocket className="h-5 w-5" />,
        },
      ]
    : [
        {
          label: "Plans Available",
          value: plans.length,
          description: "Choose a plan",
          icon: <Layers className="h-5 w-5" />,
        },
        {
          label: "Starting at",
          value: plans.length ? formatKobo(plans[0].price_monthly_kobo) : "—",
          description: "Per month",
          icon: <CreditCard className="h-5 w-5" />,
        },
        {
          label: "Trial Period",
          value: "30 days",
          description: "Free to start",
          icon: <Rocket className="h-5 w-5" />,
        },
        {
          label: "Features",
          value: "Full Access",
          description: "All features during trial",
          icon: <Check className="h-5 w-5" />,
        },
      ];

  // ── Not subscribed — show plan selection ───────────────
  if (!status?.subscribed) {
    return (
      <div className="space-y-6">
        <ResourceHero
          title="UniCloudFlow"
          subtitle="Deployment Platform"
          description="Automated server provisioning, site deployments, and SSL management — powered by LeanPloy. Start with a free 30-day trial."
          metrics={heroMetrics}
          accent="midnight"
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <ModernCard key={plan.id} className="flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {plan.name}
                </h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formatKobo(plan.price_monthly_kobo)}
                  </span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {[
                    `${plan.max_servers} server${plan.max_servers > 1 ? "s" : ""}`,
                    `${plan.max_sites} site${plan.max_sites > 1 ? "s" : ""}`,
                    `${plan.max_databases} database${plan.max_databases > 1 ? "s" : ""}`,
                    ...(plan.zero_downtime ? ["Zero-downtime deployments"] : []),
                    ...(plan.ssl_management ? ["SSL certificate management"] : []),
                    ...(plan.git_integration ? ["Git integration"] : []),
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                    >
                      <Check className="h-4 w-4 shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.features && plan.features.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
                    {plan.features.map((f, i) => (
                      <p
                        key={i}
                        className="text-xs text-slate-500 dark:text-slate-500"
                      >
                        {f}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <ModernButton
                onClick={() => handleSubscribe(plan.slug)}
                disabled={subscribing}
                className="mt-6 w-full"
              >
                {subscribing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting...
                  </span>
                ) : (
                  "Start Free Trial"
                )}
              </ModernButton>
            </ModernCard>
          ))}
        </div>
      </div>
    );
  }

  // ── Subscribed — show dashboard with side menu (inventory/pricing pattern) ─
  return (
    <div className="space-y-6">
      <ResourceHero
        title="UniCloudFlow"
        subtitle={sub?.plan?.name || "Deployment Platform"}
        description="Manage your servers, deploy sites, and configure SSL — all from one dashboard."
        metrics={heroMetrics}
        accent="midnight"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Trial banner */}
      {status.is_on_trial && status.trial_days_remaining !== null && (
        <ModernCard className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                <strong>{status.trial_days_remaining}</strong> day
                {status.trial_days_remaining !== 1 ? "s" : ""} remaining in your free trial.
              </p>
              <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                Upgrade to keep your servers and sites after the trial ends.
              </p>
            </div>
            <ModernButton
              onClick={() => navigate(`${basePath}/upgrade`)}
              variant="primary"
              size="sm"
            >
              Upgrade Now
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {status.is_trial_expired && (
        <ModernCard className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Your free trial has expired. Upgrade to continue using UniCloudFlow.
            </p>
            <ModernButton
              onClick={() => navigate(`${basePath}/upgrade`)}
              variant="primary"
              size="sm"
            >
              Upgrade Now
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {/* Main content area with side menu (inventory-style layout) */}
      <div className="flex gap-6">
        {/* Side navigation */}
        <div className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            {FLOW_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-300"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-primary-500" : ""}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tab.name}</p>
                    <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-500 truncate">
                      {tab.caption}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Cancel subscription */}
          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              onClick={handleCancel}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Cancel Subscription
            </button>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {FLOW_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  activeTab === tab.id
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab content area */}
        <div className="min-w-0 flex-1">
          {activeTab === "overview" && (
            <OverviewTab
              status={status}
              servers={servers}
              basePath={basePath}
              onNavigate={navigate}
            />
          )}
          {activeTab === "servers" && (
            <ServersTab servers={servers} basePath={basePath} onNavigate={navigate} />
          )}
          {activeTab === "sites" && <SitesPlaceholder basePath={basePath} />}
          {activeTab === "git-providers" && <GitProvidersPlaceholder basePath={basePath} />}
          {activeTab === "databases" && <DatabasesPlaceholder basePath={basePath} />}
          {activeTab === "ssl" && <SSLPlaceholder basePath={basePath} />}
        </div>
      </div>
    </div>
  );
};

// ── Tab Content Components ──────────────────────────────

const OverviewTab: React.FC<{
  status: FlowStatus;
  servers: FlowServer[];
  basePath: string;
  onNavigate: (path: string) => void;
}> = ({ status, servers, basePath, onNavigate }) => {
  const sub = status.subscription!;
  return (
    <div className="space-y-4">
      {/* Quick action cards (matching pricing page grid style) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Servers",
            value: servers.length,
            limit: sub.plan?.max_servers,
            icon: Server,
            tab: "servers",
            color: "text-blue-500",
          },
          {
            title: "Sites",
            value: "—",
            limit: sub.plan?.max_sites,
            icon: Globe,
            tab: "sites",
            color: "text-green-500",
          },
          {
            title: "Git Providers",
            value: "—",
            limit: null,
            icon: GitBranch,
            tab: "git-providers",
            color: "text-purple-500",
          },
          {
            title: "Databases",
            value: "—",
            limit: sub.plan?.max_databases,
            icon: Database,
            tab: "databases",
            color: "text-amber-500",
          },
          {
            title: "SSL Certificates",
            value: "—",
            limit: null,
            icon: Shield,
            tab: "ssl",
            color: "text-teal-500",
          },
          {
            title: "Deployments",
            value: "—",
            limit: null,
            icon: Rocket,
            tab: "sites",
            color: "text-orange-500",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <ModernCard
              key={item.title}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => onNavigate(`${basePath}?tab=${item.tab}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    {item.value}
                  </p>
                  {item.limit && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      of {item.limit} limit
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ${item.color} dark:bg-slate-800`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </ModernCard>
          );
        })}
      </div>

      {/* Recent servers */}
      {servers.length > 0 && (
        <ModernCard>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Linked Servers
            </h4>
            <ModernButton variant="ghost" size="sm" onClick={() => onNavigate(`${basePath}?tab=servers`)}>
              View all
            </ModernButton>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {servers.slice(0, 5).map((server) => (
              <div key={server.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-900/30">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {server.name}
                    </p>
                    <p className="text-xs text-slate-500">{server.ip_address}</p>
                  </div>
                </div>
                <StatusBadge status={server.status} />
              </div>
            ))}
          </div>
        </ModernCard>
      )}
    </div>
  );
};

const ServersTab: React.FC<{
  servers: FlowServer[];
  basePath: string;
  onNavigate: (path: string) => void;
}> = ({ servers, onNavigate }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Servers</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage servers linked to your UniCloudFlow subscription.
        </p>
      </div>
    </div>

    {servers.length === 0 ? (
      <ModernCard className="py-12 text-center">
        <Server className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">No servers linked yet.</p>
        <p className="mt-1 text-xs text-slate-400">
          Servers will appear here once provisioned through LeanPloy.
        </p>
      </ModernCard>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        {servers.map((server) => (
          <ModernCard
            key={server.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/30">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {server.name}
                  </p>
                  <p className="text-xs text-slate-500">{server.ip_address}</p>
                </div>
              </div>
              <StatusBadge status={server.status} />
            </div>
            {server.php_version && (
              <div className="mt-3 flex gap-3 text-xs text-slate-500">
                <span>PHP {server.php_version}</span>
                {server.ubuntu_version && <span>Ubuntu {server.ubuntu_version}</span>}
              </div>
            )}
          </ModernCard>
        ))}
      </div>
    )}
  </div>
);

// Placeholder tabs — will be expanded into full sub-pages
const SitesPlaceholder: React.FC<{ basePath: string }> = () => (
  <ModernCard className="py-12 text-center">
    <Globe className="mx-auto h-10 w-10 text-slate-300" />
    <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
      Sites & Deployments
    </p>
    <p className="mt-1 text-xs text-slate-500">
      Select a server from the Servers tab to manage its sites and trigger deployments.
    </p>
  </ModernCard>
);

const GitProvidersPlaceholder: React.FC<{ basePath: string }> = () => (
  <ModernCard className="py-12 text-center">
    <GitBranch className="mx-auto h-10 w-10 text-slate-300" />
    <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">Git Providers</p>
    <p className="mt-1 text-xs text-slate-500">
      Connect GitHub, GitLab, or Bitbucket to enable automated deployments.
    </p>
  </ModernCard>
);

const DatabasesPlaceholder: React.FC<{ basePath: string }> = () => (
  <ModernCard className="py-12 text-center">
    <Database className="mx-auto h-10 w-10 text-slate-300" />
    <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">Databases</p>
    <p className="mt-1 text-xs text-slate-500">
      Create and manage databases on your linked servers.
    </p>
  </ModernCard>
);

const SSLPlaceholder: React.FC<{ basePath: string }> = () => (
  <ModernCard className="py-12 text-center">
    <Shield className="mx-auto h-10 w-10 text-slate-300" />
    <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">SSL Certificates</p>
    <p className="mt-1 text-xs text-slate-500">
      Manage Let's Encrypt certificates for your sites.
    </p>
  </ModernCard>
);

export default FlowDashboard;

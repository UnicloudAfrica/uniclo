/**
 * UniCloudFlow Dashboard — shared component used across admin, tenant, and client dashboards.
 *
 * Matches the visual style of adminInventory, adminPricing, and TenantPricingOverrides:
 *   - ResourceHero with metrics strip
 *   - ModernCard for content sections
 *   - Side-menu navigation for sub-sections (servers, sites, git providers, etc.)
 */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useFlowApi,
  type FlowPlan,
  type FlowStatus,
  type FlowServer,
  type FlowSite,
} from "@/shared/hooks/useFlowApi";
import ResourceHero from "@/shared/components/ui/ResourceHero";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import { TemporaryDomainBadge } from "./TemporaryDomainBadge";
import FlowSiteArchitectureModal from "./FlowSiteArchitectureModal";
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
  Workflow,
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

const VALID_TAB_IDS = FLOW_TABS.map((t) => t.id);

const FlowDashboard: React.FC<FlowDashboardProps> = ({ basePath }) => {
  const navigate = useNavigate();
  const api = useFlowApi();
  const { t } = useTranslation("flow");
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<FlowStatus | null>(null);
  const [plans, setPlans] = useState<FlowPlan[]>([]);
  const [servers, setServers] = useState<FlowServer[]>([]);
  // Read the initial tab from the URL — lets sidebar submenus deep-link
  // straight into a section (e.g. /dashboard/flow?tab=sites).
  const tabFromUrl = searchParams.get("tab") ?? "overview";
  const initialTab = VALID_TAB_IDS.includes(tabFromUrl) ? tabFromUrl : "overview";
  const [activeTab, setActiveTabState] = useState(initialTab);

  // Wrap setActiveTab so every change keeps `?tab=` in sync. Browser
  // back/forward then navigates between sections, and refresh stays on
  // the same tab the user was viewing.
  const setActiveTab = useCallback(
    (next: string) => {
      setActiveTabState(next);
      const sp = new URLSearchParams(searchParams);
      if (next === "overview") {
        sp.delete("tab");
      } else {
        sp.set("tab", next);
      }
      setSearchParams(sp, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  // If the URL changes from outside (sidebar nav, back button), follow it.
  useEffect(() => {
    const fromUrl = searchParams.get("tab") ?? "overview";
    const next = VALID_TAB_IDS.includes(fromUrl) ? fromUrl : "overview";
    if (next !== activeTab) {
      setActiveTabState(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
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

  // Auto-refresh:
  //   - poll every 30s while the dashboard is open
  //   - refetch immediately when the tab regains focus (user comes back from
  //     a deploy on LeanPloy and expects to see the new state)
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!document.hidden) {
        fetchData();
      }
    }, 30_000);

    const onFocus = () => fetchData();
    const onVisibility = () => {
      if (!document.hidden) fetchData();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchData]);

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
    if (!window.confirm("Are you sure you want to cancel your SimpleDeploy subscription?")) return;
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
          title="SimpleDeploy"
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
        title="SimpleDeploy"
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
              Your free trial has expired. Upgrade to continue using SimpleDeploy.
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

      {/*
        Past-due banner — shown when ChargeFlowSubscriptions has exhausted its
        retry budget and flipped the subscription to past_due. Paystack auth
        codes can't be silently refreshed once the card is replaced/expired,
        so the user must re-enter card details. The renewSubscription endpoint
        already accepts past_due — we just need to surface the CTA.
      */}
      {sub?.status === "past_due" && (
        <ModernCard
          className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                {t("past_due_banner.title")}
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                {t("past_due_banner.body")}
              </p>
            </div>
            <ModernButton
              onClick={() => navigate(`${basePath}/billing?reauthorize=1`)}
              variant="primary"
              size="sm"
            >
              {t("past_due_banner.cta")}
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
            <ServersTab
              servers={servers}
              basePath={basePath}
              onNavigate={navigate}
              onChange={fetchData}
            />
          )}
          {activeTab === "sites" && <SitesTab servers={servers} />}
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
  onChange: () => void | Promise<void>;
}> = ({ servers, onChange }) => {
  const api = useFlowApi();

  const claim = async (serverId: number, name?: string) => {
    await api.attachServerTemporaryDomain(serverId, name);
    await onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Servers</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage servers linked to your SimpleDeploy subscription.
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
            <ModernCard key={server.id}>
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
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
                <TemporaryDomainBadge
                  scope="compute"
                  domain={server.temporary_domain ?? null}
                  onClaim={(name) => claim(server.id, name)}
                  onGenerate={() => claim(server.id)}
                />
              </div>
            </ModernCard>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Sites tab: lists all sites across all linked servers, with the
 * temporary-domain badge inline. The temp-domain pattern is the same
 * one Vercel/Heroku ships — every freshly created site has a working
 * URL on `<slug>.flow.unicloudafrica.ng` immediately, before the
 * customer has wired their custom DNS.
 */
const SitesTab: React.FC<{ servers: FlowServer[] }> = ({ servers }) => {
  const api = useFlowApi();
  const [loading, setLoading] = useState(true);
  const [sitesByServer, setSitesByServer] = useState<
    Record<number, FlowSite[]>
  >({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  // The architecture-modal state is two values so we can render the modal
  // OUTSIDE the sites loop without prop-drilling. `null` = closed.
  const [archTarget, setArchTarget] = useState<{ server: FlowServer; site: FlowSite } | null>(
    null,
  );

  // Use the server-id list as the dep, not the array reference. The
  // parent re-creates `servers` on each render even when the contents
  // don't change — that previously thrashed this useCallback +
  // dependent useEffect into an infinite loop (RESULT_CODE_HUNG).
  const serverIdsKey = servers.map((s) => s.id).join(",");
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        servers.map(async (s) => {
          try {
            const r = await api.getSites(s.id);
            return [s.id, r.data ?? []] as const;
          } catch {
            return [s.id, []] as const;
          }
        }),
      );
      const next: Record<number, FlowSite[]> = {};
      for (const [id, sites] of results) {
        next[id] = [...sites]; // narrow `readonly []` to mutable `FlowSite[]`
      }
      setSitesByServer(next);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serverIdsKey is the stable identity for `servers`
  }, [api, serverIdsKey]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const onGenerateTempDomain = async (serverId: number, siteId: number) => {
    const key = `${serverId}:${siteId}`;
    setGeneratingFor(key);
    try {
      await api.attachSiteTemporaryDomain(serverId, siteId);
      await refetch();
    } finally {
      setGeneratingFor(null);
    }
  };

  const onClaimTempDomain = async (
    serverId: number,
    siteId: number,
    name: string,
  ) => {
    // Don't swallow — TemporaryDomainClaim catches and surfaces
    // 409/422 inline so the user can fix the name.
    await api.attachSiteTemporaryDomain(serverId, siteId, name);
    await refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const servesAny = Object.values(sitesByServer).some((s) => s.length > 0);
  if (!servesAny) {
    return (
      <ModernCard className="py-12 text-center">
        <Globe className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
          No sites yet
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Sites will appear here as soon as they are created on a connected server.
        </p>
      </ModernCard>
    );
  }

  return (
    <div className="space-y-6">
      {archTarget && (
        <FlowSiteArchitectureModal
          open
          onClose={() => setArchTarget(null)}
          server={archTarget.server}
          site={archTarget.site}
        />
      )}
      {servers.map((server) => {
        const sites = sitesByServer[server.id] ?? [];
        if (sites.length === 0) return null;
        return (
          <ModernCard key={server.id}>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/30">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {server.name}
                </p>
                <p className="text-xs text-slate-500">
                  {sites.length} site{sites.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {sites.map((site) => {
                const key = `${server.id}:${site.id}`;
                return (
                  <div
                    key={site.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {site.domain}
                      </p>
                      <p className="text-xs text-slate-500">
                        {site.project_type}
                        {site.repository ? ` · ${site.repository}` : ""}
                        {site.branch ? ` · ${site.branch}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <ModernButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setArchTarget({ server, site })}
                        aria-label={`View architecture for ${site.domain}`}
                        leftIcon={<Workflow className="h-3.5 w-3.5" />}
                      >
                        Architecture
                      </ModernButton>
                      <TemporaryDomainBadge
                        scope="flow"
                        domain={site.temporary_domain ?? null}
                        isGenerating={generatingFor === key}
                        onGenerate={() => onGenerateTempDomain(server.id, site.id)}
                        onClaim={(name) =>
                          onClaimTempDomain(server.id, site.id, name)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ModernCard>
        );
      })}
    </div>
  );
};

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

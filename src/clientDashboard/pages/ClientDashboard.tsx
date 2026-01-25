// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Calculator,
  ChevronRight,
  Clock,
  Cloud as CloudIcon,
  Gauge,
  HardDrive,
  Layers,
  LayoutTemplate,
  LifeBuoy,
  Rocket,
  Server,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import {
  CloudConnectionIllustration,
  MobileIllustration,
  MonitorIllustration,
} from "../../shared/components/branding/BrandIllustrations";
import { Link } from "react-router-dom";
import { useFetchClientProfile } from "../../hooks/clientHooks/resources";
import VerifyAccountPromptModal from "../components/verifyAccountPrompt";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { useFetchClientProductOffers } from "../../hooks/clientHooks/productsHook";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";
import { useFetchClientProjects } from "../../hooks/clientHooks/projectHooks";
import { useFetchClientPurchasedInstances } from "../../hooks/clientHooks/instanceHooks";
import clientSilentApi from "../../index/client/silent";
import { useQuery } from "@tanstack/react-query";

interface DashboardMessage {
  projects: number;
  active_instances: number;
  pending_instances: number;
  support: number;
}

interface Metric {
  label: string;
  value: number;
}

interface MetricWithIcon extends Metric {
  Icon: LucideIcon;
}

interface OfferItem {
  type?: string;
  identifier?: string;
  name?: string;
}

interface Offer {
  id: string | number;
  name: string;
  offer_type?: string;
  fixed_price?: number;
  discount_percentage?: number;
  period_days?: number;
  description?: string;
  items?: OfferItem[];
  starts_at?: string;
  ends_at?: string;
}

interface Offers {
  trial: Offer[];
  discount: Offer[];
  [key: string]: Offer[];
}

interface QuickAction {
  title: string;
  description: string;
  to: string;
  Icon: LucideIcon;
}

interface OfferSection {
  key: string;
  title: string;
  description: string;
  ctaLabel: string;
}

interface Profile {
  first_name?: string;
  business_name?: string;
  company_name?: string;
  verified?: boolean | number;
}

interface Theme {
  themeColor?: string;
  secondaryColor?: string;
}

// Fetch support tickets count
const useFetchClientTicketStats = () => {
  return useQuery({
    queryKey: ["client", "support", "stats"],
    queryFn: async () => {
      const res = await clientSilentApi("GET", "/business/support");
      const tickets = res?.data || [];
      const open = tickets.filter(
        (t: any) => t.status !== "resolved" && t.status !== "closed"
      ).length;
      return { open, total: tickets.length };
    },
    staleTime: 1000 * 60 * 5,
  });
};

const useFetchClientDashboardStats = () => {
  const { data: projectsData, isFetching: isProjectsFetching } = useFetchClientProjects();
  const { data: instancesData, isFetching: isInstancesFetching } =
    useFetchClientPurchasedInstances();
  const { data: ticketStats, isFetching: isTicketsFetching } = useFetchClientTicketStats();

  const projects = projectsData?.data || [];
  const instances = instancesData?.data || [];

  const activeInstances = instances.filter((i: any) =>
    ["running", "active", "ready", "online"].includes(i.status?.toLowerCase())
  ).length;

  const pendingInstances = instances.filter((i: any) =>
    ["pending", "provisioning", "creating", "initializing", "processing"].includes(
      i.status?.toLowerCase()
    )
  ).length;

  return {
    data: {
      message: {
        projects: projects.length,
        active_instances: activeInstances,
        pending_instances: pendingInstances,
        support: ticketStats?.open || 0,
      },
    },
    projects,
    instances,
    ticketStats: ticketStats || { open: 0, total: 0 },
    isFetching: isProjectsFetching || isInstancesFetching || isTicketsFetching,
  };
};

const ICON_MAP: Record<string, React.ElementType> = {
  mobile: MobileIllustration,
  storage: CloudConnectionIllustration,
  trial: MobileIllustration,
  discount: CloudConnectionIllustration,
};

const METRIC_ICON_MAP: Record<string, LucideIcon> = {
  "Total Projects": CloudIcon,
  "Active Instances": Server,
  "Pending Instances": Clock,
  "Open Tickets": LifeBuoy,
};

const HIGHLIGHT_METRICS = [
  "Total Projects",
  "Active Instances",
  "Pending Instances",
  "Open Tickets",
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Launch Compute",
    description: "Deploy a new virtual machine or container workload.",
    to: "/client-dashboard/instances/provision",
    Icon: Rocket,
  },
  {
    title: "Projects",
    description: "Organize teams, access, and infrastructure in one place.",
    to: "/client-dashboard/projects",
    Icon: Layers,
  },
  {
    title: "Templates",
    description: "Reuse starter stacks to provision faster.",
    to: "/client-dashboard/templates",
    Icon: LayoutTemplate,
  },
  {
    title: "Silo Storage",
    description: "Store and retrieve assets securely with high durability.",
    to: "/client-dashboard/object-storage",
    Icon: HardDrive,
  },
  {
    title: "Pricing Calculator",
    description: "Model projected spend before you provision resources.",
    to: "/client-dashboard/pricing-calculator",
    Icon: Calculator,
  },
];

const OFFER_SECTIONS: OfferSection[] = [
  {
    key: "trial",
    title: "Trial Offers",
    description: "Spin up resources with zero commitment for quick testing.",
    ctaLabel: "Start Trial",
  },
  {
    key: "discount",
    title: "Discounted Plans",
    description: "Lock in savings on long-running workloads and storage.",
    ctaLabel: "Unlock Offer",
  },
];

const DEFAULT_OFFERS: Offers = { trial: [], discount: [] };

const formatAmount = (amount: number | string): string => {
  const numericValue = Number(amount) || 0;
  return numericValue.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatPercentage = (value: number | string): string =>
  new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

const periodLabel = (days: number | undefined): string => {
  if (!days) return "period";
  return `${days} day${days > 1 ? "s" : ""}`;
};

const formatLabel = (value = "") =>
  value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatDateLabel = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const MetricCardSkeleton: React.FC = () => (
  <div className="w-full rounded-2xl border border-[--theme-border-color] bg-[--theme-card-bg] p-4 shadow-sm animate-pulse">
    <div className="mb-3 h-4 w-24 rounded bg-[--theme-surface-alt]" />
    <div className="h-6 w-20 rounded bg-[--theme-surface-alt]" />
  </div>
);

const OfferSkeleton: React.FC = () => (
  <div className="relative w-full overflow-hidden rounded-2xl border border-[--theme-border-color] bg-[--theme-card-bg] p-6 shadow-sm animate-pulse">
    <div className="h-5 w-40 rounded bg-[--theme-surface-alt]" />
    <div className="mt-3 h-4 w-24 rounded bg-[--theme-surface-alt]" />
    <div className="mt-6 h-7 w-32 rounded bg-[--theme-surface-alt]" />
    <div className="mt-3 h-4 w-full rounded bg-[--theme-surface-alt]" />
    <div className="mt-4 h-10 w-32 rounded-full bg-[--theme-surface-alt]" />
    <div className="absolute right-6 top-10 h-16 w-16 rounded-full bg-[--theme-surface-alt]" />
  </div>
);

interface OfferCardProps {
  offer: Offer;
  type: string;
  ctaLabel: string;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, type, ctaLabel }: any) => {
  const isTrial = type === "trial";
  const discountPercentage = Number(offer?.discount_percentage ?? 0);
  const priceValue = Number(offer?.fixed_price ?? 0);
  const hasPrice = Number.isFinite(priceValue) && priceValue > 0;
  const items = Array.isArray(offer?.items) ? offer.items : [];
  const itemNames = items
    .map((item: any) => item?.name || item?.identifier)
    .filter(Boolean)
    .slice(0, 3);
  const spec = itemNames.length ? itemNames.join(" • ") : "Bundle offer";

  const description = offer?.description || "";
  const offerTypeKey = String(offer?.offer_type || "").toLowerCase();
  const OfferIllustration =
    ICON_MAP[offerTypeKey] || (isTrial ? MobileIllustration : CloudConnectionIllustration);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-[--theme-border-color] bg-[--theme-card-bg] p-6 shadow-sm transition-all duration-200 hover:border-[--theme-color] hover:shadow-lg">
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[--theme-muted-color]">
              {isTrial ? "Trial bundle" : "Featured offer"}
            </p>
            <h3 className="text-lg font-semibold text-[--theme-heading-color]">{offer?.name}</h3>
          </div>
          <span className="rounded-full bg-[--theme-color-10] px-3 py-1 text-xs font-semibold text-[--theme-color]">
            {isTrial
              ? "Trial"
              : discountPercentage
                ? `Save ${formatPercentage(discountPercentage)}%`
                : "Offer"}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-[--theme-text-color]">
            <MonitorIllustration className="h-5 w-5 shrink-0 text-[--theme-color]" />
            <span>{spec}</span>
          </div>
          <p className="text-2xl font-semibold text-[--theme-heading-color]">
            {hasPrice ? `₦${formatAmount(priceValue)}` : "Custom pricing"}
            {hasPrice ? (
              <span className="text-sm font-medium text-[--theme-muted-color]">
                {" "}
                / {periodLabel(offer?.period_days)}
              </span>
            ) : null}
          </p>
          {description ? (
            <p className="text-sm leading-relaxed text-[--theme-muted-color]">{description}</p>
          ) : null}
          {itemNames.length ? (
            <ul className="grid gap-1 text-xs text-[--theme-muted-color]">
              {itemNames.map((item: any) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[--theme-color]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="inline-flex w-fit items-center justify-center rounded-full bg-[--theme-color-10] px-6 py-2.5 text-sm font-medium text-[--theme-color] transition-colors duration-200 hover:bg-[--theme-color] hover:text-white"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
      <OfferIllustration className="pointer-events-none absolute -right-8 bottom-0 h-32 w-auto opacity-60 md:-right-4" />
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  const { data: profile, isFetching: isProfileFetching } = useFetchClientProfile() as {
    data: Profile | undefined;
    isFetching: boolean;
  };
  const {
    data: dashboard,
    projects = [],
    instances = [],
    ticketStats,
    isFetching: isDashboardFetching,
  } = useFetchClientDashboardStats();
  const { data: offers = DEFAULT_OFFERS, isFetching: isOffersFetching } =
    useFetchClientProductOffers() as { data: Offers; isFetching: boolean };
  const { data: theme } = useClientTheme() as { data: Theme | undefined };

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (!isProfileFetching && profile && (profile.verified === 0 || profile.verified === false)) {
      setShowVerifyModal(true);
    }
  }, [isProfileFetching, profile]);

  const handleCloseVerifyModal = () => {
    setShowVerifyModal(false);
  };

  // Prepare metrics data from dashboard.message
  const metrics = useMemo<Metric[]>(() => {
    if (!dashboard?.message) return [];
    const { projects, active_instances, pending_instances, support } = dashboard.message;
    return [
      { label: "Total Projects", value: projects },
      { label: "Active Instances", value: active_instances },
      { label: "Pending Instances", value: pending_instances },
      { label: "Open Tickets", value: support },
    ];
  }, [dashboard]);

  const metricsWithIcons = useMemo<MetricWithIcon[]>(
    () =>
      metrics.map((metric: any) => {
        const Icon = METRIC_ICON_MAP[metric.label] || Gauge;
        return { ...metric, Icon };
      }),
    [metrics]
  );

  const highlightMetrics = useMemo<MetricWithIcon[]>(
    () => metricsWithIcons.filter((metric: any) => HIGHLIGHT_METRICS.includes(metric.label)),
    [metricsWithIcons]
  );

  const accentGradient = useMemo(() => {
    // Default to the platform theme when branding is unavailable.
    const start = theme?.themeColor || "#288DD1";
    const end = theme?.secondaryColor || "#3FE0C8";
    return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
  }, [theme?.themeColor, theme?.secondaryColor]);

  const welcomeName = profile?.first_name || profile?.business_name || profile?.company_name;
  const isVerified = profile?.verified === 1 || profile?.verified === true;

  const recentProjects = useMemo(() => {
    if (!projects.length) return [];
    const sorted = [...projects].sort((a: any, b: any) => {
      const aDate = new Date(a?.updated_at || a?.created_at || 0).getTime();
      const bDate = new Date(b?.updated_at || b?.created_at || 0).getTime();
      return bDate - aDate;
    });
    return sorted.slice(0, 4);
  }, [projects]);

  const instanceStatusSummary = useMemo(() => {
    const groups = [
      {
        key: "running",
        label: "Running",
        match: ["running", "active", "ready", "online"],
        color: "var(--theme-color)",
      },
      {
        key: "provisioning",
        label: "Provisioning",
        match: ["pending", "provisioning", "creating", "initializing", "processing"],
        color: "var(--theme-badge-pending-text)",
      },
      {
        key: "stopped",
        label: "Stopped",
        match: ["stopped", "halted", "offline", "paused", "suspended"],
        color: "var(--theme-muted-color)",
      },
      {
        key: "issues",
        label: "Needs attention",
        match: ["failed", "error", "terminated"],
        color: "var(--theme-badge-failed-text)",
      },
    ];

    const normalizedStatuses = instances.map((instance: any) =>
      String(instance?.status || "").toLowerCase()
    );
    const total = normalizedStatuses.length;
    let matched = 0;

    const summary = groups.map((group) => {
      const count = normalizedStatuses.filter((status) => group.match.includes(status)).length;
      matched += count;
      return {
        ...group,
        count,
        percent: total ? Math.round((count / total) * 100) : 0,
      };
    });

    const otherCount = Math.max(total - matched, 0);
    if (otherCount) {
      summary.push({
        key: "other",
        label: "Other states",
        color: "var(--theme-muted-color)",
        count: otherCount,
        percent: total ? Math.round((otherCount / total) * 100) : 0,
      });
    }

    return summary;
  }, [instances]);

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Dashboard"
        description="Monitor your services, launch new workloads, and explore curated offers."
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }]}
      >
        <div className="space-y-10">
          <section className="relative overflow-hidden rounded-[32px] border border-[--theme-border-color] bg-[--theme-card-bg] shadow-sm">
            <div className="absolute inset-0" style={{ background: accentGradient }} />
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 grid gap-8 p-6 text-white md:p-10 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                  <Sparkles className="h-3.5 w-3.5" />
                  Command Center
                </div>
                <div className="space-y-3">
                  <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
                    {isProfileFetching
                      ? "Loading your workspace..."
                      : `Hi ${welcomeName || "there"} 👋🏽`}
                  </h1>
                  <p className="text-base text-white/85 md:text-lg">
                    Monitor your cloud footprint, launch new resources, and keep your projects
                    moving without friction.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/client-dashboard/instances/provision"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[--theme-heading-color] transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Launch instance
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/client-dashboard/projects/create"
                    className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white/90 transition hover:border-white hover:bg-white/10"
                  >
                    Create project
                  </Link>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-white/80">
                    {isProfileFetching ? (
                      "Checking account status..."
                    ) : isVerified ? (
                      <>
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified account
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Verification required
                      </>
                    )}
                  </span>
                  {ticketStats ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-white/80">
                      Support: {ticketStats.open} open
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {isDashboardFetching ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`hero-metric-${index}`}
                      className="rounded-2xl bg-white/15 p-4 backdrop-blur"
                    >
                      <div className="mb-2 h-4 w-24 rounded bg-white/20" />
                      <div className="h-6 w-12 rounded bg-white/30" />
                    </div>
                  ))
                ) : highlightMetrics.length ? (
                  highlightMetrics.map(({ label, value, Icon }: any) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/12 p-4 backdrop-blur transition hover:bg-white/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                            {label}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                        </div>
                        <Icon className="h-9 w-9 text-white/80" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-sm text-white/80">
                    We will surface useful insight here once your activity begins to populate.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[--theme-heading-color]">Launchpad</h2>
                <p className="text-sm text-[--theme-muted-color]">
                  Move faster with ready-to-go actions across your workspace.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {QUICK_ACTIONS.map(({ title, description, to, Icon }: any) => (
                <Link
                  key={title}
                  to={to}
                  className="group relative overflow-hidden rounded-2xl border border-[--theme-border-color] bg-[--theme-card-bg] p-5 shadow-sm transition hover:border-[--theme-color] hover:shadow-md"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-[--theme-color-10]" />
                  </div>
                  <div className="relative z-10 flex h-full flex-col gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--theme-color-10] text-[--theme-color] transition-colors group-hover:bg-[--theme-color] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-[--theme-heading-color]">
                        {title}
                      </h3>
                      <p className="text-sm text-[--theme-muted-color] leading-relaxed">
                        {description}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[--theme-color] group-hover:underline">
                      Open
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[--theme-heading-color]">
                  Platform snapshot
                </h2>
                <p className="text-sm text-[--theme-muted-color]">
                  Keep tabs on adoption across your projects and teams.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {isDashboardFetching ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <MetricCardSkeleton key={`metric-skeleton-${index}`} />
                ))
              ) : metricsWithIcons.length ? (
                metricsWithIcons.map(({ label, value, Icon }: any) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[--theme-border-color] bg-[--theme-card-bg] p-4 shadow-sm transition hover:border-[--theme-color] hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[--theme-muted-color]">
                          {label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[--theme-heading-color]">
                          {value}
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[--theme-color-10] text-[--theme-color]">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[--theme-border-color] bg-[--theme-card-bg] p-6 text-center text-sm text-[--theme-muted-color]">
                  Metrics will appear once activity data is available.
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
            <div className="rounded-3xl border border-[--theme-border-color] bg-[--theme-card-bg] p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[--theme-heading-color]">
                    Projects in focus
                  </h2>
                  <p className="text-sm text-[--theme-muted-color]">
                    Recently active projects and their latest status.
                  </p>
                </div>
                <Link
                  to="/client-dashboard/projects"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[--theme-color]"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {isDashboardFetching ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`project-skeleton-${index}`}
                      className="rounded-2xl border border-[--theme-border-color] bg-[--theme-surface-alt] p-4 animate-pulse"
                    >
                      <div className="h-4 w-40 rounded bg-white/70" />
                      <div className="mt-2 h-3 w-24 rounded bg-white/60" />
                    </div>
                  ))
                ) : recentProjects.length ? (
                  recentProjects.map((project: any) => {
                    const projectName = project?.name || project?.identifier || "Untitled project";
                    const statusLabel = project?.status ? formatLabel(project.status) : "Active";
                    const dateLabel = formatDateLabel(project?.updated_at || project?.created_at);
                    const projectLink = project?.id
                      ? `/client-dashboard/projects/details?id=${encodeURIComponent(project.id)}`
                      : "/client-dashboard/projects";

                    return (
                      <Link
                        key={project?.id || projectName}
                        to={projectLink}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[--theme-border-color] bg-[--theme-surface-alt] p-4 transition hover:border-[--theme-color] hover:bg-white"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[--theme-heading-color]">
                            {projectName}
                          </p>
                          <p className="text-xs text-[--theme-muted-color]">{statusLabel}</p>
                        </div>
                        {dateLabel ? (
                          <span className="text-xs text-[--theme-muted-color]">{dateLabel}</span>
                        ) : null}
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-[--theme-border-color] bg-[--theme-surface-alt] p-6 text-sm text-[--theme-muted-color]">
                    No projects yet. Start by creating your first workspace.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-[--theme-border-color] bg-[--theme-card-bg] p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[--theme-heading-color]">
                      Instance health
                    </h3>
                    <p className="text-sm text-[--theme-muted-color]">
                      Live state across your fleet.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[--theme-muted-color]">
                    {instances.length} total
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {instances.length ? (
                    instanceStatusSummary.map((status: any) => (
                      <div key={status.key} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[--theme-heading-color]">
                            {status.label}
                          </span>
                          <span className="text-[--theme-muted-color]">{status.count}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[--theme-surface-alt]">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${status.percent}%`,
                              backgroundColor: status.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[--theme-border-color] bg-[--theme-surface-alt] p-4 text-sm text-[--theme-muted-color]">
                      No instances yet. Launch compute to see live health metrics.
                    </div>
                  )}
                </div>
              </div>

              <Link
                to="/client-dashboard/support"
                className="group rounded-3xl border border-[--theme-border-color] bg-[--theme-card-bg] p-6 shadow-sm transition hover:border-[--theme-color] hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[--theme-color-10] text-[--theme-color]">
                    <LifeBuoy className="h-5 w-5" />
                  </span>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[--theme-muted-color]">Support inbox</p>
                    <h3 className="text-lg font-semibold text-[--theme-heading-color]">
                      {ticketStats ? `${ticketStats.open} open tickets` : "Talk to support"}
                    </h3>
                    {ticketStats ? (
                      <p className="text-sm text-[--theme-muted-color]">
                        {ticketStats.total} total requests tracked in your workspace.
                      </p>
                    ) : (
                      <p className="text-sm text-[--theme-muted-color]">
                        Our team is ready to help when you need it.
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[--theme-color]">
                  <span>Go to support</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[--theme-heading-color]">
                Offers picked for you
              </h2>
              <p className="text-sm text-[--theme-muted-color]">
                Try new services or scale for less with curated incentives.
              </p>
            </div>

            {OFFER_SECTIONS.map(({ key, title, description, ctaLabel }: any) => {
              const items = offers?.[key] ?? [];
              const skeletonCount = key === "discount" ? 2 : 1;

              return (
                <div key={key} className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[--theme-heading-color]">
                        {title}
                      </h3>
                      <p className="text-sm text-[--theme-muted-color]">{description}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {isOffersFetching ? (
                      Array.from({ length: skeletonCount }).map((_, index) => (
                        <OfferSkeleton key={`${key}-skeleton-${index}`} />
                      ))
                    ) : items.length ? (
                      items.map((offer: any) => (
                        <OfferCard
                          key={`${key}-${offer?.id}`}
                          offer={offer}
                          type={key}
                          ctaLabel={ctaLabel}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[--theme-border-color] bg-[--theme-card-bg] p-6 text-sm text-[--theme-muted-color]">
                        No {key} offers available right now. Check back soon as we refresh
                        incentives regularly.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </ClientPageShell>
      <VerifyAccountPromptModal isOpen={showVerifyModal} onClose={handleCloseVerifyModal} />
    </>
  );
};

export default ClientDashboard;

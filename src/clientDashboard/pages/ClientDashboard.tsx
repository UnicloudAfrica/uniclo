// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  ChevronRight,
  Clock,
  Cloud as CloudIcon,
  Gauge,
  HardDrive,
  LifeBuoy,
  Rocket,
  Server,
  UserCheck,
  Users,
  LucideIcon,
} from "lucide-react";
import mobileIllustration from "./assets/mobile.svg";
import cloudIllustration from "./assets/cloud-connection.svg";
import monitorIllustration from "./assets/monitor.svg";
import { Link } from "react-router-dom";
import { useFetchClientProfile } from "../../hooks/clientHooks/resources";
import VerifyAccountPromptModal from "../components/verifyAccountPrompt";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { useFetchClientProductOffers } from "../../hooks/clientHooks/productsHook";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";

interface DashboardMessage {
  partners: number;
  client: number;
  active_instances: number;
  pending_instances: number;
  support: number;
}

interface DashboardData {
  message: DashboardMessage;
}

interface Metric {
  label: string;
  value: number;
}

interface MetricWithIcon extends Metric {
  Icon: LucideIcon;
}

interface Offer {
  id: string | number;
  name: string;
  fixed_price?: number;
  discount_percentage?: number;
  period_days?: number;
  description?: string;
  productable?: {
    vcpus?: number;
    memory_gib?: number;
    price_per_month?: number;
    media_type?: string;
    storage_class?: string;
    description?: string;
    icon?: string;
  };
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

// Placeholder hook for dashboard data
const useFetchTenantDashboard = (): { data: DashboardData; isFetching: boolean } => {
  return {
    data: {
      message: {
        partners: 5,
        client: 120,
        active_instances: 150,
        pending_instances: 5,
        support: 2,
      },
    },
    isFetching: false,
  };
};

const ICON_MAP: Record<string, string> = {
  mobile: mobileIllustration,
  storage: cloudIllustration,
};

const METRIC_ICON_MAP: Record<string, LucideIcon> = {
  Partners: Users,
  Clients: UserCheck,
  "Active Instances": Server,
  "Pending Instances": Clock,
  "Support Tickets": LifeBuoy,
};

const HIGHLIGHT_METRICS = ["Active Instances", "Pending Instances", "Support Tickets"];

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Launch Compute",
    description: "Deploy a new virtual machine or container workload.",
    to: "/client-dashboard/instances/provision",
    Icon: Rocket,
  },
  {
    title: "Manage Instances",
    description: "Track health, scaling, and lifecycle for existing nodes.",
    to: "/client-dashboard/instances",
    Icon: Server,
  },
  {
    title: "Silo Storage",
    description: "Store and retrieve assets securely with high durability.",
    to: "/client-dashboard/object-storage",
    Icon: HardDrive,
  },
  {
    title: "Cost Calculator",
    description: "Model projected spend before you provision resources.",
    to: "/client-dashboard/calculator",
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

const MetricCardSkeleton: React.FC = () => (
  <div className="w-full rounded-2xl border border-[--theme-border-color] bg-white/60 p-4 shadow-sm animate-pulse">
    <div className="h-4 w-24 rounded bg-gray-200/90 mb-3" />
    <div className="h-6 w-20 rounded bg-gray-300/80" />
  </div>
);

const OfferSkeleton: React.FC = () => (
  <div className="relative w-full overflow-hidden rounded-2xl border border-[--theme-border-color] bg-white/80 p-6 shadow-sm animate-pulse">
    <div className="h-5 w-40 rounded bg-gray-200/80" />
    <div className="mt-3 h-4 w-24 rounded bg-gray-200/70" />
    <div className="mt-6 h-7 w-32 rounded bg-gray-300/70" />
    <div className="mt-3 h-4 w-full rounded bg-gray-100/80" />
    <div className="mt-4 h-10 w-32 rounded-full bg-gray-200/70" />
    <div className="absolute right-6 top-10 h-16 w-16 rounded-full bg-gray-100/80" />
  </div>
);

interface OfferCardProps {
  offer: Offer;
  type: string;
  ctaLabel: string;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, type, ctaLabel }: any) => {
  const product = offer?.productable ?? {};
  const isTrial = type === "trial";
  const basePrice = isTrial
    ? Number(offer?.fixed_price ?? 0)
    : Number(product?.price_per_month ?? offer?.fixed_price ?? 0);
  const discountPercentage = Number(offer?.discount_percentage ?? 0);
  const computedPrice = isTrial ? basePrice : basePrice * (1 - discountPercentage / 100);

  const spec = isTrial
    ? `${product?.vcpus ?? "--"} vCPU • ${product?.memory_gib ?? "--"} GiB Memory`
    : `${product?.media_type || product?.storage_class || "Flexible"} Storage`;

  const description = product?.description || offer?.description || "";
  const imageSrc =
    ICON_MAP[product?.icon || ""] || (isTrial ? mobileIllustration : cloudIllustration);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[--theme-border-color] bg-white/90 p-6 shadow-sm transition-all duration-200 hover:border-[--theme-color] hover:shadow-lg">
      <div className="relative z-10 flex flex-col gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[--theme-muted-color]">
            {isTrial ? "Limited Time Trial" : "Exclusive Discount"}
          </p>
          <h3 className="text-lg font-semibold text-[--theme-heading-color]">{offer?.name}</h3>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-[#1E1E1EB2]">
            <img
              src={monitorIllustration}
              alt=""
              className="h-5 w-5 shrink-0 text-[--theme-color]"
            />
            <span>{spec}</span>
          </div>
          <p className="text-2xl font-semibold text-[--theme-color]">
            ₦{formatAmount(Number.isFinite(computedPrice) ? computedPrice : 0)}{" "}
            <span className="text-sm font-medium text-[#6B7280]">
              / {periodLabel(offer?.period_days)}
            </span>
          </p>
          {description ? (
            <p className="text-sm leading-relaxed text-[#676767]">{description}</p>
          ) : null}
          <button
            type="button"
            className="inline-flex w-fit items-center justify-center rounded-full bg-[--theme-color-10] px-6 py-2.5 text-sm font-medium text-[--theme-color] transition-colors duration-200 hover:bg-[--theme-color] hover:text-white"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
      <img
        src={imageSrc}
        alt=""
        className="pointer-events-none absolute -right-6 bottom-0 h-32 w-auto opacity-70 md:-right-4"
      />
      {!isTrial && discountPercentage ? (
        <span className="absolute right-4 top-4 rounded-full bg-[--theme-color-10] px-3 py-1 text-xs font-semibold text-[--theme-color]">
          Save {formatPercentage(discountPercentage)}%
        </span>
      ) : null}
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  const { data: profile, isFetching: isProfileFetching } = useFetchClientProfile() as {
    data: Profile | undefined;
    isFetching: boolean;
  };
  const { data: dashboard, isFetching: isDashboardFetching } = useFetchTenantDashboard();
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
    const { partners, client, active_instances, pending_instances, support } = dashboard.message;
    return [
      { label: "Partners", value: partners },
      { label: "Clients", value: client },
      { label: "Active Instances", value: active_instances },
      { label: "Pending Instances", value: pending_instances },
      { label: "Support Tickets", value: support },
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
    // Default to admin colors if theme is missing or using old defaults
    const start = theme?.themeColor || "#1C1C1C";
    const end = theme?.secondaryColor || "#14547F";
    return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
  }, [theme?.themeColor, theme?.secondaryColor]);

  const welcomeName = profile?.first_name || profile?.business_name || profile?.company_name;

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Dashboard"
        description="Monitor your services, launch new workloads, and explore curated offers."
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }]}
      >
        <div className="space-y-8">
          <section
            className="overflow-hidden rounded-3xl border border-transparent bg-[--theme-color] text-white shadow-lg"
            style={{ background: accentGradient }}
          >
            <div className="relative z-10 flex flex-col gap-8 p-6 md:p-10">
              <div className="max-w-3xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-wide text-white/80">
                  Welcome back
                </p>
                <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
                  {isProfileFetching
                    ? "Loading your workspace..."
                    : `Hi ${welcomeName || "there"} 👋🏽`}
                </h1>
                <p className="text-base text-white/80 md:text-lg">
                  Monitor your cloud footprint, launch new resources, and keep your projects moving
                  without friction.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {isDashboardFetching ? (
                  <>
                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                      <div className="h-4 w-24 rounded bg-white/20 mb-2" />
                      <div className="h-6 w-12 rounded bg-white/30" />
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                      <div className="h-4 w-24 rounded bg-white/20 mb-2" />
                      <div className="h-6 w-12 rounded bg-white/30" />
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                      <div className="h-4 w-24 rounded bg-white/20 mb-2" />
                      <div className="h-6 w-12 rounded bg-white/30" />
                    </div>
                  </>
                ) : highlightMetrics.length ? (
                  highlightMetrics.map(({ label, value, Icon }: any) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:bg-white/15"
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
            <div className="absolute inset-y-0 right-0 z-0 hidden w-1/3 translate-x-12 bg-white/10 blur-3xl md:block" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
            <Link
              to="/dashboard/purchased-modules"
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-[--theme-border-color] bg-white/90 p-5 shadow-sm transition hover:border-[--theme-color] hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[--theme-color-10] text-[--theme-color]">
                  <CloudIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[--theme-muted-color]">
                    Purchased Modules
                  </p>
                  <h2 className="text-lg font-semibold text-[--theme-heading-color]">
                    Explore what's already available to you
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[--theme-color]">
                <span>See modules</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              to="/client-dashboard/support"
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-[--theme-border-color] bg-white/90 p-5 shadow-sm transition hover:border-[--theme-color] hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[--theme-color-10] text-[--theme-color]">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[--theme-muted-color]">Need a hand?</p>
                  <h2 className="text-lg font-semibold text-[--theme-heading-color]">
                    Connect with support or view open tickets
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[--theme-color]">
                <span>Go to support</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {isDashboardFetching ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <MetricCardSkeleton key={`metric-skeleton-${index}`} />
                ))
              ) : metricsWithIcons.length ? (
                metricsWithIcons.map(({ label, value, Icon }: any) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[--theme-border-color] bg-white p-4 shadow-sm transition hover:border-[--theme-color] hover:shadow-md"
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
                <div className="rounded-2xl border border-dashed border-[--theme-border-color] bg-white/60 p-6 text-center text-sm text-[--theme-muted-color]">
                  Metrics will appear once activity data is available.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {QUICK_ACTIONS.map(({ title, description, to, Icon }: any) => (
                <Link
                  key={title}
                  to={to}
                  className="group flex flex-col justify-between gap-4 rounded-2xl border border-[--theme-border-color] bg-white p-5 shadow-sm transition hover:border-[--theme-color] hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[--theme-color-10] text-[--theme-color] transition-colors group-hover:bg-[--theme-color] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold text-[--theme-heading-color]">
                      {title}
                    </h3>
                  </div>
                  <p className="text-sm text-[--theme-muted-color] leading-relaxed">
                    {description}
                  </p>
                  <span className="text-sm font-medium text-[--theme-color] group-hover:underline">
                    Open
                  </span>
                </Link>
              ))}
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
                      <div className="rounded-2xl border border-dashed border-[--theme-border-color] bg-white/80 p-6 text-sm text-[--theme-muted-color]">
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

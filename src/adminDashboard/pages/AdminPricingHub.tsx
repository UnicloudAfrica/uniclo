import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calculator,
  Database,
  DollarSign,
  Gauge,
  Package,
  Server,
  Shield,
} from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";

interface HubCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  textAccent: string;
  badge?: string;
}

const HUB_CARDS: HubCard[] = [
  {
    title: "Catalog (per-region SKUs)",
    description:
      "Compute, OS, EBS, bandwidth, IPs and object storage. Set the published list price for every SKU in every region. Bulk Import / Export Excel here.",
    href: "/admin-dashboard/products",
    icon: Package,
    accent: "bg-blue-50",
    textAccent: "text-blue-600",
  },
  {
    title: "Provider unit costs",
    description:
      "Per-AZ input cost per vCPU, GB-RAM, EBS GB, bandwidth Mbps. Recompute jobs use these to derive auto-priced SKUs (Nobus today).",
    href: "/admin-dashboard/pricing/unit-costs",
    icon: Gauge,
    accent: "bg-violet-50",
    textAccent: "text-violet-600",
  },
  {
    title: "SimpleDeploy plans",
    description:
      "Monthly subscription tiers for SimpleDeploy. Edit fee, included quotas (servers / sites / databases) and feature flags.",
    href: "/admin-dashboard/pricing/flow-plans",
    icon: Server,
    accent: "bg-emerald-50",
    textAccent: "text-emerald-600",
  },
  {
    title: "Shield packages",
    description:
      "DDoS, WAF, SSL and bandwidth overage rates. One published price per service per provider (StormWall, Cloudflare).",
    href: "/admin-dashboard/pricing/shield",
    icon: Shield,
    accent: "bg-rose-50",
    textAccent: "text-rose-600",
  },
  {
    title: "Metered usage",
    description:
      "Per-VM / per-GB / per-attack rate card. Drives every subscription item flagged usage-based — multiply unit price by recorded usage.",
    href: "/admin-dashboard/pricing/metered",
    icon: Database,
    accent: "bg-amber-50",
    textAccent: "text-amber-600",
  },
  {
    title: "FX rates",
    description:
      "Published FX rate sheet. Used to convert stored prices (NGN / USD) into the customer's currency at quote and invoice time.",
    href: "/admin-dashboard/pricing/fx-rates",
    icon: DollarSign,
    accent: "bg-slate-100",
    textAccent: "text-slate-700",
  },
  {
    title: "Pricing calculator",
    description:
      "Build a quote for a customer scenario — multiple workloads, storage, network. Picks live admin prices and shows the rolled-up cost.",
    href: "/admin-dashboard/pricing-calculator",
    icon: Calculator,
    accent: "bg-indigo-50",
    textAccent: "text-indigo-600",
  },
];

const AdminPricingHub = () => {
  const navigate = useNavigate();

  return (
    <AdminPageShell
      title="Pricing"
      description="Every pricing surface in one place. Pick the track you want to edit — catalog list prices, provider unit costs, subscription plans, package rates, or usage-based metrics."
      contentClassName="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {HUB_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <ModernCard
              key={card.href}
              padding="default"
              className="flex h-full flex-col gap-4 transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.accent} ${card.textAccent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {card.badge && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {card.badge}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                <p className="text-sm text-slate-500">{card.description}</p>
              </div>

              <ModernButton
                variant="outline"
                onClick={() => navigate(card.href)}
                className="self-start"
              >
                Open
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </ModernButton>
            </ModernCard>
          );
        })}
      </div>

      <ModernCard padding="default" className="space-y-3 border-dashed">
        <h3 className="text-base font-semibold text-slate-900">How the tracks fit together</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>
            <span className="font-medium text-slate-900">Catalog</span> — what we sell. One list
            price per SKU per region. Multi-currency via FX rates.
          </li>
          <li>
            <span className="font-medium text-slate-900">Unit costs</span> — what it costs us. Drives
            auto-derived sell prices (compute = vCPU × RAM-GB unit costs).
          </li>
          <li>
            <span className="font-medium text-slate-900">Subscription plans / packages</span> —
            monthly tiers (SimpleDeploy plans, Shield packages). Customers subscribe to a tier; the
            tier's flat fee + included quota lives here.
          </li>
          <li>
            <span className="font-medium text-slate-900">Metered usage</span> — variable charges
            on top of subscriptions. Per-VM / per-GB / per-attack. Billing engine multiplies unit
            price × recorded usage at invoice time.
          </li>
        </ul>
      </ModernCard>
    </AdminPageShell>
  );
};

export default AdminPricingHub;

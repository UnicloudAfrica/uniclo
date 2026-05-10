import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  Boxes,
  Calculator,
  Cpu,
  Database,
  DollarSign,
  HardDrive,
  Image as ImageIcon,
  Inbox,
  Network,
  Server,
  Shield as ShieldIcon,
  Wifi,
  Zap,
} from "lucide-react";

import AdminPageShell from "../../components/AdminPageShell";
import { ModernCard } from "@/shared/components/ui";

import CatalogPane from "./panes/CatalogPane";
import SlimDeployPane from "./panes/SlimDeployPane";
import AnyCloudFlowPane from "./panes/AnyCloudFlowPane";
import ShieldPane from "./panes/ShieldPane";
import PayAsYouGoPane from "./panes/PayAsYouGoPane";
import LinkOutPane from "./panes/LinkOutPane";

/**
 * Single-page pricing shell.
 *
 * One URL — `/admin-dashboard/pricing` (admin) or `/dashboard/pricing`
 * (tenant). Left rail lists every priceable product the platform sells
 * (catalog SKUs + third-party services + platform infra). Right pane
 * renders the editor for whichever product is selected via the
 * `?product=…` query parameter, so each entry is deep-linkable and the
 * browser back button works between products.
 *
 * Tenant view is the same component with `role="tenant"` — each pane
 * decides whether to show the override column (admin pages don't, the
 * tenant ones do).
 */

export type PricingRole = "admin" | "tenant";

interface MenuItem {
  id: string;
  label: string;
  caption?: string;
  icon: React.ComponentType<{ className?: string }>;
  // Some panes (FX rates, calculator) are full-bore separate screens —
  // we link out to them rather than embedding a stub here.
  linkOut?: { to: string; cta: string };
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const MENU: MenuGroup[] = [
  {
    label: "Products",
    items: [
      { id: "compute", label: "Compute", caption: "Instance types", icon: Cpu },
      { id: "os_image", label: "OS Images", caption: "Golden templates", icon: ImageIcon },
      { id: "volume", label: "Volumes", caption: "Block storage tiers", icon: HardDrive },
      { id: "silo_storage", label: "Silo Storage", caption: "Object storage", icon: Database },
      { id: "bandwidth", label: "Bandwidth", caption: "Throughput tiers", icon: Wifi },
      { id: "floating_ip", label: "Floating IPs", caption: "Public connectivity", icon: Network },
      { id: "cross_connect", label: "Cross Connect", caption: "Partner links", icon: Boxes },
    ],
  },
  {
    label: "Third-party",
    items: [
      // Lattice / StaqDB is a managed-database product the platform
      // resells from a partner, not infrastructure we operate, so it
      // sits with SlimDeploy / AnyCloudFlow / Shield rather than
      // with the Products group.
      { id: "lattice", label: "Lattice / StaqDB", caption: "Managed databases", icon: Database },
      { id: "simpledeploy", label: "SlimDeploy", caption: "Deploy plans", icon: Server },
      { id: "anycloudflow", label: "AnyCloudFlow", caption: "Migration & DR", icon: Inbox },
      { id: "shield", label: "Shield", caption: "DDoS / WAF / SSL", icon: ShieldIcon },
      { id: "pay_as_you_go", label: "Pay-as-you-go", caption: "Per-VM, per-GB rates", icon: Activity },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        id: "fx_rates",
        label: "FX rates",
        caption: "Currency conversion",
        icon: DollarSign,
        linkOut: { to: "/admin-dashboard/pricing/fx-rates", cta: "Open FX rates" },
      },
      {
        id: "calculator",
        label: "Pricing calculator",
        caption: "Build a quote",
        icon: Calculator,
        linkOut: { to: "/admin-dashboard/pricing-calculator", cta: "Open calculator" },
      },
      {
        id: "unit_costs",
        label: "Provider unit costs",
        caption: "Input costs / vCPU / GB",
        icon: Zap,
        linkOut: {
          to: "/admin-dashboard/pricing/unit-costs",
          cta: "Open provider unit costs",
        },
      },
    ],
  },
];

const DEFAULT_PRODUCT = "compute";

interface PricingShellProps {
  role?: PricingRole;
}

const PricingShell: React.FC<PricingShellProps> = ({ role = "admin" }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeId = searchParams.get("product") || DEFAULT_PRODUCT;
  const activeItem = useMemo(
    () =>
      MENU.flatMap((g) => g.items).find((i) => i.id === activeId) ??
      MENU[0].items[0],
    [activeId],
  );

  const setActive = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("product", id);
    setSearchParams(next, { replace: false });
  };

  const titleByRole =
    role === "tenant" ? "Pricing (your overrides)" : "Pricing";
  const descriptionByRole =
    role === "tenant"
      ? "Set the price you bill your customers. The platform default is shown alongside; clear an override to fall back to it."
      : "Every priceable product on the platform — pick one from the left to edit its rates. Catalog SKUs, third-party services and pay-as-you-go meters all live here.";

  return (
    <AdminPageShell
      title={titleByRole}
      description={descriptionByRole}
      contentClassName="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Left menu */}
        <ModernCard padding="default" className="lg:sticky lg:top-4 lg:self-start">
          <nav className="space-y-5">
            {MENU.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeId;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.linkOut) {
                              navigate(item.linkOut.to);
                              return;
                            }
                            setActive(item.id);
                          }}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                            isActive
                              ? "bg-primary-50 text-primary-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <Icon
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              isActive ? "text-primary-600" : "text-slate-400"
                            }`}
                          />
                          <span className="flex flex-col gap-0.5">
                            <span className={`font-medium ${isActive ? "" : "text-slate-700"}`}>
                              {item.label}
                            </span>
                            {item.caption && (
                              <span className="text-[11px] text-slate-400">{item.caption}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ModernCard>

        {/* Right pane */}
        <div className="space-y-4">
          {activeItem.linkOut ? (
            <LinkOutPane
              title={activeItem.label}
              caption={activeItem.caption}
              icon={activeItem.icon}
              cta={activeItem.linkOut.cta}
              to={activeItem.linkOut.to}
            />
          ) : (
            <PaneFor productId={activeId} role={role} />
          )}
        </div>
      </div>
    </AdminPageShell>
  );
};

const PaneFor: React.FC<{ productId: string; role: PricingRole }> = ({ productId, role }) => {
  switch (productId) {
    // Catalog products — same data shape (Product + ProductPricing) joined
    // by productable_type. The CatalogPane filters and renders.
    case "compute":
      return (
        <CatalogPane
          productableType="compute_instance"
          title="Compute pricing"
          description="Per-region, per-AZ instance-type list price. Edit from the inline action."
          role={role}
        />
      );
    case "os_image":
      return (
        <CatalogPane
          productableType="os_image"
          title="OS image pricing"
          description="Licensed and free golden templates."
          role={role}
        />
      );
    case "volume":
      return (
        <CatalogPane
          productableType="volume_type"
          title="Volume pricing"
          description="Block storage tier rates per GB."
          role={role}
        />
      );
    case "silo_storage":
      return (
        <CatalogPane
          productableType="object_storage_configuration"
          title="Silo Storage pricing"
          description="Per-GiB object storage. Per-AZ rates."
          role={role}
        />
      );
    case "bandwidth":
      return (
        <CatalogPane
          productableType="bandwidth"
          title="Bandwidth pricing"
          description="Throughput tier rates."
          role={role}
        />
      );
    case "floating_ip":
      return (
        <CatalogPane
          productableType="ip"
          title="Floating IP pricing"
          description="Public IP allocation rates."
          role={role}
        />
      );
    case "cross_connect":
      return (
        <CatalogPane
          productableType="cross_connect"
          title="Cross Connect pricing"
          description="Partner cross-connect links."
          role={role}
        />
      );
    case "lattice":
      return (
        <CatalogPane
          productableType="managed_database_plan"
          title="Lattice / StaqDB pricing"
          description="Managed database plan rates."
          role={role}
        />
      );

    case "simpledeploy":
      return <SlimDeployPane role={role} />;
    case "anycloudflow":
      return <AnyCloudFlowPane role={role} />;
    case "shield":
      return <ShieldPane role={role} />;
    case "pay_as_you_go":
      return <PayAsYouGoPane role={role} />;

    default:
      return (
        <CatalogPane
          productableType="compute_instance"
          title="Compute pricing"
          description="Pick a product on the left."
          role={role}
        />
      );
  }
};

export default PricingShell;

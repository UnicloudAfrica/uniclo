import type { MenuEntry } from "../components/sidebar";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Users,
  UserPlus,
  CreditCard,
  Package,
  Layers,
  Database,
  DollarSign,
  FolderOpen,
  MapPin,
  Calculator,
  FileText,
  Settings,
  HelpCircle,
  User,
  CheckSquare,
  Server,
  ClipboardList,
  HardDrive,
  SlidersHorizontal,
  Building2,
  Globe,
  Wallet,
  Repeat,
  Receipt,
  BarChart3,
  LayoutDashboard,
  Briefcase,
  LifeBuoy,
  Percent,
  FolderKanban,
  TrendingUp,
  LayoutTemplate,
  KeyRound,
  CloudDownload,
  ShieldCheck,
  ArrowLeftRight,
  FolderOutput,
  FlaskConical,
  GitMerge,
} from "lucide-react";

type InfraRole = "admin" | "tenant" | "client";

const INFRA_MENU_ITEMS: Array<{
  label: string;
  icon: LucideIcon;
  iconByRole?: Partial<Record<InfraRole, LucideIcon>>;
  path: string;
  roles: InfraRole[];
  requiredPermission?: string;
}> = [
  {
    label: "Projects",
    icon: FolderOpen,
    iconByRole: {
      tenant: FolderKanban,
      client: Briefcase,
    },
    path: "/projects",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "projects.view",
  },
  {
    label: "Cube Instances",
    icon: Server,
    path: "/cube-instances",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Templates",
    icon: LayoutTemplate,
    path: "/templates",
    roles: ["admin", "tenant"],
    requiredPermission: "templates.view",
  },
  {
    label: "Key Pairs",
    icon: KeyRound,
    path: "/infrastructure/key-pairs",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Silo Storage",
    icon: HardDrive,
    path: "/object-storage",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "storage.view",
  },
  {
    label: "Managed Databases",
    icon: Database,
    path: "/databases",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "storage.view",
  },
  {
    label: "Protection Services",
    icon: ShieldCheck,
    path: "/protection",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Migrations",
    icon: ArrowLeftRight,
    path: "/migrations",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "migrations.view",
  },
  {
    label: "Destinations",
    icon: FolderOutput,
    path: "/destinations",
    roles: ["admin", "tenant"],
    requiredPermission: "backups.manage",
  },
];

const buildInfrastructureMenuGroup = (basePath: string, role: InfraRole): MenuEntry => {
  const normalizedBase = basePath.replace(/\/+$/, "");
  const toPath = (suffix: string) =>
    `${normalizedBase}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  const children = INFRA_MENU_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    name: item.label,
    icon: item.iconByRole?.[role] ?? item.icon,
    isLucide: true,
    requiredPermission: item.requiredPermission,
    path: toPath(item.path),
  }));

  return {
    name: "Infrastructure",
    icon: Server,
    isLucide: true,
    children,
  };
};

export const adminMenuItems: MenuEntry[] = [
  {
    name: "Home",
    icon: Home,
    isLucide: true,
    requiredPermission: "dashboard.view",
    path: "/admin-dashboard",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    isLucide: true,
    requiredPermission: "analytics.view",
    path: "/admin-dashboard/analytics",
  },
  {
    name: "Customer Management",
    icon: Users,
    isLucide: true,
    children: [
      {
        name: "Tenants & Users",
        icon: Users,
        isLucide: true,
        requiredPermission: "tenants.view",
        path: "/admin-dashboard/partners",
      },
      {
        name: "Clients",
        icon: Building2,
        isLucide: true,
        requiredPermission: "clients.view",
        path: "/admin-dashboard/clients",
      },
      {
        name: "Leads",
        icon: UserPlus,
        isLucide: true,
        requiredPermission: "leads.view",
        path: "/admin-dashboard/leads",
      },
    ],
  },
  {
    ...buildInfrastructureMenuGroup("/admin-dashboard", "admin"),
  },
  {
    name: "Provider Discovery",
    icon: CloudDownload,
    isLucide: true,
    requiredPermission: "provider_discovery.view",
    path: "/admin-dashboard/provider-discovery",
  },
  {
    name: "Billing & Pricing",
    icon: DollarSign,
    isLucide: true,
    children: [
      {
        name: "Products",
        icon: Package,
        isLucide: true,
        requiredPermission: "products.view",
        path: "/admin-dashboard/products",
      },
      {
        name: "Product Families",
        icon: GitMerge,
        isLucide: true,
        requiredPermission: "products.view",
        path: "/admin-dashboard/product-families",
      },
      {
        name: "Inventory",
        icon: Layers,
        isLucide: true,
        requiredPermission: "products.view",
        path: "/admin-dashboard/inventory",
      },
      {
        name: "Payment",
        icon: CreditCard,
        isLucide: true,
        requiredPermission: "billing.view",
        path: "/admin-dashboard/payment",
      },
      {
        name: "Pricing",
        icon: DollarSign,
        isLucide: true,
        requiredPermission: "pricing.view",
        path: "/admin-dashboard/pricing",
      },
      {
        name: "Pricing Calculator",
        icon: Calculator,
        isLucide: true,
        requiredPermission: "pricing.view",
        path: "/admin-dashboard/pricing-calculator",
      },
      {
        name: "Generate Invoice",
        icon: FileText,
        isLucide: true,
        requiredPermission: "invoices.create",
        path: "/admin-dashboard/create-invoice",
      },
      {
        name: "Tax Configuration",
        icon: Settings,
        isLucide: true,
        requiredPermission: "tax.view",
        path: "/admin-dashboard/tax-configuration",
      },
      {
        name: "Subscription Plans",
        icon: Repeat,
        isLucide: true,
        requiredPermission: "subscriptions.view",
        path: "/admin-dashboard/subscription-plans",
      },
      {
        name: "Wallet",
        icon: Wallet,
        isLucide: true,
        requiredPermission: "wallet.view",
        path: "/admin-dashboard/wallet",
      },
      {
        name: "Settlements",
        icon: Receipt,
        isLucide: true,
        requiredPermission: "settlements.view",
        path: "/admin-dashboard/settlements",
      },
      {
        name: "Payouts",
        icon: CreditCard,
        isLucide: true,
        requiredPermission: "payouts.view",
        path: "/admin-dashboard/payouts",
      },
      {
        name: "POC Trials",
        icon: FlaskConical,
        isLucide: true,
        requiredPermission: "billing.manage",
        path: "/admin-dashboard/poc-trials",
      },
    ],
  },
  {
    name: "Regional",
    icon: Globe,
    isLucide: true,
    children: [
      {
        name: "Regions",
        icon: MapPin,
        isLucide: true,
        requiredPermission: "regions.view",
        path: "/admin-dashboard/regions",
      },
      {
        name: "Region Approvals",
        icon: CheckSquare,
        isLucide: true,
        requiredPermission: "region_approvals.view",
        path: "/admin-dashboard/region-approvals",
      },
    ],
  },
  {
    name: "Onboarding",
    icon: ClipboardList,
    isLucide: true,
    children: [
      {
        name: "Onboarding Review",
        icon: ClipboardList,
        isLucide: true,
        requiredPermission: "onboarding.view",
        path: "/admin-dashboard/onboarding-review",
      },
      {
        name: "Onboarding Settings",
        icon: SlidersHorizontal,
        isLucide: true,
        requiredPermission: "onboarding.manage",
        path: "/admin-dashboard/onboarding-settings",
      },
    ],
  },
  {
    name: "Support Tickets",
    icon: HelpCircle,
    isLucide: true,
    requiredPermission: "support.view",
    path: "/admin-dashboard/tickets",
  },
  {
    name: "Account Settings",
    icon: User,
    isLucide: true,
    requiredPermission: "settings.view",
    path: "/admin-dashboard/account",
  },
];

export const tenantMenuItems: MenuEntry[] = [
  {
    name: "Home",
    icon: Home,
    isLucide: true,
    requiredPermission: "dashboard.view",
    path: "/dashboard",
  },
  {
    name: "Customer Management",
    icon: Users,
    isLucide: true,
    children: [
      {
        name: "Clients",
        icon: Users,
        isLucide: true,
        requiredPermission: "clients.view",
        path: "/dashboard/clients",
      },
      {
        name: "Leads",
        icon: UserPlus,
        isLucide: true,
        requiredPermission: "leads.view",
        path: "/dashboard/leads",
      },
    ],
  },
  {
    ...buildInfrastructureMenuGroup("/dashboard", "tenant"),
  },
  {
    name: "Regional",
    icon: MapPin,
    isLucide: true,
    children: [
      {
        name: "Region Requests",
        icon: MapPin,
        isLucide: true,
        requiredPermission: "regions.view",
        path: "/dashboard/region-requests",
      },
      {
        name: "Onboarding Review",
        icon: ClipboardList,
        isLucide: true,
        requiredPermission: "onboarding.view",
        path: "/dashboard/onboarding",
      },
    ],
  },
  {
    name: "Billing & Revenue",
    icon: DollarSign,
    isLucide: true,
    children: [
      {
        name: "Revenue",
        icon: TrendingUp,
        isLucide: true,
        requiredPermission: "revenue.view",
        path: "/dashboard/revenue",
      },
      {
        name: "Price Settings",
        icon: DollarSign,
        isLucide: true,
        requiredPermission: "pricing.view",
        path: "/dashboard/pricing-overrides",
      },
      {
        name: "Pricing Calculator",
        icon: Calculator,
        isLucide: true,
        requiredPermission: "pricing.view",
        path: "/dashboard/pricing-calculator",
      },
      {
        name: "Generate Invoice",
        icon: FileText,
        isLucide: true,
        requiredPermission: "invoices.create",
        path: "/dashboard/create-invoice",
      },
      {
        name: "Payment History",
        icon: CreditCard,
        isLucide: true,
        requiredPermission: "billing.view",
        path: "/dashboard/payment-history",
      },
      {
        name: "Discounts & Margins",
        icon: Percent,
        isLucide: true,
        requiredPermission: "billing.manage",
        path: "/dashboard/discounts",
      },
      {
        name: "Billing Settings",
        icon: Settings,
        isLucide: true,
        requiredPermission: "billing.manage",
        path: "/dashboard/billing",
      },
      {
        name: "Invoices",
        icon: FileText,
        isLucide: true,
        requiredPermission: "invoices.view",
        path: "/dashboard/invoices",
      },
      {
        name: "POC Trials",
        icon: FlaskConical,
        isLucide: true,
        requiredPermission: "billing.view",
        path: "/dashboard/poc-trials",
      },
    ],
  },
  {
    name: "Products",
    icon: Package,
    isLucide: true,
    requiredPermission: "products.view",
    path: "/dashboard/products",
  },
  {
    name: "Support",
    icon: HelpCircle,
    isLucide: true,
    requiredPermission: "support.view",
    path: "/dashboard/support",
  },
  {
    name: "Account Settings",
    icon: Settings,
    isLucide: true,
    requiredPermission: "settings.view",
    path: "/dashboard/account",
  },
];

export const buildClientMenuItems = (_hasProjects: boolean): MenuEntry[] => {
  const infrastructureGroup = buildInfrastructureMenuGroup("/client-dashboard", "client");

  return [
    {
      name: "Home",
      icon: LayoutDashboard,
      isLucide: true,
      requiredPermission: "dashboard.view",
      path: "/client-dashboard",
    },
    infrastructureGroup,
    {
      name: "Pricing Calculator",
      icon: Calculator,
      isLucide: true,
      requiredPermission: "billing.view",
      path: "/client-dashboard/pricing-calculator",
    },
    {
      name: "Orders & Payments",
      icon: CreditCard,
      isLucide: true,
      requiredPermission: "billing.view",
      path: "/client-dashboard/orders-payments",
    },
    {
      name: "Support",
      icon: LifeBuoy,
      isLucide: true,
      requiredPermission: "support.view",
      path: "/client-dashboard/support",
    },
    {
      name: "Account Settings",
      icon: Settings,
      isLucide: true,
      requiredPermission: "settings.view",
      path: "/client-dashboard/account-settings",
    },
  ];
};

/**
 * Filter menu items based on user permissions.
 * Items without requiredPermission are always shown.
 * Groups with no visible children after filtering are hidden.
 *
 * Safety: if permissions is empty (e.g. not yet loaded), all items are shown
 * to prevent an empty sidebar that locks the user out.
 */
export function filterMenuByPermissions(
  items: MenuEntry[],
  permissions: string[]
): MenuEntry[] {
  // If permissions haven't been loaded yet, show everything to avoid lockout
  if (!permissions || permissions.length === 0) {
    return items;
  }

  const filtered = items
    .map((item) => {
      // Check if this is a group (has children)
      if ("children" in item && item.children) {
        // Filter children first
        const filteredChildren = item.children.filter(
          (child) =>
            !child.requiredPermission || permissions.includes(child.requiredPermission)
        );

        // If group itself requires a permission, check it
        if (item.requiredPermission && !permissions.includes(item.requiredPermission)) {
          return null;
        }

        // Hide group if no visible children remain
        if (filteredChildren.length === 0) {
          return null;
        }

        return { ...item, children: filteredChildren };
      }

      // Single menu item
      if (item.requiredPermission && !permissions.includes(item.requiredPermission)) {
        return null;
      }

      return item;
    })
    .filter((item): item is MenuEntry => item !== null);

  // Safety: always keep at least the first item (Home/Dashboard) visible
  // so the user can never be completely locked out of navigation
  if (filtered.length === 0 && items.length > 0) {
    return [items[0]];
  }

  return filtered;
}

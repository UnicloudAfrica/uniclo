import type { MenuEntry } from "../components/sidebar";
import {
  Home,
  Users,
  UserPlus,
  CreditCard,
  Package,
  Layers,
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
} from "lucide-react";

type InfraRole = "admin" | "tenant" | "client";

const INFRA_MENU_ITEMS: Array<{
  label: string;
  icon: any;
  iconByRole?: Partial<Record<InfraRole, any>>;
  path: string;
  roles: InfraRole[];
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
  },
  {
    label: "Instances",
    icon: Server,
    path: "/instances",
    roles: ["admin", "tenant", "client"],
  },
  {
    label: "Templates",
    icon: LayoutTemplate,
    path: "/templates",
    roles: ["admin", "tenant", "client"],
  },
  {
    label: "Silo Storage",
    icon: HardDrive,
    path: "/object-storage",
    roles: ["admin", "tenant", "client"],
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
    path: "/admin-dashboard",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    isLucide: true,
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
        path: "/admin-dashboard/partners",
      },
      {
        name: "Clients",
        icon: Building2,
        isLucide: true,
        path: "/admin-dashboard/clients",
      },
      {
        name: "Leads",
        icon: UserPlus,
        isLucide: true,
        path: "/admin-dashboard/leads",
      },
    ],
  },
  {
    ...buildInfrastructureMenuGroup("/admin-dashboard", "admin"),
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
        path: "/admin-dashboard/products",
      },
      {
        name: "Inventory",
        icon: Layers,
        isLucide: true,
        path: "/admin-dashboard/inventory",
      },
      {
        name: "Payment",
        icon: CreditCard,
        isLucide: true,
        path: "/admin-dashboard/payment",
      },
      {
        name: "Pricing",
        icon: DollarSign,
        isLucide: true,
        path: "/admin-dashboard/pricing",
      },
      {
        name: "Pricing Calculator",
        icon: Calculator,
        isLucide: true,
        path: "/admin-dashboard/pricing-calculator",
      },
      {
        name: "Generate Invoice",
        icon: FileText,
        isLucide: true,
        path: "/admin-dashboard/create-invoice",
      },
      {
        name: "Tax Configuration",
        icon: Settings,
        isLucide: true,
        path: "/admin-dashboard/tax-configuration",
      },
      {
        name: "Subscription Plans",
        icon: Repeat,
        isLucide: true,
        path: "/admin-dashboard/subscription-plans",
      },
      {
        name: "Wallet",
        icon: Wallet,
        isLucide: true,
        path: "/admin-dashboard/wallet",
      },
      {
        name: "Settlements",
        icon: Receipt,
        isLucide: true,
        path: "/admin-dashboard/settlements",
      },
      {
        name: "Payouts",
        icon: CreditCard,
        isLucide: true,
        path: "/admin-dashboard/payouts",
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
        path: "/admin-dashboard/regions",
      },
      {
        name: "Region Approvals",
        icon: CheckSquare,
        isLucide: true,
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
        path: "/admin-dashboard/onboarding-review",
      },
      {
        name: "Onboarding Settings",
        icon: SlidersHorizontal,
        isLucide: true,
        path: "/admin-dashboard/onboarding-settings",
      },
    ],
  },
  {
    name: "Support Tickets",
    icon: HelpCircle,
    isLucide: true,
    path: "/admin-dashboard/tickets",
  },
  {
    name: "Account Settings",
    icon: User,
    isLucide: true,
    path: "/admin-dashboard/account",
  },
];

export const tenantMenuItems: MenuEntry[] = [
  {
    name: "Home",
    icon: Home,
    isLucide: true,
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
        path: "/dashboard/clients",
      },
      {
        name: "Leads",
        icon: UserPlus,
        isLucide: true,
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
        path: "/dashboard/region-requests",
      },
      {
        name: "Onboarding Review",
        icon: ClipboardList,
        isLucide: true,
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
        path: "/dashboard/revenue",
      },
      {
        name: "Pricing Calculator",
        icon: Calculator,
        isLucide: true,
        path: "/dashboard/pricing-calculator",
      },
      {
        name: "Generate Invoice",
        icon: FileText,
        isLucide: true,
        path: "/dashboard/create-invoice",
      },
      {
        name: "Payment History",
        icon: CreditCard,
        isLucide: true,
        path: "/dashboard/payment-history",
      },
      {
        name: "Discounts & Margins",
        icon: Percent,
        isLucide: true,
        path: "/dashboard/discounts",
      },
      {
        name: "Payouts & Banking",
        icon: Wallet,
        isLucide: true,
        path: "/dashboard/payouts",
      },
      {
        name: "Billing Settings",
        icon: Settings,
        isLucide: true,
        path: "/dashboard/billing",
      },
      {
        name: "Invoices",
        icon: FileText,
        isLucide: true,
        path: "/dashboard/invoices",
      },
    ],
  },
  {
    name: "Products",
    icon: Package,
    isLucide: true,
    path: "/dashboard/products",
  },
  {
    name: "Support",
    icon: HelpCircle,
    isLucide: true,
    path: "/dashboard/support",
  },
  {
    name: "Account Settings",
    icon: Settings,
    isLucide: true,
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
      path: "/client-dashboard",
    },
    infrastructureGroup,
    {
      name: "Pricing Calculator",
      icon: Calculator,
      isLucide: true,
      path: "/client-dashboard/pricing-calculator",
    },
    {
      name: "Orders & Payments",
      icon: CreditCard,
      isLucide: true,
      path: "/client-dashboard/orders-payments",
    },
    {
      name: "Support",
      icon: LifeBuoy,
      isLucide: true,
      path: "/client-dashboard/support",
    },
    {
      name: "Account Settings",
      icon: Settings,
      isLucide: true,
      path: "/client-dashboard/account-settings",
    },
  ];
};

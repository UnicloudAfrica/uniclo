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
    name: "Support Tickets",
    icon: HelpCircle,
    isLucide: true,
    path: "/admin-dashboard/tickets",
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
    name: "Infrastructure",
    icon: Server,
    isLucide: true,
    children: [
      {
        name: "Projects",
        icon: FolderOpen,
        isLucide: true,
        path: "/admin-dashboard/projects",
      },
      {
        name: "Instances",
        icon: Server,
        isLucide: true,
        path: "/admin-dashboard/instances",
      },
      {
        name: "Templates",
        icon: LayoutTemplate,
        isLucide: true,
        path: "/admin-dashboard/templates",
      },
      {
        name: "Silo Storage",
        icon: HardDrive,
        isLucide: true,
        path: "/admin-dashboard/object-storage",
      },
    ],
  },
  {
    name: "Billing & Pricing",
    icon: DollarSign,
    isLucide: true,
    children: [
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
    name: "Infrastructure",
    icon: Server,
    isLucide: true,
    children: [
      {
        name: "Projects",
        icon: FolderKanban,
        isLucide: true,
        path: "/dashboard/projects",
      },
      {
        name: "Instances",
        icon: Server,
        isLucide: true,
        path: "/dashboard/instances",
      },
      {
        name: "Templates",
        icon: LayoutTemplate,
        isLucide: true,
        path: "/dashboard/templates",
      },
      {
        name: "Silo Storage",
        icon: HardDrive,
        isLucide: true,
        path: "/dashboard/object-storage",
      },
    ],
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

export const buildClientMenuItems = (hasProjects: boolean): MenuEntry[] => {
  const infrastructureGroup: MenuEntry = {
    name: "Infrastructure",
    icon: Server,
    isLucide: true,
    children: [
      {
        name: "Projects",
        icon: Briefcase,
        isLucide: true,
        path: "/client-dashboard/projects",
      },
      {
        name: "Instances",
        icon: Server,
        isLucide: true,
        path: "/client-dashboard/instances",
      },
      {
        name: "Templates",
        icon: LayoutTemplate,
        isLucide: true,
        path: "/client-dashboard/templates",
      },
      {
        name: "Silo Storage",
        icon: HardDrive,
        isLucide: true,
        path: "/client-dashboard/object-storage",
      },
    ],
  };

  return [
    {
      name: "Home",
      icon: LayoutDashboard,
      isLucide: true,
      path: "/client-dashboard",
    },
    ...(hasProjects
      ? [infrastructureGroup]
      : [
          {
            name: "Silo Storage",
            icon: HardDrive,
            isLucide: true,
            path: "/client-dashboard/object-storage",
          },
          {
            name: "Templates",
            icon: LayoutTemplate,
            isLucide: true,
            path: "/client-dashboard/templates",
          },
        ]),
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

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
  Map,
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
  ShieldAlert,
  Shield,
  Cloud,
  CloudOff,
  Network,
  Route,
  Lock,
  Scale,
  Bot,
  BookOpen,
  Code2,
  Monitor,
  Activity,
  Radio,
  Flame,
  Rocket,
  GitBranch,
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
    label: "Lattice Databases",
    icon: Database,
    path: "/databases",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "storage.view",
  },
  {
    label: "Cloud Accounts",
    icon: Cloud,
    path: "/cloud-accounts",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "storage.view",
  },
  {
    label: "Monitoring",
    icon: Activity,
    path: "/monitoring",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "NOC",
    icon: Radio,
    path: "/noc",
    roles: ["admin"],
  },
];

const DR_MENU_ITEMS: Array<{
  label: string;
  icon: LucideIcon;
  path: string;
  roles: InfraRole[];
  requiredPermission?: string;
}> = [
  {
    label: "Replication Policies",
    icon: ShieldCheck,
    path: "/protection",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Serverless DR",
    icon: CloudOff,
    path: "/serverless-dr",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "DR Drills",
    icon: FlaskConical,
    path: "/dr-drills",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Hypervisor",
    icon: Monitor,
    path: "/hypervisor",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Database Replication",
    icon: Database,
    path: "/database-replication",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Ransomware",
    icon: ShieldAlert,
    path: "/ransomware",
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
    label: "Batch Migrations",
    icon: GitMerge,
    path: "/batch-migrations",
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
  {
    label: "Migration Calculator",
    icon: Calculator,
    path: "/anycloudflow/calculator",
    roles: ["admin", "tenant", "client"],
  },
];

const NETWORKING_MENU_ITEMS: Array<{
  label: string;
  icon: LucideIcon;
  path: string;
  roles: InfraRole[];
  requiredPermission?: string;
}> = [
  {
    label: "VPCs",
    icon: Network,
    path: "/infrastructure/vpcs",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Subnets",
    icon: Route,
    path: "/infrastructure/subnets",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Security Groups",
    icon: Lock,
    path: "/infrastructure/security-groups",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Load Balancers",
    icon: Scale,
    path: "/infrastructure/load-balancers",
    roles: ["admin", "tenant"],
    requiredPermission: "instances.view",
  },
  {
    label: "DNS Zones",
    icon: Globe,
    path: "/infrastructure/dns",
    roles: ["admin", "tenant"],
    requiredPermission: "instances.view",
  },
];

const SHIELD_MENU_ITEMS: Array<{
  label: string;
  icon: LucideIcon;
  path: string;
  roles: InfraRole[];
  requiredPermission?: string;
}> = [
  {
    label: "Domains",
    icon: Globe,
    path: "/shield/domains",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "shield.view",
  },
  {
    label: "Firewall",
    icon: ShieldCheck,
    path: "/shield/firewall",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "shield.view",
  },
  {
    label: "Attacks",
    icon: Flame,
    path: "/shield/attacks",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "shield.view",
  },
  {
    label: "Attack Map",
    icon: Map,
    path: "/shield/attack-map",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "shield.view",
  },
  {
    label: "Analytics",
    icon: Activity,
    path: "/shield/analytics",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "shield.view",
  },
  {
    label: "SSL",
    icon: Lock,
    path: "/shield/ssl",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "shield.view",
  },
];

const buildShieldMenuGroup = (basePath: string, role: InfraRole): MenuEntry => {
  const normalizedBase = basePath.replace(/\/+$/, "");
  const toPath = (suffix: string) =>
    `${normalizedBase}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  const children = SHIELD_MENU_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    name: item.label,
    icon: item.icon,
    isLucide: true,
    requiredPermission: item.requiredPermission,
    path: toPath(item.path),
  }));

  return {
    name: "Shield",
    icon: Shield,
    isLucide: true,
    children,
  };
};

const buildDrMenuGroup = (basePath: string, role: InfraRole): MenuEntry => {
  const normalizedBase = basePath.replace(/\/+$/, "");
  const toPath = (suffix: string) =>
    `${normalizedBase}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  const children = DR_MENU_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    name: item.label,
    icon: item.icon,
    isLucide: true,
    requiredPermission: item.requiredPermission,
    path: toPath(item.path),
  }));

  return {
    name: "Disaster Recovery",
    icon: ShieldAlert,
    isLucide: true,
    children,
  };
};

const buildNetworkingMenuGroup = (basePath: string, role: InfraRole): MenuEntry => {
  const normalizedBase = basePath.replace(/\/+$/, "");
  const toPath = (suffix: string) =>
    `${normalizedBase}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  const children = NETWORKING_MENU_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    name: item.label,
    icon: item.icon,
    isLucide: true,
    requiredPermission: item.requiredPermission,
    path: toPath(item.path),
  }));

  return {
    name: "Networking",
    icon: Network,
    isLucide: true,
    children,
  };
};

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
    ...buildNetworkingMenuGroup("/admin-dashboard", "admin"),
  },
  {
    ...buildDrMenuGroup("/admin-dashboard", "admin"),
  },
  {
    ...buildShieldMenuGroup("/admin-dashboard", "admin"),
  },
  {
    name: "Infrastructure Agent",
    icon: Bot,
    isLucide: true,
    requiredPermission: "instances.view",
    path: "/admin-dashboard/agent",
  },
  {
    // SimpleDeploy = customer-facing brand for the LeanPloy-powered
    // managed-deployment surface. Internally the subsystem is still
    // UniCloudFlow; only the sidebar label is rebranded. Each child
    // deep-links into the dashboard's tab via ?tab=… (read by
    // FlowDashboard on mount + on URL change).
    name: "SimpleDeploy",
    icon: Rocket,
    isLucide: true,
    requiredPermission: "instances.view",
    children: [
      {
        name: "Overview",
        icon: Layers,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/admin-dashboard/flow-dashboard",
      },
      {
        name: "Servers",
        icon: Server,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/admin-dashboard/flow-dashboard?tab=servers",
      },
      {
        name: "Sites & Deployments",
        icon: Globe,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/admin-dashboard/flow-dashboard?tab=sites",
      },
      {
        name: "Git Providers",
        icon: GitBranch,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/admin-dashboard/flow-dashboard?tab=git-providers",
      },
      {
        name: "Databases",
        icon: Database,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/admin-dashboard/flow-dashboard?tab=databases",
      },
      {
        name: "SSL Certificates",
        icon: Shield,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/admin-dashboard/flow-dashboard?tab=ssl",
      },
    ],
  },
  {
    name: "Object Storage",
    icon: HardDrive,
    isLucide: true,
    children: [
      {
        name: "Bucket Endpoints",
        icon: Database,
        isLucide: true,
        requiredPermission: "migrations.view",
        path: "/admin-dashboard/integrations/anycloudflow/buckets/endpoints",
      },
      {
        name: "Bucket Migrations",
        icon: ArrowLeftRight,
        isLucide: true,
        requiredPermission: "migrations.view",
        path: "/admin-dashboard/integrations/anycloudflow/buckets/migrations",
      },
      {
        name: "Bucket Replications",
        icon: Repeat,
        isLucide: true,
        requiredPermission: "migrations.view",
        path: "/admin-dashboard/integrations/anycloudflow/buckets/replications",
      },
      {
        // BG-15 Path B — tenant-admin curated client visibility grants.
        // Permission gate is the workspace `bucket.access_grants.manage`
        // capability, not generic `migrations.view`. Granting access is a
        // destructive admin action that mints data-visibility scopes for
        // a client; viewers should never see this route in the nav.
        // The route's backend already enforces `workspace.role:owner,admin`
        // — this nav check is a UX layer (don't show what they can't use).
        name: "Client Access Grants",
        icon: KeyRound,
        isLucide: true,
        requiredPermission: "bucket.access_grants.manage",
        path: "/admin-dashboard/integrations/anycloudflow/buckets/client-access",
      },
    ],
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
      // Pricing surfaces — single entry. The Pricing page itself is a
      // unified shell with a left menu listing every priceable product
      // (catalog SKUs, third-party services, pay-as-you-go meters), so
      // there are no track-specific entries here anymore.
      {
        name: "Pricing",
        icon: DollarSign,
        isLucide: true,
        requiredPermission: "pricing.view",
        path: "/admin-dashboard/pricing",
      },
      {
        name: "Exchange Rates",
        icon: ArrowLeftRight,
        isLucide: true,
        requiredPermission: "exchange-rates.view",
        path: "/admin-dashboard/exchange-rates",
      },
      // Quote+Invoice convergence — the Pricing Calculator entry has
      // moved into the wizard's first step (calculator becomes accessible
      // from inside "New Quote / Invoice"), and the Generate Invoice
      // entry is renamed to reflect the unified Quote vs Invoice toggle.
      {
        name: "New Quote / Invoice",
        icon: FileText,
        isLucide: true,
        requiredPermission: "invoices.create",
        path: "/admin-dashboard/create-invoice",
      },
      {
        name: "Quotes & Invoices",
        icon: Receipt,
        isLucide: true,
        requiredPermission: "invoices.view",
        path: "/admin-dashboard/invoices",
      },
      {
        // Phase B — read-only accounting reports (trial balance, P&L,
        // balance sheet, general ledger). Backed by the journal entries
        // the InvoiceAccountingObserver posts on invoice issue/payment.
        name: "Accounting",
        icon: BookOpen,
        isLucide: true,
        requiredPermission: "accounting.view",
        path: "/admin-dashboard/accounting",
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
        name: "Payment Splits",
        icon: ArrowLeftRight,
        isLucide: true,
        requiredPermission: "billing.manage",
        path: "/admin-dashboard/payment-splits",
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
    name: "Developer",
    icon: Code2,
    isLucide: true,
    children: [
      { name: "API Keys", path: "/admin-dashboard/developer/api-keys", icon: KeyRound, isLucide: true },
      { name: "Webhooks", path: "/admin-dashboard/developer/webhooks", icon: GitMerge, isLucide: true },
      { name: "Usage", path: "/admin-dashboard/developer/usage", icon: BarChart3, isLucide: true },
      { name: "Bridge Clients", path: "/admin-dashboard/bridge-clients", icon: Network, isLucide: true },
    ],
  },
  {
    name: "Documentation",
    icon: BookOpen,
    isLucide: true,
    path: "/admin-dashboard/docs",
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
    ...buildNetworkingMenuGroup("/dashboard", "tenant"),
  },
  {
    ...buildDrMenuGroup("/dashboard", "tenant"),
  },
  {
    ...buildShieldMenuGroup("/dashboard", "tenant"),
  },
  {
    name: "Infrastructure Agent",
    icon: Bot,
    isLucide: true,
    requiredPermission: "instances.view",
    path: "/dashboard/agent",
  },
  {
    name: "SimpleDeploy",
    icon: Rocket,
    isLucide: true,
    requiredPermission: "instances.view",
    children: [
      {
        name: "Overview",
        icon: Layers,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/dashboard/flow",
      },
      {
        name: "Servers",
        icon: Server,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/dashboard/flow?tab=servers",
      },
      {
        name: "Sites & Deployments",
        icon: Globe,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/dashboard/flow?tab=sites",
      },
      {
        name: "Git Providers",
        icon: GitBranch,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/dashboard/flow?tab=git-providers",
      },
      {
        name: "Databases",
        icon: Database,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/dashboard/flow?tab=databases",
      },
      {
        name: "SSL Certificates",
        icon: Shield,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/dashboard/flow?tab=ssl",
      },
      {
        name: "Billing",
        icon: CreditCard,
        isLucide: true,
        requiredPermission: "instances.view",
        path: "/dashboard/flow/billing",
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
      // Quote+Invoice convergence — calculator folded into the wizard's
      // first step; "Generate Invoice" replaced by the unified
      // "New Quote / Invoice" entry.
      {
        name: "New Quote / Invoice",
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
        name: "Quotes & Invoices",
        icon: FileText,
        isLucide: true,
        requiredPermission: "invoices.view",
        path: "/dashboard/invoices",
      },
      {
        // Phase B — read-only accounting reports for the tenant ledger.
        // Same component used by admin; the hooks switch URL prefix
        // automatically based on context.
        name: "Accounting",
        icon: BookOpen,
        isLucide: true,
        requiredPermission: "accounting.view",
        path: "/dashboard/accounting",
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
    name: "Developer",
    icon: Code2,
    isLucide: true,
    children: [
      { name: "API Keys", path: "/dashboard/developer/api-keys", icon: KeyRound, isLucide: true },
      { name: "Webhooks", path: "/dashboard/developer/webhooks", icon: GitMerge, isLucide: true },
      { name: "Usage", path: "/dashboard/developer/usage", icon: BarChart3, isLucide: true },
    ],
  },
  {
    name: "Documentation",
    icon: BookOpen,
    isLucide: true,
    path: "/dashboard/docs",
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
      ...buildNetworkingMenuGroup("/client-dashboard", "client"),
    },
    {
      ...buildDrMenuGroup("/client-dashboard", "client"),
    },
    {
      ...buildShieldMenuGroup("/client-dashboard", "client"),
    },
    {
      name: "Infrastructure Agent",
      icon: Bot,
      isLucide: true,
      requiredPermission: "instances.view",
      path: "/client-dashboard/agent",
    },
    {
      name: "SimpleDeploy",
      icon: Rocket,
      isLucide: true,
      requiredPermission: "instances.view",
      children: [
        {
          name: "Overview",
          icon: Layers,
          isLucide: true,
          requiredPermission: "instances.view",
          path: "/client-dashboard/flow",
        },
        {
          name: "Servers",
          icon: Server,
          isLucide: true,
          requiredPermission: "instances.view",
          path: "/client-dashboard/flow?tab=servers",
        },
        {
          name: "Sites & Deployments",
          icon: Globe,
          isLucide: true,
          requiredPermission: "instances.view",
          path: "/client-dashboard/flow?tab=sites",
        },
        {
          name: "Git Providers",
          icon: GitBranch,
          isLucide: true,
          requiredPermission: "instances.view",
          path: "/client-dashboard/flow?tab=git-providers",
        },
        {
          name: "Databases",
          icon: Database,
          isLucide: true,
          requiredPermission: "instances.view",
          path: "/client-dashboard/flow?tab=databases",
        },
        {
          name: "SSL Certificates",
          icon: Shield,
          isLucide: true,
          requiredPermission: "instances.view",
          path: "/client-dashboard/flow?tab=ssl",
        },
        {
          name: "Billing",
          icon: CreditCard,
          isLucide: true,
          requiredPermission: "instances.view",
          path: "/client-dashboard/flow/billing",
        },
      ],
    },
    {
      // Path C — client view of AnyCloudFlow bucket subsystem. Mirrors the
      // admin "Object Storage" group but read-only: the underlying routes
      // forward an X-Acf-Client-Id header so AcF automatically narrows the
      // view to the client's own endpoints/migrations/replications.
      name: "Object Storage",
      icon: HardDrive,
      isLucide: true,
      children: [
        {
          name: "Bucket Endpoints",
          icon: Database,
          isLucide: true,
          requiredPermission: "migrations.view",
          path: "/client-dashboard/integrations/anycloudflow/buckets/endpoints",
        },
        {
          name: "Bucket Migrations",
          icon: ArrowLeftRight,
          isLucide: true,
          requiredPermission: "migrations.view",
          path: "/client-dashboard/integrations/anycloudflow/buckets/migrations",
        },
        {
          name: "Bucket Replications",
          icon: Repeat,
          isLucide: true,
          requiredPermission: "migrations.view",
          path: "/client-dashboard/integrations/anycloudflow/buckets/replications",
        },
      ],
    },
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
      name: "Invoices",
      icon: Receipt,
      isLucide: true,
      requiredPermission: "billing.view",
      path: "/client-dashboard/invoices",
    },
    {
      name: "Developer",
      icon: Code2,
      isLucide: true,
      children: [
        { name: "API Keys", path: "/client-dashboard/developer/api-keys", icon: KeyRound, isLucide: true },
        { name: "Webhooks", path: "/client-dashboard/developer/webhooks", icon: GitMerge, isLucide: true },
        { name: "Usage", path: "/client-dashboard/developer/usage", icon: BarChart3, isLucide: true },
      ],
    },
    {
      name: "Documentation",
      icon: BookOpen,
      isLucide: true,
      path: "/client-dashboard/docs",
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

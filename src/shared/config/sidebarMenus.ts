import type { MenuEntry } from "../components/sidebar";
import type { LucideIcon } from "lucide-react";
import { BRANDING } from "../branding";
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
  Orbit as OrbitIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// New 8-group IA — collapsed from 24 admin / 14 tenant / 14 client top-level
// entries to 8 across all three roles. Same skeleton in every role so muscle
// memory transfers between admin/tenant/client.
//
// Resilience (group #4) is the "Orbit" surface — the white-label name for the
// AnyCloudFlow-powered migration / replication / DR / bucket-sync / automation
// engine. AcF the standalone product still exists publicly; inside UniCloud,
// customers only ever see "Orbit". See `web/src/shared/branding.ts` and
// `api/config/branding.php` for the brand source of truth.
// ─────────────────────────────────────────────────────────────────────────────

type InfraRole = "admin" | "tenant" | "client";

interface RoleAwareItem {
  label: string;
  icon: LucideIcon;
  iconByRole?: Partial<Record<InfraRole, LucideIcon>>;
  path: string;
  roles: InfraRole[];
  requiredPermission?: string;
}

// ─── Group 2: Compute & Storage ──────────────────────────────────────────────
// Branded names ("Cube Instances" / "Silo Storage" / "Lattice Databases") are
// kept on the page headers; sidebar uses neutral category words so a user
// landing for the first time doesn't have to learn three glossaries.

const COMPUTE_STORAGE_ITEMS: RoleAwareItem[] = [
  {
    label: "Projects",
    icon: FolderOpen,
    iconByRole: { tenant: FolderKanban, client: Briefcase },
    path: "/projects",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "projects.view",
  },
  {
    label: "Instances",
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
    label: "Object Buckets",
    icon: HardDrive,
    path: "/object-storage",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "storage.view",
  },
  {
    label: "Databases",
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
    label: "Provider Discovery",
    icon: CloudDownload,
    path: "/provider-discovery",
    roles: ["admin"],
    requiredPermission: "provider_discovery.view",
  },
];

// ─── Group 3: Networking & Edge ──────────────────────────────────────────────
// Merges the previous "Networking" (VPC layer) and "Shield" (CDN/WAF layer)
// groups under one header — both are "how traffic reaches and leaves your
// stuff." SSL appears once; SlimDeploy's old SSL Certificates entry links here.

const NETWORKING_EDGE_ITEMS: RoleAwareItem[] = [
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
    label: "Edge Analytics",
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

// ─── Group 4: Resilience (Orbit — white-label of AnyCloudFlow) ───────────────
// All AcF surfaces consolidate here: workload migrations + bucket migrations
// + replication (workload + DB + bucket) + DR drills + automation + ransomware
// + hypervisor + destinations. Customer never sees "AnyCloudFlow" — only the
// "Orbit" / "Resilience" surface. AcF the company stays public for direct
// customers; this is the UniCloud-facing skin.

const RESILIENCE_ITEMS: RoleAwareItem[] = [
  // ── Sources (FR-043) — register/list source VMs + pre-migration assessment ──
  {
    label: "Sources",
    icon: Server,
    path: `/integrations/${BRANDING.resilienceSlug}/vms`,
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  // ── Migrations ────────────────────────────────────────────────────────────
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
    label: "Migration Calculator",
    icon: Calculator,
    path: `/${BRANDING.resilienceSlug}/calculator`,
    roles: ["admin", "tenant", "client"],
  },
  // ── Bucket sync (was "Object Storage" top-level) ──────────────────────────
  {
    label: "Bucket Endpoints",
    icon: Database,
    path: `/integrations/${BRANDING.resilienceSlug}/buckets/endpoints`,
    roles: ["admin", "tenant", "client"],
    requiredPermission: "migrations.view",
  },
  {
    label: "Bucket Migrations",
    icon: ArrowLeftRight,
    path: `/integrations/${BRANDING.resilienceSlug}/buckets/migrations`,
    roles: ["admin", "tenant", "client"],
    requiredPermission: "migrations.view",
  },
  {
    label: "Bucket Replications",
    icon: Repeat,
    path: `/integrations/${BRANDING.resilienceSlug}/buckets/replications`,
    roles: ["admin", "tenant", "client"],
    requiredPermission: "migrations.view",
  },
  {
    // BG-15 Path B — tenant-admin curated client visibility grants. Permission
    // gate is `bucket.access_grants.manage`, not generic `migrations.view`.
    // Granting access mints data-visibility scopes for a client; viewers
    // should never see this route in the nav.
    label: "Client Access Grants",
    icon: KeyRound,
    path: `/integrations/${BRANDING.resilienceSlug}/buckets/client-access`,
    roles: ["admin"],
    requiredPermission: "bucket.access_grants.manage",
  },
  // ── Replication ──────────────────────────────────────────────────────────
  {
    label: "Replication Policies",
    icon: ShieldCheck,
    path: "/protection",
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
  // ── DR ────────────────────────────────────────────────────────────────────
  {
    label: "DR Drills",
    icon: FlaskConical,
    path: "/dr-drills",
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
    label: "Ransomware",
    icon: ShieldAlert,
    path: "/ransomware",
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
    label: "Destinations",
    icon: FolderOutput,
    path: "/destinations",
    roles: ["admin", "tenant"],
    requiredPermission: "backups.manage",
  },
  // ── Automation (was top-level "Infrastructure Agent") ─────────────────────
  // Single entry — the AgentDashboard page already has Rules / Decisions tabs.
  // Renamed from "Infrastructure Agent" to "Automation" because the docs that
  // page advertised (a host-monitoring daemon) don't match what the product
  // actually does (rules/decisions engine for failover/backup/retention).
  {
    label: "Automation",
    icon: Bot,
    path: "/agent",
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
];

// ─── Group 5: Deploy (SlimDeploy) ────────────────────────────────────────────
// The "?tab=" deep links into the FlowDashboard tabs are preserved. The
// SSL Certificates entry is removed — links into Networking & Edge → SSL
// instead, eliminating the duplicate concept.

interface DeployItem extends RoleAwareItem {
  /** Admin SlimDeploy lives at /flow-dashboard, others at /flow. */
  pathByRole?: Partial<Record<InfraRole, string>>;
}

const DEPLOY_ITEMS: DeployItem[] = [
  {
    label: "Overview",
    icon: Layers,
    path: "/flow",
    pathByRole: { admin: "/flow-dashboard" },
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Servers",
    icon: Server,
    path: "/flow?tab=servers",
    pathByRole: { admin: "/flow-dashboard?tab=servers" },
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Sites & Deployments",
    icon: Globe,
    path: "/flow?tab=sites",
    pathByRole: { admin: "/flow-dashboard?tab=sites" },
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Git Providers",
    icon: GitBranch,
    path: "/flow?tab=git-providers",
    pathByRole: { admin: "/flow-dashboard?tab=git-providers" },
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Deploy Databases",
    icon: Database,
    path: "/flow?tab=databases",
    pathByRole: { admin: "/flow-dashboard?tab=databases" },
    roles: ["admin", "tenant", "client"],
    requiredPermission: "instances.view",
  },
  {
    label: "Flow Billing",
    icon: CreditCard,
    path: "/flow/billing",
    roles: ["tenant", "client"],
    requiredPermission: "instances.view",
  },
];

// ─── Group 6: Customers (admin + tenant) ─────────────────────────────────────

const CUSTOMERS_ITEMS_ADMIN: RoleAwareItem[] = [
  {
    label: "Tenants & Users",
    icon: Users,
    path: "/admin-dashboard/partners",
    roles: ["admin"],
    requiredPermission: "tenants.view",
  },
  {
    label: "Clients",
    icon: Building2,
    path: "/admin-dashboard/clients",
    roles: ["admin"],
    requiredPermission: "clients.view",
  },
  {
    label: "Leads",
    icon: UserPlus,
    path: "/admin-dashboard/leads",
    roles: ["admin"],
    requiredPermission: "leads.view",
  },
  {
    label: "Region Approvals",
    icon: CheckSquare,
    path: "/admin-dashboard/region-approvals",
    roles: ["admin"],
    requiredPermission: "region_approvals.view",
  },
  {
    label: "Regions",
    icon: MapPin,
    path: "/admin-dashboard/regions",
    roles: ["admin"],
    requiredPermission: "regions.view",
  },
  {
    label: "Onboarding Review",
    icon: ClipboardList,
    path: "/admin-dashboard/onboarding-review",
    roles: ["admin"],
    requiredPermission: "onboarding.view",
  },
  {
    label: "Onboarding Settings",
    icon: SlidersHorizontal,
    path: "/admin-dashboard/onboarding-settings",
    roles: ["admin"],
    requiredPermission: "onboarding.manage",
  },
];

const CUSTOMERS_ITEMS_TENANT: RoleAwareItem[] = [
  {
    label: "Clients",
    icon: Users,
    path: "/dashboard/clients",
    roles: ["tenant"],
    requiredPermission: "clients.view",
  },
  {
    label: "Leads",
    icon: UserPlus,
    path: "/dashboard/leads",
    roles: ["tenant"],
    requiredPermission: "leads.view",
  },
  {
    label: "Region Requests",
    icon: MapPin,
    path: "/dashboard/region-requests",
    roles: ["tenant"],
    requiredPermission: "regions.view",
  },
  {
    label: "Onboarding",
    icon: ClipboardList,
    path: "/dashboard/onboarding",
    roles: ["tenant"],
    requiredPermission: "onboarding.view",
  },
];

// ─── Group 7: Billing ────────────────────────────────────────────────────────
// Each role keeps its existing detail pages reachable; long-term the goal is a
// single Billing landing page with internal nav. For now, the consolidation is
// "Billing" as one collapsible group instead of two ("Billing & Pricing" +
// "Billing & Revenue") and 17-item mega-menus.

const BILLING_ITEMS_ADMIN: RoleAwareItem[] = [
  {
    label: "Quotes & Invoices",
    icon: Receipt,
    path: "/admin-dashboard/invoices",
    roles: ["admin"],
    requiredPermission: "invoices.view",
  },
  {
    label: "New Quote / Invoice",
    icon: FileText,
    path: "/admin-dashboard/create-invoice",
    roles: ["admin"],
    requiredPermission: "invoices.create",
  },
  {
    label: "Pricing",
    icon: DollarSign,
    path: "/admin-dashboard/pricing",
    roles: ["admin"],
    requiredPermission: "pricing.view",
  },
  {
    label: "Products",
    icon: Package,
    path: "/admin-dashboard/products",
    roles: ["admin"],
    requiredPermission: "products.view",
  },
  {
    label: "Product Families",
    icon: GitMerge,
    path: "/admin-dashboard/product-families",
    roles: ["admin"],
    requiredPermission: "products.view",
  },
  {
    label: "Inventory",
    icon: Layers,
    path: "/admin-dashboard/inventory",
    roles: ["admin"],
    requiredPermission: "products.view",
  },
  {
    label: "Subscription Plans",
    icon: Repeat,
    path: "/admin-dashboard/subscription-plans",
    roles: ["admin"],
    requiredPermission: "subscriptions.view",
  },
  {
    label: "Accounting",
    icon: BookOpen,
    path: "/admin-dashboard/accounting",
    roles: ["admin"],
    requiredPermission: "accounting.view",
  },
  {
    label: "Tax Configuration",
    icon: Settings,
    path: "/admin-dashboard/tax-configuration",
    roles: ["admin"],
    requiredPermission: "tax.view",
  },
  {
    label: "Exchange Rates",
    icon: ArrowLeftRight,
    path: "/admin-dashboard/exchange-rates",
    roles: ["admin"],
    requiredPermission: "exchange-rates.view",
  },
  {
    label: "Wallet",
    icon: Wallet,
    path: "/admin-dashboard/wallet",
    roles: ["admin"],
    requiredPermission: "wallet.view",
  },
  {
    label: "Settlements",
    icon: Receipt,
    path: "/admin-dashboard/settlements",
    roles: ["admin"],
    requiredPermission: "settlements.view",
  },
  {
    label: "Payouts",
    icon: CreditCard,
    path: "/admin-dashboard/payouts",
    roles: ["admin"],
    requiredPermission: "payouts.view",
  },
  {
    label: "Payment Splits",
    icon: ArrowLeftRight,
    path: "/admin-dashboard/payment-splits",
    roles: ["admin"],
    requiredPermission: "billing.manage",
  },
  {
    label: "Payment",
    icon: CreditCard,
    path: "/admin-dashboard/payment",
    roles: ["admin"],
    requiredPermission: "billing.view",
  },
  {
    label: "POC Trials",
    icon: FlaskConical,
    path: "/admin-dashboard/poc-trials",
    roles: ["admin"],
    requiredPermission: "billing.manage",
  },
];

const BILLING_ITEMS_TENANT: RoleAwareItem[] = [
  {
    label: "Revenue",
    icon: TrendingUp,
    path: "/dashboard/revenue",
    roles: ["tenant"],
    requiredPermission: "revenue.view",
  },
  {
    label: "Quotes & Invoices",
    icon: FileText,
    path: "/dashboard/invoices",
    roles: ["tenant"],
    requiredPermission: "invoices.view",
  },
  {
    label: "New Quote / Invoice",
    icon: FileText,
    path: "/dashboard/create-invoice",
    roles: ["tenant"],
    requiredPermission: "invoices.create",
  },
  {
    label: "Price Settings",
    icon: DollarSign,
    path: "/dashboard/pricing-overrides",
    roles: ["tenant"],
    requiredPermission: "pricing.view",
  },
  {
    label: "Discounts & Margins",
    icon: Percent,
    path: "/dashboard/discounts",
    roles: ["tenant"],
    requiredPermission: "billing.manage",
  },
  {
    label: "Payment History",
    icon: CreditCard,
    path: "/dashboard/payment-history",
    roles: ["tenant"],
    requiredPermission: "billing.view",
  },
  {
    label: "Accounting",
    icon: BookOpen,
    path: "/dashboard/accounting",
    roles: ["tenant"],
    requiredPermission: "accounting.view",
  },
  {
    label: "Billing Settings",
    icon: Settings,
    path: "/dashboard/billing",
    roles: ["tenant"],
    requiredPermission: "billing.manage",
  },
  {
    label: "POC Trials",
    icon: FlaskConical,
    path: "/dashboard/poc-trials",
    roles: ["tenant"],
    requiredPermission: "billing.view",
  },
];

const BILLING_ITEMS_CLIENT: RoleAwareItem[] = [
  {
    label: "Pricing Calculator",
    icon: Calculator,
    path: "/client-dashboard/pricing-calculator",
    roles: ["client"],
    requiredPermission: "billing.view",
  },
  {
    label: "Orders & Payments",
    icon: CreditCard,
    path: "/client-dashboard/orders-payments",
    roles: ["client"],
    requiredPermission: "billing.view",
  },
  {
    label: "Invoices",
    icon: Receipt,
    path: "/client-dashboard/invoices",
    roles: ["client"],
    requiredPermission: "billing.view",
  },
];

// ─── Group 8: Developer ──────────────────────────────────────────────────────

const DEVELOPER_ITEMS: RoleAwareItem[] = [
  {
    label: "API Keys",
    icon: KeyRound,
    path: "/developer/api-keys",
    roles: ["admin", "tenant", "client"],
  },
  {
    label: "Webhooks",
    icon: GitMerge,
    path: "/developer/webhooks",
    roles: ["admin", "tenant", "client"],
  },
  {
    label: "Usage",
    icon: BarChart3,
    path: "/developer/usage",
    roles: ["admin", "tenant", "client"],
  },
  {
    label: "Bridge Clients",
    icon: Network,
    path: "/admin-dashboard/bridge-clients",
    roles: ["admin"],
  },
];

// ─── Account (bottom-pinned, replaces top-level 2FA + 2FA Policy + Settings) ─

interface AccountItem {
  label: string;
  icon: LucideIcon;
  path: string;
  requiredPermission?: string;
}

const ACCOUNT_ITEMS_BY_ROLE: Record<InfraRole, AccountItem[]> = {
  admin: [
    { label: "Profile", icon: User, path: "/admin-dashboard/account", requiredPermission: "settings.view" },
    { label: "Two-Factor Auth", icon: ShieldCheck, path: "/admin-dashboard/security/2fa", requiredPermission: "settings.view" },
    { label: "2FA Policy", icon: Shield, path: "/admin-dashboard/security/2fa-policy", requiredPermission: "settings.view" },
  ],
  tenant: [
    { label: "Profile", icon: User, path: "/dashboard/account", requiredPermission: "settings.view" },
    { label: "Two-Factor Auth", icon: ShieldCheck, path: "/dashboard/security/2fa", requiredPermission: "settings.view" },
    { label: "2FA Policy", icon: Shield, path: "/dashboard/security/2fa-policy", requiredPermission: "settings.view" },
  ],
  client: [
    { label: "Profile", icon: Settings, path: "/client-dashboard/account-settings", requiredPermission: "settings.view" },
    { label: "Two-Factor Auth", icon: ShieldCheck, path: "/client-dashboard/security/2fa", requiredPermission: "settings.view" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Group builder helpers
// ─────────────────────────────────────────────────────────────────────────────

const buildGroup = (
  name: string,
  icon: LucideIcon,
  items: RoleAwareItem[],
  basePath: string,
  role: InfraRole,
): MenuEntry => {
  const normalizedBase = basePath.replace(/\/+$/, "");
  const toPath = (suffix: string) => {
    // Absolute admin/dashboard/client-dashboard paths pass through unchanged
    // (some items intentionally cross dashboards — e.g. Bridge Clients).
    if (suffix.startsWith("/admin-dashboard") || suffix.startsWith("/dashboard") || suffix.startsWith("/client-dashboard")) {
      return suffix;
    }
    return `${normalizedBase}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  };

  const children = items
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      name: item.label,
      icon: item.iconByRole?.[role] ?? item.icon,
      isLucide: true,
      requiredPermission: item.requiredPermission,
      path: toPath(item.path),
    }));

  return { name, icon, isLucide: true, children };
};

const buildDeployGroup = (basePath: string, role: InfraRole): MenuEntry => {
  const normalizedBase = basePath.replace(/\/+$/, "");
  const children = DEPLOY_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
    const rawPath = item.pathByRole?.[role] ?? item.path;
    // Admin SlimDeploy paths are already absolute (/flow-dashboard...).
    const path = rawPath.startsWith("/flow-dashboard") ? rawPath : `${normalizedBase}${rawPath.startsWith("/") ? rawPath : `/${rawPath}`}`;
    return {
      name: item.label,
      icon: item.icon,
      isLucide: true,
      requiredPermission: item.requiredPermission,
      path,
    };
  });

  return { name: "Deploy", icon: Rocket, isLucide: true, children };
};

const buildAccountGroup = (role: InfraRole): MenuEntry => {
  const items = ACCOUNT_ITEMS_BY_ROLE[role];
  return {
    name: "Account",
    icon: User,
    isLucide: true,
    children: items.map((item) => ({
      name: item.label,
      icon: item.icon,
      isLucide: true,
      requiredPermission: item.requiredPermission,
      path: item.path,
    })),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-role assembly — same 8-group skeleton across admin / tenant / client
// ─────────────────────────────────────────────────────────────────────────────

export const adminMenuItems: MenuEntry[] = [
  // 1. Overview
  {
    name: "Overview",
    icon: Home,
    isLucide: true,
    children: [
      { name: "Home", icon: Home, isLucide: true, requiredPermission: "dashboard.view", path: "/admin-dashboard" },
      { name: "Analytics", icon: BarChart3, isLucide: true, requiredPermission: "analytics.view", path: "/admin-dashboard/analytics" },
      { name: "NOC", icon: Radio, isLucide: true, path: "/admin-dashboard/noc" },
    ],
  },
  // 2. Compute & Storage
  buildGroup("Compute & Storage", Server, COMPUTE_STORAGE_ITEMS, "/admin-dashboard", "admin"),
  // 3. Networking & Edge
  buildGroup("Networking & Edge", Network, NETWORKING_EDGE_ITEMS, "/admin-dashboard", "admin"),
  // 4. Resilience (Orbit)
  buildGroup(
    BRANDING.resilienceProduct === "Orbit" ? "Resilience" : `Resilience (${BRANDING.resilienceProduct})`,
    OrbitIcon,
    RESILIENCE_ITEMS,
    "/admin-dashboard",
    "admin",
  ),
  // 5. Deploy (SlimDeploy)
  buildDeployGroup("/admin-dashboard", "admin"),
  // 6. Customers
  buildGroup("Customers", Users, CUSTOMERS_ITEMS_ADMIN, "", "admin"),
  // 7. Billing
  buildGroup("Billing", DollarSign, BILLING_ITEMS_ADMIN, "", "admin"),
  // 8. Developer
  buildGroup("Developer", Code2, DEVELOPER_ITEMS, "/admin-dashboard", "admin"),
  // ─── Bottom-pinned ───
  { name: "Documentation", icon: BookOpen, isLucide: true, path: "/admin-dashboard/docs" },
  { name: "Support", icon: HelpCircle, isLucide: true, requiredPermission: "support.view", path: "/admin-dashboard/tickets" },
  buildAccountGroup("admin"),
];

export const tenantMenuItems: MenuEntry[] = [
  // 1. Overview
  {
    name: "Overview",
    icon: Home,
    isLucide: true,
    children: [
      { name: "Home", icon: Home, isLucide: true, requiredPermission: "dashboard.view", path: "/dashboard" },
    ],
  },
  // 2. Compute & Storage
  buildGroup("Compute & Storage", Server, COMPUTE_STORAGE_ITEMS, "/dashboard", "tenant"),
  // 3. Networking & Edge
  buildGroup("Networking & Edge", Network, NETWORKING_EDGE_ITEMS, "/dashboard", "tenant"),
  // 4. Resilience (Orbit)
  buildGroup(
    BRANDING.resilienceProduct === "Orbit" ? "Resilience" : `Resilience (${BRANDING.resilienceProduct})`,
    OrbitIcon,
    RESILIENCE_ITEMS,
    "/dashboard",
    "tenant",
  ),
  // 5. Deploy (SlimDeploy)
  buildDeployGroup("/dashboard", "tenant"),
  // 6. Customers
  buildGroup("Customers", Users, CUSTOMERS_ITEMS_TENANT, "", "tenant"),
  // 7. Billing
  buildGroup("Billing", DollarSign, BILLING_ITEMS_TENANT, "", "tenant"),
  // 8. Developer
  buildGroup("Developer", Code2, DEVELOPER_ITEMS, "/dashboard", "tenant"),
  // Products entry (tenant-only standalone — sits with Developer because
  // tenants self-serve their own product catalog).
  { name: "Products", icon: Package, isLucide: true, requiredPermission: "products.view", path: "/dashboard/products" },
  // ─── Bottom-pinned ───
  { name: "Documentation", icon: BookOpen, isLucide: true, path: "/dashboard/docs" },
  { name: "Support", icon: HelpCircle, isLucide: true, requiredPermission: "support.view", path: "/dashboard/support" },
  buildAccountGroup("tenant"),
];

export const buildClientMenuItems = (_hasProjects: boolean): MenuEntry[] => {
  return [
    // 1. Overview
    {
      name: "Overview",
      icon: LayoutDashboard,
      isLucide: true,
      children: [
        { name: "Home", icon: LayoutDashboard, isLucide: true, requiredPermission: "dashboard.view", path: "/client-dashboard" },
      ],
    },
    // 2. Compute & Storage
    buildGroup("Compute & Storage", Server, COMPUTE_STORAGE_ITEMS, "/client-dashboard", "client"),
    // 3. Networking & Edge
    buildGroup("Networking & Edge", Network, NETWORKING_EDGE_ITEMS, "/client-dashboard", "client"),
    // 4. Resilience (Orbit)
    buildGroup(
      BRANDING.resilienceProduct === "Orbit" ? "Resilience" : `Resilience (${BRANDING.resilienceProduct})`,
      OrbitIcon,
      RESILIENCE_ITEMS,
      "/client-dashboard",
      "client",
    ),
    // 5. Deploy (SlimDeploy)
    buildDeployGroup("/client-dashboard", "client"),
    // 6. Billing (clients have a slim billing tree — no Customers group)
    buildGroup("Billing", DollarSign, BILLING_ITEMS_CLIENT, "", "client"),
    // 7. Developer
    buildGroup("Developer", Code2, DEVELOPER_ITEMS, "/client-dashboard", "client"),
    // ─── Bottom-pinned ───
    { name: "Documentation", icon: BookOpen, isLucide: true, path: "/client-dashboard/docs" },
    { name: "Support", icon: LifeBuoy, isLucide: true, requiredPermission: "support.view", path: "/client-dashboard/support" },
    buildAccountGroup("client"),
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

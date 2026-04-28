import {
  Home, Rocket, Users, Building2, UserPlus, Globe, MapPin, CheckSquare,
  ClipboardList, SlidersHorizontal, Server, Network, HardDrive, Database,
  LayoutTemplate, KeyRound, CloudOff,
  ArrowLeftRight, FolderOutput, ShieldCheck, Bot, CloudDownload,
  Package, CreditCard, DollarSign, Wallet, BarChart3,
  Code2, LifeBuoy, User, Lock, Scale, Route,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DocLink {
  label: string;
  slug: string;
  icon: LucideIcon;
}

export interface DocSection {
  heading: string;
  links: DocLink[];
}

export const adminDocSections: DocSection[] = [
  {
    heading: "Getting Started",
    links: [
      { label: "Home", slug: "", icon: Home },
      { label: "Getting Started", slug: "getting-started", icon: Rocket },
      { label: "Analytics", slug: "analytics", icon: BarChart3 },
    ],
  },
  {
    heading: "Customer Management",
    links: [
      { label: "Tenants & Users", slug: "tenants", icon: Users },
      { label: "Clients", slug: "clients", icon: Building2 },
      { label: "Leads", slug: "leads", icon: UserPlus },
    ],
  },
  {
    heading: "Infrastructure",
    links: [
      { label: "Projects", slug: "projects", icon: Server },
      { label: "Cube Instances", slug: "compute", icon: Server },
      { label: "Templates", slug: "templates", icon: LayoutTemplate },
      { label: "Key Pairs", slug: "key-pairs", icon: KeyRound },
      { label: "Silo Storage", slug: "storage", icon: HardDrive },
      { label: "Lattice Databases", slug: "databases", icon: Database },
    ],
  },
  {
    heading: "Networking",
    links: [
      { label: "VPCs", slug: "vpcs", icon: Network },
      { label: "Subnets", slug: "networking", icon: Route },
      { label: "Security Groups", slug: "security-groups", icon: Lock },
      { label: "Load Balancers", slug: "load-balancers", icon: Scale },
      { label: "DNS Zones", slug: "dns", icon: Globe },
    ],
  },
  {
    heading: "Disaster Recovery",
    links: [
      { label: "Replication Policies", slug: "replication", icon: ShieldCheck },
      { label: "Serverless DR", slug: "serverless-dr", icon: CloudOff },
      { label: "Migrations", slug: "migrations", icon: ArrowLeftRight },
      { label: "Destinations", slug: "destinations", icon: FolderOutput },
    ],
  },
  {
    heading: "Platform Services",
    links: [
      { label: "Infrastructure Agent", slug: "agent", icon: Bot },
      { label: "Shield Protection", slug: "shield", icon: ShieldCheck },
      { label: "Provider Discovery", slug: "provider-discovery", icon: CloudDownload },
    ],
  },
  {
    heading: "Billing & Pricing",
    links: [
      { label: "Products", slug: "products", icon: Package },
      { label: "Pricing", slug: "pricing", icon: DollarSign },
      { label: "Billing & Finance", slug: "billing", icon: CreditCard },
      { label: "Wallet & Settlements", slug: "wallet", icon: Wallet },
    ],
  },
  {
    heading: "Regional",
    links: [
      { label: "Regions", slug: "regions", icon: MapPin },
      { label: "Region Approvals", slug: "region-approvals", icon: CheckSquare },
    ],
  },
  {
    heading: "Onboarding",
    links: [
      { label: "Onboarding Review", slug: "onboarding", icon: ClipboardList },
      { label: "Onboarding Settings", slug: "onboarding-settings", icon: SlidersHorizontal },
    ],
  },
  {
    heading: "Developer",
    links: [
      { label: "API Keys & Webhooks", slug: "developer", icon: Code2 },
    ],
  },
  {
    heading: "Support & Settings",
    links: [
      { label: "Support Tickets", slug: "support", icon: LifeBuoy },
      { label: "Account Settings", slug: "settings", icon: User },
    ],
  },
];

const modules = import.meta.glob("/src/docs/content/admin/*.md", { query: "?raw", import: "default" });

export async function loadAdminDoc(slug: string): Promise<string> {
  const key = `/src/docs/content/admin/${slug || "home"}.md`;
  const loader = modules[key];
  if (!loader) throw new Error(`Doc not found: ${slug}`);
  return (await loader()) as string;
}

import {
  Home, Rocket, LayoutDashboard, Users, UserPlus,
  Server, LayoutTemplate, KeyRound, HardDrive, Database,
  Network, Lock, Scale, Globe,
  ShieldCheck, ArrowLeftRight,
  Bot, MapPin, ClipboardList,
  TrendingUp, DollarSign, CreditCard, Package,
  Code2, LifeBuoy, User,
} from "lucide-react";
import type { DocSection } from "./adminDocs";

export const tenantDocSections: DocSection[] = [
  {
    heading: "Getting Started",
    links: [
      { label: "Home", slug: "", icon: Home },
      { label: "Getting Started", slug: "getting-started", icon: Rocket },
      { label: "Dashboard Overview", slug: "dashboard-overview", icon: LayoutDashboard },
    ],
  },
  {
    heading: "Customer Management",
    links: [
      { label: "Clients", slug: "clients", icon: Users },
      { label: "Leads", slug: "leads", icon: UserPlus },
    ],
  },
  {
    heading: "Infrastructure",
    links: [
      { label: "Projects & Instances", slug: "compute", icon: Server },
      { label: "Templates", slug: "templates", icon: LayoutTemplate },
      { label: "Key Pairs", slug: "key-pairs", icon: KeyRound },
      { label: "Silo Storage", slug: "storage", icon: HardDrive },
      { label: "Lattice Databases", slug: "databases", icon: Database },
    ],
  },
  {
    heading: "Networking",
    links: [
      { label: "VPCs & Subnets", slug: "networking", icon: Network },
      { label: "Security Groups", slug: "security-groups", icon: Lock },
      { label: "Load Balancers", slug: "load-balancers", icon: Scale },
      { label: "DNS Zones", slug: "dns", icon: Globe },
    ],
  },
  {
    heading: "Disaster Recovery",
    links: [
      { label: "Replication & DR", slug: "advanced", icon: ShieldCheck },
      { label: "Migrations", slug: "migrations", icon: ArrowLeftRight },
    ],
  },
  {
    heading: "Platform Services",
    links: [
      { label: "Orbit Automation", slug: "agent", icon: Bot },
      { label: "Shield Protection", slug: "shield", icon: ShieldCheck },
    ],
  },
  {
    heading: "Regional",
    links: [
      { label: "Region Requests", slug: "regions", icon: MapPin },
      { label: "Onboarding", slug: "onboarding", icon: ClipboardList },
    ],
  },
  {
    heading: "Billing & Revenue",
    links: [
      { label: "Revenue", slug: "revenue", icon: TrendingUp },
      { label: "Price Settings", slug: "price-settings", icon: DollarSign },
      { label: "Billing & Payments", slug: "billing", icon: CreditCard },
      { label: "Products", slug: "products", icon: Package },
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
      { label: "Support", slug: "support", icon: LifeBuoy },
      { label: "Account Settings", slug: "settings", icon: User },
    ],
  },
];

const modules = import.meta.glob("/src/docs/content/tenant/*.md", { query: "?raw", import: "default" });

export async function loadTenantDoc(slug: string): Promise<string> {
  const key = `/src/docs/content/tenant/${slug || "home"}.md`;
  const loader = modules[key];
  if (!loader) throw new Error(`Doc not found: ${slug}`);
  return (await loader()) as string;
}

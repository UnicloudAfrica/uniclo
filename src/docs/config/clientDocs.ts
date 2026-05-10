import {
  Home, Rocket, Server, KeyRound, HardDrive, Database,
  Network, Lock,
  ShieldCheck, ArrowLeftRight,
  Bot, Calculator, CreditCard,
  Code2, LifeBuoy, Settings,
} from "lucide-react";
import type { DocSection } from "./adminDocs";

export const clientDocSections: DocSection[] = [
  {
    heading: "Getting Started",
    links: [
      { label: "Home", slug: "", icon: Home },
      { label: "Getting Started", slug: "getting-started", icon: Rocket },
    ],
  },
  {
    heading: "Infrastructure",
    links: [
      { label: "Projects & Instances", slug: "compute", icon: Server },
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
    heading: "Billing",
    links: [
      { label: "Pricing Calculator", slug: "pricing-calculator", icon: Calculator },
      { label: "Orders & Payments", slug: "billing", icon: CreditCard },
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
      { label: "Account Settings", slug: "settings", icon: Settings },
    ],
  },
];

const modules = import.meta.glob("/src/docs/content/client/*.md", { query: "?raw", import: "default" });

export async function loadClientDoc(slug: string): Promise<string> {
  const key = `/src/docs/content/client/${slug || "home"}.md`;
  const loader = modules[key];
  if (!loader) throw new Error(`Doc not found: ${slug}`);
  return (await loader()) as string;
}

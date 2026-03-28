import React from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  Building2,
  Users,
  Globe,
  Server,
  Network,
  HardDrive,
  DollarSign,
  Receipt,
  Zap,
  LifeBuoy,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DocsPageShell from "@/shared/pages/docs/components/DocsPageShell";
import DocCallout from "@/shared/pages/docs/components/DocCallout";

const PREFIX = "/admin-dashboard/docs";

interface QuickCard {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

const cards: QuickCard[] = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Sign in, explore the dashboard, and learn the basics of platform administration.",
    href: `${PREFIX}/getting-started`,
  },
  {
    icon: Building2,
    title: "Tenants & Partners",
    description: "Create and manage the organisations that resell your cloud services.",
    href: `${PREFIX}/tenants`,
  },
  {
    icon: Users,
    title: "Clients",
    description: "View and manage the end-users across every tenant on the platform.",
    href: `${PREFIX}/clients`,
  },
  {
    icon: Globe,
    title: "Regions",
    description: "Set up data-center regions and availability zones worldwide.",
    href: `${PREFIX}/regions`,
  },
  {
    icon: Server,
    title: "Compute",
    description: "Manage virtual machines, templates, and key pairs across all tenants.",
    href: `${PREFIX}/compute`,
  },
  {
    icon: Network,
    title: "Networking",
    description: "Configure VPCs, subnets, security groups, load balancers, and DNS.",
    href: `${PREFIX}/networking`,
  },
  {
    icon: HardDrive,
    title: "Storage",
    description: "Oversee object storage, managed databases, snapshots, and images.",
    href: `${PREFIX}/storage`,
  },
  {
    icon: DollarSign,
    title: "Pricing & Products",
    description: "Define product families, pricing tiers, and subscription plans.",
    href: `${PREFIX}/pricing`,
  },
  {
    icon: Receipt,
    title: "Billing & Finance",
    description: "Track payments, wallets, settlements, taxes, and invoices.",
    href: `${PREFIX}/billing`,
  },
  {
    icon: Zap,
    title: "Advanced Services",
    description: "Explore disaster recovery, migrations, auto-scaling, and more.",
    href: `${PREFIX}/advanced`,
  },
  {
    icon: LifeBuoy,
    title: "Support",
    description: "View and respond to support tickets from tenants and clients.",
    href: `${PREFIX}/support`,
  },
  {
    icon: Settings,
    title: "Platform Settings",
    description: "Manage branding, admin users, and global platform configuration.",
    href: `${PREFIX}/settings`,
  },
];

const AdminDocsHome: React.FC = () => (
  <DocsPageShell
    title="Admin Documentation"
    subtitle="Everything you need to manage and operate the entire UniCloud platform. Pick a topic below to get started."
  >
    <DocCallout type="info" title="Welcome, Admin!">
      This documentation walks you through every section of the admin dashboard
      in plain, simple language. Whether you are setting things up for the first
      time or looking up a specific feature, you will find step-by-step
      instructions with screenshots and helpful tips.
    </DocCallout>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            to={card.href}
            className="rounded-lg border p-5 transition-shadow hover:shadow-md"
            style={{
              borderColor: "var(--theme-border-color, #e5e7eb)",
              backgroundColor: "var(--theme-card-bg, #fff)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: "var(--theme-color-alpha-10, rgba(40,141,209,0.1))",
                }}
              >
                <Icon size={18} style={{ color: "var(--theme-color, #288DD1)" }} />
              </div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "var(--theme-heading-color, #1f2937)" }}
              >
                {card.title}
              </h3>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--theme-muted-color, #6b7280)" }}
            >
              {card.description}
            </p>
          </Link>
        );
      })}
    </div>
  </DocsPageShell>
);

export default AdminDocsHome;

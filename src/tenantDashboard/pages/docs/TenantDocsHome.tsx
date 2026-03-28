import React from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  LayoutDashboard,
  Users,
  Server,
  Network,
  HardDrive,
  Database,
  DollarSign,
  Globe,
  Zap,
  LifeBuoy,
  Settings,
} from "lucide-react";
import DocsPageShell from "@/shared/pages/docs/components/DocsPageShell";
import DocCallout from "@/shared/pages/docs/components/DocCallout";
import type { LucideIcon } from "lucide-react";

const PREFIX = "/dashboard/docs";

interface QuickCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const cards: QuickCard[] = [
  {
    title: "Getting Started",
    description: "Set up your account, add your branding, and get ready to sell cloud services.",
    href: `${PREFIX}/getting-started`,
    icon: Rocket,
  },
  {
    title: "Dashboard Overview",
    description: "Understand the stats, charts, and quick actions on your main dashboard.",
    href: `${PREFIX}/dashboard`,
    icon: LayoutDashboard,
  },
  {
    title: "Clients & Leads",
    description: "Add clients, track leads, manage partners, and invite team members.",
    href: `${PREFIX}/clients`,
    icon: Users,
  },
  {
    title: "Compute",
    description: "Create projects, launch servers, and manage your compute instances.",
    href: `${PREFIX}/compute`,
    icon: Server,
  },
  {
    title: "Networking",
    description: "Set up VPCs, subnets, firewalls, load balancers, DNS, and more.",
    href: `${PREFIX}/networking`,
    icon: Network,
  },
  {
    title: "Storage",
    description: "Use object storage buckets to store files, images, backups, and more.",
    href: `${PREFIX}/storage`,
    icon: HardDrive,
  },
  {
    title: "Databases",
    description: "Spin up managed databases without worrying about maintenance.",
    href: `${PREFIX}/databases`,
    icon: Database,
  },
  {
    title: "Billing & Revenue",
    description: "Track revenue, set pricing, generate invoices, and manage payouts.",
    href: `${PREFIX}/billing`,
    icon: DollarSign,
  },
  {
    title: "Regions",
    description: "Expand your cloud business into new geographic regions.",
    href: `${PREFIX}/regions`,
    icon: Globe,
  },
  {
    title: "Advanced Services",
    description: "Disaster recovery, migrations, auto-scaling, and protection services.",
    href: `${PREFIX}/advanced`,
    icon: Zap,
  },
  {
    title: "Support",
    description: "Create and manage support tickets to get help when you need it.",
    href: `${PREFIX}/support`,
    icon: LifeBuoy,
  },
  {
    title: "Settings & Branding",
    description: "Customize your platform look, manage your team, and secure your account.",
    href: `${PREFIX}/settings`,
    icon: Settings,
  },
];

const TenantDocsHome: React.FC = () => (
  <DocsPageShell
    title="Welcome to Your Cloud Business!"
    subtitle="Everything you need to know about running your own cloud platform. Pick a topic below to get started."
  >
    <DocCallout type="tip" title="New here?">
      If this is your first time, we recommend starting with the{" "}
      <Link
        to={`${PREFIX}/getting-started`}
        className="underline font-medium"
        style={{ color: "var(--theme-color, #288DD1)" }}
      >
        Getting Started
      </Link>{" "}
      guide. It walks you through everything from signing up to launching your first
      server -- step by step!
    </DocCallout>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            to={card.href}
            className="group rounded-lg border p-5 transition-shadow hover:shadow-md"
            style={{
              borderColor: "var(--theme-border-color, #e5e7eb)",
              backgroundColor: "var(--theme-card-bg, #fff)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--theme-color-alpha-10, rgba(40,141,209,0.1))" }}
              >
                <Icon size={18} style={{ color: "var(--theme-color, #288DD1)" }} />
              </div>
              <h3
                className="font-semibold text-sm group-hover:underline"
                style={{ color: "var(--theme-heading-color, #1f2937)" }}
              >
                {card.title}
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
              {card.description}
            </p>
          </Link>
        );
      })}
    </div>
  </DocsPageShell>
);

export default TenantDocsHome;

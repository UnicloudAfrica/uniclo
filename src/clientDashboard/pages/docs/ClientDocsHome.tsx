import React from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  Server,
  Network,
  HardDrive,
  Database,
  Receipt,
  Zap,
  LifeBuoy,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DocsPageShell from "@/shared/pages/docs/components/DocsPageShell";
import DocCallout from "@/shared/pages/docs/components/DocCallout";

const PREFIX = "/client-dashboard/docs";

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
    description: "Brand new? Start here! We will walk you through everything step by step.",
    href: `${PREFIX}/getting-started`,
  },
  {
    icon: Server,
    title: "Compute & Instances",
    description: "Learn how to create projects and launch your own servers in the cloud.",
    href: `${PREFIX}/compute`,
  },
  {
    icon: Network,
    title: "Networking",
    description: "Set up private networks, security rules, and connect everything together.",
    href: `${PREFIX}/networking`,
  },
  {
    icon: HardDrive,
    title: "Storage",
    description: "Store files, take snapshots, and keep your data safe.",
    href: `${PREFIX}/storage`,
  },
  {
    icon: Database,
    title: "Databases",
    description: "Create and manage databases without worrying about the technical details.",
    href: `${PREFIX}/databases`,
  },
  {
    icon: Receipt,
    title: "Billing & Payments",
    description: "Understand your bill, make payments, and estimate costs.",
    href: `${PREFIX}/billing`,
  },
  {
    icon: Zap,
    title: "Advanced Services",
    description: "Disaster recovery, migrations, and automatic server protection.",
    href: `${PREFIX}/advanced`,
  },
  {
    icon: LifeBuoy,
    title: "Support",
    description: "Need help? Learn how to reach our support team quickly.",
    href: `${PREFIX}/support`,
  },
  {
    icon: Settings,
    title: "Account Settings",
    description: "Update your profile, security settings, and manage your team.",
    href: `${PREFIX}/settings`,
  },
];

const ClientDocsHome: React.FC = () => (
  <DocsPageShell title="Welcome to Your Cloud Dashboard!" subtitle="Everything you need to know, explained simply.">
    <DocCallout type="tip" title="First time here?">
      If you are brand new, start with the{" "}
      <Link to={`${PREFIX}/getting-started`} className="underline font-semibold" style={{ color: "var(--theme-color, #288DD1)" }}>
        Getting Started
      </Link>{" "}
      guide. It walks you through everything from signing in to launching your very first server. No experience needed!
    </DocCallout>

    <p className="text-base leading-relaxed mb-6" style={{ color: "var(--theme-text-color, #374151)" }}>
      This dashboard is your control center for all your cloud services. Think of it like the remote control for
      your own set of powerful computers, storage spaces, and networks that live in a secure data center. You do not
      need to be a tech expert to use it -- we will explain everything in plain language.
    </p>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                style={{
                  backgroundColor: "var(--theme-color-alpha-10, rgba(40,141,209,0.1))",
                }}
              >
                <Icon size={18} style={{ color: "var(--theme-color, #288DD1)" }} />
              </div>
              <h3
                className="font-semibold group-hover:underline"
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

export default ClientDocsHome;

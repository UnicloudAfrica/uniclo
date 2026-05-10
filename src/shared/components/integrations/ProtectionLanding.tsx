import React from "react";
import { ArrowRight, CloudOff, Database, FlaskConical, Monitor, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import ProtectionOverview from "./ProtectionOverview";

interface ShellProps {
  title: string;
  description?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

interface ProtectionLandingProps {
  PageShell: React.ComponentType<ShellProps>;
  context: "admin" | "tenant" | "client";
  basePath: string;
  description: string;
}

/**
 * Friendly workflow tiles — plain English, emoji as visual anchor, brand
 * gradient on the icon chip so cards re-tint with the active theme.
 */
const WORKFLOWS = [
  {
    title: "Practice for a bad day",
    badge: "DR Drills",
    emoji: "🚨",
    description: "Run a fire-drill on your servers — make sure your recovery actually works before you need it.",
    path: "/dr-drills",
    icon: FlaskConical,
  },
  {
    title: "Talk to your VM hosts",
    badge: "Hypervisor",
    emoji: "🖥️",
    description: "Connect VMware, Hyper-V, or KVM hosts so we can move the VMs running on them.",
    path: "/hypervisor",
    icon: Monitor,
  },
  {
    title: "Keep databases in sync",
    badge: "Database Replication",
    emoji: "🗄️",
    description: "Continuous replication for PostgreSQL, MySQL, and MongoDB. We handle the change-data-capture.",
    path: "/database-replication",
    icon: Database,
  },
  {
    title: "Catch threats early",
    badge: "Ransomware",
    emoji: "🛡️",
    description: "We watch your backups for ransomware patterns. If something looks wrong, we tell you fast.",
    path: "/ransomware",
    icon: ShieldAlert,
  },
  {
    title: "Always-ready, only-pays-on-use",
    badge: "Serverless DR",
    emoji: "💤",
    description: "Backup server stays asleep — only the data stays awake. Boots in seconds when disaster strikes.",
    path: "/serverless-dr",
    icon: CloudOff,
  },
];

export default function ProtectionLanding({
  PageShell,
  context,
  basePath,
  description,
}: ProtectionLandingProps) {
  return (
    <PageShell
      title="Replication Policies"
      description={description}
      contentClassName="space-y-6"
    >
      <ProtectionOverview context={context} />

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Other things you can do
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Each one's its own page now — pick the one that matches what you're trying to do.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WORKFLOWS.map((workflow) => (
            <Link
              key={workflow.path}
              to={`${basePath}${workflow.path}`}
              className="group rounded-2xl border border-gray-200 bg-surface-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-gray-800 motion-reduce:hover:translate-y-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl text-white shadow-sm">
                  <span aria-hidden="true">{workflow.emoji}</span>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 text-gray-400 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none dark:text-gray-500"
                />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {workflow.badge}
              </p>
              <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                {workflow.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {workflow.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

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

const WORKFLOWS = [
  {
    title: "DR Drills",
    description: "Schedule and review failover exercises without digging through the DR dashboard.",
    path: "/dr-drills",
    icon: FlaskConical,
    accent: "from-blue-500 to-indigo-500",
  },
  {
    title: "Hypervisor",
    description: "Detect hypervisors, manage guest VMs, and run migrations from a dedicated workspace.",
    path: "/hypervisor",
    icon: Monitor,
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    title: "Database Replication",
    description: "Manage database-native replication groups as their own workflow.",
    path: "/database-replication",
    icon: Database,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Ransomware",
    description: "Review scans, acknowledge findings, and trigger recovery from a focused page.",
    path: "/ransomware",
    icon: ShieldAlert,
    accent: "from-rose-500 to-orange-500",
  },
  {
    title: "Serverless DR",
    description: "Keep policy management separate from broader replication operations.",
    path: "/serverless-dr",
    icon: CloudOff,
    accent: "from-sky-500 to-cyan-500",
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
            Related Workflows
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The detailed DR operations now live in dedicated pages instead of being stacked under
            the old dashboard tab.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WORKFLOWS.map((workflow) => {
            const Icon = workflow.icon;

            return (
              <Link
                key={workflow.path}
                to={`${basePath}${workflow.path}`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${workflow.accent} text-white shadow-sm`}
                  >
                    <Icon size={20} />
                  </div>
                  <ArrowRight
                    size={16}
                    className="mt-1 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500"
                  />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {workflow.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {workflow.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

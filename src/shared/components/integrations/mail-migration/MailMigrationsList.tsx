import React from "react";
import { ChevronRight, Inbox } from "lucide-react";
import { StatusBadge } from "@/shared/components/orbit";
import { useMailMigrations, type MailProvider } from "@/shared/hooks/resources";
import { mailStatusTone } from "./mailStatus";

/**
 * MailMigrationsList — past + running email moves. Each row is clickable
 * into the live progress view.
 */

export interface MailMigrationsListProps {
  onOpen: (identifier: string) => void;
}

const PROVIDER_LABELS: Record<MailProvider, string> = {
  m365: "Microsoft 365",
  gmail: "Gmail",
  imap: "Other email",
};

const providerLabel = (p?: MailProvider) => (p ? PROVIDER_LABELS[p] : "email");

export function MailMigrationsList({ onOpen }: MailMigrationsListProps): React.JSX.Element {
  const { data: migrations = [], isLoading } = useMailMigrations();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (migrations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/40">
        <span aria-hidden="true" className="text-4xl">
          📭
        </span>
        <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          No email moves yet
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          When you move email, you'll see it here so you can check on it any time.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {migrations.map((m) => {
        const badge = mailStatusTone(m.status);
        return (
          <li key={m.identifier}>
            <button
              type="button"
              onClick={() => onOpen(m.identifier)}
              className="group flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-800 dark:bg-gray-900 motion-reduce:hover:translate-y-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                <Inbox className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {providerLabel(m.source_provider)} → {providerLabel(m.dest_provider)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {(m.migrated_messages ?? 0)} of {(m.total_messages ?? 0)} moved
                </p>
              </div>
              <StatusBadge tone={badge.tone} label={badge.label} size="sm" />
              <ChevronRight
                className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default MailMigrationsList;

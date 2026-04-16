/**
 * EventTimeline -- Timeline view of recent events for a database.
 *
 * Shows events in chronological order with type-based icons and colors,
 * collapsible JSON payload viewer, and event type filtering.
 */
import React, { useState, useMemo } from "react";
import {
  Activity,
  Database,
  HardDrive,
  Shield,
  Bell,
  User,
  Wrench,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  Clock,
  Zap,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import { useFetchDatabaseEvents } from "@/shared/hooks/resources/managedDatabaseHooks";
import type { DatabaseEvent } from "@/types/managedDatabase";

// -- Event Type Config --

interface EventTypeConfig {
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

const getEventConfig = (eventType: string): EventTypeConfig => {
  const prefix = eventType.split(".")[0];
  const suffix = eventType.split(".").slice(1).join(".");

  const baseConfigs: Record<string, Omit<EventTypeConfig, "label">> = {
    database: {
      icon: Database,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    backup: {
      icon: HardDrive,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100 dark:bg-violet-900/30",
      borderColor: "border-violet-200 dark:border-violet-800",
    },
    replica: {
      icon: Copy,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
      borderColor: "border-cyan-200 dark:border-cyan-800",
    },
    alert: {
      icon: Bell,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    user: {
      icon: User,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
      borderColor: "border-indigo-200 dark:border-indigo-800",
    },
    password: {
      icon: Shield,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-100 dark:bg-rose-900/30",
      borderColor: "border-rose-200 dark:border-rose-800",
    },
    maintenance: {
      icon: Wrench,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800/50",
      borderColor: "border-gray-200 dark:border-gray-700",
    },
  };

  // Override icon for specific statuses
  const statusIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
    error: XCircle,
    failed: XCircle,
    completed: CheckCircle2,
    created: Zap,
    provisioned: CheckCircle2,
    deleted: XCircle,
    fired: AlertTriangle,
    resolved: CheckCircle2,
    promoted: ArrowUpCircle,
    resized: ArrowUpCircle,
    scheduled: Clock,
    started: Activity,
  };

  const base = baseConfigs[prefix] ?? {
    icon: Activity,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800/50",
    borderColor: "border-gray-200 dark:border-gray-700",
  };

  return {
    ...base,
    icon: statusIcons[suffix] ?? base.icon,
    label: eventType
      .split(".")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" "),
  };
};

// -- Time Display --

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// -- Event Card --

interface EventCardProps {
  event: DatabaseEvent;
  isLast: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const config = getEventConfig(event.type);
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
        >
          <Icon size={14} className={config.color} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-mono font-medium ${config.bgColor} ${config.color} ${config.borderColor}`}
            >
              {event.type}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
            {formatTime(event.created_at)}
          </span>
        </div>

        {/* Payload Preview */}
        {event.payload && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Hide payload" : "View payload"}
          </button>
        )}

        {expanded && event.payload && (
          <div className="mt-2 rounded-lg bg-gray-900 dark:bg-gray-950 p-3 overflow-x-auto">
            <pre className="text-xs text-gray-300 max-h-48 overflow-y-auto">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// -- Filter Dropdown --

const EVENT_PREFIXES = [
  { value: "", label: "All Events" },
  { value: "database", label: "Database" },
  { value: "backup", label: "Backup" },
  { value: "replica", label: "Replica" },
  { value: "alert", label: "Alert" },
  { value: "user", label: "User" },
  { value: "password", label: "Password" },
  { value: "maintenance", label: "Maintenance" },
];

// -- Main Component --

interface EventTimelineProps {
  databaseId?: number | string;
}

const EventTimeline: React.FC<EventTimelineProps> = ({ databaseId }) => {
  const { data: eventsRaw, isLoading, refetch } = useFetchDatabaseEvents(databaseId);
  const [filterPrefix, setFilterPrefix] = useState("");

  const events = useMemo(() => {
    const list = Array.isArray(eventsRaw)
      ? (eventsRaw as DatabaseEvent[])
      : ((eventsRaw as Record<string, unknown>)?.data as DatabaseEvent[]) ?? [];

    if (!filterPrefix) return list;
    return list.filter((e) => e.type.startsWith(filterPrefix + "."));
  }, [eventsRaw, filterPrefix]);

  // -- Loading --
  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Event Timeline
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({events.length} events)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <Filter
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={filterPrefix}
              onChange={(e) => setFilterPrefix(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1.5 pl-7 pr-8 text-xs appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {EVENT_PREFIXES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
          </ModernButton>
        </div>
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <ModernCard className="py-10 text-center">
          <Activity size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">
            {filterPrefix ? "No events matching this filter." : "No events yet."}
          </p>
        </ModernCard>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <ModernCard className="p-4">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              isLast={index === events.length - 1}
            />
          ))}
        </ModernCard>
      )}
    </div>
  );
};

export default EventTimeline;

/**
 * AlertEventHistory — Timeline of alert events for a database.
 *
 * Shows triggered alerts with status badges (firing/acknowledged/resolved),
 * metric values, timestamps, and acknowledge/resolve action buttons.
 * Supports filtering by status and severity.
 */
import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  RefreshCw,
  Search,
  Shield,
  Activity,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchAlertEvents,
  useAcknowledgeAlertEvent,
  useResolveAlertEvent,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { AlertEvent } from "@/types/managedDatabase";

// ─── Status Badge ────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  icon: React.FC<{ size: number; className?: string }>;
  label: string;
  className: string;
  dot: string;
}> = {
  firing: {
    icon: AlertCircle,
    label: "Firing",
    className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-red-500/20",
    dot: "bg-red-500 animate-pulse",
  },
  acknowledged: {
    icon: Eye,
    label: "Acknowledged",
    className: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-500/20",
    dot: "bg-amber-500",
  },
  resolved: {
    icon: CheckCircle2,
    label: "Resolved",
    className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
    dot: "bg-emerald-500",
  },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.firing;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <Icon size={12} />
      {config.label}
    </span>
  );
};

// ─── Severity Badge ──────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

const SeverityIcon: React.FC<{ severity: string }> = ({ severity }) => {
  const colorClass = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.info;
  const Icon = severity === "critical" ? AlertCircle : severity === "warning" ? AlertTriangle : Info;
  return <Icon size={14} className={colorClass} />;
};

// ─── Time Formatting ─────────────────────────────────────────────

const formatTimestamp = (dateStr: string | null): string => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ─── Main Component ──────────────────────────────────────────────

interface AlertEventHistoryProps {
  identifier: string | number;
}

const AlertEventHistory: React.FC<AlertEventHistoryProps> = ({ identifier }) => {
  const { data: eventsRaw, isLoading, refetch } = useFetchAlertEvents(identifier);
  const acknowledgeMutation = useAcknowledgeAlertEvent();
  const resolveMutation = useResolveAlertEvent();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const events = useMemo(() => {
    let list = Array.isArray(eventsRaw) ? (eventsRaw as AlertEvent[]) : [];
    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (severityFilter !== "all") {
      list = list.filter((e) => e.severity === severityFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          (e.rule_name ?? "").toLowerCase().includes(q) ||
          (e.message ?? "").toLowerCase().includes(q) ||
          (e.metric ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [eventsRaw, statusFilter, severityFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const all = Array.isArray(eventsRaw) ? (eventsRaw as AlertEvent[]) : [];
    return {
      all: all.length,
      firing: all.filter((e) => e.status === "firing").length,
      acknowledged: all.filter((e) => e.status === "acknowledged").length,
      resolved: all.filter((e) => e.status === "resolved").length,
    };
  }, [eventsRaw]);

  const handleAcknowledge = async (eventId: number) => {
    try {
      await acknowledgeMutation.mutateAsync({ eventId, identifier });
    } catch {
      // handled by mutation
    }
  };

  const handleResolve = async (eventId: number) => {
    try {
      await resolveMutation.mutateAsync({ eventId, identifier });
    } catch {
      // handled by mutation
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading alert history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filters */}
          {(["all", "firing", "acknowledged", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-0.5 text-[10px] opacity-70">
                {statusCounts[s]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
          </ModernButton>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search alerts..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Empty State */}
      {events.length === 0 && !searchQuery && statusFilter === "all" && (
        <ModernCard className="py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30">
            <Shield className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Alerts Triggered
          </h3>
          <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400">
            All clear! No alert events have been triggered for this database.
          </p>
        </ModernCard>
      )}

      {/* Events Timeline */}
      <div className="space-y-3">
        {events.map((event) => {
          const isFiring = event.status === "firing";
          const isAcknowledged = event.status === "acknowledged";
          const actionPending = acknowledgeMutation.isPending || resolveMutation.isPending;

          return (
            <ModernCard
              key={event.id}
              className={`relative overflow-hidden transition-all duration-200 ${
                isFiring ? "ring-1 ring-red-200 dark:ring-red-800" : ""
              }`}
            >
              {/* Status color strip */}
              <div className={`absolute inset-y-0 left-0 w-1 ${
                isFiring ? "bg-red-500" :
                isAcknowledged ? "bg-amber-500" : "bg-emerald-500"
              }`} />

              <div className="p-5 pl-6 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityIcon severity={event.severity ?? "info"} />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {event.rule_name ?? "Alert"}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {event.message}
                    </p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>

                {/* Metric Details */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Activity size={11} />
                    <span className="font-mono font-medium">{event.metric_value?.toFixed(2)}</span>
                    {event.operator && event.threshold != null && (
                      <span className="text-gray-400">
                        (threshold: {event.threshold})
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {timeAgo(event.triggered_at)}
                  </span>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-gray-400">
                  <div>
                    <span className="font-medium">Triggered:</span>{" "}
                    {formatTimestamp(event.triggered_at)}
                  </div>
                  {event.acknowledged_at && (
                    <div>
                      <span className="font-medium">Acked:</span>{" "}
                      {formatTimestamp(event.acknowledged_at)}
                    </div>
                  )}
                  {event.resolved_at && (
                    <div>
                      <span className="font-medium">Resolved:</span>{" "}
                      {formatTimestamp(event.resolved_at)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(isFiring || isAcknowledged) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    {isFiring && (
                      <ModernButton
                        variant="outline"
                        size="xs"
                        loading={actionPending}
                        onClick={() => handleAcknowledge(event.id)}
                      >
                        <Eye size={12} className="mr-1" />
                        Acknowledge
                      </ModernButton>
                    )}
                    <ModernButton
                      variant="outline"
                      size="xs"
                      loading={actionPending}
                      onClick={() => handleResolve(event.id)}
                    >
                      <CheckCircle2 size={12} className="mr-1" />
                      Resolve
                    </ModernButton>
                  </div>
                )}
              </div>
            </ModernCard>
          );
        })}
      </div>

      {/* Search no results */}
      {(searchQuery || statusFilter !== "all") && events.length === 0 && (
        <ModernCard className="py-10 text-center">
          <Search size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No alerts matching current filters</p>
        </ModernCard>
      )}
    </div>
  );
};

export default AlertEventHistory;

/**
 * RansomwarePanel — Displays ransomware scan dashboard and recent scan results.
 *
 * Shows threat summary cards (total scans, threats detected, critical count,
 * last scan time), color-coded threat level badges, threat level gauge,
 * recent scans list with policy name / threat level / score / timestamp,
 * and action buttons for high/critical threats (Acknowledge, Recover).
 */
import React from "react";
import { ShieldAlert, Bug, CheckCircle2, RotateCcw } from "lucide-react";
import { ModernButton } from "../ui";
import {
  useRansomwareDashboard,
  useRansomwareScans,
  useAcknowledgeRansomware,
  useRecoverFromRansomware,
  type RansomwareScan,
} from "../../hooks/resources/integrationHooks";

interface RansomwarePanelProps {
  integrationKey: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Threat-level style mapping                                        */
/* ------------------------------------------------------------------ */

const THREAT_LEVEL_STYLES: Record<
  string,
  { bg: string; text: string; label: string; dot: string; bar: string; borderLeft: string }
> = {
  none: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-400",
    label: "None",
    dot: "bg-green-500",
    bar: "bg-green-500",
    borderLeft: "border-l-green-500",
  },
  low: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    label: "Low",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    borderLeft: "border-l-blue-500",
  },
  medium: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Medium",
    dot: "bg-yellow-500",
    bar: "bg-yellow-500",
    borderLeft: "border-l-yellow-500",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-400",
    label: "High",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
    borderLeft: "border-l-orange-500",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    label: "Critical",
    dot: "bg-red-500",
    bar: "bg-red-500",
    borderLeft: "border-l-red-500",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Convert an ISO timestamp to a human-friendly relative string. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Map a threat level string to a 0-100 numeric value for the gauge. */
function threatLevelToPercent(level: string): number {
  const map: Record<string, number> = {
    none: 0,
    low: 25,
    medium: 50,
    high: 75,
    critical: 100,
  };
  return map[level] ?? 0;
}

/** Derive an overall threat level from dashboard data. */
function deriveOverallThreat(dashboard: {
  critical_count?: number;
  threats_detected?: number;
  total_scans?: number;
}): string {
  if ((dashboard.critical_count ?? 0) > 0) return "critical";
  if ((dashboard.threats_detected ?? 0) > 0) return "high";
  if ((dashboard.total_scans ?? 0) > 0) return "none";
  return "none";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

const ThreatBadge: React.FC<{ level: string }> = ({ level }) => {
  const style = THREAT_LEVEL_STYLES[level] ?? THREAT_LEVEL_STYLES.none;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

/** Colored progress bar showing a scan score (0-100). */
const ScoreBar: React.FC<{ score: number; level: string }> = ({ score, level }) => {
  const style = THREAT_LEVEL_STYLES[level] ?? THREAT_LEVEL_STYLES.none;
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: "var(--theme-border-color, #e5e7eb)" }}
      >
        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
      <span
        className="text-xs font-medium tabular-nums"
        style={{ color: "var(--theme-muted-color, #6b7280)" }}
      >
        {score}
      </span>
    </div>
  );
};

/** Horizontal threat gauge with a gradient bar from green to red. */
const ThreatGauge: React.FC<{ level: string }> = ({ level }) => {
  const percent = threatLevelToPercent(level);
  const _style = THREAT_LEVEL_STYLES[level] ?? THREAT_LEVEL_STYLES.none;
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--theme-card-bg, #ffffff)",
        border: "1px solid var(--theme-border-color, #e5e7eb)",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--theme-muted-color, #6b7280)" }}
        >
          Overall Threat Level
        </span>
        <ThreatBadge level={level} />
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-green-400 via-yellow-400 via-60% to-red-500">
        {/* Overlay to dim past the indicator */}
        <div
          className="absolute right-0 top-0 h-full rounded-r-full bg-gray-200/60 dark:bg-gray-700/60 transition-all"
          style={{ width: `${100 - percent}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-[10px]" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
          Safe
        </span>
        <span className="text-[10px]" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
          Critical
        </span>
      </div>
    </div>
  );
};

/** Loading skeleton placeholder. */
const SkeletonCard: React.FC = () => (
  <div
    className="animate-pulse rounded-xl p-5"
    style={{
      background: "var(--theme-card-bg, #ffffff)",
      border: "1px solid var(--theme-border-color, #e5e7eb)",
    }}
  >
    <div className="mb-3 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

/** Empty state when no scans exist. */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
      <ShieldAlert size={28} className="text-blue-500" />
    </div>
    <p
      className="mb-1 text-sm font-semibold"
      style={{ color: "var(--theme-heading-color, #111827)" }}
    >
      No scans yet
    </p>
    <p className="max-w-xs text-center text-xs" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
      Ransomware scans will appear here once your protection policies start running.
    </p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

const RansomwarePanel: React.FC<RansomwarePanelProps> = ({ integrationKey, className = "" }) => {
  const { data: dashboard, isLoading: dashboardLoading } = useRansomwareDashboard(integrationKey);
  const { data: scansResult, isLoading: scansLoading } = useRansomwareScans(integrationKey, { per_page: 10 });
  const acknowledge = useAcknowledgeRansomware();
  const recover = useRecoverFromRansomware();

  const scans: RansomwareScan[] = scansResult?.data ?? [];
  const isActionable = (level: string) => level === "high" || level === "critical";

  const overallThreat = dashboard ? deriveOverallThreat(dashboard) : "none";

  const statCards = [
    {
      label: "Total Scans",
      value: dashboard?.total_scans ?? 0,
      icon: <ShieldAlert size={20} />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Threats Detected",
      value: dashboard?.threats_detected ?? 0,
      icon: <Bug size={20} />,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Critical",
      value: dashboard?.critical_count ?? 0,
      icon: <ShieldAlert size={20} />,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "Last Scan",
      value: dashboard?.last_scan_at ? relativeTime(dashboard.last_scan_at) : "N/A",
      icon: <CheckCircle2 size={20} />,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
  ];

  return (
    <div className={className}>
      {/* ---- Header ---- */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-sm">
          <ShieldAlert size={18} />
        </div>
        <h3
          className="text-lg font-bold tracking-tight"
          style={{ color: "var(--theme-heading-color, #111827)" }}
        >
          Ransomware Detection
        </h3>
      </div>

      {/* ---- Hero Stat Cards ---- */}
      {dashboardLoading ? (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md"
              style={{
                background: "var(--theme-card-bg, #ffffff)",
                border: "1px solid var(--theme-border-color, #e5e7eb)",
              }}
            >
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${card.iconBg}`}>
                <span className={card.iconColor}>{card.icon}</span>
              </div>
              <p
                className="text-2xl font-bold tabular-nums leading-none"
                style={{ color: "var(--theme-heading-color, #111827)" }}
              >
                {card.value}
              </p>
              <p
                className="mt-1 text-xs font-medium"
                style={{ color: "var(--theme-muted-color, #6b7280)" }}
              >
                {card.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ---- Threat Gauge ---- */}
      {!dashboardLoading && dashboard && (
        <div className="mb-5">
          <ThreatGauge level={overallThreat} />
        </div>
      )}

      {/* ---- Recent Scans ---- */}
      <div>
        <h4
          className="mb-3 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--theme-muted-color, #6b7280)" }}
        >
          Recent Scans
        </h4>

        {scansLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl p-4"
                style={{
                  background: "var(--theme-card-bg, #ffffff)",
                  border: "1px solid var(--theme-border-color, #e5e7eb)",
                }}
              >
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {scans.map((scan) => {
              const lvl = THREAT_LEVEL_STYLES[scan.threat_level] ?? THREAT_LEVEL_STYLES.none;
              return (
                <div
                  key={scan.id}
                  className={`flex flex-col gap-3 rounded-xl border-l-4 p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${lvl.borderLeft}`}
                  style={{
                    background: "var(--theme-card-bg, #ffffff)",
                    borderRight: "1px solid var(--theme-border-color, #e5e7eb)",
                    borderTop: "1px solid var(--theme-border-color, #e5e7eb)",
                    borderBottom: "1px solid var(--theme-border-color, #e5e7eb)",
                  }}
                >
                  {/* Left content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold"
                      style={{ color: "var(--theme-heading-color, #111827)" }}
                    >
                      {scan.policy_name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <ThreatBadge level={scan.threat_level} />
                      <ScoreBar score={scan.score} level={scan.threat_level} />
                      <span
                        className="text-xs"
                        style={{ color: "var(--theme-muted-color, #6b7280)" }}
                      >
                        {relativeTime(scan.scanned_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {isActionable(scan.threat_level) && !scan.acknowledged_at && (
                      <>
                        <ModernButton
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            acknowledge.mutate({
                              integrationKey,
                              scanId: scan.id,
                            })
                          }
                          disabled={acknowledge.isPending}
                          className="rounded-full px-3"
                        >
                          <CheckCircle2 size={14} />
                          {acknowledge.isPending ? "..." : "Acknowledge"}
                        </ModernButton>
                        <ModernButton
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            recover.mutate({
                              integrationKey,
                              scanId: scan.id,
                            })
                          }
                          disabled={recover.isPending}
                          className="rounded-full px-3"
                        >
                          <RotateCcw size={14} />
                          {recover.isPending ? "..." : "Recover"}
                        </ModernButton>
                      </>
                    )}

                    {scan.acknowledged_at && !scan.recovered_at && (
                      <>
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800"
                          style={{ color: "var(--theme-muted-color, #6b7280)" }}
                        >
                          <CheckCircle2 size={12} />
                          Acknowledged
                        </span>
                        {isActionable(scan.threat_level) && (
                          <ModernButton
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              recover.mutate({
                                integrationKey,
                                scanId: scan.id,
                              })
                            }
                            disabled={recover.isPending}
                            className="rounded-full px-3"
                          >
                            <RotateCcw size={14} />
                            {recover.isPending ? "..." : "Recover"}
                          </ModernButton>
                        )}
                      </>
                    )}

                    {scan.recovered_at && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle2 size={12} />
                        Recovered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RansomwarePanel;

/**
 * DrDashboard — Unified disaster recovery dashboard.
 *
 * Shows cross-provider replication status, backup coverage, RPO metrics,
 * recent failover/drill operations, and per-provider health cards.
 */
import React from "react";
import { Shield, Activity, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw, ArrowLeftRight } from "lucide-react";
import ModernStatsCard from "../ui/ModernStatsCard";
import IntegrationStatusBadge from "./IntegrationStatusBadge";
import DegradationBanner from "./DegradationBanner";
import { useDrDashboard, useDrTimeline, useBidirectionalStatus, type DrDashboardData, type DrTimelineEvent } from "../../hooks/resources/integrationHooks";
import { designTokens } from "@/styles/designTokens";
import { QuorumState, QUORUM_STATE_LABELS, QUORUM_STATE_COLORS, ReplicationMode } from "@/types/bidirectional";

interface DrDashboardProps {
  className?: string;
  activePairId?: string;
}

const DrDashboard: React.FC<DrDashboardProps> = ({ className = "", activePairId }) => {
  const { data: dashboard, isLoading: dashboardLoading } = useDrDashboard();
  const { data: timeline, isLoading: timelineLoading } = useDrTimeline({ limit: 10 });
  const { data: biStatus } = useBidirectionalStatus(activePairId);

  const repl = dashboard?.replication_summary ?? {
    total: 0,
    healthy: 0,
    degraded: 0,
    critical: 0,
    unknown: 0,
  };

  const rpo = dashboard?.rpo_metrics ?? {
    average_lag_seconds: null,
    worst_lag_seconds: null,
    replication_coverage: 0,
  };

  const backupSummary = dashboard?.backup_summary ?? { total: 0, enabled: 0, by_provider: {} };
  const providerHealth = dashboard?.provider_health ?? {};

  const healthPercent = repl.total > 0
    ? Math.round((repl.healthy / repl.total) * 100)
    : 0;

  const formatLag = (seconds: number | null): string => {
    if (seconds === null) return "N/A";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  return (
    <div className={`dr-dashboard ${className}`} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <ModernStatsCard
          title="Protected Resources"
          value={repl.total + backupSummary.total}
          icon={<Shield />}
          color="primary"
          loading={dashboardLoading}
          description={`${repl.total} replicated, ${backupSummary.enabled} backup policies active`}
        />
        <ModernStatsCard
          title="Replication Health"
          value={`${healthPercent}%`}
          icon={<Activity />}
          color={repl.critical > 0 ? "error" : repl.degraded > 0 ? "warning" : "success"}
          loading={dashboardLoading}
          description={`${repl.healthy} healthy, ${repl.degraded} degraded, ${repl.critical} critical`}
        />
        <ModernStatsCard
          title="Average RPO"
          value={formatLag(rpo.average_lag_seconds)}
          icon={<Clock />}
          color={rpo.average_lag_seconds && rpo.average_lag_seconds > 300 ? "warning" : "info"}
          loading={dashboardLoading}
          description={rpo.worst_lag_seconds ? `Worst: ${formatLag(rpo.worst_lag_seconds)}` : "No lag data"}
        />
        <ModernStatsCard
          title="Backup Policies"
          value={backupSummary.enabled}
          suffix={`/ ${backupSummary.total}`}
          icon={<RefreshCw />}
          color="primary"
          loading={dashboardLoading}
          description="Active backup policies"
        />
      </div>

      {/* Bidirectional Status (if active pair) */}
      {activePairId && biStatus?.local_pair && (
        <div>
          {biStatus.local_pair.degraded_at && (
            <DegradationBanner
              pairId={activePairId}
              quorumState={biStatus.local_pair.quorum_state}
              degradedAt={biStatus.local_pair.degraded_at}
              degradationReason={biStatus.local_pair.degradation_reason}
              className="mb-4"
            />
          )}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-purple-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Bidirectional Sync Status
              </h3>
              <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
                biStatus.local_pair.quorum_state === QuorumState.Healthy
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : biStatus.local_pair.quorum_state === QuorumState.Degraded
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {QUORUM_STATE_LABELS[biStatus.local_pair.quorum_state] ?? biStatus.local_pair.quorum_state}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mode</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {biStatus.local_pair.mode === ReplicationMode.BidirectionalSync ? "Bidirectional" : "Active-Passive"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Witness</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {biStatus.local_pair.witness_configured ? "Configured" : "Not configured"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Unresolved Conflicts</p>
                <p className={`text-sm font-medium ${biStatus.local_pair.unresolved_conflict_count > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}>
                  {biStatus.local_pair.unresolved_conflict_count}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Sync</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {biStatus.last_sync_at ? new Date(biStatus.last_sync_at).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Health Cards */}
      {Object.keys(providerHealth).length > 0 && (
        <div>
          <h3 style={{
            fontSize: designTokens.typography.fontSize.lg[0],
            fontWeight: designTokens.typography.fontWeight.semibold,
            color: designTokens.colors.neutral[900],
            marginBottom: "12px",
          }}>
            Provider Health
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {Object.entries(providerHealth).map(([provider, health]) => (
              <div
                key={provider}
                style={{
                  backgroundColor: designTokens.colors.neutral[0],
                  border: `1px solid ${designTokens.colors.neutral[200]}`,
                  borderRadius: designTokens.borderRadius.xl,
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{
                    fontSize: designTokens.typography.fontSize.base[0],
                    fontWeight: designTokens.typography.fontWeight.semibold,
                    color: designTokens.colors.neutral[900],
                    textTransform: "capitalize",
                  }}>
                    {provider}
                  </span>
                  <IntegrationStatusBadge status={health.overall} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ fontSize: designTokens.typography.fontSize.sm[0], color: designTokens.colors.neutral[600] }}>
                    <span style={{ fontWeight: designTokens.typography.fontWeight.medium }}>Replications:</span> {health.replication_count}
                  </div>
                  <div style={{ fontSize: designTokens.typography.fontSize.sm[0], color: designTokens.colors.neutral[600] }}>
                    <span style={{ fontWeight: designTokens.typography.fontWeight.medium }}>Backups:</span> {health.backup_count}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: designTokens.typography.fontSize.sm[0] }}>
                    <CheckCircle size={14} color={designTokens.colors.success[500]} />
                    <span>{health.healthy} healthy</span>
                  </div>
                  {health.critical > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: designTokens.typography.fontSize.sm[0] }}>
                      <XCircle size={14} color={designTokens.colors.error[500]} />
                      <span>{health.critical} critical</span>
                    </div>
                  )}
                  {health.degraded > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: designTokens.typography.fontSize.sm[0] }}>
                      <AlertTriangle size={14} color={designTokens.colors.warning[500]} />
                      <span>{health.degraded} degraded</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Operations Timeline */}
      <div>
        <h3 style={{
          fontSize: designTokens.typography.fontSize.lg[0],
          fontWeight: designTokens.typography.fontWeight.semibold,
          color: designTokens.colors.neutral[900],
          marginBottom: "12px",
        }}>
          Recent DR Operations
        </h3>
        <div style={{
          backgroundColor: designTokens.colors.neutral[0],
          border: `1px solid ${designTokens.colors.neutral[200]}`,
          borderRadius: designTokens.borderRadius.xl,
          overflow: "hidden",
        }}>
          {timelineLoading ? (
            <div style={{ padding: "24px", textAlign: "center", color: designTokens.colors.neutral[500] }}>
              Loading operations...
            </div>
          ) : !timeline || timeline.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: designTokens.colors.neutral[500] }}>
              No recent DR operations
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${designTokens.colors.neutral[200]}` }}>
                  {["Time", "Type", "Resource", "Status", "Duration"].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: designTokens.typography.fontSize.xs[0],
                        fontWeight: designTokens.typography.fontWeight.semibold,
                        color: designTokens.colors.neutral[500],
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeline.map((event: DrTimelineEvent) => (
                  <tr
                    key={event.id}
                    style={{ borderBottom: `1px solid ${designTokens.colors.neutral[100]}` }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: designTokens.typography.fontSize.sm[0], color: designTokens.colors.neutral[600] }}>
                      {event.started_at ? new Date(event.started_at).toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: designTokens.typography.fontSize.sm[0], fontWeight: designTokens.typography.fontWeight.medium }}>
                      {event.operation_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: designTokens.typography.fontSize.sm[0], color: designTokens.colors.neutral[600] }}>
                      {event.resource_type ? `${event.resource_type} #${event.resource_id}` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <IntegrationStatusBadge status={event.status} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: designTokens.typography.fontSize.sm[0], color: designTokens.colors.neutral[600] }}>
                      {event.duration_seconds ? `${event.duration_seconds}s` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Backup Coverage by Provider */}
      {Object.keys(backupSummary.by_provider).length > 0 && (
        <div>
          <h3 style={{
            fontSize: designTokens.typography.fontSize.lg[0],
            fontWeight: designTokens.typography.fontWeight.semibold,
            color: designTokens.colors.neutral[900],
            marginBottom: "12px",
          }}>
            Backup Coverage by Provider
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {Object.entries(backupSummary.by_provider).map(([provider, info]) => (
              <div
                key={provider}
                style={{
                  backgroundColor: designTokens.colors.neutral[0],
                  border: `1px solid ${designTokens.colors.neutral[200]}`,
                  borderRadius: designTokens.borderRadius.xl,
                  padding: "16px",
                }}
              >
                <div style={{
                  fontSize: designTokens.typography.fontSize.sm[0],
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  textTransform: "capitalize",
                  marginBottom: "8px",
                }}>
                  {provider}
                </div>
                <div style={{ fontSize: designTokens.typography.fontSize.sm[0], color: designTokens.colors.neutral[600] }}>
                  {info.enabled} / {info.total} policies active
                </div>
                {info.last_triggered_at && (
                  <div style={{ fontSize: designTokens.typography.fontSize.xs[0], color: designTokens.colors.neutral[500], marginTop: "4px" }}>
                    Last backup: {new Date(info.last_triggered_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrDashboard;

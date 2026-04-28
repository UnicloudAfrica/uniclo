/**
 * SlaCompliancePanel — Displays SLA compliance metrics and snapshot history.
 *
 * Color-coded compliance badge (green >= 95, yellow >= 80, red below)
 * with stats row and a table of recent snapshots.
 */
import React from "react";
import { ShieldCheck, Check, X, Download } from "lucide-react";
import { useSlaHistory, useExportSlaReport } from "../../hooks/resources/integrationHooks";

interface SlaCompliancePanelProps {
  pairId: string;
  className?: string;
}

function complianceColor(pct: number): string {
  if (pct >= 95) return "green";
  if (pct >= 80) return "yellow";
  return "red";
}

const COLOR_MAP = {
  green: {
    ring: "#22c55e",
    ringTrack: "var(--ds-success-subtle, #dcfce7)",
    bg: "var(--ds-success-subtle, #f0fdf4)",
    text: "var(--ds-success-text, #15803d)",
    iconBg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  },
  yellow: {
    ring: "#eab308",
    ringTrack: "var(--ds-warning-subtle, #fef9c3)",
    bg: "var(--ds-warning-subtle, #fefce8)",
    text: "var(--ds-warning-text, #a16207)",
    iconBg: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
  },
  red: {
    ring: "#ef4444",
    ringTrack: "var(--ds-error-subtle, #fee2e2)",
    bg: "var(--ds-error-subtle, #fef2f2)",
    text: "var(--ds-error-text, #b91c1c)",
    iconBg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  },
} as const;

function formatLag(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

/* ---------- Circular progress ring ---------- */

const ComplianceRing: React.FC<{ pct: number; color: string }> = ({ pct, color }) => {
  const palette = COLOR_MAP[color as keyof typeof COLOR_MAP] ?? COLOR_MAP.red;
  const size = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={palette.ringTrack}
            strokeWidth={stroke}
          />
          {/* Value */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={palette.ring}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        {/* Center label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 700, color: palette.text, lineHeight: 1 }}>
            {pct.toFixed(1)}%
          </span>
          <span style={{ fontSize: 11, color: "var(--ds-text-subtle, #6b7280)", marginTop: 2 }}>
            Compliance
          </span>
        </div>
      </div>
    </div>
  );
};

/* ---------- styles ---------- */

const s = {
  panel: {
    borderRadius: 16,
    border: "1px solid var(--ds-border, #e5e7eb)",
    background: "var(--ds-surface, #ffffff)",
    overflow: "hidden" as const,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid var(--ds-border-subtle, #f3f4f6)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--ds-text, #111827)",
    margin: 0,
  },
  subtitle: {
    fontSize: 12,
    color: "var(--ds-text-subtle, #6b7280)",
    margin: 0,
    marginTop: 2,
  },
  exportBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s ease, transform 0.15s ease",
    boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
  } as React.CSSProperties,
  body: {
    padding: 24,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    marginTop: 20,
  },
  statCard: (_accentBg: string) =>
    ({
      borderRadius: 14,
      border: "1px solid var(--ds-border, #e5e7eb)",
      padding: "18px 16px",
      background: "var(--ds-surface, #ffffff)",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }) as React.CSSProperties,
  statIcon: (bg: string) =>
    ({
      width: 40,
      height: 40,
      borderRadius: 12,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }) as React.CSSProperties,
  statLabel: {
    fontSize: 12,
    color: "var(--ds-text-subtle, #6b7280)",
    margin: 0,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--ds-text, #111827)",
    margin: 0,
    lineHeight: 1.2,
    marginTop: 2,
  },
  /* Table */
  tableWrap: {
    borderRadius: 12,
    border: "1px solid var(--ds-border, #e5e7eb)",
    overflow: "hidden" as const,
    marginTop: 20,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--ds-text-subtle, #6b7280)",
    background: "var(--ds-surface-raised, #f9fafb)",
    borderBottom: "1px solid var(--ds-border, #e5e7eb)",
  },
  td: (isEven: boolean) =>
    ({
      padding: "12px 16px",
      color: "var(--ds-text, #374151)",
      background: isEven
        ? "var(--ds-surface-raised, #f9fafb)"
        : "var(--ds-surface, #ffffff)",
      borderBottom: "1px solid var(--ds-border-subtle, #f3f4f6)",
    }) as React.CSSProperties,
  compliantBadge: (compliant: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      background: compliant
        ? "var(--ds-success-subtle, #dcfce7)"
        : "var(--ds-error-subtle, #fee2e2)",
      color: compliant
        ? "var(--ds-success-text, #15803d)"
        : "var(--ds-error-text, #b91c1c)",
    }) as React.CSSProperties,
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    color: "var(--ds-text-subtle, #9ca3af)",
    fontSize: 14,
  },
  empty: {
    textAlign: "center" as const,
    padding: 48,
    color: "var(--ds-text-subtle, #9ca3af)",
    fontSize: 14,
    lineHeight: 1.6,
  },
  exportRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 20,
  },
} as const;

const SlaCompliancePanel: React.FC<SlaCompliancePanelProps> = ({ pairId, className = "" }) => {
  const { data: sla, isLoading } = useSlaHistory(pairId);
  const exportReport = useExportSlaReport();

  const compliancePct = Number(sla?.compliance_percent ?? 0);
  const color = complianceColor(compliancePct);
  const palette = COLOR_MAP[color as keyof typeof COLOR_MAP];
  const snapshots = (sla?.snapshots as Array<Record<string, unknown>>) ?? [];

  return (
    <div className={className} style={s.panel}>
      {/* ---- Header ---- */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.iconCircle}>
            <ShieldCheck size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={s.title}>SLA Compliance</h3>
            <p style={s.subtitle}>Replication performance monitoring</p>
          </div>
        </div>
      </div>

      {/* ---- Body ---- */}
      <div style={s.body}>
        {isLoading ? (
          <div style={s.loading}>Loading SLA data...</div>
        ) : !sla ? (
          <div style={s.empty}>
            <ShieldCheck size={32} color="var(--ds-text-subtle, #d1d5db)" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No SLA data available</p>
          </div>
        ) : (
          <>
            {/* -- Compliance hero ring -- */}
            <ComplianceRing pct={compliancePct} color={color} />

            {/* -- Stats row -- */}
            <div style={s.statsRow}>
              {/* Compliance % */}
              <div style={s.statCard(palette.bg)}>
                <div style={s.statIcon(palette.iconBg)}>
                  <ShieldCheck size={18} color="#ffffff" />
                </div>
                <div>
                  <p style={s.statLabel}>Compliance</p>
                  <p style={s.statValue}>{compliancePct.toFixed(1)}%</p>
                </div>
              </div>
              {/* Avg Lag */}
              <div style={s.statCard("transparent")}>
                <div style={s.statIcon("linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)")}>
                  <ShieldCheck size={18} color="#ffffff" />
                </div>
                <div>
                  <p style={s.statLabel}>Avg Lag</p>
                  <p style={s.statValue}>{formatLag(Number(sla.average_lag ?? 0))}</p>
                </div>
              </div>
              {/* Breaches */}
              <div style={s.statCard("transparent")}>
                <div style={s.statIcon("linear-gradient(135deg, #ef4444 0%, #dc2626 100%)")}>
                  <X size={18} color="#ffffff" />
                </div>
                <div>
                  <p style={s.statLabel}>Breaches</p>
                  <p style={s.statValue}>{Number(sla.breach_count ?? 0)}</p>
                </div>
              </div>
            </div>

            {/* -- Snapshot table -- */}
            {snapshots.length > 0 && (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Recorded At</th>
                      <th style={s.th}>Lag</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Syncs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((snap, idx) => {
                      const isEven = idx % 2 === 0;
                      const compliant = Boolean(snap.compliant);
                      return (
                        <tr key={idx}>
                          <td style={s.td(isEven)}>
                            {String(snap.recorded_at ?? "")}
                          </td>
                          <td style={s.td(isEven)}>
                            {formatLag(Number(snap.actual_lag_seconds ?? 0))}
                          </td>
                          <td style={s.td(isEven)}>
                            <span style={s.compliantBadge(compliant)}>
                              {compliant ? (
                                <Check size={12} />
                              ) : (
                                <X size={12} />
                              )}
                              {compliant ? "Compliant" : "Breach"}
                            </span>
                          </td>
                          <td style={s.td(isEven)}>
                            {Number(snap.sync_count ?? 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* -- Export button -- */}
            <div style={s.exportRow}>
              <button
                onClick={() => exportReport.mutate({ period: "30d", include_drills: true, include_replication: true })}
                disabled={exportReport.isPending}
                style={{
                  ...s.exportBtn,
                  opacity: exportReport.isPending ? 0.6 : 1,
                  cursor: exportReport.isPending ? "not-allowed" : "pointer",
                }}
                title="Export SLA report as PDF"
              >
                <Download size={15} />
                {exportReport.isPending ? "Exporting..." : "Export Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SlaCompliancePanel;

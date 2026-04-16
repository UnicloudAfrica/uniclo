/**
 * HypervisorPanel — Hypervisor management panel for the DR Dashboard.
 *
 * Provides endpoint selection, hypervisor detection, VM listing with
 * power actions, CBT toggle, and live/offline migration with progress tracking.
 */
import React, { useState, useEffect } from "react";
import {
  Server,
  Play,
  Square,
  Cpu,
  HardDrive,
  ArrowRightLeft,
  Activity,
  RefreshCw,
  X,
} from "lucide-react";
import { ModernButton } from "../ui";
import {
  useDetectHypervisor,
  useHypervisorVMs,
  useHypervisorVMAction,
  useEnableHypervisorCBT,
  useHypervisorCBTStatus,
  useMigrateHypervisorVM,
  useHypervisorMigrationProgress,
} from "../../hooks/resources/integrationHooks";

/* ------------------------------------------------------------------ */
/*  Inline styles object for the modern redesign                      */
/* ------------------------------------------------------------------ */
const S = {
  panel: {
    borderRadius: 16,
    border: "1px solid var(--theme-border-color, #e5e7eb)",
    background: "var(--theme-card-bg, #ffffff)",
    overflow: "hidden" as const,
    boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06)",
  },

  /* Header */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid var(--theme-border-color, #e5e7eb)",
    background:
      "linear-gradient(135deg, rgba(99,102,241,.04) 0%, rgba(168,85,247,.04) 100%)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--theme-heading-color, #111827)",
    margin: 0,
    lineHeight: 1.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "var(--theme-muted-color, #6b7280)",
    marginTop: 2,
  },
  versionPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.02em",
  },

  /* Body */
  body: {
    padding: 24,
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },

  /* Endpoint selector card */
  endpointCard: {
    borderRadius: 12,
    border: "1px solid var(--theme-border-color, #e5e7eb)",
    background: "var(--theme-card-bg, #ffffff)",
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  endpointIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background:
      "linear-gradient(135deg, rgba(99,102,241,.1) 0%, rgba(168,85,247,.1) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,
  endpointContent: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  endpointLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  endpointLabelText: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--theme-muted-color, #6b7280)",
  },
  countBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "0 6px",
  },
  select: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid var(--theme-border-color, #e5e7eb)",
    background: "var(--theme-card-bg, #ffffff)",
    padding: "8px 12px",
    fontSize: 14,
    color: "var(--theme-text-color, #374151)",
    outline: "none",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'none\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M3 4.5l3 3 3-3\' stroke=\'%236b7280\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: 12,
  },

  /* Detection card */
  detectionCard: {
    borderRadius: 12,
    border: "1px solid var(--theme-border-color, #e5e7eb)",
    background: "var(--theme-card-bg, #ffffff)",
    padding: 20,
  },
  detectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  detectionTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
  detectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--theme-heading-color, #111827)",
  },
  detectionSubtitle: {
    fontSize: 12,
    color: "var(--theme-muted-color, #6b7280)",
  },
  capsGrid: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  capTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 12px",
    borderRadius: 8,
    border: "1px solid var(--theme-border-color, #e5e7eb)",
    background:
      "linear-gradient(135deg, rgba(99,102,241,.06) 0%, rgba(168,85,247,.06) 100%)",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--theme-text-color, #374151)",
  },
  capDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    flexShrink: 0,
  } as React.CSSProperties,

  /* Loading */
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "var(--theme-muted-color, #6b7280)",
    padding: "12px 0",
  },

  /* Table */
  tableWrapper: {
    borderRadius: 12,
    border: "1px solid var(--theme-border-color, #e5e7eb)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 14,
  },
  th: {
    textAlign: "left" as const,
    padding: "12px 16px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--theme-muted-color, #6b7280)",
    background:
      "linear-gradient(180deg, rgba(99,102,241,.04) 0%, rgba(99,102,241,.02) 100%)",
    borderBottom: "1px solid var(--theme-border-color, #e5e7eb)",
  },
  thRight: {
    textAlign: "right" as const,
    padding: "12px 16px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--theme-muted-color, #6b7280)",
    background:
      "linear-gradient(180deg, rgba(99,102,241,.04) 0%, rgba(99,102,241,.02) 100%)",
    borderBottom: "1px solid var(--theme-border-color, #e5e7eb)",
  },
  thIcon: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },

  /* Empty state */
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "48px 24px",
    textAlign: "center" as const,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background:
      "linear-gradient(135deg, rgba(99,102,241,.08) 0%, rgba(168,85,247,.08) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  } as React.CSSProperties,
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--theme-heading-color, #111827)",
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: "var(--theme-muted-color, #6b7280)",
    maxWidth: 280,
    lineHeight: 1.5,
  },

  /* Migration modal */
  migrationOverlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,.45)",
    backdropFilter: "blur(4px)",
  },
  migrationCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 16,
    overflow: "hidden",
    background: "var(--theme-card-bg, #ffffff)",
    boxShadow: "0 25px 50px rgba(0,0,0,.2)",
  },
  migrationHeader: {
    padding: "18px 24px",
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  migrationHeaderTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
  },
  migrationClose: {
    background: "rgba(255,255,255,.2)",
    border: "none",
    borderRadius: 8,
    padding: 6,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    transition: "background .15s",
  },
  migrationBody: {
    padding: 24,
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  fieldLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--theme-muted-color, #6b7280)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: 8,
  },

  /* Migration type cards */
  typeCardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  typeCard: (selected: boolean) =>
    ({
      padding: "12px 8px",
      borderRadius: 10,
      border: `2px solid ${selected ? "#6366f1" : "var(--theme-border-color, #e5e7eb)"}`,
      background: selected
        ? "linear-gradient(135deg, rgba(99,102,241,.08) 0%, rgba(168,85,247,.08) 100%)"
        : "transparent",
      cursor: "pointer",
      textAlign: "center" as const,
      transition: "all .15s ease",
    }) as React.CSSProperties,
  typeCardLabel: (selected: boolean) => ({
    fontSize: 12,
    fontWeight: selected ? 700 : 500,
    color: selected
      ? "#6366f1"
      : "var(--theme-text-color, #374151)",
  }),

  /* Bandwidth slider */
  sliderContainer: {
    position: "relative" as const,
  },
  sliderTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    appearance: "none" as const,
    outline: "none",
    cursor: "pointer",
    background: "var(--theme-border-color, #e5e7eb)",
  },
  sliderLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 6,
    fontSize: 11,
    color: "var(--theme-muted-color, #6b7280)",
  },
  bwValue: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 6,
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },

  /* Action buttons */
  actionGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  iconBtn: (hoverColor: string) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      borderRadius: 8,
      border: "1px solid var(--theme-border-color, #e5e7eb)",
      background: "transparent",
      cursor: "pointer",
      color: "var(--theme-muted-color, #6b7280)",
      transition: "all .15s ease",
      position: "relative" as const,
    }) as React.CSSProperties,
  tooltip: {
    position: "absolute" as const,
    bottom: "calc(100% + 6px)",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "4px 8px",
    borderRadius: 6,
    background: "#1f2937",
    color: "#fff",
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
    pointerEvents: "none" as const,
    opacity: 0,
    transition: "opacity .15s",
  },

  /* Progress bar */
  progressWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    background: "var(--theme-border-color, #e5e7eb)",
    overflow: "hidden",
    position: "relative" as const,
  },
  progressFill: (pct: number) =>
    ({
      height: "100%",
      borderRadius: 999,
      background: "linear-gradient(90deg, #6366f1 0%, #a855f7 100%)",
      width: `${pct}%`,
      transition: "width .4s cubic-bezier(.4,0,.2,1)",
      position: "relative" as const,
    }) as React.CSSProperties,
  progressLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6366f1",
    minWidth: 36,
    textAlign: "right" as const,
  },

  /* CBT toggle */
  cbtSwitch: (on: boolean) =>
    ({
      width: 36,
      height: 20,
      borderRadius: 999,
      background: on
        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        : "var(--theme-border-color, #d1d5db)",
      cursor: on ? "default" : "pointer",
      position: "relative" as const,
      transition: "background .2s ease",
      border: "none",
      padding: 0,
      flexShrink: 0,
    }) as React.CSSProperties,
  cbtKnob: (on: boolean) =>
    ({
      position: "absolute" as const,
      top: 2,
      left: on ? 18 : 2,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      transition: "left .2s ease",
    }) as React.CSSProperties,
} as const;

/* ================================================================== */
/*  Scoped CSS for hover/animation effects                            */
/* ================================================================== */
const scopedCSS = `
.hp-table-row {
  transition: background .15s ease;
}
.hp-table-row:hover {
  background: linear-gradient(90deg, rgba(99,102,241,.03) 0%, rgba(168,85,247,.03) 100%);
}
.hp-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color, #e5e7eb);
  background: transparent;
  cursor: pointer;
  color: var(--theme-muted-color, #6b7280);
  transition: all .15s ease;
  position: relative;
}
.hp-icon-btn:hover {
  background: linear-gradient(135deg, rgba(99,102,241,.1) 0%, rgba(168,85,247,.1) 100%);
  color: #6366f1;
  border-color: rgba(99,102,241,.3);
}
.hp-icon-btn:hover .hp-tooltip {
  opacity: 1;
}
.hp-icon-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}
.hp-icon-btn:disabled:hover {
  background: transparent;
  color: var(--theme-muted-color, #6b7280);
  border-color: var(--theme-border-color, #e5e7eb);
}
.hp-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  border-radius: 6px;
  background: #1f2937;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity .15s;
  z-index: 10;
}
.hp-progress-shine {
  position: relative;
  overflow: hidden;
}
.hp-progress-shine::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.3) 50%, transparent 100%);
  animation: hp-shine 2s infinite;
}
@keyframes hp-shine {
  0%   { left: -100%; }
  100% { left: 100%; }
}
.hp-migration-close:hover {
  background: rgba(255,255,255,.35) !important;
}
.hp-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,.15);
}
.hp-type-card:hover {
  border-color: rgba(99,102,241,.4) !important;
}
.hp-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 var(--slider-pct, 50%), var(--theme-border-color, #e5e7eb) var(--slider-pct, 50%));
}
.hp-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(99,102,241,.35);
  cursor: pointer;
}
.hp-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(99,102,241,.35);
  cursor: pointer;
}
.hp-footer-btns {
  display: flex;
  gap: 10px;
  padding-top: 4px;
}
`;

/* ================================================================== */
/*  Interfaces                                                        */
/* ================================================================== */

interface EndpointItem {
  id: string;
  identifier: string;
  name: string;
  host: string;
  resource_type: string;
}

interface HypervisorPanelProps {
  endpoints: EndpointItem[];
  className?: string;
}

/* ================================================================== */
/*  HypervisorPanel                                                   */
/* ================================================================== */

const HypervisorPanel: React.FC<HypervisorPanelProps> = ({ endpoints, className = "" }) => {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [migratingVM, setMigratingVM] = useState<string | null>(null);
  const [migrationTarget, setMigrationTarget] = useState("");
  const [migrationType, setMigrationType] = useState<"live_precopy" | "live_postcopy" | "offline">("live_precopy");
  const [bandwidthLimit, setBandwidthLimit] = useState(100);
  const [activeMigrationVM, setActiveMigrationVM] = useState<string | null>(null);

  // Queries
  const { data: detection, isLoading: detectLoading } = useDetectHypervisor(selectedEndpointId);
  const { data: vms = [], isLoading: vmsLoading } = useHypervisorVMs(selectedEndpointId);
  const { data: migrationProgress } = useHypervisorMigrationProgress(
    selectedEndpointId,
    activeMigrationVM,
    { enabled: Boolean(activeMigrationVM) },
  );

  // Mutations
  const vmAction = useHypervisorVMAction();
  const enableCBT = useEnableHypervisorCBT();
  const migrateVM = useMigrateHypervisorVM();

  // Clear migration progress polling when complete
  useEffect(() => {
    if (migrationProgress?.status === "completed" || migrationProgress?.status === "failed") {
      const timer = setTimeout(() => setActiveMigrationVM(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [migrationProgress?.status]);

  const handleVMAction = (vmName: string, action: string) => {
    if (!selectedEndpointId) return;
    vmAction.mutate({ endpointId: selectedEndpointId, vmName, action });
  };

  const handleEnableCBT = (vmName: string) => {
    if (!selectedEndpointId) return;
    enableCBT.mutate({ endpointId: selectedEndpointId, vmName });
  };

  const handleStartMigration = () => {
    if (!selectedEndpointId || !migratingVM || !migrationTarget) return;
    migrateVM.mutate(
      {
        endpointId: selectedEndpointId,
        vmName: migratingVM,
        target_endpoint_identifier: migrationTarget,
        migration_type: migrationType,
        bandwidth_mbps: bandwidthLimit,
      },
      {
        onSuccess: () => {
          setActiveMigrationVM(migratingVM);
          setMigratingVM(null);
        },
      },
    );
  };

  const migrationTypeLabels: Record<string, string> = {
    live_precopy: "Live Pre-copy",
    live_postcopy: "Live Post-copy",
    offline: "Offline",
  };

  const sliderPct = ((bandwidthLimit - 10) / (10000 - 10)) * 100;

  return (
    <>
      {/* Scoped CSS */}
      <style>{scopedCSS}</style>

      <div className={className} style={S.panel}>
        {/* ── Header ───────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerIcon}>
              <Server size={18} color="#fff" />
            </div>
            <div>
              <h3 style={S.headerTitle}>Hypervisor Management</h3>
              <p style={S.headerSubtitle}>
                Manage endpoints, VMs, and migrations
              </p>
            </div>
          </div>
          {detection && !detectLoading && (
            <span style={S.versionPill}>
              <Activity size={12} />
              {detection.hypervisor_type} {detection.version}
            </span>
          )}
        </div>

        <div style={S.body}>
          {/* ── Endpoint Selector Card ─────────────────────────── */}
          <div style={S.endpointCard}>
            <div style={S.endpointIcon}>
              <Server size={20} color="#6366f1" />
            </div>
            <div style={S.endpointContent}>
              <div style={S.endpointLabel}>
                <span style={S.endpointLabelText}>Select Endpoint</span>
                <span style={S.countBadge}>{endpoints.length}</span>
              </div>
              <select
                value={selectedEndpointId ?? ""}
                onChange={(e) => {
                  setSelectedEndpointId(e.target.value || null);
                  setMigratingVM(null);
                  setActiveMigrationVM(null);
                }}
                className="hp-select"
                style={S.select}
              >
                <option value="">Choose an endpoint...</option>
                {endpoints.map((ep) => (
                  <option key={ep.identifier} value={ep.identifier}>
                    {ep.name} ({ep.host}) -- {ep.resource_type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Detection Loading ──────────────────────────────── */}
          {selectedEndpointId && detectLoading && (
            <div style={S.loadingRow}>
              <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
              Detecting hypervisor...
            </div>
          )}

          {/* ── Detection Info Card ────────────────────────────── */}
          {selectedEndpointId && detection && !detectLoading && (
            <div style={S.detectionCard}>
              <div style={S.detectionHeader}>
                <div style={S.detectionTypeIcon}>
                  <Cpu size={16} color="#fff" />
                </div>
                <div>
                  <div style={S.detectionTitle}>{detection.hypervisor_type}</div>
                  <div style={S.detectionSubtitle}>
                    Detected capabilities
                  </div>
                </div>
              </div>
              <div style={S.capsGrid}>
                {detection.capabilities.map((cap: string) => (
                  <span key={cap} style={S.capTag}>
                    <span style={S.capDot} />
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── VM Table ───────────────────────────────────────── */}
          {selectedEndpointId && (
            <>
              {vmsLoading ? (
                <div style={S.loadingRow}>
                  <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Loading virtual machines...
                </div>
              ) : vms.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={S.emptyIcon}>
                    <Server size={26} color="#6366f1" />
                  </div>
                  <div style={S.emptyTitle}>No Virtual Machines</div>
                  <div style={S.emptyDesc}>
                    No VMs were found on this endpoint. Check your hypervisor
                    configuration or select a different endpoint.
                  </div>
                </div>
              ) : (
                <div style={S.tableWrapper}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Name</th>
                          <th style={S.th}>Status</th>
                          <th style={S.th}>
                            <span style={S.thIcon}>
                              <HardDrive size={11} /> Memory
                            </span>
                          </th>
                          <th style={S.th}>
                            <span style={S.thIcon}>
                              <Cpu size={11} /> CPU
                            </span>
                          </th>
                          <th style={S.th}>CBT</th>
                          <th style={S.thRight}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vms.map((vm: any) => (
                          <VMRow
                            key={vm.name}
                            vm={vm}
                            endpointId={selectedEndpointId}
                            onAction={handleVMAction}
                            onEnableCBT={handleEnableCBT}
                            onMigrate={() => setMigratingVM(vm.name)}
                            actionPending={vmAction.isPending}
                            cbtPending={enableCBT.isPending}
                            isMigrating={activeMigrationVM === vm.name}
                            migrationProgress={
                              activeMigrationVM === vm.name ? migrationProgress : undefined
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── No endpoint selected empty state ──────────────── */}
          {!selectedEndpointId && (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>
                <Activity size={26} color="#6366f1" />
              </div>
              <div style={S.emptyTitle}>Select an Endpoint</div>
              <div style={S.emptyDesc}>
                Choose a hypervisor endpoint above to view and manage virtual
                machines.
              </div>
            </div>
          )}
        </div>

        {/* ── Migration Modal ────────────────────────────────── */}
        {migratingVM && (
          <div style={S.migrationOverlay} onClick={() => setMigratingVM(null)}>
            <div
              style={S.migrationCard}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient header */}
              <div style={S.migrationHeader}>
                <div style={S.migrationHeaderTitle}>
                  <ArrowRightLeft size={16} />
                  Migrate: {migratingVM}
                </div>
                <button
                  onClick={() => setMigratingVM(null)}
                  className="hp-migration-close"
                  style={S.migrationClose}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={S.migrationBody}>
                {/* Target endpoint */}
                <div>
                  <label style={S.fieldLabel}>Target Endpoint</label>
                  <select
                    value={migrationTarget}
                    onChange={(e) => setMigrationTarget(e.target.value)}
                    className="hp-select"
                    style={S.select}
                  >
                    <option value="">Select target...</option>
                    {endpoints
                      .filter((ep) => ep.identifier !== selectedEndpointId)
                      .map((ep) => (
                        <option key={ep.identifier} value={ep.identifier}>
                          {ep.name} ({ep.host})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Migration type cards */}
                <div>
                  <label style={S.fieldLabel}>Migration Type</label>
                  <div style={S.typeCardsGrid}>
                    {(["live_precopy", "live_postcopy", "offline"] as const).map((type) => (
                      <div
                        key={type}
                        className="hp-type-card"
                        style={S.typeCard(migrationType === type)}
                        onClick={() => setMigrationType(type)}
                      >
                        <div style={{ marginBottom: 4 }}>
                          {type === "offline" ? (
                            <Square size={18} color={migrationType === type ? "#6366f1" : "#9ca3af"} />
                          ) : (
                            <Activity size={18} color={migrationType === type ? "#6366f1" : "#9ca3af"} />
                          )}
                        </div>
                        <div style={S.typeCardLabel(migrationType === type)}>
                          {migrationTypeLabels[type]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bandwidth slider */}
                <div>
                  <label style={S.fieldLabel}>Bandwidth Limit</label>
                  <div style={S.bwValue}>
                    <Activity size={12} />
                    {bandwidthLimit >= 1000
                      ? `${(bandwidthLimit / 1000).toFixed(1)} Gbps`
                      : `${bandwidthLimit} Mbps`}
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={10000}
                    step={10}
                    value={bandwidthLimit}
                    onChange={(e) => setBandwidthLimit(Number(e.target.value))}
                    className="hp-slider"
                    style={{ "--slider-pct": `${sliderPct}%` } as React.CSSProperties}
                  />
                  <div style={S.sliderLabels}>
                    <span>10 Mbps</span>
                    <span>1 Gbps</span>
                    <span>10 Gbps</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="hp-footer-btns">
                  <ModernButton
                    variant="primary"
                    size="sm"
                    onClick={handleStartMigration}
                    disabled={!migrationTarget || migrateVM.isPending}
                  >
                    {migrateVM.isPending ? "Starting..." : "Start Migration"}
                  </ModernButton>
                  <ModernButton variant="outline" size="sm" onClick={() => setMigratingVM(null)}>
                    Cancel
                  </ModernButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* ================================================================== */
/*  VMRow sub-component                                               */
/* ================================================================== */

interface VMRowProps {
  vm: {
    name: string;
    status: string;
    memory_mb: number;
    cpu_count: number;
    cbt_enabled?: boolean;
  };
  endpointId: string;
  onAction: (vmName: string, action: string) => void;
  onEnableCBT: (vmName: string) => void;
  onMigrate: () => void;
  actionPending: boolean;
  cbtPending: boolean;
  isMigrating: boolean;
  migrationProgress?: { status: string; percent: number } | null;
}

const VMRow: React.FC<VMRowProps> = ({
  vm,
  endpointId,
  onAction,
  onEnableCBT,
  onMigrate,
  actionPending,
  cbtPending,
  isMigrating,
  migrationProgress,
}) => {
  const { data: cbtStatus } = useHypervisorCBTStatus(endpointId, vm.name);
  const cbtEnabled = vm.cbt_enabled ?? (cbtStatus as { enabled?: boolean } | undefined)?.enabled ?? false;
  const isRunning = vm.status === "running";

  const statusColor = isRunning ? "#10b981" : "#9ca3af";
  const statusBg = isRunning
    ? "rgba(16,185,129,.1)"
    : "rgba(156,163,175,.1)";

  const memoryDisplay =
    vm.memory_mb >= 1024
      ? `${(vm.memory_mb / 1024).toFixed(1)} GB`
      : `${vm.memory_mb} MB`;

  const cellBase: React.CSSProperties = {
    padding: "14px 16px",
    borderBottom: "1px solid var(--theme-border-color, #e5e7eb)",
  };

  return (
    <tr className="hp-table-row">
      {/* Name */}
      <td style={{ ...cellBase, fontWeight: 600, color: "var(--theme-heading-color, #111827)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Server size={14} color="#6366f1" />
          {vm.name}
        </div>
      </td>

      {/* Status badge */}
      <td style={cellBase}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            borderRadius: 999,
            background: statusBg,
            fontSize: 12,
            fontWeight: 600,
            color: statusColor,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: statusColor,
              boxShadow: isRunning ? `0 0 6px ${statusColor}` : "none",
            }}
          />
          {vm.status.charAt(0).toUpperCase() + vm.status.slice(1)}
        </span>
      </td>

      {/* Memory */}
      <td style={{ ...cellBase, color: "var(--theme-text-color, #374151)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <HardDrive size={13} color="var(--theme-muted-color, #6b7280)" />
          {memoryDisplay}
        </span>
      </td>

      {/* CPU */}
      <td style={{ ...cellBase, color: "var(--theme-text-color, #374151)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Cpu size={13} color="var(--theme-muted-color, #6b7280)" />
          {vm.cpu_count} vCPU
        </span>
      </td>

      {/* CBT toggle switch */}
      <td style={cellBase}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => !cbtEnabled && onEnableCBT(vm.name)}
            disabled={cbtEnabled || cbtPending}
            style={S.cbtSwitch(cbtEnabled)}
            title={cbtEnabled ? "CBT enabled" : "Click to enable CBT"}
          >
            <span style={S.cbtKnob(cbtEnabled)} />
          </button>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: cbtEnabled
                ? "#10b981"
                : "var(--theme-muted-color, #6b7280)",
            }}
          >
            {cbtEnabled ? "On" : "Off"}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td style={{ ...cellBase, textAlign: "right" }}>
        {isMigrating && migrationProgress ? (
          <div style={S.progressWrapper}>
            <Activity
              size={14}
              color="#6366f1"
              style={{ animation: "pulse 2s infinite", flexShrink: 0 }}
            />
            <div style={S.progressTrack}>
              <div
                className="hp-progress-shine"
                style={S.progressFill(migrationProgress.percent)}
              />
            </div>
            <span style={S.progressLabel}>
              {migrationProgress.percent}%
            </span>
          </div>
        ) : (
          <div style={S.actionGroup}>
            {isRunning ? (
              <button
                className="hp-icon-btn"
                onClick={() => onAction(vm.name, "stop")}
                disabled={actionPending}
              >
                <Square size={13} />
                <span className="hp-tooltip">Stop VM</span>
              </button>
            ) : (
              <button
                className="hp-icon-btn"
                onClick={() => onAction(vm.name, "start")}
                disabled={actionPending}
              >
                <Play size={13} />
                <span className="hp-tooltip">Start VM</span>
              </button>
            )}
            <button
              className="hp-icon-btn"
              onClick={onMigrate}
            >
              <ArrowRightLeft size={13} />
              <span className="hp-tooltip">Migrate VM</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default HypervisorPanel;

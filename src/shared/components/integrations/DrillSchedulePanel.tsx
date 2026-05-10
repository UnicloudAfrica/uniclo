/**
 * DrillSchedulePanel — Manages auto-scheduling for DR drill tests.
 *
 * Provides controls for enabling/disabling automatic drill scheduling,
 * configuring frequency, day-of-week, hour, and isolation mode.
 * Uses useConfigureDrillSchedule and useDisableDrillSchedule mutation hooks.
 */
import React, { useState } from "react";
import { CalendarClock, Shield } from "lucide-react";
import { ModernButton } from "../ui";
import { useConfigureDrillSchedule, useDisableDrillSchedule } from "../../hooks/resources/integrationHooks";

interface DrillSchedulePanelProps {
  drillId: string;
  className?: string;
  initialConfig?: {
    auto_schedule_enabled?: boolean;
    schedule_frequency?: "weekly" | "monthly" | "quarterly";
    schedule_day_of_week?: number;
    schedule_hour?: number;
    is_isolated?: boolean;
  };
}

const FREQUENCY_OPTIONS: { value: "weekly" | "monthly" | "quarterly"; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const formatHour = (hour: number): string => {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
};

/* ---------- inline style helpers (CSS-var aware for dark mode) ---------- */

const styles = {
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
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 12,
    color: "var(--ds-text-subtle, #6b7280)",
    margin: 0,
    lineHeight: 1.3,
    marginTop: 2,
  },
  badge: (active: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      background: active
        ? "var(--ds-success-subtle, #dcfce7)"
        : "var(--ds-neutral-subtle, #f3f4f6)",
      color: active
        ? "var(--ds-success-text, #15803d)"
        : "var(--ds-text-subtle, #6b7280)",
    }) as React.CSSProperties,
  badgeDot: (active: boolean) =>
    ({
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: active
        ? "var(--ds-success, #22c55e)"
        : "var(--ds-neutral, #9ca3af)",
    }) as React.CSSProperties,
  body: {
    padding: 24,
  },
  /* Toggle switch */
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderRadius: 12,
    background: "var(--ds-surface-raised, #f9fafb)",
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--ds-text, #111827)",
  },
  toggleTrack: (on: boolean) =>
    ({
      width: 44,
      height: 24,
      borderRadius: 12,
      background: on
        ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
        : "var(--ds-neutral-subtle, #d1d5db)",
      position: "relative",
      cursor: "pointer",
      transition: "background 0.2s ease",
      flexShrink: 0,
      border: "none",
      padding: 0,
    }) as React.CSSProperties,
  toggleThumb: (on: boolean) =>
    ({
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "#ffffff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      position: "absolute",
      top: 3,
      left: on ? 23 : 3,
      transition: "left 0.2s ease",
    }) as React.CSSProperties,
  /* Config cards */
  configSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  miniCard: {
    borderRadius: 12,
    border: "1px solid var(--ds-border, #e5e7eb)",
    padding: "16px 18px",
    background: "var(--ds-surface, #ffffff)",
  },
  miniCardLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ds-text-subtle, #6b7280)",
  },
  miniCardIcon: (bg: string) =>
    ({
      width: 28,
      height: 28,
      borderRadius: 8,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }) as React.CSSProperties,
  /* Pill buttons */
  pillGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
  },
  pill: (selected: boolean) =>
    ({
      padding: "8px 18px",
      borderRadius: 999,
      border: selected
        ? "2px solid var(--ds-primary, #3b82f6)"
        : "1.5px solid var(--ds-border, #e5e7eb)",
      background: selected
        ? "var(--ds-primary-subtle, #eff6ff)"
        : "var(--ds-surface, #ffffff)",
      color: selected
        ? "var(--ds-primary, #3b82f6)"
        : "var(--ds-text, #111827)",
      fontWeight: selected ? 600 : 400,
      fontSize: 13,
      cursor: "pointer",
      transition: "all 0.15s ease",
      outline: "none",
    }) as React.CSSProperties,
  /* Day circles */
  dayGroup: {
    display: "flex",
    gap: 6,
  },
  dayCircle: (selected: boolean) =>
    ({
      width: 36,
      height: 36,
      borderRadius: "50%",
      border: selected
        ? "2px solid var(--ds-primary, #3b82f6)"
        : "1.5px solid var(--ds-border, #e5e7eb)",
      background: selected
        ? "var(--ds-primary, #3b82f6)"
        : "var(--ds-surface, #ffffff)",
      color: selected ? "#ffffff" : "var(--ds-text, #111827)",
      fontWeight: selected ? 600 : 500,
      fontSize: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.15s ease",
      outline: "none",
    }) as React.CSSProperties,
  /* Hour selector */
  hourSelect: {
    width: "100%",
    borderRadius: 10,
    border: "1.5px solid var(--ds-border, #e5e7eb)",
    background: "var(--ds-surface, #ffffff)",
    color: "var(--ds-text, #111827)",
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    appearance: "none" as const,
    cursor: "pointer",
  },
  /* Isolation card */
  isolationCard: (active: boolean) =>
    ({
      borderRadius: 12,
      border: "1.5px solid var(--ds-purple-border, #c084fc)",
      borderLeft: "4px solid var(--ds-purple, #a855f7)",
      padding: "16px 18px",
      background: active
        ? "var(--ds-purple-subtle, #faf5ff)"
        : "var(--ds-surface, #ffffff)",
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      cursor: "pointer",
      transition: "all 0.15s ease",
    }) as React.CSSProperties,
  isolationToggle: (on: boolean) =>
    ({
      width: 36,
      height: 20,
      borderRadius: 10,
      background: on
        ? "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
        : "var(--ds-neutral-subtle, #d1d5db)",
      position: "relative",
      cursor: "pointer",
      transition: "background 0.2s ease",
      flexShrink: 0,
      marginTop: 2,
      border: "none",
      padding: 0,
    }) as React.CSSProperties,
  isolationThumb: (on: boolean) =>
    ({
      width: 14,
      height: 14,
      borderRadius: "50%",
      background: "#ffffff",
      boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
      position: "absolute",
      top: 3,
      left: on ? 19 : 3,
      transition: "left 0.2s ease",
    }) as React.CSSProperties,
  /* Buttons row */
  actionsRow: {
    display: "flex",
    gap: 10,
    paddingTop: 8,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "24px 16px",
    color: "var(--ds-text-subtle, #9ca3af)",
    fontSize: 14,
    lineHeight: 1.6,
  },
} as const;

const DrillSchedulePanel: React.FC<DrillSchedulePanelProps> = ({
  drillId,
  className = "",
  initialConfig,
}) => {
  const configureMutation = useConfigureDrillSchedule();
  const disableMutation = useDisableDrillSchedule();

  const [enabled, setEnabled] = useState(initialConfig?.auto_schedule_enabled ?? false);
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly">(
    initialConfig?.schedule_frequency ?? "monthly",
  );
  const [dayOfWeek, setDayOfWeek] = useState(initialConfig?.schedule_day_of_week ?? 0);
  const [hour, setHour] = useState(initialConfig?.schedule_hour ?? 2);
  const [isIsolated, setIsIsolated] = useState(initialConfig?.is_isolated ?? false);

  const handleSave = () => {
    configureMutation.mutate({
      drillId,
      schedule_frequency: frequency,
      schedule_day_of_week: dayOfWeek,
      schedule_hour: hour,
      is_isolated: isIsolated,
    });
    setEnabled(true);
  };

  const handleDisable = () => {
    disableMutation.mutate({ drillId });
    setEnabled(false);
  };

  const handleToggle = () => {
    if (enabled) {
      handleDisable();
    } else {
      setEnabled(true);
    }
  };

  return (
    <div className={className} style={styles.panel}>
      {/* ---- Header ---- */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconCircle}>
            <CalendarClock size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={styles.title}>DR Drill Schedule</h3>
            <p style={styles.subtitle}>Automated disaster-recovery testing</p>
          </div>
        </div>
        <span style={styles.badge(enabled)}>
          <span style={styles.badgeDot(enabled)} />
          {enabled ? "Active" : "Inactive"}
        </span>
      </div>

      {/* ---- Body ---- */}
      <div style={styles.body}>
        {/* Toggle row */}
        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>Enable automatic scheduling</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            style={styles.toggleTrack(enabled)}
          >
            <span style={styles.toggleThumb(enabled)} />
          </button>
        </div>

        {enabled ? (
          <div style={styles.configSection}>
            {/* -- Frequency pills -- */}
            <div style={styles.miniCard}>
              <div style={styles.miniCardLabel}>
                <div style={styles.miniCardIcon("linear-gradient(135deg, #f59e0b 0%, #f97316 100%)")}>
                  <CalendarClock size={14} color="#ffffff" />
                </div>
                Frequency
              </div>
              <div style={styles.pillGroup}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFrequency(opt.value)}
                    style={styles.pill(frequency === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* -- Day-of-week circles (weekly only) -- */}
            {frequency === "weekly" && (
              <div style={styles.miniCard}>
                <div style={styles.miniCardLabel}>
                  <div style={styles.miniCardIcon("linear-gradient(135deg, #10b981 0%, #059669 100%)")}>
                    <CalendarClock size={14} color="#ffffff" />
                  </div>
                  Day of Week
                </div>
                <div style={styles.dayGroup}>
                  {DAY_OF_WEEK_OPTIONS.map((opt, idx) => (
                    <button
                      key={opt.value}
                      type="button"
                      title={opt.label}
                      onClick={() => setDayOfWeek(opt.value)}
                      style={styles.dayCircle(dayOfWeek === opt.value)}
                    >
                      {DAY_SHORT[idx]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* -- Hour selector -- */}
            <div style={styles.miniCard}>
              <div style={styles.miniCardLabel}>
                <div style={styles.miniCardIcon("linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)")}>
                  <CalendarClock size={14} color="#ffffff" />
                </div>
                Scheduled Hour
              </div>
              <select
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                style={styles.hourSelect}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {formatHour(i)}
                  </option>
                ))}
              </select>
            </div>

            {/* -- Isolation mode card -- */}
            <div
              style={styles.isolationCard(isIsolated)}
              onClick={() => setIsIsolated(!isIsolated)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsIsolated(!isIsolated);
                }
              }}
            >
              <button
                type="button"
                role="switch"
                aria-checked={isIsolated}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsIsolated(!isIsolated);
                }}
                style={styles.isolationToggle(isIsolated)}
              >
                <span style={styles.isolationThumb(isIsolated)} />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Shield size={15} color="var(--ds-purple, #a855f7)" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ds-text, #111827)" }}>
                    Isolation Mode
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "var(--ds-text-subtle, #6b7280)", lineHeight: 1.5 }}>
                  Drills run against an isolated snapshot to avoid impacting production workloads.
                </p>
              </div>
            </div>

            {/* -- Action buttons -- */}
            <div style={styles.actionsRow}>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={configureMutation.isPending}
                leftIcon={<CalendarClock size={14} />}
              >
                {configureMutation.isPending ? "Saving..." : "Save Schedule"}
              </ModernButton>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={handleDisable}
                disabled={disableMutation.isPending}
              >
                {disableMutation.isPending ? "Disabling..." : "Disable Schedule"}
              </ModernButton>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span aria-hidden="true" style={{ fontSize: 40, display: "block", marginBottom: 8 }}>
              📅
            </span>
            <p style={{ margin: 0, fontWeight: 600 }}>No drill schedule yet</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.8 }}>
              Set one up and we'll run a fire-drill on your servers automatically — so you know your recovery plan still works without lifting a finger.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrillSchedulePanel;

/**
 * RansomwarePanel — friendly ransomware-detection dashboard.
 *
 * Wow refactor:
 *   - Threat tier replaces "None/Low/Medium/High/Critical" with plain English
 *     ("All clear" / "Worth a look" / "Needs attention" / "Act fast" / "Drop everything")
 *   - Each scan row leads with a MoodIndicator
 *   - Status pills use orbit StatusBadge so they auto-theme
 *   - Score bar gradient routes through platform success/warning/danger
 *   - Recover (destructive) gated by ConfirmActionDialog with friendly verbs
 *   - Acknowledge uses AsyncButton with success-state feedback
 *   - Empty state via ResourceShell with 🛡️ illustration
 *   - All inline `style={{ background: var(--theme-card-bg) }}` replaced
 *     with `bg-surface-card` / `border-surface-alt` Tailwind tokens
 */
import React, { useState } from "react";
import { ShieldAlert, Bug, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import {
  MoodIndicator,
  StatusBadge,
  ResourceShell,
  ConfirmActionDialog,
  AsyncButton,
  usePrefersReducedMotion,
  orbitTransition,
} from "@/shared/components/orbit";
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

// ─── Threat-tier mapping (friendly + theme-token-aware) ──────────────────────

interface ThreatTier {
  /** Plain-English label for sighted users. */
  friendly: string;
  /** Canonical level for screen readers + analytics. */
  technical: string;
  /** StatusBadge tone. */
  tone: "success" | "pending" | "warning" | "danger";
  /** Theme-tinted progress-bar fill class. */
  fill: string;
  /** MoodIndicator mood. */
  mood: "happy" | "thinking" | "worried" | "alarmed";
}

const TIER_MAP: Record<string, ThreatTier> = {
  none: { friendly: "All clear", technical: "None", tone: "success", fill: "bg-success-500", mood: "happy" },
  low: { friendly: "Worth a look", technical: "Low", tone: "pending", fill: "bg-warning-400", mood: "thinking" },
  medium: { friendly: "Needs attention", technical: "Medium", tone: "warning", fill: "bg-warning-500", mood: "worried" },
  high: { friendly: "Act fast", technical: "High", tone: "danger", fill: "bg-danger-500", mood: "alarmed" },
  critical: { friendly: "Drop everything", technical: "Critical", tone: "danger", fill: "bg-danger-600", mood: "alarmed" },
};

function tier(level: string): ThreatTier {
  return TIER_MAP[level] ?? TIER_MAP.none;
}

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

function deriveOverallTier(d: { critical_count?: number; threats_detected?: number; total_scans?: number }): string {
  if ((d.critical_count ?? 0) > 0) return "critical";
  if ((d.threats_detected ?? 0) > 0) return "high";
  return "none";
}

function levelToPercent(level: string): number {
  return { none: 0, low: 25, medium: 50, high: 75, critical: 100 }[level] ?? 0;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const ThreatGauge: React.FC<{ level: string; reduced: boolean }> = ({ level, reduced }) => {
  const t = tier(level);
  const pct = levelToPercent(level);
  return (
    <section
      aria-labelledby="overall-threat-label"
      className="rounded-2xl border border-gray-200 bg-surface-card p-4 shadow-sm dark:border-gray-800"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span id="overall-threat-label" className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          How are things looking?
        </span>
        <StatusBadge tone={t.tone} label={t.technical} friendlyLabel={t.friendly} size="md" />
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Overall threat level: ${t.friendly}`}
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-success-400 via-warning-400 to-danger-500"
      >
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-full rounded-r-full bg-gray-200/70 dark:bg-gray-700/70"
          style={{
            width: `${100 - pct}%`,
            transition: orbitTransition(reduced, "width", "smooth", "decelerate"),
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
        <span>Calm seas</span>
        <span>Storm warning</span>
      </div>
    </section>
  );
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone: "primary" | "warning" | "danger" | "success";
}> = ({ label, value, icon, tone }) => {
  const toneClasses = {
    primary: "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
    warning: "bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400",
    danger: "bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400",
    success: "bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400",
  }[tone];
  return (
    <div className="rounded-xl border border-gray-200 bg-surface-card p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${toneClasses}`}>{icon}</div>
      <p className="text-2xl font-bold tabular-nums leading-none text-gray-900 dark:text-gray-100">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
};

// ─── Main panel ─────────────────────────────────────────────────────────────

const RansomwarePanel: React.FC<RansomwarePanelProps> = ({ integrationKey, className = "" }) => {
  const reduced = usePrefersReducedMotion();
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } =
    useRansomwareDashboard(integrationKey);
  const { data: scansResult, isLoading: scansLoading, error: scansError, refetch: refetchScans } =
    useRansomwareScans(integrationKey, { per_page: 10 });
  const acknowledge = useAcknowledgeRansomware();
  const recover = useRecoverFromRansomware();

  const [confirmRecover, setConfirmRecover] = useState<RansomwareScan | null>(null);

  const scans: RansomwareScan[] = scansResult?.data ?? [];
  const overallLevel = dashboard ? deriveOverallTier(dashboard) : "none";
  const isActionable = (level: string) => level === "high" || level === "critical";

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ─── Stat cards ─────────────────────────────────────────────── */}
      <ResourceShell loading={dashboardLoading} error={dashboardError} onRetry={refetchDashboard}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Scans run"
            value={dashboard?.total_scans ?? 0}
            icon={<ShieldCheck size={20} />}
            tone="primary"
          />
          <StatCard
            label="Things found"
            value={dashboard?.threats_detected ?? 0}
            icon={<Bug size={20} />}
            tone="warning"
          />
          <StatCard
            label="Critical"
            value={dashboard?.critical_count ?? 0}
            icon={<ShieldAlert size={20} />}
            tone="danger"
          />
          <StatCard
            label="Last check"
            value={dashboard?.last_scan_at ? relativeTime(dashboard.last_scan_at) : "Not yet"}
            icon={<CheckCircle2 size={20} />}
            tone="success"
          />
        </div>
      </ResourceShell>

      {/* ─── Overall threat gauge ──────────────────────────────────── */}
      {!dashboardLoading && dashboard && <ThreatGauge level={overallLevel} reduced={reduced} />}

      {/* ─── Recent scans list ─────────────────────────────────────── */}
      <section aria-labelledby="recent-scans-heading">
        <h3
          id="recent-scans-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
        >
          What we found recently
        </h3>

        <ResourceShell
          loading={scansLoading}
          error={scansError}
          onRetry={refetchScans}
          empty={!scansLoading && scans.length === 0}
          emptyTitle="Nothing's been scanned yet"
          emptyDescription="Once your protection policies start running, you'll see every scan here — what was checked, what was found, and what we did about it."
          emptyIcon={<span aria-hidden="true" className="text-5xl">🛡️</span>}
        >
          <div className="space-y-2">
            {scans.map((scan) => {
              const t = tier(scan.threat_level);
              return (
                <article
                  key={scan.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-surface-card p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left — mood + policy + meta */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <MoodIndicator mood={t.mood} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {scan.policy_name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge tone={t.tone} label={t.technical} friendlyLabel={t.friendly} size="sm" />
                        <ScoreBar score={scan.score} fill={t.fill} reduced={reduced} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {relativeTime(scan.scanned_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {isActionable(scan.threat_level) && !scan.acknowledged_at && (
                      <AsyncButton
                        variant="secondary"
                        size="sm"
                        icon={<CheckCircle2 size={14} />}
                        loadingLabel="Marking…"
                        successLabel="Got it"
                        onClick={async () => {
                          await acknowledge.mutateAsync({ integrationKey, scanId: scan.id });
                        }}
                      >
                        Acknowledge
                      </AsyncButton>
                    )}

                    {scan.acknowledged_at && !scan.recovered_at && (
                      <StatusBadge tone="neutral" label="Acknowledged" friendlyLabel="Reviewed by your team" size="sm" />
                    )}

                    {(isActionable(scan.threat_level) && !scan.recovered_at) && (
                      <AsyncButton
                        variant="primary"
                        size="sm"
                        icon={<RotateCcw size={14} />}
                        onClick={() => {
                          setConfirmRecover(scan);
                        }}
                      >
                        Recover
                      </AsyncButton>
                    )}

                    {scan.recovered_at && (
                      <StatusBadge tone="success" label="Recovered" friendlyLabel="Back to safe ✨" size="sm" />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </ResourceShell>
      </section>

      {/* ─── Recovery confirmation ────────────────────────────────── */}
      <ConfirmActionDialog
        open={Boolean(confirmRecover)}
        onClose={() => setConfirmRecover(null)}
        onConfirm={async () => {
          if (!confirmRecover) return;
          await recover.mutateAsync({ integrationKey, scanId: confirmRecover.id });
          setConfirmRecover(null);
        }}
        title="Restore from a clean snapshot?"
        description={
          confirmRecover
            ? `We'll roll back the protected workload to the most recent clean snapshot — wiping anything written after the threat appeared. This usually takes a few minutes.`
            : ""
        }
        severity="danger"
        confirmLabel="Yes, restore now"
        cancelLabel="Not yet"
        requireTypeToConfirm="RESTORE"
      />
    </div>
  );
};

// ─── Score bar ──────────────────────────────────────────────────────────────

const ScoreBar: React.FC<{ score: number; fill: string; reduced: boolean }> = ({ score, fill, reduced }) => {
  const safe = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2" title={`Threat score: ${safe}/100`}>
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Threat score ${safe} out of 100`}
      >
        <div
          className={`h-full rounded-full ${fill}`}
          style={{
            width: `${safe}%`,
            transition: orbitTransition(reduced, "width", "smooth", "decelerate"),
          }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-gray-600 dark:text-gray-400">{safe}</span>
    </div>
  );
};

export default RansomwarePanel;

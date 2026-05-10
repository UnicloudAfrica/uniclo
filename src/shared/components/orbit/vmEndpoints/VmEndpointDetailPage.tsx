import React, { useMemo, useState } from "react";
import {
  Server,
  Wifi,
  KeyRound,
  Cpu,
  HardDrive,
  Network,
  Calendar,
  ScanLine,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import {
  HeroBanner,
  ResourceShell,
  StatusBadge,
  MoodIndicator,
  AsyncButton,
  ConfirmActionDialog,
  StateMachineProgress,
  FriendlyTooltip,
  RESILIENCE,
} from "@/shared/components/orbit";
import {
  useFetchVmEndpoint,
  useFetchVmAssessment,
  useFetchVmScanStatus,
  useStartVmScan,
  useDeleteVmEndpoint,
} from "@/shared/hooks/resources/orbit/vmEndpointHooks";
import type {
  VmAssessment,
  VmEndpoint,
  VmScanStatus,
} from "@/shared/types/orbit/vmEndpoint";

/**
 * VmEndpointDetailPage — single source-VM detail page (shared across all 3
 * roles). Renders:
 *
 *   1. Hero with name, host, source-type, mood
 *   2. Active-scan banner (collapsed when no scan running)
 *   3. Assessment report — readiness score, headline, remediations, hardware,
 *      OS, application stack
 *   4. Connection details (host/port/credential ref/last seen)
 *   5. Actions: Run scan, Generate assessment, Delete (admin/tenant only)
 *
 * The assessment is the heart of the page — it's WHAT the customer came
 * here to see ("is this server ready to move?"). Friendly UX:
 *   - Big readiness score in the hero, color-coded
 *   - Plain-English headline below it
 *   - Remediations grouped by severity, each with friendly summary +
 *     expandable technical detail
 *
 * Accessibility:
 *   - Each section is its own region
 *   - Active-scan banner uses role="status" aria-live="polite"
 *   - Severity tones never sole signal — every remediation has its
 *     severity word + icon
 */

export interface VmEndpointDetailPageProps {
  identifier: string;
  /** Where to go when the user clicks Back. */
  backPath: string;
  /** Where to go when the endpoint is deleted. */
  afterDeletePath: string;
  /** Whether the current user can mutate (false for client). */
  canEdit: boolean;
}

export function VmEndpointDetailPage({
  identifier,
  backPath,
  afterDeletePath,
  canEdit,
}: VmEndpointDetailPageProps): React.JSX.Element {
  const endpoint = useFetchVmEndpoint(identifier);
  const assessment = useFetchVmAssessment(identifier);
  const scan = useFetchVmScanStatus(identifier);
  const startScan = useStartVmScan();
  const deleteEp = useDeleteVmEndpoint();

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => (window.location.href = backPath)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2 dark:text-gray-300 dark:hover:text-gray-100 dark:focus:ring-offset-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to all servers
      </button>

      <ResourceShell
        loading={endpoint.isLoading}
        error={endpoint.error}
        onRetry={endpoint.refetch}
        empty={!endpoint.isLoading && !endpoint.data}
        emptyTitle="Server not found"
        emptyDescription="This server may have been removed."
      >
        {endpoint.data && (
          <DetailContents
            endpoint={endpoint.data}
            assessment={assessment.data ?? null}
            assessmentLoading={assessment.isLoading}
            assessmentError={assessment.error}
            scanStatus={scan.data ?? null}
            canEdit={canEdit}
            onStartScan={() =>
              startScan.mutateAsync({ endpoint_ids: [identifier], scan_type: "deep" })
            }
            onRequestDelete={() => setConfirmDelete(true)}
          />
        )}
      </ResourceShell>

      <ConfirmActionDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteEp.mutateAsync(identifier);
          window.location.href = afterDeletePath;
        }}
        title={`Forget "${endpoint.data?.name ?? "this server"}"?`}
        description="We'll remove this server from your list. Active migrations or replications using it will block this — finish or cancel those first."
        severity="danger"
        confirmLabel="Yes, forget it"
        cancelLabel="No, keep it"
      />
    </div>
  );
}

// ─── Inner contents (rendered once endpoint data is loaded) ──────────────────

function DetailContents({
  endpoint,
  assessment,
  assessmentLoading,
  assessmentError,
  scanStatus,
  canEdit,
  onStartScan,
  onRequestDelete,
}: {
  endpoint: VmEndpoint;
  assessment: VmAssessment | null;
  assessmentLoading: boolean;
  assessmentError: unknown;
  scanStatus: VmScanStatus | null;
  canEdit: boolean;
  onStartScan: () => Promise<unknown>;
  onRequestDelete: () => void;
}): React.JSX.Element {
  return (
    <>
      <DetailHero endpoint={endpoint} assessment={assessment} />

      {scanStatus &&
        (scanStatus.state === "queued" || scanStatus.state === "running") && (
          <ActiveScanBanner status={scanStatus} />
        )}

      <AssessmentSection
        loading={assessmentLoading}
        error={assessmentError}
        assessment={assessment}
        canEdit={canEdit}
        onStartScan={onStartScan}
      />

      <ConnectionDetails endpoint={endpoint} />

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRequestDelete}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:ring-offset-gray-900"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Forget this server
          </button>
        </div>
      )}
    </>
  );
}

// ─── Hero — VM identity + readiness score ────────────────────────────────────

function DetailHero({
  endpoint,
  assessment,
}: {
  endpoint: VmEndpoint;
  assessment: VmAssessment | null;
}): React.JSX.Element {
  const score = assessment?.readiness_score;
  const headline = assessment?.headline ?? deriveHeadline(score);

  const subtitle = assessment
    ? headline
    : "Run a scan to find out how ready this server is to move.";

  return (
    <HeroBanner
      eyebrow={`${RESILIENCE} · Source server`}
      title={endpoint.name}
      subtitle={subtitle}
      technicalNote={`${endpoint.host}:${endpoint.port} · ${endpoint.source_type}`}
      mode={score != null ? "spotlight" : "calm"}
      illustration={
        score != null ? (
          <ReadinessRing score={score} />
        ) : (
          <span aria-hidden="true" className="text-7xl">
            🔭
          </span>
        )
      }
    />
  );
}

function ReadinessRing({ score }: { score: number }): React.JSX.Element {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const ring = scoreToRing(safe);
  const radius = 70;
  const stroke = 10;
  const C = 2 * Math.PI * radius;
  const offset = C * (1 - safe / 100);
  return (
    <div
      role="img"
      aria-label={`Readiness score ${safe} out of 100`}
      className="relative flex items-center justify-center"
    >
      <svg
        width={radius * 2 + stroke * 2}
        height={radius * 2 + stroke * 2}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          stroke={ring.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          fill="none"
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-bold text-white">{safe}</p>
        <p className="-mt-1 text-[11px] uppercase tracking-wider text-white/70">
          Readiness
        </p>
      </div>
    </div>
  );
}

function scoreToRing(score: number): { color: string; label: string } {
  // Route through platform semantic CSS variables so the readiness ring
  // re-tints in lockstep with whatever brand the role applied (admin
  // platform brand, tenant white-label, or client-inherits-tenant).
  if (score >= 85) return { color: "rgb(var(--theme-success-500))", label: "Looks great" };
  if (score >= 70) return { color: "rgb(var(--theme-success-400))", label: "Mostly ready" };
  if (score >= 50) return { color: "rgb(var(--theme-warning-500))", label: "Needs some work" };
  return { color: "rgb(var(--theme-danger-500))", label: "Not ready yet" };
}

function deriveHeadline(score?: number): string {
  if (score == null) return "Run a scan to see if this server is ready to move.";
  if (score >= 85) return "Looking great. This server's ready to go whenever you are.";
  if (score >= 70) return "Mostly ready — a couple of things to clean up first.";
  if (score >= 50) return "Workable, but a few changes will make the move smoother.";
  return "Not ready yet. Let's fix the blockers below before we move it.";
}

// ─── Active-scan banner ──────────────────────────────────────────────────────

const SCAN_PHASES = [
  { id: "queued", label: "Queued" },
  { id: "discovery", label: "Discovering" },
  { id: "sizing", label: "Measuring" },
  { id: "deps", label: "Mapping apps" },
  { id: "report", label: "Building report" },
  { id: "succeeded", label: "All done" },
];

function ActiveScanBanner({ status }: { status: VmScanStatus }): React.JSX.Element {
  // Best-effort phase mapping — AcF returns a `phase` string we map onto our
  // canonical 6-phase list. Falls back to "discovery" when the upstream phase
  // isn't recognized so the bar isn't blank.
  const currentPhase =
    SCAN_PHASES.find((p) => p.id === status.phase)?.id ??
    (status.state === "succeeded" ? "succeeded" : "discovery");

  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800/40 dark:bg-blue-900/10"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MoodIndicator mood="working" size="md" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Scanning your server…
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              We're taking a careful look. This usually takes 1–3 minutes.
            </p>
          </div>
        </div>
        <StatusBadge tone="running" label={`Scan ${status.progress_percent}%`} size="sm" />
      </div>
      <StateMachineProgress
        phases={SCAN_PHASES}
        current={currentPhase}
        size="sm"
      />
    </section>
  );
}

// ─── Assessment section — the readiness report ───────────────────────────────

function AssessmentSection({
  loading,
  error,
  assessment,
  canEdit,
  onStartScan,
}: {
  loading: boolean;
  error: unknown;
  assessment: VmAssessment | null;
  canEdit: boolean;
  onStartScan: () => Promise<unknown>;
}): React.JSX.Element {
  return (
    <section
      aria-labelledby="assessment-heading"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2
          id="assessment-heading"
          className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100"
        >
          <Sparkles className="h-5 w-5 text-[var(--secondary-color)]" aria-hidden="true" />
          Readiness report
        </h2>
        {canEdit && (
          <AsyncButton
            variant="secondary"
            size="sm"
            icon={<ScanLine className="h-4 w-4" aria-hidden="true" />}
            loadingLabel="Starting scan…"
            successLabel="Scan started"
            onClick={onStartScan}
          >
            Run a fresh scan
          </AsyncButton>
        )}
      </div>

      <ResourceShell
        loading={loading}
        error={error}
        empty={!loading && !assessment}
        emptyTitle="No report yet"
        emptyDescription="Run a scan and we'll build a readiness report you can read here."
        emptyIcon={<span aria-hidden="true" className="text-5xl">📋</span>}
      >
        {assessment && <AssessmentBody assessment={assessment} />}
      </ResourceShell>
    </section>
  );
}

function AssessmentBody({ assessment }: { assessment: VmAssessment }): React.JSX.Element {
  const grouped = useMemo(() => groupRemediations(assessment.remediations), [assessment]);
  const { hardware, os, application_stack } = assessment;

  return (
    <div className="space-y-6">
      {/* Remediations */}
      {assessment.remediations.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Things to look at
          </h3>
          <ul className="space-y-2">
            {grouped.map((g) => (
              <li key={g.severity}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <StatusBadge
                    tone={severityToTone(g.severity)}
                    label={g.severity}
                    friendlyLabel={severityFriendly(g.severity)}
                    size="sm"
                  />
                  <span className="ml-2">
                    {g.items.length} item{g.items.length === 1 ? "" : "s"}
                  </span>
                </p>
                <ul className="space-y-2">
                  {g.items.map((r) => (
                    <li
                      key={r.code}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/40"
                    >
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {r.title}
                      </p>
                      {r.friendly_summary && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {r.friendly_summary}
                        </p>
                      )}
                      {r.description && (
                        <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                          {r.description}
                        </p>
                      )}
                      {r.steps && r.steps.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-primary-500 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-1">
                            Show fix steps
                          </summary>
                          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-gray-700 dark:text-gray-300">
                            {r.steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </details>
                      )}
                      <p className="mt-2 font-mono text-[10px] text-gray-400">{r.code}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          ✨ Nothing standing in the way. This server is ready to move.
        </p>
      )}

      {/* OS + Hardware + App stack */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {os && (
          <FactCard
            icon={<Server className="h-4 w-4" aria-hidden="true" />}
            title="Operating system"
            primary={os.distribution || os.family}
            secondary={`${os.version}${os.kernel ? ` · kernel ${os.kernel}` : ""}`}
          />
        )}
        {hardware && (
          <FactCard
            icon={<Cpu className="h-4 w-4" aria-hidden="true" />}
            title="CPU & memory"
            primary={`${hardware.cpu_cores} cores · ${formatMb(hardware.memory_mb)} RAM`}
            secondary={hardware.cpu_model}
          />
        )}
        {hardware?.disks && (
          <FactCard
            icon={<HardDrive className="h-4 w-4" aria-hidden="true" />}
            title="Disks"
            primary={`${hardware.disks.length} disk${hardware.disks.length === 1 ? "" : "s"}`}
            secondary={hardware.disks
              .map((d) => `${d.device} (${formatBytes(d.size_bytes)})`)
              .join(" · ")}
          />
        )}
        {hardware?.nics && (
          <FactCard
            icon={<Network className="h-4 w-4" aria-hidden="true" />}
            title="Network"
            primary={`${hardware.nics.length} NIC${hardware.nics.length === 1 ? "" : "s"}`}
            secondary={hardware.nics.map((n) => n.name).join(" · ")}
          />
        )}
        {application_stack && application_stack.length > 0 && (
          <FactCard
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            title="Apps we found"
            primary={`${application_stack.length} apps`}
            secondary={application_stack.map((a) => a.name).join(" · ")}
          />
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Report generated{" "}
        <FriendlyTooltip
          mode="inline"
          term={new Date(assessment.generated_at).toLocaleString()}
          definition={`This is when ${RESILIENCE} last looked at the server. Scan again to refresh.`}
        />
      </p>
    </div>
  );
}

// ─── Connection details (read-only) ──────────────────────────────────────────

function ConnectionDetails({ endpoint }: { endpoint: VmEndpoint }): React.JSX.Element {
  return (
    <section
      aria-labelledby="connection-heading"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
    >
      <h2
        id="connection-heading"
        className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100"
      >
        Connection details
      </h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <DlRow label="Address" value={`${endpoint.host}:${endpoint.port}`} icon={<Wifi className="h-4 w-4" />} />
        <DlRow label="Type" value={endpoint.source_type} />
        <DlRow label="Credentials" value={endpoint.credential_ref} icon={<KeyRound className="h-4 w-4" />} mono />
        <DlRow
          label="Last reachable"
          value={
            endpoint.last_seen_at
              ? new Date(endpoint.last_seen_at).toLocaleString()
              : "Not yet contacted"
          }
          icon={<Calendar className="h-4 w-4" />}
        />
        <DlRow
          label="Health"
          value={
            <StatusBadge
              tone={
                endpoint.health === "healthy"
                  ? "success"
                  : endpoint.health === "degraded"
                  ? "warning"
                  : endpoint.health === "unreachable"
                  ? "danger"
                  : "neutral"
              }
              label={endpoint.health}
              size="sm"
            />
          }
        />
        {endpoint.tags && endpoint.tags.length > 0 && (
          <DlRow
            label="Tags"
            value={
              <div className="flex flex-wrap gap-1">
                {endpoint.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            }
          />
        )}
      </dl>
    </section>
  );
}

// ─── Tiny presentational helpers ─────────────────────────────────────────────

function FactCard({
  icon,
  title,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  title: string;
  primary?: string;
  secondary?: string;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
      <p className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
        <span aria-hidden="true">{icon}</span>
        {title}
      </p>
      <p className="font-semibold text-gray-900 dark:text-gray-100">{primary ?? "—"}</p>
      {secondary && (
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{secondary}</p>
      )}
    </div>
  );
}

function DlRow({
  label,
  value,
  icon,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  mono?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-2 border-b border-gray-100 py-2 last:border-b-0 dark:border-gray-800 sm:border-b-0">
      <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">
        {icon ?? <ChevronRight className="h-4 w-4 opacity-0" />}
      </span>
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd
        className={[
          "min-w-0 flex-1 text-sm",
          mono ? "break-all font-mono text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SeverityGroup = {
  severity: "critical" | "high" | "medium" | "low" | "info";
  items: VmAssessment["remediations"];
};

function groupRemediations(rs: VmAssessment["remediations"]): SeverityGroup[] {
  const order: SeverityGroup["severity"][] = ["critical", "high", "medium", "low", "info"];
  return order
    .map((sev) => ({ severity: sev, items: rs.filter((r) => r.severity === sev) }))
    .filter((g) => g.items.length > 0);
}

function severityToTone(
  s: SeverityGroup["severity"]
): "danger" | "warning" | "pending" | "neutral" | "highlight" {
  switch (s) {
    case "critical":
      return "danger";
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "pending";
    case "info":
      return "neutral";
    default:
      return "neutral";
  }
}

function severityFriendly(s: SeverityGroup["severity"]): string {
  switch (s) {
    case "critical":
      return "Must fix";
    case "high":
      return "Should fix";
    case "medium":
      return "Worth fixing";
    case "low":
      return "Nice to fix";
    case "info":
      return "Just FYI";
    default:
      return s;
  }
}

function formatMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

function formatBytes(b: number): string {
  if (b >= 1024 ** 4) return `${(b / 1024 ** 4).toFixed(1)} TB`;
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${b} B`;
}

export default VmEndpointDetailPage;

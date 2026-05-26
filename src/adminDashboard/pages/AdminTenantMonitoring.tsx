/**
 * Admin Tenant Monitoring page (Stream A, task A3).
 *
 * Lists a tenant's active instances with CPU / memory / network
 * sparklines + a disk panel for each, and exposes a "Generate Report"
 * modal that downloads the PDF / CSV utilization report produced by
 * the backend's `reports:tenant-utilization` command.
 *
 * Tenant ID is read from the `?id=` query string. Following the
 * existing admin convention (`AdminPartnerDetails`, `AdminClientDetails`)
 * the ID is base64-encoded in the URL.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Cpu,
  Download,
  HardDrive,
  Loader2,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
} from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import {
  ModernButton,
  ModernCard,
  ModernModal,
  ModernSelect,
  ModernInput,
  StatusPill,
  Gauge,
  InfoCallout,
} from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { sanitizeProviderLabel } from "@/utils/sanitizeProviderLabel";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { useFetchTenantById } from "@/hooks/adminHooks/tenantHooks";

import {
  useTenantInstances,
  useInstanceMetrics,
  useInstanceDisk,
  useGenerateUtilizationReport,
  type GenerateReportPayload,
  type InstanceMetricsParams,
  type MetricKind,
  type ReportOutput,
  type TenantMonitoringInstance,
} from "../hooks/useAdminTenantMonitoring";

// ─── Time-window helpers ──────────────────────────────────────────────

type WindowPreset = "24h" | "7d" | "30d";

const PRESET_LABELS: Record<WindowPreset, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

const PRESET_INTERVAL_MINUTES: Record<WindowPreset, number> = {
  "24h": 5,
  "7d": 30,
  "30d": 60,
};

const presetToRange = (preset: WindowPreset): { start: string; end: string; interval: number } => {
  const end = new Date();
  const start = new Date(end);
  if (preset === "24h") start.setUTCHours(end.getUTCHours() - 24);
  if (preset === "7d") start.setUTCDate(end.getUTCDate() - 7);
  if (preset === "30d") start.setUTCDate(end.getUTCDate() - 30);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    interval: PRESET_INTERVAL_MINUTES[preset],
  };
};

const decodeId = (encoded: string | null): string | null => {
  if (!encoded) return null;
  try {
    return atob(decodeURIComponent(encoded));
  } catch {
    // Fall back to raw value — backend ID may already be plain.
    return encoded;
  }
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const idx = Math.min(Math.floor(Math.log10(bytes) / 3), units.length - 1);
  const value = bytes / Math.pow(1000, idx);
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

// ─── Sparkline ────────────────────────────────────────────────────────

interface SparklineProps {
  data: { timestamp: string; value: number }[];
  label: string;
  unit: string;
  color: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, label, unit, color }) => {
  if (data.length < 2) {
    return (
      <div
        className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400"
        role="img"
        aria-label={`${label} — no data`}
      >
        No data
      </div>
    );
  }
  return (
    <div className="h-20" role="img" aria-label={`${label} sparkline`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.4 }}
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.06)",
              padding: "4px 8px",
            }}
            formatter={(value: number) => [`${value.toFixed(1)}${unit}`, label]}
            labelFormatter={(ts) => new Date(ts as string).toLocaleString()}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${label})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Metric tile ──────────────────────────────────────────────────────

interface MetricTileProps {
  tenantId: string;
  instanceId: string;
  kind: MetricKind;
  label: string;
  icon: React.ReactNode;
  color: string;
  params: InstanceMetricsParams;
}

const MetricTile: React.FC<MetricTileProps> = ({
  tenantId,
  instanceId,
  kind,
  label,
  icon,
  color,
  params,
}) => {
  const query = useInstanceMetrics(tenantId, instanceId, { ...params, metric: kind });
  const summary = query.data?.summary;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <span style={{ color }}>{icon}</span>
        <span>{label}</span>
      </div>

      {query.isLoading ? (
        <div className="flex h-20 items-center justify-center text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : query.isError ? (
        <div className="flex h-20 items-center justify-center text-[11px] text-red-500">
          Failed to load
        </div>
      ) : (
        <>
          <Sparkline
            data={(query.data?.points ?? []).map((p) => ({ timestamp: p.timestamp, value: p.value }))}
            label={label}
            unit={summary?.unit ?? ""}
            color={color}
          />
          <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <dt className="text-slate-500">Mean</dt>
              <dd className="font-medium text-slate-700">
                {summary?.mean != null ? `${summary.mean.toFixed(1)}${summary.unit}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Peak</dt>
              <dd className="font-medium text-slate-700">
                {summary?.peak != null ? `${summary.peak.toFixed(1)}${summary.unit}` : "—"}
              </dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
};

// ─── Disk panel ───────────────────────────────────────────────────────

interface DiskPanelProps {
  tenantId: string;
  instanceId: string;
}

const DiskPanel: React.FC<DiskPanelProps> = ({ tenantId, instanceId }) => {
  const query = useInstanceDisk(tenantId, instanceId);

  if (query.isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white p-3">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-red-500">
        Failed to load disk data
      </div>
    );
  }

  const rows = query.data ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <HardDrive className="h-4 w-4 text-slate-500" />
          <span>Disk</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Disk metrics pending provider wiring.
        </p>
      </div>
    );
  }

  const primary = rows[0];
  const pct = primary.total_bytes > 0
    ? Math.round((primary.used_bytes / primary.total_bytes) * 100)
    : 0;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <HardDrive className="h-4 w-4 text-slate-500" />
        <span>Disk</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Gauge value={pct} label="Disk used" size="sm" />
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        {formatBytes(primary.used_bytes)} of {formatBytes(primary.total_bytes)}
      </p>
    </div>
  );
};

// ─── Instance card ────────────────────────────────────────────────────

interface InstanceCardProps {
  instance: TenantMonitoringInstance;
  tenantId: string;
  params: { start: string; end: string; interval: number };
}

const InstanceCard: React.FC<InstanceCardProps> = ({ instance, tenantId, params }) => {
  const baseParams: InstanceMetricsParams = {
    metric: "cpu",
    start: params.start,
    end: params.end,
    statistic: "mean",
    interval: params.interval,
  };

  const region = instance.region ? sanitizeProviderLabel(instance.region) : null;
  const az = instance.availability_zone
    ? sanitizeProviderLabel(instance.availability_zone)
    : null;

  return (
    <ModernCard className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Server className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {instance.name || instance.identifier}
            </h3>
            <p className="text-[11px] text-slate-500">
              {instance.identifier}
              {region ? ` · ${region}` : ""}
              {az ? ` · ${az}` : ""}
              {instance.public_ip ? ` · ${instance.public_ip}` : ""}
            </p>
          </div>
        </div>
        <StatusPill status={instance.status} />
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-4">
        <MetricTile
          tenantId={tenantId}
          instanceId={instance.id}
          kind="cpu"
          label="CPU"
          icon={<Cpu className="h-4 w-4" />}
          color="#288dd1"
          params={baseParams}
        />
        <MetricTile
          tenantId={tenantId}
          instanceId={instance.id}
          kind="memory"
          label="Memory"
          icon={<MemoryStick className="h-4 w-4" />}
          color="#10b981"
          params={baseParams}
        />
        <MetricTile
          tenantId={tenantId}
          instanceId={instance.id}
          kind="network"
          label="Network"
          icon={<Network className="h-4 w-4" />}
          color="#f59e0b"
          params={baseParams}
        />
        <DiskPanel tenantId={tenantId} instanceId={instance.id} />
      </div>
    </ModernCard>
  );
};

// ─── Generate report modal ────────────────────────────────────────────

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  defaultStart: string;
  defaultEnd: string;
}

const toLocalInputValue = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // <input type="datetime-local"> needs `YYYY-MM-DDTHH:mm` in local time.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  defaultStart,
  defaultEnd,
}) => {
  const [start, setStart] = useState(toLocalInputValue(defaultStart));
  const [end, setEnd] = useState(toLocalInputValue(defaultEnd));
  const [output, setOutput] = useState<ReportOutput>("pdf");
  const [error, setError] = useState<string | null>(null);

  const mutation = useGenerateUtilizationReport(tenantId);
  // Re-entrancy guard against React batched onClick replays — the
  // `mutation.isPending` flag only flips on the next render, so two
  // clicks landing in the same frame can both pass the check.
  const submitAction = useAsyncAction();

  useEffect(() => {
    if (isOpen) {
      setStart(toLocalInputValue(defaultStart));
      setEnd(toLocalInputValue(defaultEnd));
      setError(null);
    }
  }, [isOpen, defaultStart, defaultEnd]);

  const handleSubmit = async () => {
    if (submitAction.isPending || mutation.isPending) return;

    if (!start || !end) {
      setError("Start and end dates are required.");
      return;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError("Invalid date provided.");
      return;
    }
    if (startDate >= endDate) {
      setError("Start must be before end.");
      return;
    }

    setError(null);

    const payload: GenerateReportPayload = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      output,
    };

    try {
      await submitAction.run(() => mutation.mutateAsync(payload), {
        rethrow: true,
      });
      ToastUtils.success("Utilization report downloaded.");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Report download failed.";
      setError(message);
      ToastUtils.error(message);
    }
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Utilization Report"
      subtitle="Choose a window and format. The file downloads to your browser."
      size="md"
      actions={[
        {
          label: "Cancel",
          variant: "ghost",
          onClick: onClose,
          disabled: submitAction.isPending || mutation.isPending,
        },
        {
          label:
            submitAction.isPending || mutation.isPending
              ? "Generating..."
              : "Generate",
          variant: "primary",
          onClick: handleSubmit,
          disabled: submitAction.isPending || mutation.isPending,
        },
      ]}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="report-start" className="mb-1 block text-xs font-medium text-slate-600">
              Start
            </label>
            <ModernInput
              id="report-start"
              type="datetime-local"
              value={start}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="report-end" className="mb-1 block text-xs font-medium text-slate-600">
              End
            </label>
            <ModernInput
              id="report-end"
              type="datetime-local"
              value={end}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="report-output" className="mb-1 block text-xs font-medium text-slate-600">
            Output format
          </label>
          <ModernSelect
            id="report-output"
            value={output}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setOutput(e.target.value as ReportOutput)
            }
            options={[
              { value: "pdf", label: "PDF" },
              { value: "csv", label: "CSV" },
            ]}
          />
        </div>
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </ModernModal>
  );
};

// ─── Page shell ───────────────────────────────────────────────────────

const AdminTenantMonitoring = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tenantId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return decodeId(params.get("id"));
  }, [location.search]);

  const [preset, setPreset] = useState<WindowPreset>("24h");
  const [reportOpen, setReportOpen] = useState(false);

  const range = useMemo(() => presetToRange(preset), [preset]);

  const tenantQuery = useFetchTenantById(tenantId ?? "");
  const instancesQuery = useTenantInstances(tenantId ?? undefined);

  // Surface a single error toast when the instances query fails.
  useEffect(() => {
    if (instancesQuery.isError) {
      const err = instancesQuery.error as Error | undefined;
      ToastUtils.error(err?.message || "Failed to load tenant instances.");
    }
  }, [instancesQuery.isError, instancesQuery.error]);

  const tenantName = (tenantQuery.data as { name?: string } | undefined)?.name;

  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Partners", href: "/admin-dashboard/partners" },
    { label: tenantName ?? "Tenant", href: tenantId ? `/admin-dashboard/partners/details?id=${encodeURIComponent(btoa(tenantId))}` : undefined },
    { label: "Monitoring" },
  ];

  if (!tenantId) {
    return (
      <AdminPageShell title="Tenant Monitoring" breadcrumbs={breadcrumbs}>
        <InfoCallout tone="danger" title="Missing tenant ID">
          Open this page from the tenant detail screen — the URL must include
          an <code>?id</code> query parameter.
        </InfoCallout>
      </AdminPageShell>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={() => instancesQuery.refetch()}
        disabled={instancesQuery.isFetching}
      >
        <RefreshCw className={`mr-1 h-3.5 w-3.5 ${instancesQuery.isFetching ? "animate-spin" : ""}`} />
        Refresh
      </ModernButton>
      <ModernButton
        variant="primary"
        size="sm"
        onClick={() => setReportOpen(true)}
        disabled={!instancesQuery.data?.length}
      >
        <Download className="mr-1 h-3.5 w-3.5" />
        Generate Report
      </ModernButton>
      <ModernButton
        variant="secondary"
        size="sm"
        onClick={() =>
          navigate(
            `/admin-dashboard/partners/report-subscriptions?id=${encodeURIComponent(btoa(tenantId))}`,
          )
        }
      >
        <Calendar className="mr-1 h-3.5 w-3.5" />
        Scheduled reports
      </ModernButton>
    </div>
  );

  return (
    <AdminPageShell
      title={tenantName ? `${tenantName} — Monitoring` : "Tenant Monitoring"}
      description="Per-instance CPU, memory, network, and disk telemetry. Use this view to spot-check a tenant's workload or pull a utilization report."
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModernButton
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin-dashboard/partners/details?id=${encodeURIComponent(btoa(tenantId))}`)}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Back to tenant
        </ModernButton>

        <div className="flex items-center gap-2">
          <label htmlFor="window-preset" className="text-xs font-medium text-slate-600">
            Time window
          </label>
          <ModernSelect
            id="window-preset"
            value={preset}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setPreset(e.target.value as WindowPreset)
            }
            options={(Object.keys(PRESET_LABELS) as WindowPreset[]).map((key) => ({
              value: key,
              label: PRESET_LABELS[key],
            }))}
          />
        </div>
      </div>

      {instancesQuery.isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading instances...
        </div>
      ) : instancesQuery.isError ? (
        <InfoCallout tone="danger" title="Unable to load instances">
          {(instancesQuery.error as Error | undefined)?.message ||
            "Something went wrong fetching the tenant's instances."}
        </InfoCallout>
      ) : (instancesQuery.data ?? []).length === 0 ? (
        <InfoCallout tone="info" title="No active instances">
          This tenant has no active instances to monitor right now.
        </InfoCallout>
      ) : (
        <div className="space-y-4">
          {(instancesQuery.data ?? []).map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              tenantId={tenantId}
              params={range}
            />
          ))}
        </div>
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        tenantId={tenantId}
        defaultStart={range.start}
        defaultEnd={range.end}
      />
    </AdminPageShell>
  );
};

export default AdminTenantMonitoring;

/**
 * AlertRuleList — Manage alert rules for a database.
 *
 * Displays alert rules with metric, threshold, severity badges, and toggle controls.
 * Includes a create form for new rules with metric dropdown, operator, threshold,
 * duration, severity, and notification channel selection.
 */
import React, { useState, useMemo } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Search,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  ToggleLeft,
  ToggleRight,
  Check,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchAlertRules,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useToggleAlertRule,
  useFetchNotificationChannels,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { AlertRule, NotificationChannel } from "@/types/managedDatabase";

// ─── Constants ───────────────────────────────────────────────────

const METRICS = [
  { value: "cpu_percent", label: "CPU Usage (%)" },
  { value: "memory_percent", label: "Memory Usage (%)" },
  { value: "disk_percent", label: "Disk Usage (%)" },
  { value: "active_connections", label: "Active Connections" },
  { value: "replication_lag_seconds", label: "Replication Lag (s)" },
  { value: "query_latency_ms", label: "Query Latency (ms)" },
  { value: "iops_read", label: "Read IOPS" },
  { value: "iops_write", label: "Write IOPS" },
  { value: "network_in_bytes", label: "Network In (bytes)" },
  { value: "network_out_bytes", label: "Network Out (bytes)" },
] as const;

const OPERATORS = [
  { value: "above", label: "Above", symbol: ">" },
  { value: "below", label: "Below", symbol: "<" },
  { value: "equal", label: "Equal to", symbol: "=" },
] as const;

const SEVERITIES = [
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
] as const;

// ─── Severity Badge ──────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { icon: React.FC<{ size: number; className?: string }>; className: string }> = {
  critical: {
    icon: AlertCircle,
    className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-500/20",
  },
  info: {
    icon: Info,
    className: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-blue-500/20",
  },
};

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}>
      <Icon size={12} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

// ─── Operator Symbol ─────────────────────────────────────────────

const operatorSymbol = (op: string) =>
  OPERATORS.find((o) => o.value === op)?.symbol ?? op;

const metricLabel = (metric: string) =>
  METRICS.find((m) => m.value === metric)?.label ?? metric;

// ─── Create/Edit Form ────────────────────────────────────────────

interface RuleFormData {
  name: string;
  metric: string;
  operator: string;
  threshold: string;
  duration_minutes: string;
  severity: string;
  notification_channels: number[];
  is_enabled: boolean;
}

const EMPTY_FORM: RuleFormData = {
  name: "",
  metric: "cpu_percent",
  operator: "above",
  threshold: "",
  duration_minutes: "5",
  severity: "warning",
  notification_channels: [],
  is_enabled: true,
};

interface RuleFormProps {
  initial?: RuleFormData;
  channels: NotificationChannel[];
  onSubmit: (data: RuleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const RuleForm: React.FC<RuleFormProps> = ({ initial, channels, onSubmit, onCancel, isSubmitting, submitLabel }) => {
  const [form, setForm] = useState<RuleFormData>(initial ?? EMPTY_FORM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const toggleChannel = (id: number) => {
    setForm((prev) => ({
      ...prev,
      notification_channels: prev.notification_channels.includes(id)
        ? prev.notification_channels.filter((c) => c !== id)
        : [...prev.notification_channels, id],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rule Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. High CPU Alert"
          required
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Metric + Operator + Threshold */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Metric</label>
          <select
            value={form.metric}
            onChange={(e) => setForm({ ...form, metric: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {METRICS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Condition</label>
          <select
            value={form.operator}
            onChange={(e) => setForm({ ...form, operator: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {OPERATORS.map((o) => (
              <option key={o.value} value={o.value}>{o.label} ({o.symbol})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Threshold</label>
          <input
            type="number"
            step="any"
            value={form.threshold}
            onChange={(e) => setForm({ ...form, threshold: e.target.value })}
            placeholder="90"
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Duration + Severity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Duration (minutes)</label>
          <input
            type="number"
            min="1"
            max="1440"
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Severity</label>
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification Channels */}
      {channels.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Notification Channels</label>
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => {
              const selected = form.notification_channels.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {selected && <Check size={12} />}
                  {ch.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <ModernButton type="submit" variant="primary" size="sm" loading={isSubmitting}>
          {submitLabel}
        </ModernButton>
        <ModernButton type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </ModernButton>
      </div>
    </form>
  );
};

// ─── Main Component ──────────────────────────────────────────────

interface AlertRuleListProps {
  identifier: string | number;
}

const AlertRuleList: React.FC<AlertRuleListProps> = ({ identifier }) => {
  const { data: rulesRaw, isLoading, refetch } = useFetchAlertRules(identifier);
  const { data: channelsRaw } = useFetchNotificationChannels();
  const createMutation = useCreateAlertRule();
  const updateMutation = useUpdateAlertRule();
  const deleteMutation = useDeleteAlertRule();
  const toggleMutation = useToggleAlertRule();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const rules = useMemo(() => {
    const list = Array.isArray(rulesRaw) ? (rulesRaw as AlertRule[]) : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.metric.toLowerCase().includes(q) ||
        r.severity.toLowerCase().includes(q)
    );
  }, [rulesRaw, searchQuery]);

  const channels = useMemo(
    () => (Array.isArray(channelsRaw) ? (channelsRaw as NotificationChannel[]) : []),
    [channelsRaw]
  );

  const handleCreate = async (data: RuleFormData) => {
    await createMutation.mutateAsync({
      identifier,
      ...data,
      threshold: parseFloat(data.threshold),
      duration_minutes: parseInt(data.duration_minutes, 10),
    });
    setShowCreateForm(false);
  };

  const handleUpdate = async (ruleId: number, data: RuleFormData) => {
    await updateMutation.mutateAsync({
      identifier,
      alertId: ruleId,
      ...data,
      threshold: parseFloat(data.threshold),
      duration_minutes: parseInt(data.duration_minutes, 10),
    });
    setEditingRuleId(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ identifier, alertId: id });
      setConfirmDeleteId(null);
    } catch {
      // handled by mutation
    }
  };

  const handleToggle = async (rule: AlertRule) => {
    await toggleMutation.mutateAsync({
      identifier,
      alertId: rule.id,
    });
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading alert rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alert rules..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </ModernButton>
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => { setShowCreateForm(true); setEditingRuleId(null); }}
          >
            <Plus size={14} className="mr-1" />
            Add Alert Rule
          </ModernButton>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <ModernCard className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Create Alert Rule
          </h3>
          <RuleForm
            channels={channels}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Rule"
          />
        </ModernCard>
      )}

      {/* Empty State */}
      {!rules.length && !searchQuery && !showCreateForm && (
        <ModernCard className="py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
            <Bell className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Alert Rules
          </h3>
          <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400 mb-5">
            Set up threshold-based alerts to get notified when database metrics exceed defined limits.
          </p>
          <ModernButton variant="primary" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-1.5" />
            Create First Alert Rule
          </ModernButton>
        </ModernCard>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => {
          const isEditing = editingRuleId === rule.id;
          const isDeleting = confirmDeleteId === rule.id;

          if (isEditing) {
            return (
              <ModernCard key={rule.id} className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Edit Alert Rule
                </h3>
                <RuleForm
                  initial={{
                    name: rule.name,
                    metric: rule.metric,
                    operator: rule.operator,
                    threshold: String(rule.threshold),
                    duration_minutes: String(rule.duration_minutes),
                    severity: rule.severity,
                    notification_channels: rule.notification_channels ?? [],
                    is_enabled: rule.is_enabled,
                  }}
                  channels={channels}
                  onSubmit={(data) => handleUpdate(rule.id, data)}
                  onCancel={() => setEditingRuleId(null)}
                  isSubmitting={updateMutation.isPending}
                  submitLabel="Update Rule"
                />
              </ModernCard>
            );
          }

          return (
            <ModernCard
              key={rule.id}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                !rule.is_enabled ? "opacity-60" : ""
              }`}
            >
              {/* Severity color strip */}
              <div className={`absolute inset-y-0 left-0 w-1 ${
                rule.severity === "critical" ? "bg-red-500" :
                rule.severity === "warning" ? "bg-amber-500" : "bg-blue-500"
              }`} />

              <div className="p-5 pl-6 space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {rule.name}
                      </h4>
                      <SeverityBadge severity={rule.severity} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{metricLabel(rule.metric)}</span>
                      {" "}{operatorSymbol(rule.operator)}{" "}
                      <span className="font-mono font-medium">{rule.threshold}</span>
                      {" "}for {rule.duration_minutes}m
                    </p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(rule)}
                    disabled={toggleMutation.isPending}
                    className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title={rule.is_enabled ? "Disable rule" : "Enable rule"}
                  >
                    {rule.is_enabled ? (
                      <ToggleRight size={22} className="text-blue-500" />
                    ) : (
                      <ToggleLeft size={22} />
                    )}
                  </button>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {(rule.active_events_count ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                      <Activity size={11} />
                      {rule.active_events_count} active
                    </span>
                  )}
                  {(rule.notification_channels?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <Bell size={11} />
                      {rule.notification_channels!.length} channel(s)
                    </span>
                  )}
                  {rule.last_triggered_at && (
                    <span>Last triggered: {new Date(rule.last_triggered_at).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Delete Confirmation */}
                {isDeleting ? (
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Delete this alert rule?
                    </p>
                    <div className="flex gap-2">
                      <ModernButton
                        variant="danger"
                        size="xs"
                        loading={deleteMutation.isPending}
                        onClick={() => handleDelete(rule.id)}
                      >
                        Confirm
                      </ModernButton>
                      <ModernButton variant="ghost" size="xs" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                    <ModernButton
                      variant="ghost"
                      size="xs"
                      onClick={() => { setEditingRuleId(rule.id); setShowCreateForm(false); }}
                    >
                      <Pencil size={12} className="mr-1" />
                      Edit
                    </ModernButton>
                    <div className="flex-1" />
                    <button
                      onClick={() => setConfirmDeleteId(rule.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </ModernCard>
          );
        })}
      </div>

      {/* Search no results */}
      {searchQuery && rules.length === 0 && (
        <ModernCard className="py-10 text-center">
          <Search size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No rules matching &quot;{searchQuery}&quot;</p>
        </ModernCard>
      )}
    </div>
  );
};

export default AlertRuleList;

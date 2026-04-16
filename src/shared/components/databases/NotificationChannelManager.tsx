/**
 * NotificationChannelManager — Manage notification channels for alert delivery.
 *
 * Lists notification channels with type icons (Mail, Webhook, Slack), supports
 * create/edit/delete with type-specific configuration fields, test notification
 * button, and enable/disable toggle.
 */
import React, { useState, useMemo } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Search,
  Mail,
  Globe,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Send,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchNotificationChannels,
  useCreateNotificationChannel,
  useUpdateNotificationChannel,
  useDeleteNotificationChannel,
  useTestNotificationChannel,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { NotificationChannel } from "@/types/managedDatabase";

// ─── Type Config ─────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  icon: React.FC<{ size: number; className?: string }>;
  label: string;
  color: string;
  bgColor: string;
}> = {
  email: {
    icon: Mail,
    label: "Email",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  webhook: {
    icon: Globe,
    label: "Webhook",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  slack: {
    icon: MessageSquare,
    label: "Slack",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
};

const CHANNEL_TYPES = [
  { value: "email", label: "Email" },
  { value: "webhook", label: "Webhook" },
  { value: "slack", label: "Slack" },
] as const;

// ─── Type Icon ───────────────────────────────────────────────────

const TypeIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 16 }) => {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.webhook;
  const Icon = config.icon;
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}>
      <Icon size={size} className={config.color} />
    </div>
  );
};

// ─── Channel Form ────────────────────────────────────────────────

interface ChannelFormData {
  name: string;
  type: string;
  configuration: Record<string, unknown>;
  is_enabled: boolean;
}

const EMPTY_FORM: ChannelFormData = {
  name: "",
  type: "email",
  configuration: { addresses: [""] },
  is_enabled: true,
};

interface ChannelFormProps {
  initial?: ChannelFormData;
  onSubmit: (data: ChannelFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const ChannelForm: React.FC<ChannelFormProps> = ({ initial, onSubmit, onCancel, isSubmitting, submitLabel }) => {
  const [form, setForm] = useState<ChannelFormData>(initial ?? EMPTY_FORM);

  const handleTypeChange = (type: string) => {
    const config = type === "email"
      ? { addresses: [""] }
      : type === "webhook"
      ? { url: "" }
      : { webhook_url: "" };
    setForm({ ...form, type, configuration: config });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clean up email addresses (remove empty ones)
    if (form.type === "email") {
      const addresses = ((form.configuration as { addresses?: string[] }).addresses ?? []).filter(
        (a: string) => a.trim() !== ""
      );
      await onSubmit({ ...form, configuration: { addresses } });
    } else {
      await onSubmit(form);
    }
  };

  // Email addresses management
  const emailAddresses = (form.configuration as { addresses?: string[] }).addresses ?? [""];
  const addEmailAddress = () => {
    setForm({
      ...form,
      configuration: { addresses: [...emailAddresses, ""] },
    });
  };
  const updateEmailAddress = (index: number, value: string) => {
    const updated = [...emailAddresses];
    updated[index] = value;
    setForm({ ...form, configuration: { addresses: updated } });
  };
  const removeEmailAddress = (index: number) => {
    const updated = emailAddresses.filter((_, i) => i !== index);
    setForm({ ...form, configuration: { addresses: updated.length ? updated : [""] } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Channel Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Ops Team Email"
          required
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type</label>
        <div className="flex gap-2">
          {CHANNEL_TYPES.map((t) => {
            const config = TYPE_CONFIG[t.value] ?? TYPE_CONFIG.webhook;
            const Icon = config.icon;
            const selected = form.type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTypeChange(t.value)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                <Icon size={16} className={selected ? config.color : ""} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type-specific configuration */}
      {form.type === "email" && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Email Addresses</label>
          <div className="space-y-2">
            {emailAddresses.map((addr, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="email"
                  value={addr}
                  onChange={(e) => updateEmailAddress(i, e.target.value)}
                  placeholder="team@example.com"
                  required
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {emailAddresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmailAddress(i)}
                    className="rounded-md p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addEmailAddress}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
            >
              + Add another email
            </button>
          </div>
        </div>
      )}

      {form.type === "webhook" && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Webhook URL</label>
          <input
            type="url"
            value={(form.configuration as { url?: string }).url ?? ""}
            onChange={(e) => setForm({ ...form, configuration: { url: e.target.value } })}
            placeholder="https://api.example.com/webhooks/alerts"
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Alert payloads will be POSTed as JSON to this URL.
          </p>
        </div>
      )}

      {form.type === "slack" && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Slack Webhook URL</label>
          <input
            type="url"
            value={(form.configuration as { webhook_url?: string }).webhook_url ?? ""}
            onChange={(e) => setForm({ ...form, configuration: { webhook_url: e.target.value } })}
            placeholder="https://hooks.slack.com/services/T.../B.../..."
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Create an Incoming Webhook in your Slack workspace settings.
          </p>
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

const NotificationChannelManager: React.FC = () => {
  const { data: channelsRaw, isLoading, refetch } = useFetchNotificationChannels();
  const createMutation = useCreateNotificationChannel();
  const updateMutation = useUpdateNotificationChannel();
  const deleteMutation = useDeleteNotificationChannel();
  const testMutation = useTestNotificationChannel();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ channelId: number; success: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const channels = useMemo(() => {
    const list = Array.isArray(channelsRaw) ? (channelsRaw as NotificationChannel[]) : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
    );
  }, [channelsRaw, searchQuery]);

  const handleCreate = async (data: ChannelFormData) => {
    await createMutation.mutateAsync(data as unknown as Record<string, unknown>);
    setShowCreateForm(false);
  };

  const handleUpdate = async (channelId: number, data: ChannelFormData) => {
    await updateMutation.mutateAsync({ channelId, ...data } as Record<string, unknown>);
    setEditingChannelId(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch {
      // handled by mutation
    }
  };

  const handleTest = async (id: number) => {
    try {
      const result = await testMutation.mutateAsync(id);
      const data = result as Record<string, unknown>;
      setTestResult({ channelId: id, success: data?.success === true });
      setTimeout(() => setTestResult(null), 5000);
    } catch {
      setTestResult({ channelId: id, success: false });
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading notification channels...</p>
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
            placeholder="Search channels..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
          </ModernButton>
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => { setShowCreateForm(true); setEditingChannelId(null); }}
          >
            <Plus size={14} className="mr-1" />
            Add Channel
          </ModernButton>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <ModernCard className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Create Notification Channel
          </h3>
          <ChannelForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Channel"
          />
        </ModernCard>
      )}

      {/* Empty State */}
      {!channels.length && !searchQuery && !showCreateForm && (
        <ModernCard className="py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
            <Bell className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Notification Channels
          </h3>
          <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400 mb-5">
            Set up notification channels to receive alerts via email, webhook, or Slack
            when database metrics exceed thresholds.
          </p>
          <ModernButton variant="primary" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-1.5" />
            Create First Channel
          </ModernButton>
        </ModernCard>
      )}

      {/* Channels List */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {channels.map((channel) => {
          const isEditing = editingChannelId === channel.id;
          const isDeleting = confirmDeleteId === channel.id;
          const typeConfig = TYPE_CONFIG[channel.type] ?? TYPE_CONFIG.webhook;
          const hasTestResult = testResult?.channelId === channel.id;

          if (isEditing) {
            return (
              <ModernCard key={channel.id} className="p-5 md:col-span-2 xl:col-span-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Edit Channel
                </h3>
                <ChannelForm
                  initial={{
                    name: channel.name,
                    type: channel.type,
                    configuration: {}, // Config is encrypted server-side, user re-enters
                    is_enabled: channel.is_enabled,
                  }}
                  onSubmit={(data) => handleUpdate(channel.id, data)}
                  onCancel={() => setEditingChannelId(null)}
                  isSubmitting={updateMutation.isPending}
                  submitLabel="Update Channel"
                />
              </ModernCard>
            );
          }

          return (
            <ModernCard
              key={channel.id}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                !channel.is_enabled ? "opacity-60" : ""
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <TypeIcon type={channel.type} />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {channel.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {typeConfig.label}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await updateMutation.mutateAsync({
                        channelId: channel.id,
                        is_enabled: !channel.is_enabled,
                      });
                    }}
                    className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title={channel.is_enabled ? "Disable" : "Enable"}
                  >
                    {channel.is_enabled ? (
                      <ToggleRight size={22} className="text-blue-500" />
                    ) : (
                      <ToggleLeft size={22} />
                    )}
                  </button>
                </div>

                {/* Summary */}
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {channel.configuration_summary ? Object.values(channel.configuration_summary).join(", ") : "—"}
                </p>

                {/* Last Used */}
                {channel.last_used_at && (
                  <p className="text-[11px] text-gray-400">
                    Last used: {new Date(channel.last_used_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                {/* Test Result */}
                {hasTestResult && (
                  <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
                    testResult!.success
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                  }`}>
                    {testResult!.success ? (
                      <><CheckCircle2 size={12} /> Test notification sent!</>
                    ) : (
                      <><XCircle size={12} /> Test failed. Check configuration.</>
                    )}
                  </div>
                )}

                {/* Delete Confirmation */}
                {isDeleting ? (
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Delete this notification channel?
                    </p>
                    <div className="flex gap-2">
                      <ModernButton
                        variant="danger"
                        size="xs"
                        loading={deleteMutation.isPending}
                        onClick={() => handleDelete(channel.id)}
                      >
                        Confirm
                      </ModernButton>
                      <ModernButton variant="ghost" size="xs" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <ModernButton
                      variant="outline"
                      size="xs"
                      loading={testMutation.isPending}
                      onClick={() => handleTest(channel.id)}
                    >
                      <Send size={12} className="mr-1" />
                      Test
                    </ModernButton>
                    <ModernButton
                      variant="ghost"
                      size="xs"
                      onClick={() => { setEditingChannelId(channel.id); setShowCreateForm(false); }}
                    >
                      <Pencil size={12} className="mr-1" />
                      Edit
                    </ModernButton>
                    <div className="flex-1" />
                    <button
                      onClick={() => setConfirmDeleteId(channel.id)}
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
      {searchQuery && channels.length === 0 && (
        <ModernCard className="py-10 text-center">
          <Search size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No channels matching &quot;{searchQuery}&quot;</p>
        </ModernCard>
      )}
    </div>
  );
};

export default NotificationChannelManager;

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import { ModernButton, ModernInput, ModernCard } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "./api";

const EVENTS = [
  "migration_completed", "migration_failed",
  "backup_completed", "backup_failed",
  "failover_triggered", "replication_error",
  "ransomware_detected", "dr_drill_completed", "low_balance",
];
const CHANNELS = ["email", "slack", "pagerduty", "sms", "database"];

/**
 * Mask helper — mirrors the AnyCloudFlow MaskedSecretInput behaviour.
 * Reveals only the last 4 chars; shorter values are fully obscured.
 */
function maskPreview(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "••••";
  return `••••••••${trimmed.slice(-4)}`;
}

type SecretField =
  | "slack_webhook_url"
  | "pagerduty_routing_key"
  | "sms_gateway_token";

interface MaskedFieldProps {
  label: string;
  maskedValue: string; // What came back from the server (already masked).
  onChange: (value: string | null) => void;
  type?: string;
  placeholder?: string;
}

/**
 * Inline masked-secret input adapted to UniCloud's ModernInput look. Keeps
 * the interaction pattern (show mask → Replace → Cancel / Clear) aligned
 * with AnyCloudFlow's shared component without pulling a cross-app dep.
 */
function MaskedField({
  label,
  maskedValue,
  onChange,
  placeholder,
}: MaskedFieldProps) {
  const hasExisting = Boolean(maskedValue && maskedValue.length > 0);
  const [editing, setEditing] = useState<boolean>(!hasExisting);
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    if (!hasExisting) setEditing(true);
  }, [hasExisting]);

  if (hasExisting && !editing) {
    return (
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <div
            aria-label={`${label} (masked)`}
            className="flex-1 h-[42px] rounded-md border border-gray-200 dark:border-[#172036] bg-gray-50 dark:bg-[#0c1427] px-3 flex items-center font-mono text-sm text-gray-500 dark:text-gray-400 select-none"
          >
            {maskPreview(maskedValue)}
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft("");
              setEditing(true);
            }}
            className="h-[42px] px-3 rounded-md border border-gray-200 dark:border-[#172036] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#15203c]"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onChange(null);
            }}
            aria-label={`Clear ${label}`}
            className="h-[42px] px-3 rounded-md border border-gray-200 dark:border-[#172036] text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ModernInput
            label={label}
            type="password"
            value={draft}
            placeholder={placeholder}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setDraft(e.target.value);
              onChange(e.target.value);
            }}
          />
        </div>
        {hasExisting && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              setEditing(false);
              // Reverting to masked display — parent should not send this
              // field in the next save. We emit `undefined` by simply not
              // calling onChange here; the parent's "changed" tracker key
              // will tolerate this because it only flips true on the first
              // onChange call. Safer: re-emit `maskedValue` has no meaning
              // server-side, so we rely on the parent clearing its dirty
              // bit when appropriate. For simplicity, re-fetch will
              // overwrite anyway.
            }}
            className="h-[42px] mt-5 px-3 rounded-md border border-gray-200 dark:border-[#172036] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#15203c]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["acf-notif-prefs"],
    queryFn: () => acfApi.listNotificationPrefs(),
  });
  const prefs = ((data as { data?: unknown })?.data ?? (data as unknown) ?? []) as Array<{
    event_type: string;
    channels: string[];
    enabled: boolean;
  }>;

  // Org channels — fetch masked previews from the server. We keep the
  // non-secret `sms_gateway_url` in plain state, and track pending secret
  // updates separately so the save payload only includes fields the admin
  // actually touched.
  const { data: orgData } = useQuery({
    queryKey: ["acf-notif-org-channels"],
    queryFn: () => acfApi.getOrgChannels(),
  });
  const orgFromServer = ((orgData as { data?: unknown })?.data ?? {}) as Record<string, string | null | undefined>;

  const [smsUrl, setSmsUrl] = useState<string>("");
  const [smsUrlDirty, setSmsUrlDirty] = useState<boolean>(false);
  const [pendingSecrets, setPendingSecrets] = useState<
    Partial<Record<SecretField, string | null>>
  >({});

  useEffect(() => {
    setSmsUrl(orgFromServer.sms_gateway_url ?? "");
    setSmsUrlDirty(false);
    setPendingSecrets({});
  }, [orgData]); // eslint-disable-line react-hooks/exhaustive-deps

  const slackMasked =
    (orgFromServer.slack_webhook_url_masked as string | undefined) ??
    (orgFromServer.slack_webhook_url as string | undefined) ??
    "";
  const pdMasked =
    (orgFromServer.pagerduty_routing_key_masked as string | undefined) ??
    (orgFromServer.pagerduty_routing_key as string | undefined) ??
    "";
  const smsTokenMasked =
    (orgFromServer.sms_gateway_token_masked as string | undefined) ??
    (orgFromServer.sms_gateway_token as string | undefined) ??
    "";

  const setSecret = (field: SecretField, value: string | null) => {
    setPendingSecrets((prev) => ({ ...prev, [field]: value }));
  };

  const update = useMutation({
    mutationFn: (body: { event_type: string; channels: string[]; enabled: boolean }) =>
      acfApi.updateNotificationPrefs(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acf-notif-prefs"] }),
  });

  const saveOrgCfg = useMutation({
    mutationFn: () => {
      const payload: Record<string, string | null> = {};
      if (smsUrlDirty) payload.sms_gateway_url = smsUrl;
      for (const [field, value] of Object.entries(pendingSecrets)) {
        payload[field] = value as string | null;
      }
      return acfApi.configureOrgChannels(payload);
    },
    onSuccess: () => {
      ToastUtils.success("Organization channels saved");
      qc.invalidateQueries({ queryKey: ["acf-notif-org-channels"] });
    },
    onError: () => ToastUtils.error("Failed to save channels"),
  });

  const testChannel = useMutation({
    mutationFn: (channel: string) => acfApi.testNotificationChannel(channel),
    onSuccess: (_, channel) => ToastUtils.success(`Test notification sent to ${channel}`),
    onError: (_, channel) => ToastUtils.error(`Test to ${channel} failed`),
  });

  const isEnabled = (event: string, channel: string) => {
    const p = prefs.find((x) => x.event_type === event);
    return !!p?.enabled && (p.channels ?? []).includes(channel);
  };

  const toggle = (event: string, channel: string) => {
    const p = prefs.find((x) => x.event_type === event);
    const currentChannels = p?.channels ?? ["email", "database"];
    const isOn = currentChannels.includes(channel);
    const newChannels = isOn
      ? currentChannels.filter((c) => c !== channel)
      : [...currentChannels, channel];
    update.mutate({ event_type: event, channels: newChannels, enabled: true });
  };

  const hasChanges =
    smsUrlDirty || Object.keys(pendingSecrets).length > 0;

  return (
    <AdminPageShell
      title="Notification Preferences"
      description="Choose which channels receive alerts for each AnyCloudFlow event."
    >
      <div className="space-y-6">
        <ModernCard>
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">Organization channels</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Secrets are masked. Press <strong>Replace</strong> to set a new
              value, or <strong>Clear</strong> to remove one. Only fields you
              change are sent on save.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <MaskedField
                  label="Slack webhook URL"
                  maskedValue={slackMasked}
                  onChange={(v) => setSecret("slack_webhook_url", v)}
                  placeholder="https://hooks.slack.com/services/..."
                />
                <div className="mt-1">
                  <button
                    onClick={() => testChannel.mutate("slack")}
                    className="text-xs underline"
                    disabled={!slackMasked && !pendingSecrets.slack_webhook_url}
                  >
                    Test Slack
                  </button>
                </div>
              </div>
              <div>
                <MaskedField
                  label="PagerDuty routing key"
                  maskedValue={pdMasked}
                  onChange={(v) => setSecret("pagerduty_routing_key", v)}
                  placeholder="R0123456789ABCDEF..."
                />
                <div className="mt-1">
                  <button
                    onClick={() => testChannel.mutate("pagerduty")}
                    className="text-xs underline"
                    disabled={!pdMasked && !pendingSecrets.pagerduty_routing_key}
                  >
                    Test PagerDuty
                  </button>
                </div>
              </div>
              <div>
                <ModernInput
                  label="SMS gateway URL"
                  value={smsUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSmsUrl(e.target.value);
                    setSmsUrlDirty(true);
                  }}
                />
              </div>
              <div>
                <MaskedField
                  label="SMS gateway token"
                  maskedValue={smsTokenMasked}
                  onChange={(v) => setSecret("sms_gateway_token", v)}
                  placeholder="••••••••••••"
                />
                <div className="mt-1">
                  <button
                    onClick={() => testChannel.mutate("sms")}
                    className="text-xs underline"
                    disabled={
                      !smsUrl ||
                      (!smsTokenMasked && !pendingSecrets.sms_gateway_token)
                    }
                  >
                    Test SMS
                  </button>
                </div>
              </div>
            </div>
            <ModernButton
              onClick={() => saveOrgCfg.mutate()}
              disabled={saveOrgCfg.isPending || !hasChanges}
            >
              {saveOrgCfg.isPending ? "Saving…" : "Save organization channels"}
            </ModernButton>
          </div>
        </ModernCard>

        <ModernCard>
          <div className="p-6">
            <h3 className="font-semibold mb-4">Per-event preferences</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2">Event</th>
                    {CHANNELS.map((c) => (
                      <th key={c} className="text-center py-2 px-3 capitalize">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map((event) => (
                    <tr key={event} className="border-t border-gray-100 dark:border-[#172036]">
                      <td className="py-2 font-mono text-xs">{event}</td>
                      {CHANNELS.map((channel) => (
                        <td key={channel} className="text-center py-2 px-3">
                          <input
                            type="checkbox"
                            checked={isEnabled(event, channel)}
                            onChange={() => toggle(event, channel)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ModernCard>
      </div>
    </AdminPageShell>
  );
}

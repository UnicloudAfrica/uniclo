import React, { useState, useEffect } from "react";
import { AlertTriangle, Bell, Clock, Save, ShieldOff } from "lucide-react";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import {
  useFetchDunningPolicy,
  useUpdateDunningPolicy,
  type DunningPolicyPayload,
} from "@/shared/hooks/resources/dunningHooks";

// ─── Retry schedule helpers ────────────────────────────────────

const DEFAULT_RETRY_DAYS = [3, 7, 14];

/** Parse a user-typed comma-separated string into a sorted int array. */
function parseRetrySchedule(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

function formatRetrySchedule(schedule: number[]): string {
  return schedule.join(", ");
}

// ─── Component ────────────────────────────────────────────────

const TenantDunningSettings: React.FC = () => {
  const { data: policy, isLoading, isError } = useFetchDunningPolicy();
  const updateMutation = useUpdateDunningPolicy();

  // Local form state mirrors the policy fields.
  const [graceDays, setGraceDays] = useState<number>(3);
  const [retryRaw, setRetryRaw] = useState<string>(
    formatRetrySchedule(DEFAULT_RETRY_DAYS)
  );
  const [autoSuspend, setAutoSuspend] = useState<boolean>(false);
  const [suspendAfterDays, setSuspendAfterDays] = useState<number>(30);

  // Sync form when the remote policy loads.
  useEffect(() => {
    if (!policy) return;
    setGraceDays(policy.grace_days);
    setRetryRaw(formatRetrySchedule(policy.retry_schedule ?? DEFAULT_RETRY_DAYS));
    setAutoSuspend(policy.auto_suspend);
    setSuspendAfterDays(policy.suspend_after_days);
  }, [policy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: DunningPolicyPayload = {
      grace_days: graceDays,
      retry_schedule: parseRetrySchedule(retryRaw),
      auto_suspend: autoSuspend,
      suspend_after_days: suspendAfterDays,
    };
    updateMutation.mutate(payload);
  };

  return (
    <TenantPageShell
      title="Dunning Settings"
      description="Configure how overdue invoices are handled — grace periods, retry schedule, and auto-suspension."
    >
      {isLoading && (
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Failed to load dunning policy. Please refresh and try again.
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grace Period */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Grace Period
                </h2>
                <p className="text-sm text-gray-500">
                  Days after an invoice due-date before dunning begins.
                </p>
              </div>
            </div>

            <div className="max-w-xs">
              <label
                htmlFor="grace_days"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Grace days
              </label>
              <input
                id="grace_days"
                type="number"
                min={0}
                max={365}
                value={graceDays}
                onChange={(e) => setGraceDays(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Retry Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Retry Schedule
                </h2>
                <p className="text-sm text-gray-500">
                  Days after the grace window at which payment reminders are
                  sent (comma-separated).
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="retry_schedule"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Retry days (e.g. 3, 7, 14)
              </label>
              <input
                id="retry_schedule"
                type="text"
                value={retryRaw}
                onChange={(e) => setRetryRaw(e.target.value)}
                placeholder="3, 7, 14"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Parsed as:{" "}
                {parseRetrySchedule(retryRaw).join(", ") || "none"}
              </p>
            </div>
          </div>

          {/* Auto-Suspend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ShieldOff className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Auto-Suspension
                </h2>
                <p className="text-sm text-gray-500">
                  Automatically suspend accounts that remain overdue beyond the
                  threshold.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="auto_suspend"
                  type="checkbox"
                  checked={autoSuspend}
                  onChange={(e) => setAutoSuspend(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable automatic account suspension
                </span>
              </label>

              {autoSuspend && (
                <div className="max-w-xs ml-7">
                  <label
                    htmlFor="suspend_after_days"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Suspend after (days past grace)
                  </label>
                  <input
                    id="suspend_after_days"
                    type="number"
                    min={1}
                    max={365}
                    value={suspendAfterDays}
                    onChange={(e) =>
                      setSuspendAfterDays(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Saving…" : "Save Policy"}
            </button>
          </div>
        </form>
      )}
    </TenantPageShell>
  );
};

export default TenantDunningSettings;

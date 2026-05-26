/**
 * Admin Tenant Report Subscriptions page (Stream A, task A4).
 *
 * Sibling to `AdminTenantMonitoring`. Lets an admin manage the tenant's
 * scheduled utilization-report subscriptions: create, edit, delete, and
 * toggle the enabled flag.
 *
 * Tenant ID is read from the `?id=` query string (base64-encoded), same
 * convention as the rest of the admin dashboard.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import {
  ModernButton,
  ModernCard,
  ConfirmDialog,
  InfoCallout,
  StatusPill,
} from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { useFetchTenantById } from "@/hooks/adminHooks/tenantHooks";

import ReportSubscriptionForm from "../components/ReportSubscriptionForm";
import {
  useReportSubscriptions,
  useCreateReportSubscription,
  useUpdateReportSubscription,
  useDeleteReportSubscription,
  type ReportSubscription,
  type CreateReportSubscriptionPayload,
} from "../hooks/useReportSubscriptions";

// ─── Helpers ──────────────────────────────────────────────────────────

const decodeId = (encoded: string | null): string | null => {
  if (!encoded) return null;
  try {
    return atob(decodeURIComponent(encoded));
  } catch {
    return encoded;
  }
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const formatHour = (hour: number, tz: string): string => {
  const hh = String(hour).padStart(2, "0");
  return `${hh}:00 ${tz}`;
};

export const formatSchedule = (sub: ReportSubscription): string => {
  if (sub.cadence === "daily") {
    return `Daily at ${formatHour(sub.hour_of_day, sub.timezone)}`;
  }
  if (sub.cadence === "weekly") {
    const day = sub.day_of_week != null ? DAY_NAMES[sub.day_of_week] : "—";
    return `Weekly on ${day} at ${formatHour(sub.hour_of_day, sub.timezone)}`;
  }
  return `Monthly on day ${sub.day_of_month ?? "—"} at ${formatHour(sub.hour_of_day, sub.timezone)}`;
};

export const formatLocalDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

// ─── Row component ───────────────────────────────────────────────────

interface SubscriptionRowProps {
  subscription: ReportSubscription;
  tenantId: string;
  onEdit: (sub: ReportSubscription) => void;
}

const SubscriptionRow: React.FC<SubscriptionRowProps> = ({
  subscription,
  tenantId,
  onEdit,
}) => {
  const updateMutation = useUpdateReportSubscription(tenantId, subscription.id);
  const deleteMutation = useDeleteReportSubscription(tenantId, subscription.id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Re-entrancy guards. React's onClick batching can fire two handlers in the
  // same frame before `mutation.isPending` (re-render driven) flips to true.
  const toggleAction = useAsyncAction();
  const deleteAction = useAsyncAction();

  const handleToggle = async (next: boolean) => {
    if (toggleAction.isPending || updateMutation.isPending) return;
    try {
      await toggleAction.run(
        () => updateMutation.mutateAsync({ enabled: next }),
        { rethrow: true }
      );
      ToastUtils.success(
        next ? "Subscription enabled." : "Subscription paused."
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update subscription.";
      ToastUtils.error(message);
    }
  };

  const handleDelete = async () => {
    if (deleteAction.isPending || deleteMutation.isPending) return;
    try {
      await deleteAction.run(() => deleteMutation.mutateAsync(), {
        rethrow: true,
      });
      ToastUtils.success("Subscription deleted.");
      setConfirmingDelete(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not delete subscription.";
      ToastUtils.error(message);
    }
  };

  const recipientsLabel =
    subscription.recipients.length === 0
      ? "No recipients"
      : subscription.recipients.length <= 2
        ? subscription.recipients.join(", ")
        : `${subscription.recipients.slice(0, 2).join(", ")} +${subscription.recipients.length - 2} more`;

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 align-top">
        <div className="text-sm font-medium text-slate-800">
          {formatSchedule(subscription)}
        </div>
        <div className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">
          {subscription.output.toUpperCase()}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div
          className="text-sm text-slate-700"
          title={subscription.recipients.join(", ")}
        >
          {recipientsLabel}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <label className="inline-flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={subscription.enabled}
            disabled={toggleAction.isPending || updateMutation.isPending}
            onChange={(e) => handleToggle(e.target.checked)}
            aria-label={
              subscription.enabled
                ? `Disable subscription ${subscription.id}`
                : `Enable subscription ${subscription.id}`
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          <span>{subscription.enabled ? "Enabled" : "Paused"}</span>
        </label>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="text-sm text-slate-700">
          {formatLocalDate(subscription.next_run_at)}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="text-sm text-slate-700">
          {formatLocalDate(subscription.last_run_at)}
        </div>
        {subscription.last_run_status ? (
          <div className="mt-1">
            <StatusPill
              status={
                subscription.last_run_status === "success" ? "success" : "failed"
              }
            />
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-slate-400">Never run</div>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2">
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => onEdit(subscription)}
            aria-label={`Edit subscription ${subscription.id}`}
          >
            <Edit2 className="mr-1 h-3.5 w-3.5" />
            Edit
          </ModernButton>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingDelete(true)}
            aria-label={`Delete subscription ${subscription.id}`}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5 text-red-500" />
            <span className="text-red-600">Delete</span>
          </ModernButton>
        </div>
        <ConfirmDialog
          isOpen={confirmingDelete}
          title="Delete subscription?"
          message="This stops the schedule and removes it. Recipients will no longer receive this report."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
          isLoading={deleteAction.isPending || deleteMutation.isPending}
          variant="danger"
        />
      </td>
    </tr>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────

const AdminTenantReportSubscriptions = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tenantId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return decodeId(params.get("id"));
  }, [location.search]);

  const tenantQuery = useFetchTenantById(tenantId ?? "");
  const listQuery = useReportSubscriptions(tenantId ?? undefined);
  const createMutation = useCreateReportSubscription(tenantId ?? undefined);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReportSubscription | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Update mutation must be declared unconditionally (rules-of-hooks).
  // The hook accepts `undefined` for both args and throws inside the
  // mutation function if either is missing at call time.
  const updateMutation = useUpdateReportSubscription(
    tenantId ?? undefined,
    editing?.id,
  );

  // Re-entrancy guard for the create/update submit. The mutation's own
  // `isPending` flag only flips on the next render after `mutateAsync`
  // is called, so React batched onClicks can squeeze two submissions in.
  const submitAction = useAsyncAction();

  const tenantName = (tenantQuery.data as { name?: string } | undefined)?.name;

  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Partners", href: "/admin-dashboard/partners" },
    {
      label: tenantName ?? "Tenant",
      href: tenantId
        ? `/admin-dashboard/partners/details?id=${encodeURIComponent(btoa(tenantId))}`
        : undefined,
    },
    {
      label: "Monitoring",
      href: tenantId
        ? `/admin-dashboard/partners/monitoring?id=${encodeURIComponent(btoa(tenantId))}`
        : undefined,
    },
    { label: "Scheduled reports" },
  ];

  // Surface a single error toast when the list query fails.
  useEffect(() => {
    if (listQuery.isError) {
      const err = listQuery.error as Error | undefined;
      ToastUtils.error(err?.message || "Failed to load scheduled reports.");
    }
  }, [listQuery.isError, listQuery.error]);

  if (!tenantId) {
    return (
      <AdminPageShell title="Scheduled reports" breadcrumbs={breadcrumbs}>
        <InfoCallout tone="danger" title="Missing tenant ID">
          Open this page from the tenant monitoring screen — the URL must
          include an <code>?id</code> query parameter.
        </InfoCallout>
      </AdminPageShell>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    setFormOpen(true);
  };

  const openEdit = (sub: ReportSubscription) => {
    setEditing(sub);
    setServerError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setServerError(null);
  };

  const handleSubmit = async (payload: CreateReportSubscriptionPayload) => {
    if (
      submitAction.isPending ||
      createMutation.isPending ||
      updateMutation.isPending
    ) {
      return;
    }
    setServerError(null);
    try {
      await submitAction.run(
        () =>
          editing
            ? updateMutation.mutateAsync(payload)
            : createMutation.mutateAsync(payload),
        { rethrow: true }
      );
      ToastUtils.success(
        editing ? "Subscription updated." : "Subscription created."
      );
      closeForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save subscription.";
      setServerError(message);
      ToastUtils.error(message);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={() => listQuery.refetch()}
        disabled={listQuery.isFetching}
      >
        <RefreshCw
          className={`mr-1 h-3.5 w-3.5 ${listQuery.isFetching ? "animate-spin" : ""}`}
        />
        Refresh
      </ModernButton>
      <ModernButton variant="primary" size="sm" onClick={openCreate}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add subscription
      </ModernButton>
    </div>
  );

  const subscriptions = listQuery.data ?? [];

  return (
    <AdminPageShell
      title={tenantName ? `${tenantName} — Scheduled reports` : "Scheduled reports"}
      description="Manage recurring utilization-report deliveries for this tenant."
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModernButton
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate(
              `/admin-dashboard/partners/monitoring?id=${encodeURIComponent(btoa(tenantId))}`
            )
          }
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Back to monitoring
        </ModernButton>
      </div>

      {listQuery.isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading scheduled reports...
        </div>
      ) : listQuery.isError ? (
        <InfoCallout tone="danger" title="Unable to load scheduled reports">
          {(listQuery.error as Error | undefined)?.message ||
            "Something went wrong fetching the subscription list."}
        </InfoCallout>
      ) : subscriptions.length === 0 ? (
        <InfoCallout tone="info" title="No scheduled reports">
          No scheduled reports for this tenant yet.
        </InfoCallout>
      ) : (
        <ModernCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Schedule
                  </th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Recipients
                  </th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Next run
                  </th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Last run
                  </th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <SubscriptionRow
                    key={sub.id}
                    subscription={sub}
                    tenantId={tenantId}
                    onEdit={openEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </ModernCard>
      )}

      <ReportSubscriptionForm
        isOpen={formOpen}
        onClose={closeForm}
        subscription={editing}
        onSubmit={handleSubmit}
        isSubmitting={
          submitAction.isPending ||
          (editing ? updateMutation.isPending : createMutation.isPending)
        }
        serverError={serverError}
      />
    </AdminPageShell>
  );
};

export default AdminTenantReportSubscriptions;

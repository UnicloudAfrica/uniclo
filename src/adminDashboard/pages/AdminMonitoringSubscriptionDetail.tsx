/**
 * Admin monitoring subscription detail page (B7 frontend).
 *
 * Detail view for a single monitoring subscription: header with
 * tenant + tier + status + cost, the table of assigned hosts, and a
 * recent-events feed (last 50). Mirrors `AdminTenantMonitoring`'s
 * card-based composition.
 */
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, Server } from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import {
  ModernButton,
  ModernCard,
  StatusPill,
  InfoCallout,
} from "@/shared/components/ui";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";

import {
  useMonitoringSubscriptionDetail,
  type MonitoringSubscriptionEvent,
} from "../hooks/useAdminMonitoringSubscriptions";
import type { MonitoringTier } from "../hooks/useAdminMonitoringPricing";

const TIER_LABELS: Record<MonitoringTier, string> = {
  standard: "Standard",
  professional: "Professional",
  enterprise: "Enterprise",
};

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const AdminMonitoringSubscriptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: subscription, isLoading, isError, error } =
    useMonitoringSubscriptionDetail(id);

  // Cap the events list at 50 — the backend may return more, but the
  // contract calls for "last 50" so we slice locally as a safety net.
  const recentEvents = useMemo<MonitoringSubscriptionEvent[]>(
    () => (subscription?.recent_events ?? []).slice(0, 50),
    [subscription?.recent_events],
  );

  const headerActions = (
    <ModernButton
      variant="ghost"
      size="sm"
      onClick={() => navigate("/admin-dashboard/monitoring/subscriptions")}
    >
      <ArrowLeft className="mr-1 h-3.5 w-3.5" />
      Back to list
    </ModernButton>
  );

  if (isLoading) {
    return (
      <AdminPageShell title="monitoring subscription" actions={headerActions}>
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading subscription…
        </div>
      </AdminPageShell>
    );
  }

  if (isError || !subscription) {
    return (
      <AdminPageShell title="monitoring subscription" actions={headerActions}>
        <InfoCallout tone="danger" title="Unable to load subscription">
          {(error as Error | undefined)?.message ||
            "Something went wrong fetching the subscription."}
        </InfoCallout>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={`Subscription #${subscription.id}`}
      description={`${subscription.tenant_name} — ${TIER_LABELS[subscription.tier] || subscription.tier}`}
      actions={headerActions}
      contentClassName="space-y-6"
    >
      {/* Header summary */}
      <ModernCard padding="default" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{subscription.tenant_name}</h2>
            <p className="text-xs text-slate-500">
              Tenant ID: {subscription.tenant_id}
              {subscription.external_service_id
                ? ` · External: ${subscription.external_service_id}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {TIER_LABELS[subscription.tier] || subscription.tier}
            </span>
            <StatusPill status={subscription.status} />
            {subscription.last_run_status && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                Last run: <StatusPill status={subscription.last_run_status} />
              </span>
            )}
          </div>
        </div>

        <dl className="grid gap-3 md:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-slate-500">
              Monthly cost
            </dt>
            <dd className="text-base font-semibold text-slate-900">
              <PriceLabel
                amount={subscription.monthly_cost_usd}
                sourceCurrency={subscription.currency || "USD"}
              />
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-slate-500">Hosts</dt>
            <dd className="text-base font-semibold text-slate-900">
              {subscription.host_count}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-slate-500">Created</dt>
            <dd className="flex items-center gap-1 text-sm text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {formatDate(subscription.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-slate-500">
              External service
            </dt>
            <dd className="text-sm text-slate-700">
              {subscription.external_service_id || "—"}
            </dd>
          </div>
        </dl>
      </ModernCard>

      {/* Assigned hosts */}
      <ModernCard padding="default" className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Assigned hosts</h3>
            <p className="text-sm text-slate-500">
              {subscription.assigned_hosts.length} host
              {subscription.assigned_hosts.length === 1 ? "" : "s"} attached to this subscription
            </p>
          </div>
        </div>

        {subscription.assigned_hosts.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
            No hosts are currently assigned to this subscription.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 pr-3">Identifier</th>
                  <th className="py-3 pr-3">Name</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscription.assigned_hosts.map((host) => (
                  <tr key={String(host.id)}>
                    <td className="py-2 pr-3 text-xs font-mono text-slate-600">
                      {host.identifier}
                    </td>
                    <td className="py-2 pr-3 text-slate-900">{host.name || "—"}</td>
                    <td className="py-2 pr-3">
                      {host.status ? <StatusPill status={host.status} /> : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {formatDate(host.added_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModernCard>

      {/* Recent events */}
      <ModernCard padding="default" className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Recent events</h3>
          <p className="text-sm text-slate-500">
            Last {recentEvents.length} monitoring event
            {recentEvents.length === 1 ? "" : "s"} for this subscription
          </p>
        </div>

        {recentEvents.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
            No events recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentEvents.map((event) => (
              <li
                key={String(event.id)}
                className="flex items-start justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{event.type}</p>
                  {event.message && (
                    <p className="mt-0.5 truncate text-xs text-slate-500" title={event.message}>
                      {event.message}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {event.status && <StatusPill status={event.status} />}
                  <span className="text-[11px] text-slate-400">
                    {formatDate(event.occurred_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ModernCard>
    </AdminPageShell>
  );
};

export default AdminMonitoringSubscriptionDetail;

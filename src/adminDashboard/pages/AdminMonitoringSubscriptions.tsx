/**
 * Admin monitoring subscriptions page (B7 frontend).
 *
 * Paginated table of every monitoring subscription across all tenants,
 * filterable by tier, status, and CuberWatch-org presence. Each row
 * links to the subscription detail page.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import {
  ModernCard,
  ModernSelect,
  Pagination,
  StatusPill,
  InfoCallout,
} from "@/shared/components/ui";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";

import {
  useMonitoringSubscriptions,
  type MonitoringSubscription,
  type MonitoringSubscriptionsFilters,
} from "../hooks/useAdminMonitoringSubscriptions";
import type { MonitoringTier } from "../hooks/useAdminMonitoringPricing";

const TIER_LABELS: Record<MonitoringTier, string> = {
  standard: "Standard",
  professional: "Professional",
  enterprise: "Enterprise",
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending", label: "Pending" },
];

const TIER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All tiers" },
  { value: "standard", label: TIER_LABELS.standard },
  { value: "professional", label: TIER_LABELS.professional },
  { value: "enterprise", label: TIER_LABELS.enterprise },
];

const CUBERWATCH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Any" },
  { value: "yes", label: "Has CuberWatch org" },
  { value: "no", label: "No CuberWatch org" },
];

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const AdminMonitoringSubscriptions = () => {
  const navigate = useNavigate();

  const [tier, setTier] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [hasOrg, setHasOrg] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const filters = useMemo<MonitoringSubscriptionsFilters>(
    () => ({
      tier: (tier || undefined) as MonitoringTier | undefined,
      status: status || undefined,
      has_cuberwatch_org:
        hasOrg === "" ? undefined : hasOrg === "yes",
      page,
    }),
    [tier, status, hasOrg, page],
  );

  const { data, isLoading, isFetching, isError, error } =
    useMonitoringSubscriptions(filters);

  const subscriptions: MonitoringSubscription[] = data?.data ?? [];
  const meta = data?.meta ?? { current_page: 1, last_page: 1, total: 0 };

  const handleFilterChange = (
    setter: (value: string) => void,
  ): React.ChangeEventHandler<HTMLSelectElement> => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const goToDetail = (id: number) => {
    navigate(`/admin-dashboard/monitoring/subscriptions/${id}`);
  };

  return (
    <AdminPageShell
      title="monitoring subscriptions"
      description="Every monitoring subscription across all tenants. Filter by tier, status, or CuberWatch-org presence; click a row to see assigned hosts and recent events."
      contentClassName="space-y-6"
    >
      <ModernCard padding="default" className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label
              htmlFor="filter-tier"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Tier
            </label>
            <ModernSelect
              id="filter-tier"
              value={tier}
              onChange={handleFilterChange(setTier)}
              options={TIER_OPTIONS}
            />
          </div>
          <div>
            <label
              htmlFor="filter-status"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Status
            </label>
            <ModernSelect
              id="filter-status"
              value={status}
              onChange={handleFilterChange(setStatus)}
              options={STATUS_OPTIONS}
            />
          </div>
          <div>
            <label
              htmlFor="filter-org"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              CuberWatch organisation
            </label>
            <ModernSelect
              id="filter-org"
              value={hasOrg}
              onChange={handleFilterChange(setHasOrg)}
              options={CUBERWATCH_OPTIONS}
            />
          </div>
        </div>
      </ModernCard>

      {isError ? (
        <InfoCallout tone="danger" title="Unable to load subscriptions">
          {(error as Error | undefined)?.message ||
            "Something went wrong fetching the subscription list."}
        </InfoCallout>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading subscriptions…
        </div>
      ) : subscriptions.length === 0 ? (
        <InfoCallout tone="info" title="No subscriptions found">
          No monitoring subscriptions match the current filters.
        </InfoCallout>
      ) : (
        <ModernCard padding="default" className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 pr-3">Tenant</th>
                  <th className="py-3 pr-3">Tier</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3 text-right">Hosts</th>
                  <th className="py-3 pr-3 text-right">Monthly cost</th>
                  <th className="py-3 pr-3">Last run</th>
                  <th className="py-3 pr-3">Created</th>
                  <th className="py-3 pr-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="cursor-pointer transition hover:bg-slate-50"
                    onClick={() => goToDetail(sub.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToDetail(sub.id);
                      }
                    }}
                    aria-label={`Open subscription ${sub.id} for ${sub.tenant_name}`}
                  >
                    <td className="py-2 pr-3">
                      <p className="font-medium text-slate-900">{sub.tenant_name}</p>
                      <p className="text-[11px] text-slate-400">{sub.tenant_id}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {TIER_LABELS[sub.tier] || sub.tier}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <StatusPill status={sub.status} />
                    </td>
                    <td className="py-2 pr-3 text-right text-slate-700">{sub.host_count}</td>
                    <td className="py-2 pr-3 text-right font-medium text-slate-900">
                      <PriceLabel
                        amount={sub.monthly_cost_usd}
                        sourceCurrency={sub.currency || "USD"}
                      />
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {sub.last_run_status ? (
                        <StatusPill status={sub.last_run_status} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {formatDate(sub.created_at)}
                    </td>
                    <td className="py-2 pr-1 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={meta.current_page}
            totalPages={meta.last_page}
            totalItems={meta.total}
            itemsPerPage={subscriptions.length || 10}
            onPageChange={(p) => setPage(p)}
            onItemsPerPageChange={() => {
              /* page size fixed by backend; nothing to do */
            }}
          />

          {isFetching && !isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
            </div>
          )}
        </ModernCard>
      )}
    </AdminPageShell>
  );
};

export default AdminMonitoringSubscriptions;

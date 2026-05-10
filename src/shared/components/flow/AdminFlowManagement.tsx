/**
 * Admin-only Flow Management — plan management, subscription overview,
 * and behind-the-scenes provisioning for tenants (no payment required).
 *
 * Matches ResourceHero + ModernCard + table pattern from adminPricing and adminInventory.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  useAdminFlowApi,
  type FlowPlan,
  type FlowSubscription,
  type FlowOverview,
} from "@/shared/hooks/useFlowApi";
import ResourceHero from "@/shared/components/ui/ResourceHero";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  Users,
  Rocket,
  AlertTriangle,
  Plus,
  Power,
  PowerOff,
  Loader2,
  Search,
} from "lucide-react";

type Tab = "overview" | "plans" | "subscriptions" | "provision";

const formatKobo = (kobo: number): string => `\u20A6${(kobo / 100).toLocaleString()}`;

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    past_due: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
};

const AdminFlowManagement: React.FC = () => {
  const api = useAdminFlowApi();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<FlowOverview | null>(null);
  const [plans, setPlans] = useState<FlowPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<FlowSubscription[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Provision form
  const [tenantId, setTenantId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [skipTrial, setSkipTrial] = useState(true);
  const [provisioning, setProvisioning] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, plansRes, subsRes] = await Promise.all([
        api.getOverview(),
        api.getPlans(),
        api.getSubscriptions(),
      ]);
      setOverview(overviewRes.data);
      setPlans(plansRes.data);
      setSubscriptions(
        Array.isArray(subsRes.data) ? subsRes.data : (subsRes.data as { data?: unknown })?.data || [],
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProvision = async () => {
    if (!tenantId || !selectedPlan) return;
    setProvisioning(true);
    setError(null);
    try {
      await api.enableForTenant(Number(tenantId), selectedPlan, skipTrial);
      setTenantId("");
      setSelectedPlan("");
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to provision.");
    } finally {
      setProvisioning(false);
    }
  };

  const handleDeactivate = async (subId: number) => {
    if (!window.confirm("Deactivate this subscription?")) return;
    try {
      await api.deactivate(subId);
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deactivate.");
    }
  };

  const handleForceActivate = async (subId: number) => {
    try {
      await api.forceActivate(subId);
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to activate.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const heroMetrics = [
    {
      label: "Total Subscriptions",
      value: overview?.total_subscriptions || 0,
      description: "All time",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Active",
      value: overview?.active || 0,
      description: "Paying customers",
      icon: <Power className="h-5 w-5" />,
    },
    {
      label: "Trialing",
      value: overview?.trialing || 0,
      description: "On free trial",
      icon: <Rocket className="h-5 w-5" />,
    },
    {
      label: "Cancelled / Past Due",
      value: (overview?.cancelled || 0) + (overview?.past_due || 0),
      description: "Need attention",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "plans", label: "Plans" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "provision", label: "Provision Tenant" },
  ];

  const filteredSubs = subscriptions.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (searchTerm && !s.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <ResourceHero
        title="SlimDeploy Management"
        subtitle="Admin"
        description="Manage Flow plans, monitor subscriptions, and provision tenants behind the scenes — no payment required."
        metrics={heroMetrics}
        accent="midnight"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-primary-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ModernCard>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Plans
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {overview?.active_plans || 0}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              of {overview?.total_plans || 0} total
            </p>
          </ModernCard>
          <ModernCard>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Subs
            </p>
            <p className="mt-1 text-2xl font-semibold text-green-600">{overview?.active || 0}</p>
          </ModernCard>
          <ModernCard>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Trial Subs
            </p>
            <p className="mt-1 text-2xl font-semibold text-blue-600">{overview?.trialing || 0}</p>
          </ModernCard>
          <ModernCard>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cancelled
            </p>
            <p className="mt-1 text-2xl font-semibold text-red-600">{overview?.cancelled || 0}</p>
          </ModernCard>
        </div>
      )}

      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Flow Plans</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => (
              <ModernCard key={plan.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{plan.name}</h4>
                    <p className="mt-1 text-sm text-slate-500">{plan.slug}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${plan.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}
                  >
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatKobo(plan.price_monthly_kobo)}
                  <span className="text-sm font-normal text-slate-500">/mo</span>
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {plan.max_servers}
                    </p>
                    <p className="text-slate-500">Servers</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {plan.max_sites}
                    </p>
                    <p className="text-slate-500">Sites</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {plan.max_databases}
                    </p>
                    <p className="text-slate-500">DBs</p>
                  </div>
                </div>
                {plan.subscriptions_count !== undefined && (
                  <p className="mt-3 text-xs text-slate-500">
                    {plan.subscriptions_count} subscription
                    {plan.subscriptions_count !== 1 ? "s" : ""}
                  </p>
                )}
              </ModernCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by tenant name..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>

          <ModernCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                    <th className="px-5 py-3">Tenant</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Servers</th>
                    <th className="px-5 py-3">Period End</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No subscriptions found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => (
                      <tr
                        key={sub.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                          {sub.tenant?.name || `Tenant #${sub.tenant_id}`}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                          {sub.plan?.name || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                          {sub.server_links_count ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                          {sub.current_period_end
                            ? new Date(sub.current_period_end).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {sub.status !== "active" && (
                              <button
                                onClick={() => handleForceActivate(sub.id)}
                                className="rounded p-1 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Force Activate"
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            )}
                            {(sub.status === "active" || sub.status === "trialing") && (
                              <button
                                onClick={() => handleDeactivate(sub.id)}
                                className="rounded p-1 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Deactivate"
                              >
                                <PowerOff className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ModernCard>
        </div>
      )}

      {activeTab === "provision" && (
        <ModernCard>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Enable Flow for a Tenant
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Provision SlimDeploy behind the scenes — no payment required. The tenant will be
            automatically connected to LeanPloy.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tenant ID
              </label>
              <input
                type="number"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Enter tenant ID"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select a plan</option>
                {plans
                  .filter((p) => p.is_active)
                  .map((plan) => (
                    <option key={plan.id} value={plan.slug}>
                      {plan.name} — {formatKobo(plan.price_monthly_kobo)}/mo
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={skipTrial}
                onChange={(e) => setSkipTrial(e.target.checked)}
                className="rounded border-slate-300"
              />
              Skip trial — activate immediately (no payment)
            </label>
          </div>

          <ModernButton
            onClick={handleProvision}
            disabled={provisioning || !tenantId || !selectedPlan}
            className="mt-6"
          >
            {provisioning ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Provisioning...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Enable Flow for Tenant
              </span>
            )}
          </ModernButton>
        </ModernCard>
      )}
    </div>
  );
};

export default AdminFlowManagement;

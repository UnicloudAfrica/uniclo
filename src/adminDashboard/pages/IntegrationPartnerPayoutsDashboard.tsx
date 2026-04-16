import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RefreshCw,
  Calendar,
  FileText,
  Shield,
  ArrowRight,
  Layers,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "@/shared/components/ui";
import api from "@/lib/api";

// Types
interface IntegrationPayout {
  id: number;
  uuid: string;
  integration_key: string;
  period_start: string;
  period_end: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  currency: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  status: "pending" | "approved" | "processing" | "completed" | "failed" | "cancelled";
  gateway_reference: string | null;
  transfer_code: string | null;
  failure_reason: string | null;
  ledger_entries_count: number;
  operations_count: number;
  subscriptions_count: number;
  approved_at: string | null;
  processed_at: string | null;
  created_at: string;
  generated_by_user?: { id: number; name: string } | null;
  approved_by_user?: { id: number; name: string } | null;
  processed_by_user?: { id: number; name: string } | null;
}

interface UnsettledPartner {
  integration_key: string;
  unsettled_count: number;
  unsettled_total_cents: number;
}

interface PayoutSummary {
  unsettled: UnsettledPartner[];
  completed_this_month: number;
  total_paid_out: number;
}

interface PaginatedResponse {
  data: IntegrationPayout[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// API hooks
const useIntegrationPayouts = (params: Record<string, unknown>) =>
  useQuery({
    queryKey: ["integration-payouts", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== "" && v !== undefined) query.append(k, String(v));
      });
      const res = await api.get<{ data: PaginatedResponse }>(
        `/integration-payouts?${query.toString()}`,
        { silent: true }
      );
      return (res as { data: PaginatedResponse }).data ?? (res as PaginatedResponse);
    },
  });

const useUnsettledSummary = () =>
  useQuery({
    queryKey: ["integration-payouts", "unsettled-summary"],
    queryFn: async () => {
      const res = await api.get<{ data: PayoutSummary }>("/integration-payouts/unsettled-summary", {
        silent: true,
      });
      return (res as { data: PayoutSummary }).data ?? (res as unknown as PayoutSummary);
    },
  });

const useApprovePayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.post(`/integration-payouts/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration-payouts"] }),
  });
};

const useProcessPayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.post(`/integration-payouts/${id}/process`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration-payouts"] }),
  });
};

const useCancelPayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.post(`/integration-payouts/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration-payouts"] }),
  });
};

const useGeneratePayouts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      period_start: string;
      period_end: string;
      integration_key?: string;
    }) => api.post("/integration-payouts/generate", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration-payouts"] }),
  });
};

const useBulkApprove = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) =>
      api.post("/integration-payouts/bulk-approve", { payout_ids: ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration-payouts"] }),
  });
};

const useBulkProcess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) =>
      api.post("/integration-payouts/bulk-process", { payout_ids: ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integration-payouts"] }),
  });
};

// Helpers
const formatCurrency = (cents: number, currency = "NGN"): string => {
  const amount = cents / 100;
  const symbol = currency === "NGN" ? "\u20A6" : currency === "USD" ? "$" : currency + " ";
  return symbol + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
};

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getStatusColor = (status: string): string =>
  ({
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-indigo-100 text-indigo-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-600",
  })[status] || "bg-gray-100 text-gray-600";

const IntegrationPartnerPayoutsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    status: "",
    integration_key: "",
    date_from: "",
    date_to: "",
    page: 1,
    per_page: 20,
  });
  const [selected, setSelected] = useState<number[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<IntegrationPayout | null>(null);
  const [generateForm, setGenerateForm] = useState({
    period_start: "",
    period_end: "",
    integration_key: "",
  });

  const { data: payoutsData, isLoading } = useIntegrationPayouts(filters);
  const { data: summary } = useUnsettledSummary();
  const approvePayout = useApprovePayout();
  const processPayout = useProcessPayout();
  const cancelPayout = useCancelPayout();
  const generatePayouts = useGeneratePayouts();
  const bulkApprove = useBulkApprove();
  const bulkProcess = useBulkProcess();

  const payouts: IntegrationPayout[] = payoutsData?.data ?? [];
  const pagination = payoutsData ?? ({} as PaginatedResponse);

  const toggleSelect = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleSelectAll = () => {
    if (selected.length === payouts.length) {
      setSelected([]);
    } else {
      setSelected(payouts.map((p) => p.id));
    }
  };

  const handleApprove = async (id: number) => {
    if (!globalThis.window.confirm("Approve this payout for processing?")) return;
    try {
      await approvePayout.mutateAsync(id);
    } catch {
      /* toast handled by api */
    }
  };

  const handleProcess = async (id: number) => {
    if (
      !globalThis.window.confirm(
        "Process this payout? This will initiate the bank transfer via Paystack."
      )
    )
      return;
    try {
      await processPayout.mutateAsync(id);
    } catch {
      /* toast handled by api */
    }
  };

  const handleCancel = async (id: number) => {
    if (
      !globalThis.window.confirm(
        "Cancel this payout? Ledger entries will be released back to pending."
      )
    )
      return;
    try {
      await cancelPayout.mutateAsync(id);
    } catch {
      /* toast handled by api */
    }
  };

  const handleBulkApprove = async () => {
    const pendingIds = selected.filter((id) => payouts.find((p) => p.id === id)?.status === "pending");
    if (pendingIds.length === 0) {
      alert("No pending payouts selected.");
      return;
    }
    if (!globalThis.window.confirm(`Approve ${pendingIds.length} payout(s)?`)) return;
    try {
      await bulkApprove.mutateAsync(pendingIds);
      setSelected([]);
    } catch {
      /* toast handled */
    }
  };

  const handleBulkProcess = async () => {
    const approvedIds = selected.filter(
      (id) => payouts.find((p) => p.id === id)?.status === "approved"
    );
    if (approvedIds.length === 0) {
      alert("No approved payouts selected.");
      return;
    }
    if (
      !globalThis.window.confirm(
        `Process ${approvedIds.length} payout(s)? This will initiate bank transfers.`
      )
    )
      return;
    try {
      await bulkProcess.mutateAsync(approvedIds);
      setSelected([]);
    } catch {
      /* toast handled */
    }
  };

  const handleGenerate = async () => {
    if (!generateForm.period_start || !generateForm.period_end) {
      alert("Please select a date range.");
      return;
    }
    try {
      await generatePayouts.mutateAsync({
        period_start: generateForm.period_start,
        period_end: generateForm.period_end,
        integration_key: generateForm.integration_key || undefined,
      });
      setShowGenerateModal(false);
      setGenerateForm({ period_start: "", period_end: "", integration_key: "" });
    } catch {
      /* toast handled */
    }
  };

  // Unique integration keys from unsettled summary
  const integrationKeys = useMemo(
    () => summary?.unsettled?.map((u: UnsettledPartner) => u.integration_key) ?? [],
    [summary]
  );

  const totalUnsettledCents = useMemo(
    () =>
      summary?.unsettled?.reduce(
        (acc: number, u: UnsettledPartner) => acc + u.unsettled_total_cents,
        0
      ) ?? 0,
    [summary]
  );

  const summaryCards = useMemo(
    () => [
      {
        title: "Unsettled Balance",
        value: formatCurrency(totalUnsettledCents),
        subtitle: `${summary?.unsettled?.length ?? 0} partner(s)`,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
      {
        title: "Paid This Month",
        value: formatCurrency((summary?.completed_this_month ?? 0) * 100),
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "Total Paid Out",
        value: formatCurrency((summary?.total_paid_out ?? 0) * 100),
        icon: DollarSign,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
    ],
    [summary, totalUnsettledCents]
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <AdminPageShell
          title="Integration Partner Payouts"
          description="Manage revenue share settlements for integration partners (AnyCloudFlow, etc.)"
          actions={
            <div className="flex gap-2">
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["integration-payouts"] })}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </ModernButton>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate("/admin-dashboard/integration-partner-payouts/ledger")
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                View Ledger
              </ModernButton>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={() => setShowGenerateModal(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Generate Payouts
              </ModernButton>
            </div>
          }
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {summaryCards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-semibold mt-1">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                    )}
                  </div>
                  <div className={card.bgColor + " p-3 rounded-lg"}>
                    <card.icon className={"w-6 h-6 " + card.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Unsettled by Partner */}
          {summary?.unsettled && summary.unsettled.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Unsettled by Partner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.unsettled.map((partner: UnsettledPartner) => (
                  <div
                    key={partner.integration_key}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {partner.integration_key.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {partner.unsettled_count} entries
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-yellow-700">
                      {formatCurrency(partner.unsettled_total_cents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={filters.integration_key}
                  onChange={(e) =>
                    setFilters({ ...filters, integration_key: e.target.value, page: 1 })
                  }
                >
                  <option value="">All Partners</option>
                  {integrationKeys.map((key: string) => (
                    <option key={key} value={key}>
                      {key.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
                />
              </div>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({
                    status: "",
                    integration_key: "",
                    date_from: "",
                    date_to: "",
                    page: 1,
                    per_page: 20,
                  })
                }
              >
                Clear Filters
              </ModernButton>
            </div>
          </div>

          {/* Bulk Actions */}
          {selected.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-indigo-700 font-medium">
                {selected.length} payout(s) selected
              </span>
              <div className="flex gap-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={bulkApprove.isPending}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Approve Selected
                </ModernButton>
                <ModernButton
                  variant="primary"
                  size="sm"
                  onClick={handleBulkProcess}
                  disabled={bulkProcess.isPending}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Process Selected
                </ModernButton>
                <ModernButton variant="ghost" size="sm" onClick={() => setSelected([])}>
                  Clear
                </ModernButton>
              </div>
            </div>
          )}

          {/* Payouts Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={payouts.length > 0 && selected.length === payouts.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Partner
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Period
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Gross
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Fee
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Net
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Entries
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No integration partner payouts found
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(payout.id)}
                            onChange={() => toggleSelect(payout.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium capitalize text-sm">
                            {payout.integration_key.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {formatCurrency(payout.gross_amount_cents, payout.currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-red-600">
                          -{formatCurrency(payout.platform_fee_cents, payout.currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-sm">
                          {formatCurrency(payout.net_amount_cents, payout.currency)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                          {payout.ledger_entries_count}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              "inline-flex px-2 py-1 text-xs font-medium rounded-full " +
                              getStatusColor(payout.status)
                            }
                          >
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <ModernButton
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDetailModal(payout)}
                            >
                              <Eye className="w-3 h-3" />
                            </ModernButton>
                            {payout.status === "pending" && (
                              <>
                                <ModernButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(payout.id)}
                                  disabled={approvePayout.isPending}
                                >
                                  <Shield className="w-3 h-3 mr-1" />
                                  Approve
                                </ModernButton>
                                <ModernButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancel(payout.id)}
                                  disabled={cancelPayout.isPending}
                                >
                                  <XCircle className="w-3 h-3" />
                                </ModernButton>
                              </>
                            )}
                            {payout.status === "approved" && (
                              <>
                                <ModernButton
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleProcess(payout.id)}
                                  disabled={processPayout.isPending}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Process
                                </ModernButton>
                                <ModernButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancel(payout.id)}
                                  disabled={cancelPayout.isPending}
                                >
                                  <XCircle className="w-3 h-3" />
                                </ModernButton>
                              </>
                            )}
                            {payout.status === "failed" && payout.failure_reason && (
                              <span className="text-xs text-red-500 max-w-[150px] truncate" title={payout.failure_reason}>
                                {payout.failure_reason}
                              </span>
                            )}
                            {payout.status === "completed" && payout.processed_at && (
                              <span className="text-xs text-gray-500">
                                {formatDate(payout.processed_at)}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <ModernButton
                    variant="outline"
                    size="sm"
                    disabled={pagination.current_page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Previous
                  </ModernButton>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    disabled={pagination.current_page === pagination.last_page}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Next
                  </ModernButton>
                </div>
              </div>
            )}
          </div>
        </AdminPageShell>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Generate Integration Partner Payouts</h3>
            <p className="text-sm text-gray-500 mb-4">
              Aggregate unsettled ledger entries for the selected period into payouts ready for
              approval and bank transfer.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Start
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={generateForm.period_start}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, period_start: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={generateForm.period_end}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, period_end: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner (optional)
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={generateForm.integration_key}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, integration_key: e.target.value })
                  }
                >
                  <option value="">All Partners</option>
                  {integrationKeys.map((key: string) => (
                    <option key={key} value={key}>
                      {key.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <ModernButton variant="ghost" onClick={() => setShowGenerateModal(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={handleGenerate}
                disabled={generatePayouts.isPending}
              >
                {generatePayouts.isPending ? "Generating..." : "Generate Payouts"}
              </ModernButton>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Payout Details</h3>
              <ModernButton variant="ghost" size="sm" onClick={() => setShowDetailModal(null)}>
                <XCircle className="w-4 h-4" />
              </ModernButton>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Partner</span>
                <span className="font-medium capitalize">
                  {showDetailModal.integration_key.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Period</span>
                <span className="text-sm">
                  {formatDate(showDetailModal.period_start)} <ArrowRight className="w-3 h-3 inline mx-1" />{" "}
                  {formatDate(showDetailModal.period_end)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span
                  className={
                    "inline-flex px-2 py-1 text-xs font-medium rounded-full " +
                    getStatusColor(showDetailModal.status)
                  }
                >
                  {showDetailModal.status}
                </span>
              </div>

              <hr />

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gross Amount</span>
                  <span>
                    {formatCurrency(showDetailModal.gross_amount_cents, showDetailModal.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform Fee</span>
                  <span className="text-red-600">
                    -
                    {formatCurrency(
                      showDetailModal.platform_fee_cents,
                      showDetailModal.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                  <span>Net Amount</span>
                  <span>
                    {formatCurrency(showDetailModal.net_amount_cents, showDetailModal.currency)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-semibold">{showDetailModal.ledger_entries_count}</p>
                  <p className="text-xs text-gray-500">Ledger Entries</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-semibold">{showDetailModal.operations_count}</p>
                  <p className="text-xs text-gray-500">Operations</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-semibold">{showDetailModal.subscriptions_count}</p>
                  <p className="text-xs text-gray-500">Subscriptions</p>
                </div>
              </div>

              {showDetailModal.bank_name && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Bank Details</p>
                  <p className="text-sm font-medium">{showDetailModal.bank_name}</p>
                  <p className="text-sm text-gray-600">{showDetailModal.account_name}</p>
                  <p className="text-sm text-gray-400">{showDetailModal.account_number}</p>
                </div>
              )}

              {showDetailModal.gateway_reference && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Gateway Reference</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {showDetailModal.gateway_reference}
                  </code>
                </div>
              )}

              {showDetailModal.failure_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{showDetailModal.failure_reason}</p>
                </div>
              )}

              <div className="text-xs text-gray-400 space-y-1">
                {showDetailModal.generated_by_user && (
                  <p>Generated by: {showDetailModal.generated_by_user.name}</p>
                )}
                {showDetailModal.approved_by_user && (
                  <p>
                    Approved by: {showDetailModal.approved_by_user.name}{" "}
                    {showDetailModal.approved_at && `on ${formatDate(showDetailModal.approved_at)}`}
                  </p>
                )}
                {showDetailModal.processed_by_user && (
                  <p>
                    Processed by: {showDetailModal.processed_by_user.name}{" "}
                    {showDetailModal.processed_at &&
                      `on ${formatDate(showDetailModal.processed_at)}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationPartnerPayoutsDashboard;

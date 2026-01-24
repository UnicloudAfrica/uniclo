// @ts-nocheck
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Download,
  RefreshCw,
  Building2,
  Calendar,
  CreditCard,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "../../shared/components/ui";
import adminApi from "../../index/admin/api";

// Types
interface Payout {
  id: number;
  uuid: string;
  tenant_id: number;
  amount_cents: number;
  currency: string;
  period_start: string;
  period_end: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  gateway_reference: string | null;
  processed_at: string | null;
  settlements_count: number;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  created_at: string;
  tenant?: { id: number; name: string };
  processed_by?: { id: number; name: string };
}

interface PayoutSummary {
  pending: {
    count: number;
    total_amount_cents: number;
  };
  completed_this_month: number;
  total_paid_out: number;
}

// API hooks
const usePayouts = (params: Record<string, any>) => {
  return useQuery({
    queryKey: ["payouts", params],
    queryFn: async () => {
      const response = await adminApi.get("/payouts", { params });
      return response.data;
    },
  });
};

const usePayoutSummary = () => {
  return useQuery({
    queryKey: ["payouts", "summary"],
    queryFn: async () => {
      const response = await adminApi.get("/payouts/summary");
      return response.data.data as PayoutSummary;
    },
  });
};

const useProcessPayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await adminApi.post("/payouts/" + id + "/process");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });
};

const useCancelPayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await adminApi.post("/payouts/" + id + "/cancel");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });
};

const useGeneratePayouts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      period_start: string;
      period_end: string;
      tenant_id?: number;
    }) => {
      const response = await adminApi.post("/payouts/generate", params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });
};

// Helper functions
const formatCurrency = (cents: number, currency: string = "NGN"): string => {
  const amount = cents / 100;
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency + " ";
  return symbol + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
};

const PayoutsDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "",
    tenant_id: "",
    date_from: "",
    date_to: "",
    page: 1,
    per_page: 20,
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    period_start: "",
    period_end: "",
    tenant_id: "",
  });

  const { data: payoutsData, isLoading } = usePayouts(filters);
  const { data: summary } = usePayoutSummary();
  const processPayout = useProcessPayout();
  const cancelPayout = useCancelPayout();
  const generatePayouts = useGeneratePayouts();

  const payouts: Payout[] = payoutsData?.data?.data || [];
  const pagination = payoutsData?.data || {};

  const handleProcessPayout = async (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to process this payout? This will initiate the bank transfer."
      )
    ) {
      try {
        await processPayout.mutateAsync(id);
        alert("Payout processed successfully!");
      } catch (error: any) {
        alert(error.response?.data?.error || "Failed to process payout");
      }
    }
  };

  const handleCancelPayout = async (id: number) => {
    if (window.confirm("Are you sure you want to cancel this payout?")) {
      try {
        await cancelPayout.mutateAsync(id);
        alert("Payout cancelled");
      } catch (error: any) {
        alert(error.response?.data?.error || "Failed to cancel payout");
      }
    }
  };

  const handleGeneratePayouts = async () => {
    if (!generateForm.period_start || !generateForm.period_end) {
      alert("Please select a date range");
      return;
    }
    try {
      const result = await generatePayouts.mutateAsync({
        period_start: generateForm.period_start,
        period_end: generateForm.period_end,
        tenant_id: generateForm.tenant_id ? parseInt(generateForm.tenant_id) : undefined,
      });
      alert(result.message || "Payouts generated successfully!");
      setShowGenerateModal(false);
      setGenerateForm({ period_start: "", period_end: "", tenant_id: "" });
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to generate payouts");
    }
  };

  // Summary cards
  const summaryCards = useMemo(
    () => [
      {
        title: "Pending Payouts",
        value: summary?.pending?.count || 0,
        subtitle: formatCurrency(summary?.pending?.total_amount_cents || 0),
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
      {
        title: "Paid This Month",
        value: formatCurrency((summary?.completed_this_month || 0) * 100),
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "Total Paid Out",
        value: formatCurrency((summary?.total_paid_out || 0) * 100),
        icon: DollarSign,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
    ],
    [summary]
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <AdminPageShell
          title="Tenant Payouts"
          description="Manage settlements and payouts to tenants"
          actions={
            <div className="flex gap-2">
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["payouts"] })}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </ModernButton>
              <ModernButton variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
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
                    {card.subtitle && <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>}
                  </div>
                  <div className={card.bgColor + " p-3 rounded-lg"}>
                    <card.icon className={"w-6 h-6 " + card.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

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
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
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
                    tenant_id: "",
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

          {/* Payouts Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Tenant
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
                      Net Amount
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Bank Details
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No payouts found
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {payout.tenant?.name || "Tenant #" + payout.tenant_id}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {payout.settlements_count} settlements
                          </div>
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
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(payout.net_amount_cents, payout.currency)}
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
                        <td className="px-4 py-3 text-sm">
                          {payout.bank_name ? (
                            <div>
                              <div>{payout.bank_name}</div>
                              <div className="text-xs text-gray-500">{payout.account_number}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No bank details</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {payout.status === "pending" && (
                              <>
                                <ModernButton
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleProcessPayout(payout.id)}
                                  disabled={processPayout.isPending}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Process
                                </ModernButton>
                                <ModernButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelPayout(payout.id)}
                                  disabled={cancelPayout.isPending}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Cancel
                                </ModernButton>
                              </>
                            )}
                            {payout.status === "completed" && (
                              <span className="text-xs text-gray-500">
                                {payout.processed_at && formatDate(payout.processed_at)}
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

      {/* Generate Payouts Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Generate Payouts</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
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
                  onChange={(e) => setGenerateForm({ ...generateForm, period_end: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant ID (optional)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Leave empty for all tenants"
                  value={generateForm.tenant_id}
                  onChange={(e) => setGenerateForm({ ...generateForm, tenant_id: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <ModernButton variant="ghost" onClick={() => setShowGenerateModal(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={handleGeneratePayouts}
                disabled={generatePayouts.isPending}
              >
                {generatePayouts.isPending ? "Generating..." : "Generate Payouts"}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsDashboard;

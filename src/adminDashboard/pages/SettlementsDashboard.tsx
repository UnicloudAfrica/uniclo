// @ts-nocheck
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "../../shared/components/ui";
import adminApi from "../../index/admin/api";

// Types
interface Settlement {
  id: number;
  payer_type: string;
  payer_id: number;
  payee_type: string;
  payee_id: number;
  base_amount_cents: number;
  payer_discount_percent: number;
  payer_paid_cents: number;
  payee_discount_percent: number;
  payee_due_cents: number;
  margin_cents: number;
  status: "pending" | "partial" | "settled" | "disputed" | "written_off";
  settled_amount_cents: number;
  currency: string;
  created_at: string;
  payer?: any;
  payee?: any;
}

interface SettlementSummary {
  total_settlements: number;
  pending_count: number;
  settled_count: number;
  total_due: number;
  total_settled: number;
  total_outstanding: number;
  total_margin: number;
  total_profit: number;
  total_loss: number;
}

// API hooks
const useSettlements = (params: Record<string, any>) => {
  return useQuery({
    queryKey: ["settlements", params],
    queryFn: async () => {
      const response = await adminApi.get("/settlements", { params });
      return response.data;
    },
  });
};

const useSettlementSummary = () => {
  return useQuery({
    queryKey: ["settlements", "summary"],
    queryFn: async () => {
      const response = await adminApi.get("/settlements/summary");
      return response.data.data as SettlementSummary;
    },
  });
};

const useMarkSettled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reference,
      method,
    }: {
      id: number;
      reference?: string;
      method?: string;
    }) => {
      const response = await adminApi.post(`/settlements/${id}/mark-settled`, {
        reference,
        method,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
};

const useSendReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await adminApi.post(`/settlements/${id}/send-reminder`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
};

// Helper functions
const formatCurrency = (cents: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "settled":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "partial":
      return "bg-blue-100 text-blue-700";
    case "disputed":
      return "bg-red-100 text-red-700";
    case "written_off":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}> = ({ title, value, icon, trend, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div
        className={`p-3 rounded-full ${
          trend === "up"
            ? "bg-green-100 text-green-600"
            : trend === "down"
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-600"
        }`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const SettlementsDashboard: React.FC = () => {
  const [filters, setFilters] = useState({
    status: "",
    payer_type: "",
    margin_type: "",
    page: 1,
  });

  const { data: summary, isLoading: summaryLoading } = useSettlementSummary();
  const { data: settlementData, isLoading: settlementsLoading, refetch } = useSettlements(filters);
  const markSettled = useMarkSettled();
  const sendReminder = useSendReminder();

  const settlements = settlementData?.data?.data || [];
  const pagination = settlementData?.data || {};

  const handleMarkSettled = async (id: number) => {
    if (window.confirm("Mark this settlement as paid?")) {
      await markSettled.mutateAsync({ id });
    }
  };

  const handleSendReminder = async (id: number) => {
    if (window.confirm("Send payment reminder to the payer?")) {
      try {
        await sendReminder.mutateAsync(id);
        alert("Reminder sent successfully!");
      } catch (error: any) {
        alert(error.response?.data?.error || "Failed to send reminder");
      }
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.payer_type) params.append("payer_type", filters.payer_type);

    // Open export URL in new tab (will download CSV)
    const baseUrl = adminApi.defaults.baseURL || "";
    window.open(`${baseUrl}/settlements/export?${params.toString()}`, "_blank");
  };

  return (
    <>
      <AdminPageShell
        title="Settlement Dashboard"
        description="Track financial settlements between admin, tenants, and clients"
        actions={
          <div className="flex gap-2">
            <ModernButton variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </ModernButton>
            <ModernButton variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </ModernButton>
          </div>
        }
        contentClassName="space-y-6"
      >
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Outstanding"
            value={formatCurrency((summary?.total_outstanding || 0) * 100)}
            icon={<DollarSign className="w-5 h-5" />}
            subtitle={`${summary?.pending_count || 0} pending settlements`}
          />
          <StatCard
            title="Total Settled"
            value={formatCurrency((summary?.total_settled || 0) * 100)}
            icon={<CheckCircle className="w-5 h-5" />}
            trend="up"
            subtitle={`${summary?.settled_count || 0} settled`}
          />
          <StatCard
            title="Total Profit"
            value={formatCurrency((summary?.total_profit || 0) * 100)}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="up"
          />
          <StatCard
            title="Total Loss"
            value={formatCurrency((summary?.total_loss || 0) * 100)}
            icon={<TrendingDown className="w-5 h-5" />}
            trend="down"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="settled">Settled</option>
              <option value="disputed">Disputed</option>
            </select>
            <select
              value={filters.payer_type}
              onChange={(e) => setFilters({ ...filters, payer_type: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Payer Types</option>
              <option value="tenant">Tenants</option>
              <option value="user">Users</option>
            </select>
            <select
              value={filters.margin_type}
              onChange={(e) => setFilters({ ...filters, margin_type: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Margins</option>
              <option value="profit">Profitable</option>
              <option value="loss">Loss-making</option>
            </select>
          </div>
        </div>

        {/* Settlements Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlementsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading settlements...
                    </td>
                  </tr>
                ) : settlements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No settlements found
                    </td>
                  </tr>
                ) : (
                  settlements.map((settlement: Settlement) => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {settlement.payer?.name ||
                            settlement.payer?.first_name ||
                            `${settlement.payer_type} #${settlement.payer_id}`}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {settlement.payer_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(settlement.base_amount_cents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(settlement.payer_paid_cents)}
                        <span className="text-xs text-gray-500 ml-1">
                          ({settlement.payer_discount_percent}% off)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(settlement.payee_due_cents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            settlement.margin_cents > 0
                              ? "text-green-600"
                              : settlement.margin_cents < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {settlement.margin_cents >= 0 ? "+" : ""}
                          {formatCurrency(settlement.margin_cents)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            settlement.status
                          )}`}
                        >
                          {settlement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {settlement.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMarkSettled(settlement.id)}
                              disabled={markSettled.isPending}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Mark Settled
                            </button>
                            <button
                              onClick={() => handleSendReminder(settlement.id)}
                              disabled={sendReminder.isPending}
                              className="text-orange-600 hover:text-orange-800 font-medium"
                            >
                              Remind
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};

export default SettlementsDashboard;

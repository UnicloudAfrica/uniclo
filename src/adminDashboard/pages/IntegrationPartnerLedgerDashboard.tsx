import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Clock,
  CheckCircle,
  FileText,
  ArrowLeft,
  Layers,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "@/shared/components/ui";
import api from "@/lib/api";

// Types
interface LedgerEntry {
  id: number;
  integration_key: string;
  service_type: string;
  reference_type: string;
  reference_id: number;
  tenant_id: number;
  gross_amount_cents: number;
  partner_share_cents: number;
  platform_share_cents: number;
  currency: string;
  billing_model: string;
  settled_via_split: boolean;
  status: "pending" | "included_in_payout" | "settled";
  payout_id: number | null;
  created_at: string;
}

interface PartnerHistory {
  integration_key: string;
  payouts: {
    data: Array<{
      id: number;
      uuid: string;
      period_start: string;
      period_end: string;
      gross_amount_cents: number;
      platform_fee_cents: number;
      net_amount_cents: number;
      currency: string;
      status: string;
      ledger_entries_count: number;
      processed_at: string | null;
      created_at: string;
    }>;
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  summary: {
    total_paid: number;
    pending: number;
    payout_count: number;
  };
}

interface PaginatedLedger {
  data: LedgerEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// API hooks
const usePartnerLedger = (integrationKey: string, status: string, page: number) =>
  useQuery({
    queryKey: ["integration-ledger", integrationKey, status, page],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (status) query.append("status", status);
      query.append("page", String(page));
      query.append("per_page", "50");
      const res = await api.get<{ data: PaginatedLedger }>(
        `/integration-payouts/partners/${integrationKey}/ledger?${query.toString()}`,
        { silent: true }
      );
      return (res as { data: PaginatedLedger }).data ?? (res as unknown as PaginatedLedger);
    },
    enabled: !!integrationKey,
  });

const usePartnerHistory = (integrationKey: string) =>
  useQuery({
    queryKey: ["integration-history", integrationKey],
    queryFn: async () => {
      const res = await api.get<{ data: PartnerHistory }>(
        `/integration-payouts/partners/${integrationKey}/history`,
        { silent: true }
      );
      return (res as { data: PartnerHistory }).data ?? (res as unknown as PartnerHistory);
    },
    enabled: !!integrationKey,
  });

const useUnsettledSummary = () =>
  useQuery({
    queryKey: ["integration-payouts", "unsettled-summary"],
    queryFn: async () => {
      const res = await api.get<{ data: { unsettled: Array<{ integration_key: string; unsettled_count: number; unsettled_total_cents: number }> } }>(
        "/integration-payouts/unsettled-summary",
        { silent: true }
      );
      return (res as { data: { unsettled: Array<{ integration_key: string }> } }).data ?? res;
    },
  });

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

const formatDateTime = (dateString: string): string =>
  new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusColor = (status: string): string =>
  ({
    pending: "bg-yellow-100 text-yellow-800",
    included_in_payout: "bg-blue-100 text-blue-800",
    settled: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    approved: "bg-indigo-100 text-indigo-800",
    processing: "bg-blue-100 text-blue-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-600",
  })[status] || "bg-gray-100 text-gray-600";

const IntegrationPartnerLedgerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedPartner = searchParams.get("partner") || "";
  const [statusFilter, setStatusFilter] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"ledger" | "history">("ledger");

  const { data: summaryData } = useUnsettledSummary();
  const partners =
    (summaryData as { unsettled?: Array<{ integration_key: string; unsettled_count: number; unsettled_total_cents: number }> })?.unsettled ?? [];

  const { data: ledgerData, isLoading: ledgerLoading } = usePartnerLedger(
    selectedPartner,
    statusFilter,
    ledgerPage
  );
  const { data: historyData, isLoading: historyLoading } = usePartnerHistory(selectedPartner);

  const ledgerEntries: LedgerEntry[] = ledgerData?.data ?? [];
  const ledgerPagination = ledgerData ?? ({} as PaginatedLedger);
  const history = historyData as PartnerHistory | undefined;

  const selectPartner = (key: string) => {
    setSearchParams({ partner: key });
    setLedgerPage(1);
    setStatusFilter("");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <AdminPageShell
          title="Integration Settlement Ledger"
          description="View per-partner ledger entries and payout history"
          actions={
            <div className="flex gap-2">
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin-dashboard/integration-partner-payouts")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Payouts
              </ModernButton>
            </div>
          }
        >
          {/* Partner Selection */}
          {!selectedPartner ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Select an integration partner to view their ledger
              </h3>
              {partners.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                  No integration partners with ledger entries found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partners.map((partner) => (
                    <button
                      key={partner.integration_key}
                      onClick={() => selectPartner(partner.integration_key)}
                      className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                          <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <p className="font-medium capitalize text-lg">
                          {partner.integration_key.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {partner.unsettled_count} unsettled entries
                        </span>
                        <span className="text-sm font-semibold text-yellow-700">
                          {formatCurrency(partner.unsettled_total_cents)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Partner Header */}
              <div className="flex items-center gap-3 mb-6">
                <ModernButton variant="ghost" size="sm" onClick={() => setSearchParams({})}>
                  <ArrowLeft className="w-4 h-4" />
                </ModernButton>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold capitalize">
                    {selectedPartner.replace(/_/g, " ")}
                  </h3>
                </div>
              </div>

              {/* History Summary Cards */}
              {history && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Paid Out</p>
                        <p className="text-2xl font-semibold mt-1">
                          {formatCurrency(history.summary.total_paid * 100)}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Pending Payouts</p>
                        <p className="text-2xl font-semibold mt-1">
                          {formatCurrency(history.summary.pending * 100)}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Payouts</p>
                        <p className="text-2xl font-semibold mt-1">
                          {history.summary.payout_count}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                    activeTab === "ledger"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("ledger")}
                >
                  <FileText className="w-4 h-4 inline mr-1.5" />
                  Ledger Entries
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                    activeTab === "history"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("history")}
                >
                  <DollarSign className="w-4 h-4 inline mr-1.5" />
                  Payout History
                </button>
              </div>

              {/* Ledger Tab */}
              {activeTab === "ledger" && (
                <>
                  <div className="flex gap-3 mb-4">
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setLedgerPage(1);
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="included_in_payout">In Payout</option>
                      <option value="settled">Settled</option>
                    </select>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Service
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Reference
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Billing
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Gross
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Partner Share
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Platform
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Settlement
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ledgerLoading ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                Loading...
                              </td>
                            </tr>
                          ) : ledgerEntries.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                No ledger entries found
                              </td>
                            </tr>
                          ) : (
                            ledgerEntries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {formatDateTime(entry.created_at)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="capitalize">
                                    {entry.service_type.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="text-xs text-gray-400">
                                    {entry.reference_type}
                                  </span>
                                  <span className="text-xs font-mono ml-1">
                                    #{entry.reference_id}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                                    {entry.billing_model.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                  {formatCurrency(entry.gross_amount_cents, entry.currency)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-green-700">
                                  {formatCurrency(entry.partner_share_cents, entry.currency)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-500">
                                  {formatCurrency(entry.platform_share_cents, entry.currency)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {entry.settled_via_split ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                      Split
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                                      Deferred
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={
                                      "inline-flex px-2 py-1 text-xs font-medium rounded-full " +
                                      getStatusColor(entry.status)
                                    }
                                  >
                                    {entry.status.replace(/_/g, " ")}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {ledgerPagination.last_page > 1 && (
                      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Showing{" "}
                          {(ledgerPagination.current_page - 1) * ledgerPagination.per_page + 1} to{" "}
                          {Math.min(
                            ledgerPagination.current_page * ledgerPagination.per_page,
                            ledgerPagination.total
                          )}{" "}
                          of {ledgerPagination.total} entries
                        </div>
                        <div className="flex gap-2">
                          <ModernButton
                            variant="outline"
                            size="sm"
                            disabled={ledgerPagination.current_page === 1}
                            onClick={() => setLedgerPage((p) => p - 1)}
                          >
                            Previous
                          </ModernButton>
                          <ModernButton
                            variant="outline"
                            size="sm"
                            disabled={ledgerPagination.current_page === ledgerPagination.last_page}
                            onClick={() => setLedgerPage((p) => p + 1)}
                          >
                            Next
                          </ModernButton>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
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
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            Processed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {historyLoading ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                              Loading...
                            </td>
                          </tr>
                        ) : !history?.payouts?.data?.length ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                              No payout history yet
                            </td>
                          </tr>
                        ) : (
                          history.payouts.data.map((payout) => (
                            <tr key={payout.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                {formatDate(payout.period_start)} -{" "}
                                {formatDate(payout.period_end)}
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
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {payout.processed_at ? formatDate(payout.processed_at) : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </AdminPageShell>
      </div>
    </div>
  );
};

export default IntegrationPartnerLedgerDashboard;

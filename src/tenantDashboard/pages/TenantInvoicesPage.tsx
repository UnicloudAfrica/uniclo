// @ts-nocheck
import React, { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import {
  useInvoices,
  useEnforcementSummary,
  usePaySettlements,
} from "../../hooks/useTenantBilling";

const formatCurrency = (amount: number, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const badges = {
    paid: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Paid" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock, label: "Pending" },
    overdue: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle, label: "Overdue" },
    void: { bg: "bg-gray-100", text: "text-gray-700", icon: XCircle, label: "Void" },
  };
  return badges[status] || badges.pending;
};

const TenantInvoicesPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");

  const { data: invoiceData, isLoading: isLoadingInvoices } = useInvoices({
    status: statusFilter !== "all" ? statusFilter : undefined,
    page: currentPage,
  });

  const { data: enforcementData, isLoading: isLoadingEnforcement } = useEnforcementSummary();
  const paySettlementsMutation = usePaySettlements();

  const invoices = invoiceData?.invoices || [];
  const pagination = invoiceData?.meta || { current_page: 1, last_page: 1 };

  const handleDownloadPdf = async (invoiceId: number, invoiceNumber: string) => {
    try {
      // Open PDF in new tab (backend returns PDF download)
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "";
      window.open(`${apiUrl}/api/tenant/v1/invoices/${invoiceId}/pdf`, "_blank");
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  const handlePaySettlements = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paySettlementsMutation.mutateAsync({
        amount_cents: Math.round(parseFloat(paymentAmount) * 100),
        payment_method: paymentMethod,
        reference: paymentReference || undefined,
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentReference("");
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  return (
    <TenantPageShell title="Invoices" description="View and manage your invoices">
      {/* Enforcement Summary */}
      {enforcementData &&
        (enforcementData.total_outstanding_cents > 0 || enforcementData.is_suspended) && (
          <div
            className={`rounded-xl p-4 mb-6 ${enforcementData.is_suspended ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`w-5 h-5 ${enforcementData.is_suspended ? "text-red-600" : "text-yellow-600"}`}
                />
                <div>
                  <p
                    className={`font-medium ${enforcementData.is_suspended ? "text-red-800" : "text-yellow-800"}`}
                  >
                    {enforcementData.is_suspended ? "Account Suspended" : "Outstanding Balance"}
                  </p>
                  <p
                    className={`text-sm ${enforcementData.is_suspended ? "text-red-600" : "text-yellow-600"}`}
                  >
                    Total Outstanding:{" "}
                    {formatCurrency(enforcementData.total_outstanding_cents / 100)}
                    {enforcementData.overdue_count > 0 &&
                      ` (${enforcementData.overdue_count} overdue)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Make Payment
              </button>
            </div>
          </div>
        )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isLoadingInvoices ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-3 text-gray-500">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">No invoices found</p>
            <p className="text-sm text-gray-500 mt-1">
              Your invoices will appear here when generated.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                    <th className="px-6 py-3 font-medium">Invoice #</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Due Date</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice) => {
                    const badge = getStatusBadge(invoice.status);
                    const StatusIcon = badge.icon;
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {invoice.invoice_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadPdf(invoice.id, invoice.invoice_number)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-500">
                  Page {pagination.current_page} of {pagination.last_page}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                    disabled={currentPage === pagination.last_page}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Make Payment</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePaySettlements} className="p-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency((enforcementData?.total_outstanding_cents || 0) / 100)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card Payment</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Transaction reference..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySettlementsMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {paySettlementsMutation.isPending ? "Processing..." : "Submit Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TenantPageShell>
  );
};

export default TenantInvoicesPage;

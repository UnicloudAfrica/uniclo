// @ts-nocheck
import React, { useState } from "react";
import {
  Receipt,
  CreditCard,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import {
  useClientInvoices,
  useBillingSummary,
  usePayInvoice,
  Invoice,
  getStatusColor,
  getStatusLabel,
  formatCurrency,
} from "../../hooks/useClientInvoices";

// Status badge component
const StatusBadge: React.FC<{ status: Invoice["status"] }> = ({ status }: any) => {
  const colorMap: Record<Invoice["status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    partial: "bg-blue-100 text-blue-700",
    overdue: "bg-red-100 text-red-700",
    void: "bg-gray-100 text-gray-500",
    refunded: "bg-purple-100 text-purple-700",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[status]}`}>
      {getStatusLabel(status)}
    </span>
  );
};

// Summary card component
const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div
        className={`p-2.5 rounded-lg ${color.replace("text-", "bg-").replace("-600", "-100").replace("-700", "-100")}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

// Invoice row component
const InvoiceRow: React.FC<{
  invoice: Invoice;
  onPay: (id: number) => void;
  isPaymentLoading: boolean;
}> = ({ invoice, onPay, isPaymentLoading }: any) => {
  const isPastDue = invoice.status === "overdue";
  const canPay = ["pending", "partial", "overdue"].includes(invoice.status);

  return (
    <div
      className={`bg-white rounded-lg border ${isPastDue ? "border-red-200" : "border-gray-200"} p-4 hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${isPastDue ? "bg-red-50" : "bg-gray-50"}`}>
            <Receipt className={`w-5 h-5 ${isPastDue ? "text-red-500" : "text-gray-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Due: {new Date(invoice.due_date).toLocaleDateString()}
              {invoice.days_overdue && invoice.days_overdue > 0 && (
                <span className="text-red-500 ml-2">({invoice.days_overdue} days overdue)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {formatCurrency(invoice.amount_due, invoice.currency)}
            </p>
            <p className="text-xs text-gray-500">
              of {formatCurrency(invoice.total, invoice.currency)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canPay && (
              <button
                onClick={() => onPay(invoice.id)}
                disabled={isPaymentLoading}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                Pay Now
              </button>
            )}
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientBillingPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    refetch,
  } = useClientInvoices({
    status: statusFilter || undefined,
    page: currentPage,
    per_page: 10,
  });

  const { data: summaryData, isLoading: summaryLoading } = useBillingSummary();
  const payInvoice = usePayInvoice();

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      const result = await payInvoice.mutateAsync(invoiceId);
      // Handle payment initialization - could redirect to payment gateway
      console.log("Payment initialized:", result);
      // TODO: Integrate with payment gateway (Paystack/Stripe)
      alert(
        `Payment of ${formatCurrency(result.data.amount, result.data.currency)} initiated. ${result.data.message}`
      );
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  const stats = summaryData?.data?.statistics;
  const invoices = invoicesData?.data || [];
  const meta = invoicesData?.meta;

  return (
    <ClientPageShell
      title="Billing & Invoices"
      description="Manage your invoices, view payment history, and track your subscription billing."
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Total Outstanding"
          value={stats ? formatCurrency(stats.total_pending + stats.total_overdue) : "—"}
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          color="text-yellow-600"
          subtitle={`${(stats?.pending_count || 0) + (stats?.overdue_count || 0)} invoices`}
        />
        <SummaryCard
          title="Overdue"
          value={stats ? formatCurrency(stats.total_overdue) : "—"}
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          color="text-red-600"
          subtitle={stats?.overdue_count ? `${stats.overdue_count} invoices` : "None"}
        />
        <SummaryCard
          title="Total Paid"
          value={stats ? formatCurrency(stats.total_paid) : "—"}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          color="text-green-600"
          subtitle="All time"
        />
        <SummaryCard
          title="Total Invoices"
          value={stats?.total_invoices || 0}
          icon={<Receipt className="w-5 h-5 text-blue-600" />}
          color="text-blue-600"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Invoices</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partially Paid</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {invoicesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-3">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-3">No invoices found</p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter ? "Try changing the filter" : "Your invoices will appear here"}
            </p>
          </div>
        ) : (
          invoices.map((invoice: any) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              onPay={handlePayInvoice}
              isPaymentLoading={payInvoice.isPending}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {(meta.current_page - 1) * meta.per_page + 1} to{" "}
            {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} invoices
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </ClientPageShell>
  );
};

export default ClientBillingPage;

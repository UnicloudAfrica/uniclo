import { useState } from "react";
import { Download, Receipt } from "lucide-react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";
import {
  useFetchTransactions,
  getTransactionTypeLabel,
  isDebitType,
} from "@/shared/hooks/resources/transactionHooks";
import type { WalletTransaction } from "@/shared/hooks/resources/transactionHooks";

// ─── Status badge ────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  reversed: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASSES[status] ?? "bg-gray-100 text-gray-500";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ─── Receipt download affordance ─────────────────────────────────

function DownloadButton({ tx }: { tx: WalletTransaction }) {
  const label = tx.reference ?? `txn-${tx.uuid}`;
  const handleDownload = () => {
    // Produce a minimal text receipt the browser downloads directly.
    const lines = [
      `UniCloud Transaction Receipt`,
      `----------------------------`,
      `Reference : ${tx.reference ?? tx.uuid}`,
      `Date       : ${new Date(tx.created_at).toLocaleString()}`,
      `Type       : ${getTransactionTypeLabel(tx.type)}`,
      `Amount     : ${isDebitType(tx.type) ? "-" : "+"}${tx.amount} ${tx.currency}`,
      `Status     : ${tx.status}`,
      tx.description ? `Description: ${tx.description}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${label}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      aria-label={`Download receipt for ${label}`}
      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Download className="h-4 w-4" />
    </button>
  );
}

// ─── Table row ───────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const debit = isDebitType(tx.type);
  const amount = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {new Date(tx.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="px-4 py-3 text-sm text-gray-800">
        <div>{getTransactionTypeLabel(tx.type)}</div>
        {tx.description && (
          <div className="text-xs text-gray-400 truncate max-w-xs">
            {tx.description}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
        <span className={debit ? "text-red-600" : "text-green-600"}>
          {debit ? "-" : "+"}
          <PriceLabel amount={amount} sourceCurrency={tx.currency} />
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={tx.status} />
      </td>
      <td className="px-4 py-3 text-right">
        <DownloadButton tx={tx} />
      </td>
    </tr>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function ClientPaymentHistory() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useFetchTransactions({ page, per_page: 20 });

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Payment History"
        description="Review your billing transactions and download detailed receipts."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Billing" },
          { label: "Payment History" },
        ]}
      >
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Description", "Amount", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No transactions yet</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Your payment history will appear here once you make a transaction.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {(meta.current_page - 1) * meta.per_page + 1}–
                {Math.min(meta.current_page * meta.per_page, meta.total)} of{" "}
                {meta.total} transactions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  {meta.current_page} / {meta.last_page}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(meta.last_page, p + 1))
                  }
                  disabled={meta.current_page === meta.last_page}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </ClientPageShell>
    </>
  );
}

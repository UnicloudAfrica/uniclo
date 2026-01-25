// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Receipt,
  Check,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import objectStorageApi from "../../../services/objectStorageApi";
import ToastUtils from "../../../utils/toastUtil";

interface Transaction {
  id: string;
  identifier: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

interface ObjectStorageTransactionsProps {
  accountId: string;
  accountName: string;
}

export const ObjectStorageTransactions: React.FC<ObjectStorageTransactionsProps> = ({
  accountId,
  accountName,
}) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (accountId) {
      loadTransactions();
    }
  }, [accountId]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await objectStorageApi.getTransactions(accountId);
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      successful: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <Check className="h-3.5 w-3.5" />,
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <Check className="h-3.5 w-3.5" />,
      },
      pending: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: <Clock className="h-3.5 w-3.5" />,
      },
      processing: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: <Clock className="h-3.5 w-3.5" />,
      },
      failed: { bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="h-3.5 w-3.5" /> },
      expired: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: <AlertCircle className="h-3.5 w-3.5" />,
      },
    };
    const style = styles[status.toLowerCase()] || styles.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Transactions Yet</h3>
        <p className="text-gray-500">Transactions for {accountName} will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
          <p className="text-sm text-gray-500">
            {total} transaction{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={loadTransactions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Desktop Table - hidden on mobile */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Transaction
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{tx.identifier}</p>
                    <p className="text-xs text-gray-500">
                      {tx.description || tx.type || "Payment"}
                      {tx.payment_method && ` • ${tx.payment_method}`}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-800">
                    {formatAmount(tx.amount, tx.currency)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{formatDate(tx.created_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - visible only on small screens */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{tx.identifier}</p>
                <p className="text-xs text-gray-500 truncate">
                  {tx.description || tx.type || "Payment"}
                </p>
              </div>
              {getStatusBadge(tx.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-800">
                {formatAmount(tx.amount, tx.currency)}
              </span>
              <span className="text-xs text-gray-500">{formatDate(tx.created_at)}</span>
            </div>
            {tx.payment_method && (
              <p className="text-xs text-gray-400 mt-2">via {tx.payment_method}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ObjectStorageTransactions;

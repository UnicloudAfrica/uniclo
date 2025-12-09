// @ts-nocheck
import React from "react";
import { CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  Payout,
  formatCurrency,
  getPayoutStatusStyle,
  formatPayoutDate,
  maskAccountNumber,
} from "./bankDetailsTypes";

interface PayoutHistoryTableProps {
  payouts: Payout[];
  isLoading?: boolean;
  showBankDetails?: boolean;
  emptyMessage?: string;
}

export const PayoutHistoryTable: React.FC<PayoutHistoryTableProps> = ({
  payouts,
  isLoading = false,
  showBankDetails = true,
  emptyMessage = "No payouts yet",
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "processing":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16" />
        ))}
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Amount</th>
            {showBankDetails && <th className="pb-3 font-medium">Bank Account</th>}
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {payouts.map((payout) => {
            const statusStyle = getPayoutStatusStyle(payout.status);
            return (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="py-4 text-sm">
                  {formatPayoutDate(payout.processed_at || payout.created_at)}
                </td>
                <td className="py-4">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(payout.amount_cents / 100, payout.currency)}
                  </span>
                </td>
                {showBankDetails && (
                  <td className="py-4 text-sm text-gray-600">
                    <div>{payout.bank_name}</div>
                    <div className="text-xs text-gray-400">
                      {maskAccountNumber(payout.account_number)}
                    </div>
                  </td>
                )}
                <td className="py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {getStatusIcon(payout.status)}
                    {statusStyle.label}
                  </span>
                </td>
                <td className="py-4 text-sm text-gray-500 font-mono">
                  {payout.gateway_reference || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PayoutHistoryTable;

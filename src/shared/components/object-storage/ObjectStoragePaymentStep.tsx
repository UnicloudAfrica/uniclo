import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { SummaryTotals } from "../../../hooks/useObjectStoragePricing";
import { PaymentModal } from "../ui";

export interface PaymentOption {
  gateway: string;
  method?: string;
  identifier?: string;
  amount?: number;
  currency?: string;
  charge_breakdown?: {
    total_fees?: number;
    subtotal?: number;
    tax?: number;
  };
  payment_url?: string;
  public_key?: string;
  reference?: string;
}

export interface ObjectStoragePaymentStepProps {
  paymentOptions: PaymentOption[];
  totals: SummaryTotals;
  isPaymentComplete?: boolean;
  isPaymentFailed?: boolean;
  isProcessing?: boolean;
  transactionId?: string;
  transactionData?: any;
  onPaymentComplete?: (payload: any) => void;
  onPaymentOptionChange?: (option: any) => void;
  apiBaseUrl?: string;
}

export const ObjectStoragePaymentStep: React.FC<ObjectStoragePaymentStepProps> = ({
  paymentOptions,
  totals,
  isPaymentComplete,
  isPaymentFailed,
  isProcessing,
  transactionId,
  transactionData,
  onPaymentComplete,
  onPaymentOptionChange,
  apiBaseUrl,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const showPaymentOptions = Boolean(transactionData) && paymentOptions.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Payment</h2>
        <p className="text-sm text-gray-500">Select a payment method to complete your order.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount due</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {formatCurrency(totals.total, totals.currency)}
        </p>
        {totals.tax > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Subtotal {formatCurrency(totals.subtotal, totals.currency)} + Tax{" "}
            {formatCurrency(totals.tax, totals.currency)}
          </p>
        )}
      </div>

      {isPaymentComplete && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Payment Successful</p>
            {transactionId && (
              <p className="text-xs text-emerald-700">Transaction: {transactionId}</p>
            )}
          </div>
        </div>
      )}

      {isPaymentFailed && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <XCircle className="mt-0.5 h-5 w-5 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Payment Failed</p>
            <p className="text-xs text-rose-700">Please try again or select a different method.</p>
          </div>
        </div>
      )}

      {!isPaymentComplete && showPaymentOptions ? (
        <PaymentModal
          isOpen
          mode="inline"
          onClose={() => {}}
          transactionData={transactionData}
          onPaymentComplete={onPaymentComplete}
          onPaymentOptionChange={onPaymentOptionChange}
          apiBaseUrl={apiBaseUrl}
          paymentOptions={paymentOptions}
          pricingSummary={{
            subtotal: totals.subtotal,
            tax: totals.tax,
            grandTotal: totals.total,
            currency: totals.currency,
          }}
          className="border border-gray-200/80"
        />
      ) : !isPaymentComplete ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          {isProcessing
            ? "Generating payment options..."
            : "No payment options available. Please go back and generate payment options."}
        </div>
      ) : null}

      {isPaymentComplete && (
        <p className="text-xs text-gray-500">
          Payment has been successfully processed. You can now proceed to review and submit your
          order.
        </p>
      )}
    </div>
  );
};

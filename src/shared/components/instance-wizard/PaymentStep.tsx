import React from "react";
import { CheckCircle } from "lucide-react";
import { PaymentModal } from "../ui";

interface PaymentStepProps {
  submissionResult: any;
  orderReceipt: any;
  isPaymentSuccessful: boolean;
  summaryGrandTotalValue: number;
  summaryDisplayCurrency: string;
  contextType: string;
  selectedUserId: string;
  clientOptions: any[];
  onPaymentComplete: (payload?: any) => void;
  authToken: string | null;
  apiBaseUrl: string;
  paymentTransactionLabel: string;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  submissionResult,
  orderReceipt,
  isPaymentSuccessful,
  summaryGrandTotalValue,
  summaryDisplayCurrency,
  contextType,
  selectedUserId,
  clientOptions,
  onPaymentComplete,
  authToken,
  apiBaseUrl,
  paymentTransactionLabel,
}) => {
  return (
    <div className="space-y-6">
      {submissionResult?.payment?.required && !isPaymentSuccessful && (
        <PaymentModal
          mode="inline"
          isOpen={true}
          onClose={() => {}}
          amount={summaryGrandTotalValue}
          currency={summaryDisplayCurrency}
          email={
            contextType === "user"
              ? clientOptions.find((c) => c.value === String(selectedUserId))?.raw?.email || ""
              : ""
          }
          transactionReference={
            submissionResult?.transaction?.identifier ||
            submissionResult?.transaction?.id ||
            orderReceipt?.transaction?.identifier ||
            ""
          }
          paymentOptions={
            submissionResult?.payment?.payment_gateway_options ||
            submissionResult?.payment?.options ||
            []
          }
          onPaymentComplete={onPaymentComplete}
          authToken={authToken || undefined}
          apiBaseUrl={apiBaseUrl}
        />
      )}
      {isPaymentSuccessful && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-900">Payment Verified</h3>
          <p className="text-sm text-emerald-700">
            Transaction {paymentTransactionLabel} confirmed. Redirecting to review...
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentStep;

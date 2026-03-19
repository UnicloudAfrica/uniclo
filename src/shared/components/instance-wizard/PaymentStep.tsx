import React from "react";
import { CheckCircle } from "lucide-react";
import { PaymentModal } from "../ui";
import type { PaymentGatewayOption } from "../ui/payment/types";

type PaymentSummary = {
  required?: boolean;
  payment_gateway_options?: PaymentGatewayOption[];
  options?: PaymentGatewayOption[];
};

type TransactionSummary = {
  identifier?: string;
  id?: string | number;
};

type SubmissionResult = {
  payment?: PaymentSummary;
  transaction?: TransactionSummary;
};

type OrderReceipt = {
  transaction?: TransactionSummary;
};

type ClientOption = {
  value: string | number;
  raw?: unknown;
};

interface PaymentStepProps {
  submissionResult: SubmissionResult | null;
  orderReceipt: OrderReceipt | null;
  isPaymentSuccessful: boolean;
  summarySubtotalValue?: number;
  summaryTaxValue?: number;
  summaryGatewayFeesValue?: number;
  summaryGrandTotalValue: number;
  summaryDisplayCurrency: string;
  contextType: string;
  selectedUserId: string;
  clientOptions: ClientOption[];
  onPaymentComplete: (payload?: unknown) => void;
  onPaymentOptionChange?: (option: PaymentGatewayOption | null) => void;
  apiBaseUrl: string;
  paymentTransactionLabel: string;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  submissionResult,
  orderReceipt,
  isPaymentSuccessful,
  summarySubtotalValue = 0,
  summaryTaxValue = 0,
  summaryGatewayFeesValue = 0,
  summaryGrandTotalValue,
  summaryDisplayCurrency,
  contextType,
  selectedUserId,
  clientOptions,
  onPaymentComplete,
  onPaymentOptionChange,
  apiBaseUrl,
  paymentTransactionLabel,
}) => {
  const selectedClient = clientOptions.find(
    (option) => String(option.value) === String(selectedUserId)
  );
  const raw = selectedClient?.raw as { email?: unknown } | undefined;
  const resolvedEmail = typeof raw?.email === "string" ? raw.email : "";

  return (
    <div className="space-y-6">
      {submissionResult?.payment?.required && !isPaymentSuccessful && (
        <PaymentModal
          mode="inline"
          isOpen={true}
          onClose={() => {}}
          amount={summaryGrandTotalValue}
          currency={summaryDisplayCurrency}
          pricingSummary={{
            subtotal: summarySubtotalValue,
            tax: summaryTaxValue,
            gatewayFees: summaryGatewayFeesValue,
            grandTotal: summaryGrandTotalValue,
            currency: summaryDisplayCurrency,
          }}
          email={contextType === "user" ? resolvedEmail : ""}
          transactionReference={
            submissionResult?.transaction?.identifier ||
            submissionResult?.transaction?.id?.toString() ||
            orderReceipt?.transaction?.identifier ||
            ""
          }
          paymentOptions={
            submissionResult?.payment?.payment_gateway_options ||
            submissionResult?.payment?.options ||
            []
          }
          onPaymentOptionChange={onPaymentOptionChange}
          onPaymentComplete={onPaymentComplete}
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

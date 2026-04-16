import { CreditCard, CheckCircle, AlertCircle, RefreshCw, Server } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { PaystackButton } from "react-paystack";
import logger from "@/utils/logger";
import type { PaymentGatewayOption, SavedCard } from "./types";
import BankTransferDetails from "./BankTransferDetails";

type PaymentStatusValue = "pending" | "completed" | "failed" | "expired" | "processing";

interface PaymentActionsProps {
  paymentStatus: PaymentStatusValue;
  setPaymentStatus: (status: PaymentStatusValue) => void;
  paymentMode: string | null;
  selectedPaymentOption: PaymentGatewayOption | null;
  isPaystackCardOption: boolean;
  isPaystackReady: boolean;
  paystackEmail: string;
  paystackAmount: number;
  paystackPublicKey: string;
  paystackReferenceProps: Record<string, string>;
  transactionIdentifier: string | null;
  isConfirming: boolean;
  isPolling: boolean;
  isStorageOrder: boolean;
  firstStorageAccountId: string | number | null;
  savedCards: SavedCard[];
  selectedSavedCard: string | null;
  appPaths: { storage: string; instances: string };
  pollTransactionStatus: () => void;
  handleBankTransferConfirmation: () => void;
  handleSavedCardPayment: () => void;
  handleModalClose: () => void;
  confirmTransaction: (options?: {
    gatewayOverride?: string;
    includeSaveCardDetails?: boolean;
  }) => Promise<boolean>;
  fetchSavedCards: () => Promise<void>;
  handlePaymentCompletion: (payload: unknown) => void;
}

const PaymentActions = ({
  paymentStatus,
  setPaymentStatus,
  paymentMode,
  selectedPaymentOption,
  isPaystackCardOption: _isPaystackCardOption,
  isPaystackReady,
  paystackEmail,
  paystackAmount,
  paystackPublicKey,
  paystackReferenceProps,
  transactionIdentifier,
  isConfirming,
  isPolling,
  isStorageOrder,
  firstStorageAccountId,
  savedCards,
  selectedSavedCard,
  appPaths,
  pollTransactionStatus,
  handleBankTransferConfirmation,
  handleSavedCardPayment,
  handleModalClose,
  confirmTransaction,
  fetchSavedCards,
  handlePaymentCompletion,
}: PaymentActionsProps) => {
  return (
    <>
      <div
        className="mt-6 flex items-center justify-between rounded-xl border border-t px-6 py-4"
        style={{
          backgroundColor: designTokens.colors.neutral[50],
          borderColor: designTokens.colors.neutral[200],
        }}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={pollTransactionStatus}
            disabled={isPolling}
            className="flex items-center text-sm transition-colors hover:text-blue-600"
            style={{ color: designTokens.colors.neutral[600] }}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${isPolling ? "animate-spin" : ""}`} />
            {isPolling ? "Checking..." : "Check Status"}
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {paymentMode === "card" && selectedPaymentOption && paymentStatus !== "completed" && (
            <div className="flex flex-col items-end gap-2">
              {!isPaystackReady && (
                <p className="text-xs text-amber-600">
                  Paystack public key, customer email, or transaction reference is missing. Check
                  your payment gateway settings.
                </p>
              )}
              <PaystackButton
                {...paystackReferenceProps}
                email={paystackEmail}
                amount={paystackAmount}
                publicKey={paystackPublicKey}
                text={paymentStatus === "processing" ? "Processing\u2026" : "Pay with Card"}
                className="w-full inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 bg-[var(--theme-color)] border border-[var(--theme-color)] min-h-[48px]"
                disabled={!isPaystackReady || isConfirming}
                onSuccess={async (response: Record<string, unknown>) => {
                  logger.info("[Paystack][Admin] PaystackButton success", response);
                  setPaymentStatus("processing");
                  const confirmed = await confirmTransaction({
                    gatewayOverride: "Paystack",
                    includeSaveCardDetails: true,
                  });
                  if (confirmed) {
                    await fetchSavedCards();
                    handlePaymentCompletion({ ...response, status: "successful" });
                    setPaymentStatus("completed");
                  } else {
                    setPaymentStatus("pending");
                  }
                }}
                onClose={async () => {
                  logger.info("[Paystack][Admin] PaystackButton closed");
                  if ((paymentStatus as string) === "completed") return;
                  setPaymentStatus("processing");
                  const confirmed = await confirmTransaction({
                    gatewayOverride: "Paystack",
                    includeSaveCardDetails: true,
                  });
                  if (confirmed) {
                    await fetchSavedCards();
                    handlePaymentCompletion({
                      channel: "card",
                      reference: transactionIdentifier,
                      status: "successful",
                    });
                    setPaymentStatus("completed");
                  } else {
                    setPaymentStatus("pending");
                  }
                }}
              />
            </div>
          )}

          {paymentStatus !== "completed" &&
            paymentMode === "bank_transfer" &&
            selectedPaymentOption && (
              <button
                onClick={handleBankTransferConfirmation}
                disabled={isConfirming || isPolling}
                className="inline-flex items-center rounded-lg px-6 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: designTokens.colors.warning[600],
                  borderColor: designTokens.colors.warning[600],
                  color: designTokens.colors.neutral[0],
                }}
              >
                <Server className="mr-2 h-4 w-4" />I have paid
              </button>
            )}

          {paymentStatus === "pending" && paymentMode === "saved_card" && savedCards.length > 0 && (
            <button
              onClick={handleSavedCardPayment}
              disabled={isConfirming || isPolling || !selectedSavedCard}
              className="inline-flex items-center rounded-lg px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: designTokens.colors.primary[700],
                borderColor: designTokens.colors.primary[700],
              }}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with Saved Card
            </button>
          )}

          {paymentStatus === "completed" && (
            <button
              onClick={() => {
                handleModalClose();
                setTimeout(() => {
                  if (isStorageOrder && firstStorageAccountId) {
                    globalThis.window.location.href = `${appPaths.storage}/${firstStorageAccountId}`;
                  } else if (isStorageOrder) {
                    globalThis.window.location.href = appPaths.storage;
                  } else {
                    globalThis.window.location.href = appPaths.instances;
                  }
                }, 500);
              }}
              className="inline-flex items-center rounded-lg px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md"
              style={{
                backgroundColor: designTokens.colors.success[600],
                borderColor: designTokens.colors.success[600],
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isStorageOrder ? "View Storage" : "View Instances"}
            </button>
          )}

          {(paymentStatus === "failed" || paymentStatus === "expired") && (
            <button
              onClick={handleModalClose}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
              style={{
                backgroundColor: designTokens.colors.neutral[100],
                color: designTokens.colors.neutral[700],
                borderColor: designTokens.colors.neutral[300],
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {paymentStatus === "pending" &&
        paymentMode === "bank_transfer" &&
        selectedPaymentOption?.details && (
          <BankTransferDetails selectedPaymentOption={selectedPaymentOption} />
        )}

      {paymentStatus === "pending" && (
        <div
          className="mt-4 rounded-xl border px-6 py-3 text-sm"
          style={{
            backgroundColor: designTokens.colors.info[50],
            borderColor: designTokens.colors.info[200],
            color: designTokens.colors.info[700],
          }}
        >
          <p className="flex items-start">
            <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
            {selectedPaymentOption?.payment_type?.toLowerCase().includes("transfer")
              ? `After making the bank transfer, click "Check Status" or wait for automatic verification. Your ${isStorageOrder ? "storage accounts" : "instances"} will be provisioned once payment is confirmed.`
              : `After completing payment, your ${isStorageOrder ? "storage accounts" : "instances"} will be automatically provisioned. This card will update automatically, or you can click "Check Status" to refresh.`}
          </p>
        </div>
      )}
    </>
  );
};

export default PaymentActions;

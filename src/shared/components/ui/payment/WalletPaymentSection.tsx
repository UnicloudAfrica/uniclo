import { Wallet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { formatCurrencyValue } from "@/utils/instanceCreationUtils";

interface WalletPaymentSectionProps {
  walletBalance: number | null;
  isLoadingBalance: boolean;
  payableAmount: number;
  currency: string;
  hasSufficientFunds: boolean;
  isProcessing: boolean;
  onPayWithWallet: () => void;
}

const WalletPaymentSection = ({
  walletBalance,
  isLoadingBalance,
  payableAmount,
  currency,
  hasSufficientFunds,
  isProcessing,
  onPayWithWallet,
}: WalletPaymentSectionProps) => {
  const shortfall = Math.max(0, payableAmount - (walletBalance ?? 0));

  // Nothing to charge — downgrade credit or zero amount
  if (payableAmount <= 0) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border p-4"
        style={{
          borderColor: designTokens.colors.success[200],
          backgroundColor: designTokens.colors.success[50],
        }}
      >
        <CheckCircle2
          className="h-5 w-5"
          style={{ color: designTokens.colors.success[500] }}
        />
        <p
          className="text-sm font-medium"
          style={{ color: designTokens.colors.success[700] }}
        >
          No payment required. Credit will be applied to your wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Balance Display */}
      <div
        className="flex items-center justify-between rounded-xl border p-4"
        style={{
          borderColor: hasSufficientFunds
            ? designTokens.colors.success[200]
            : designTokens.colors.warning[200],
          backgroundColor: hasSufficientFunds
            ? designTokens.colors.success[50]
            : designTokens.colors.warning[50],
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: hasSufficientFunds
                ? designTokens.colors.success[100]
                : designTokens.colors.warning[100],
            }}
          >
            <Wallet
              className="h-5 w-5"
              style={{
                color: hasSufficientFunds
                  ? designTokens.colors.success[600]
                  : designTokens.colors.warning[600],
              }}
            />
          </div>
          <div>
            <p
              className="text-xs font-medium"
              style={{ color: designTokens.colors.neutral[500] }}
            >
              Wallet Balance
            </p>
            {isLoadingBalance ? (
              <div className="flex items-center gap-2">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: designTokens.colors.neutral[400] }}
                />
                <span
                  className="text-sm"
                  style={{ color: designTokens.colors.neutral[400] }}
                >
                  Loading...
                </span>
              </div>
            ) : (
              <p
                className="text-lg font-bold"
                style={{
                  color: hasSufficientFunds
                    ? designTokens.colors.success[700]
                    : designTokens.colors.warning[700],
                }}
              >
                {currency} {formatCurrencyValue(walletBalance ?? 0)}
              </p>
            )}
          </div>
        </div>

        {!isLoadingBalance && (
          <div className="flex items-center gap-1.5">
            {hasSufficientFunds ? (
              <>
                <CheckCircle2
                  className="h-4 w-4"
                  style={{ color: designTokens.colors.success[500] }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: designTokens.colors.success[600] }}
                >
                  Sufficient funds
                </span>
              </>
            ) : (
              <>
                <AlertCircle
                  className="h-4 w-4"
                  style={{ color: designTokens.colors.warning[500] }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: designTokens.colors.warning[600] }}
                >
                  Insufficient funds
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Amount to be charged */}
      <div
        className="flex items-center justify-between rounded-lg border px-4 py-3"
        style={{
          borderColor: designTokens.colors.neutral[200],
          backgroundColor: designTokens.colors.neutral[50],
        }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: designTokens.colors.neutral[600] }}
        >
          Amount to debit:
        </span>
        <span
          className="text-base font-bold"
          style={{ color: designTokens.colors.neutral[900] }}
        >
          {currency} {formatCurrencyValue(payableAmount)}
        </span>
      </div>

      {/* Remaining balance after payment */}
      {hasSufficientFunds && walletBalance !== null && (
        <div
          className="flex items-center justify-between px-4 text-xs"
          style={{ color: designTokens.colors.neutral[500] }}
        >
          <span>Balance after payment:</span>
          <span className="font-medium">
            {currency} {formatCurrencyValue(walletBalance - payableAmount)}
          </span>
        </div>
      )}

      {/* Insufficient funds warning */}
      {!hasSufficientFunds && !isLoadingBalance && (
        <div
          className="flex items-start gap-2 rounded-lg border px-3 py-2"
          style={{
            borderColor: designTokens.colors.error[200],
            backgroundColor: designTokens.colors.error[50],
          }}
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: designTokens.colors.error[500] }}
          />
          <p className="text-xs" style={{ color: designTokens.colors.error[700] }}>
            You need{" "}
            <span className="font-bold">
              {currency} {formatCurrencyValue(shortfall)}
            </span>{" "}
            more in your wallet. Please top up your wallet before proceeding.
          </p>
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={onPayWithWallet}
        disabled={!hasSufficientFunds || isProcessing || isLoadingBalance}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: hasSufficientFunds
            ? designTokens.colors.primary[600]
            : designTokens.colors.neutral[300],
          color: designTokens.colors.neutral[0],
        }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Pay {currency} {formatCurrencyValue(payableAmount)} from Wallet
          </>
        )}
      </button>
    </div>
  );
};

export default WalletPaymentSection;

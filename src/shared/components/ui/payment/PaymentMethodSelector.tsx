import { DollarSign } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { formatCurrencyValue } from "@/utils/instanceCreationUtils";
import PricingBreakdown from "./PricingBreakdown";
import type { PaymentGatewayOption, PaymentModeId, PaymentModeOption } from "./types";

interface AmountDetails {
  resolvedSubtotal: number;
  resolvedTax: number;
  resolvedGatewayFees: number;
  resolvedGrandTotal: number;
  estimatedTotalResolved: number;
  gatewayTotal: number;
  payableTotal: number;
  adjustment: number;
  displayCurrency: string;
}

interface PaymentMethodSelectorProps {
  paymentStatus: string;
  paymentMode: PaymentModeId | null;
  setPaymentMode: (mode: PaymentModeId) => void;
  availablePaymentModes: PaymentModeOption[];
  amountDetails: AmountDetails;
  displayPayableTotal: number;
  hasAdjustment: boolean;
  showPricingBreakdown: boolean;
  summaryGatewayLabel: string;
  summaryMethodLabel: string;
  summaryReference: string;
  currentSelectableOptions: PaymentGatewayOption[];
  selectedPaymentOption: PaymentGatewayOption | null;
  onPaymentOptionChange: (optionId: string) => void;
  isPaystackCardOption: boolean;
  shouldSaveCard: boolean;
  onShouldSaveCardChange: (checked: boolean) => void;
}

const PaymentMethodSelector = ({
  paymentStatus,
  paymentMode,
  setPaymentMode,
  availablePaymentModes,
  amountDetails,
  displayPayableTotal,
  hasAdjustment,
  showPricingBreakdown,
  summaryGatewayLabel,
  summaryMethodLabel,
  summaryReference,
  currentSelectableOptions,
  selectedPaymentOption,
  onPaymentOptionChange,
  isPaystackCardOption,
  shouldSaveCard,
  onShouldSaveCardChange,
}: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-4">
      {paymentStatus !== "completed" && availablePaymentModes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: designTokens.colors.neutral[500] }}
          >
            Choose how you want to pay
          </p>
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            {availablePaymentModes.map((modeItem) => {
              const isActiveMode = paymentMode === modeItem.id;
              return (
                <button
                  key={modeItem.id}
                  onClick={() => setPaymentMode(modeItem.id)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                    isActiveMode ? "shadow-sm" : "hover:border-primary-300 hover:text-primary-700"
                  }`}
                  style={{
                    borderColor: isActiveMode
                      ? designTokens.colors.primary[500]
                      : designTokens.colors.neutral[200],
                    backgroundColor: isActiveMode
                      ? designTokens.colors.primary[500]
                      : designTokens.colors.neutral[0],
                    color: isActiveMode
                      ? designTokens.colors.neutral[0]
                      : designTokens.colors.neutral[700],
                  }}
                >
                  {modeItem.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <h4
        className="flex items-center font-semibold"
        style={{ color: designTokens.colors.neutral[900] }}
      >
        <DollarSign className="mr-2 h-5 w-5" />
        Payment Details
      </h4>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Total payable:</span>
          <span
            className="text-lg font-semibold"
            style={{ color: designTokens.colors.neutral[900] }}
          >
            {amountDetails.displayCurrency} {formatCurrencyValue(displayPayableTotal)}
          </span>
        </div>
        {showPricingBreakdown && (
          <PricingBreakdown
            amountDetails={amountDetails}
            displayPayableTotal={displayPayableTotal}
            hasAdjustment={hasAdjustment}
          />
        )}
        {showPricingBreakdown && hasAdjustment && (
          <p className="text-[11px]" style={{ color: designTokens.colors.neutral[500] }}>
            Gateway total is {amountDetails.adjustment > 0 ? "higher" : "lower"} than the estimate
            by {amountDetails.displayCurrency}{" "}
            {formatCurrencyValue(Math.abs(amountDetails.adjustment))}.
          </p>
        )}
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Gateway:</span>
          <span
            className="rounded px-2 py-1 text-xs font-medium capitalize"
            style={{
              backgroundColor: designTokens.colors.primary[100],
              color: designTokens.colors.primary[800],
            }}
          >
            {summaryGatewayLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Method:</span>
          <span
            className="rounded px-2 py-1 text-xs font-medium"
            style={{
              backgroundColor: designTokens.colors.success[100],
              color: designTokens.colors.success[700],
            }}
          >
            {summaryMethodLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Reference:</span>
          <span
            className="rounded px-2 py-1 font-mono text-xs"
            style={{
              backgroundColor: designTokens.colors.neutral[100],
              color: designTokens.colors.neutral[700],
            }}
          >
            {summaryReference}
          </span>
        </div>

        {currentSelectableOptions.length > 1 && paymentMode !== "saved_card" && (
          <div className="col-span-full">
            <label
              className="mb-2 block text-xs font-medium"
              style={{ color: designTokens.colors.neutral[700] }}
            >
              {paymentMode === "bank_transfer" ? "Bank Account" : "Payment Method"}
            </label>
            <select
              value={selectedPaymentOption?.id || ""}
              onChange={(e) => onPaymentOptionChange(e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs"
              style={{
                borderColor: designTokens.colors.neutral[300],
                backgroundColor: designTokens.colors.neutral[0],
              }}
            >
              {currentSelectableOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.payment_type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {paymentStatus !== "completed" && paymentMode === "card" && isPaystackCardOption && (
        <div
          className="mt-3 flex items-start gap-3 rounded-xl border px-3 py-2"
          style={{
            borderColor: designTokens.colors.primary[100],
            backgroundColor: designTokens.colors.primary[50],
          }}
        >
          <input
            id="save-card-toggle"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            checked={shouldSaveCard}
            onChange={(event) => onShouldSaveCardChange(event.target.checked)}
          />
          <label
            htmlFor="save-card-toggle"
            className="flex flex-col text-sm"
            style={{ color: designTokens.colors.neutral[800] }}
          >
            <span className="font-semibold">Save this card</span>
            <span className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
              Faster checkout next time; we only save the authorization token, not your PAN.
            </span>
          </label>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;

import { designTokens } from "@/styles/designTokens";
import { formatCurrencyValue } from "@/utils/instanceCreationUtils";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";

interface AmountDetails {
  resolvedSubtotal: number;
  resolvedTax: number;
  resolvedGatewayFees: number;
  estimatedTotalResolved: number;
  adjustment: number;
  displayCurrency: string;
}

interface PricingBreakdownProps {
  amountDetails: AmountDetails;
  displayPayableTotal: number;
  hasAdjustment: boolean;
}

/**
 * Renders pricing-summary amounts through `PriceLabel`. The caller has
 * already resolved every amount to `amountDetails.displayCurrency`, so
 * we pass the formatted string back in via the `envelope` prop — no
 * second FX conversion happens. If we ever switch to emitting raw
 * source amounts to this component, swap `envelope` for a live call
 * to `useFormatPrice` inside `PriceLabel`.
 */
const PricingBreakdown = ({
  amountDetails,
  displayPayableTotal,
  hasAdjustment,
}: PricingBreakdownProps) => {
  const renderAmount = (amount: number) => (
    <PriceLabel
      amount={amount}
      sourceCurrency={amountDetails.displayCurrency}
      envelope={{
        amount_display: amount,
        currency_display: amountDetails.displayCurrency,
        formatted_display: `${amountDetails.displayCurrency} ${formatCurrencyValue(amount)}`,
        fx_source: "identity",
      }}
    />
  );

  return (
    <div
      className="space-y-2 rounded-lg border px-3 py-2 text-xs"
      style={{
        borderColor: designTokens.colors.neutral[200],
        backgroundColor: designTokens.colors.neutral[50],
      }}
    >
      {amountDetails.resolvedSubtotal > 0 && (
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Subtotal</span>
          <span style={{ color: designTokens.colors.neutral[900] }}>
            {renderAmount(amountDetails.resolvedSubtotal)}
          </span>
        </div>
      )}
      {amountDetails.resolvedTax > 0 && (
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Estimated tax</span>
          <span style={{ color: designTokens.colors.neutral[900] }}>
            {renderAmount(amountDetails.resolvedTax)}
          </span>
        </div>
      )}
      {amountDetails.estimatedTotalResolved > 0 &&
        (amountDetails.resolvedSubtotal > 0 || amountDetails.resolvedTax > 0) && (
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: designTokens.colors.neutral[500] }}>Estimated total</span>
            <span style={{ color: designTokens.colors.neutral[600] }}>
              {renderAmount(amountDetails.estimatedTotalResolved)}
            </span>
          </div>
        )}
      {amountDetails.resolvedGatewayFees > 0 && (
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Gateway fees</span>
          <span style={{ color: designTokens.colors.neutral[900] }}>
            {renderAmount(amountDetails.resolvedGatewayFees)}
          </span>
        </div>
      )}
      {hasAdjustment && (
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Gateway adjustment</span>
          <span
            style={{
              color:
                amountDetails.adjustment > 0
                  ? designTokens.colors.warning[700]
                  : designTokens.colors.success[700],
            }}
          >
            {renderAmount(amountDetails.adjustment)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between border-t pt-2">
        <span className="font-semibold" style={{ color: designTokens.colors.neutral[700] }}>
          Total payable
        </span>
        <span className="font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
          {renderAmount(displayPayableTotal)}
        </span>
      </div>
    </div>
  );
};

export default PricingBreakdown;

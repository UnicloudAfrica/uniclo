import { designTokens } from "@/styles/designTokens";
import { formatCurrencyValue } from "@/utils/instanceCreationUtils";

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

const PricingBreakdown = ({
  amountDetails,
  displayPayableTotal,
  hasAdjustment,
}: PricingBreakdownProps) => {
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
            {amountDetails.displayCurrency} {formatCurrencyValue(amountDetails.resolvedSubtotal)}
          </span>
        </div>
      )}
      {amountDetails.resolvedTax > 0 && (
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Estimated tax</span>
          <span style={{ color: designTokens.colors.neutral[900] }}>
            {amountDetails.displayCurrency} {formatCurrencyValue(amountDetails.resolvedTax)}
          </span>
        </div>
      )}
      {amountDetails.estimatedTotalResolved > 0 &&
        (amountDetails.resolvedSubtotal > 0 || amountDetails.resolvedTax > 0) && (
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: designTokens.colors.neutral[500] }}>Estimated total</span>
            <span style={{ color: designTokens.colors.neutral[600] }}>
              {amountDetails.displayCurrency}{" "}
              {formatCurrencyValue(amountDetails.estimatedTotalResolved)}
            </span>
          </div>
        )}
      {amountDetails.resolvedGatewayFees > 0 && (
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Gateway fees</span>
          <span style={{ color: designTokens.colors.neutral[900] }}>
            {amountDetails.displayCurrency} {formatCurrencyValue(amountDetails.resolvedGatewayFees)}
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
            {amountDetails.displayCurrency} {formatCurrencyValue(amountDetails.adjustment)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between border-t pt-2">
        <span className="font-semibold" style={{ color: designTokens.colors.neutral[700] }}>
          Total payable
        </span>
        <span className="font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
          {amountDetails.displayCurrency} {formatCurrencyValue(displayPayableTotal)}
        </span>
      </div>
    </div>
  );
};

export default PricingBreakdown;

import { designTokens } from "@/styles/designTokens";
import { formatCurrencyValue } from "@/utils/instanceCreationUtils";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";
import type { PricingLineItem, GatewayFeeDetail } from "./types";

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
  /**
   * When provided, render these as the primary breakdown (one row per
   * line) instead of a single "Subtotal" line. Mirrors the wizard's
   * line-item view so the customer sees the same decomposition on the
   * payment page that they saw at quote time.
   */
  lineItems?: PricingLineItem[];
  /**
   * Real gateway fee with a real label. When provided, supersedes the
   * legacy `resolvedGatewayFees`/`adjustment` rendering.
   */
  gatewayFee?: GatewayFeeDetail;
}

/**
 * Renders pricing-summary amounts through `PriceLabel`.
 *
 * Transparency rules baked in:
 *
 *   - When `lineItems` is provided, show them line-by-line — the
 *     customer sees the same breakdown they saw in the wizard
 *     (Compute VM, Management fee, Backups, etc.), not a synthesised
 *     "Subtotal" that hides what they're paying for.
 *   - When `gatewayFee` is provided, render it with its real label
 *     ("Paystack processing fee — 1.5% + ₦100"). Don't render a
 *     "Gateway fees" line for zero fees.
 *   - When the breakdown doesn't add up to the total payable (i.e.
 *     `hasAdjustment` is true), show a WARNING banner asking the user
 *     to refresh the quote — NEVER a silent "Gateway adjustment"
 *     line item. Unexplained deltas are a bug, not a UX surface.
 */
const PricingBreakdown = ({
  amountDetails,
  displayPayableTotal,
  hasAdjustment,
  lineItems,
  gatewayFee,
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

  const hasLineItems = Array.isArray(lineItems) && lineItems.length > 0;

  return (
    <div
      className="space-y-2 rounded-lg border px-3 py-2 text-xs"
      style={{
        borderColor: designTokens.colors.neutral[200],
        backgroundColor: designTokens.colors.neutral[50],
      }}
    >
      {/* Itemised breakdown — same shape as the wizard quote. */}
      {hasLineItems && (
        <div className="space-y-1.5 pb-1.5 border-b" style={{ borderColor: designTokens.colors.neutral[200] }}>
          {lineItems!.map((line, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div style={{ color: designTokens.colors.neutral[700] }} className="truncate">
                  {line.name}
                </div>
                {line.hint && (
                  <div className="text-[10px]" style={{ color: designTokens.colors.neutral[500] }}>
                    {line.hint}
                  </div>
                )}
              </div>
              <span style={{ color: designTokens.colors.neutral[900] }} className="tabular-nums whitespace-nowrap">
                {renderAmount(line.total)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legacy subtotal — only when we don't have line items. */}
      {!hasLineItems && amountDetails.resolvedSubtotal > 0 && (
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Subtotal</span>
          <span style={{ color: designTokens.colors.neutral[900] }}>
            {renderAmount(amountDetails.resolvedSubtotal)}
          </span>
        </div>
      )}

      {/* Tax — always shown when > 0. */}
      {amountDetails.resolvedTax > 0 && (
        <div className="flex items-center justify-between">
          <span style={{ color: designTokens.colors.neutral[600] }}>Tax</span>
          <span style={{ color: designTokens.colors.neutral[900] }}>
            {renderAmount(amountDetails.resolvedTax)}
          </span>
        </div>
      )}

      {/* Gateway fee — labelled with the real rate when present. */}
      {gatewayFee && gatewayFee.amount > 0 ? (
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span style={{ color: designTokens.colors.neutral[600] }}>{gatewayFee.label}</span>
            {gatewayFee.rate && (
              <span className="text-[10px]" style={{ color: designTokens.colors.neutral[500] }}>
                {gatewayFee.rate}
              </span>
            )}
          </div>
          <span style={{ color: designTokens.colors.neutral[900] }}>
            {renderAmount(gatewayFee.amount)}
          </span>
        </div>
      ) : (
        amountDetails.resolvedGatewayFees > 0 && (
          <div className="flex items-center justify-between">
            <span style={{ color: designTokens.colors.neutral[600] }}>Gateway processing fee</span>
            <span style={{ color: designTokens.colors.neutral[900] }}>
              {renderAmount(amountDetails.resolvedGatewayFees)}
            </span>
          </div>
        )
      )}

      {/* Total — always the last line, bold. */}
      <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: designTokens.colors.neutral[200] }}>
        <span className="font-semibold" style={{ color: designTokens.colors.neutral[700] }}>
          Total payable
        </span>
        <span className="font-semibold tabular-nums" style={{ color: designTokens.colors.neutral[900] }}>
          {renderAmount(displayPayableTotal)}
        </span>
      </div>

      {/* Unexplained delta — render a WARNING, not a silent line item.
          This branch should never fire in normal operation; when it
          does, the customer is being asked to pay something we can't
          itemise, which is a transparency failure they need to know
          about. */}
      {hasAdjustment && (
        <div
          role="alert"
          className="mt-2 rounded border px-2 py-1.5 text-[11px]"
          style={{
            borderColor: designTokens.colors.warning[300],
            backgroundColor: designTokens.colors.warning[50],
            color: designTokens.colors.warning[800],
          }}
          data-testid="pricing-mismatch-warning"
        >
          <strong className="block">Price-quote mismatch detected.</strong>
          The total payable ({renderAmount(displayPayableTotal)}) doesn't reconcile
          with the itemised breakdown + gateway fees by{" "}
          {renderAmount(amountDetails.adjustment)}. Please refresh the page to
          re-quote, or contact support if this persists. Do not proceed with
          payment until the breakdown adds up.
        </div>
      )}
    </div>
  );
};

export default PricingBreakdown;

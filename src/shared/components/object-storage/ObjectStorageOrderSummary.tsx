import React from "react";
import {
  ResolvedProfile,
  SummaryTotals,
  BackendPricingLine,
} from "../../../hooks/useObjectStoragePricing";

export interface ObjectStorageOrderSummaryProps {
  profiles: ResolvedProfile[];
  totals: SummaryTotals;
  assignmentLabel: string;
  countryLabel: string;
  workflowLabel: string;
  transactionId?: string;
  isPaymentComplete?: boolean;
  isPaymentFailed?: boolean;
  backendPricingLines?: BackendPricingLine[] | null;
  gatewayFees?: number;
  grandTotalWithFees?: number;
  showDetailedBreakdown?: boolean;
}

export const ObjectStorageOrderSummary: React.FC<ObjectStorageOrderSummaryProps> = ({
  profiles,
  totals,
  assignmentLabel,
  countryLabel,
  workflowLabel,
  transactionId,
  isPaymentComplete,
  isPaymentFailed,
  backendPricingLines,
  gatewayFees = 0,
  grandTotalWithFees,
  showDetailedBreakdown = false,
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

  const displayLines =
    backendPricingLines ||
    profiles.map((p) => ({
      id: p.id,
      region: p.region,
      name: p.tierName || p.name || "Object Storage Tier",
      months: p.months,
      subtotal: p.subtotal,
      unitPrice: p.unitPrice,
      currency: p.currency,
    }));

  const finalTotal = grandTotalWithFees ?? totals.total + gatewayFees;

  return (
    <div className="order-summary">
      <div className="summary-header">
        <h3 className="summary-title">Order Summary</h3>
        <p className="summary-subtitle">Auto-calculated from the captured configuration.</p>
      </div>

      {/* Context Info */}
      <div className="summary-context">
        <div className="context-row">
          <span className="context-label">Customer Context</span>
          <span className="context-value">{assignmentLabel}</span>
        </div>
        <div className="context-row">
          <span className="context-label">Billing Country</span>
          <span className="context-value">{countryLabel}</span>
        </div>
        <div className="context-row">
          <span className="context-label">Workflow</span>
          <span className="context-value">{workflowLabel}</span>
        </div>
        {transactionId && (
          <div className="context-row">
            <span className="context-label">Transaction</span>
            <span className="context-value mono">{transactionId}</span>
          </div>
        )}
      </div>

      {/* Payment Status */}
      {(isPaymentComplete || isPaymentFailed) && (
        <div className={`payment-status ${isPaymentComplete ? "success" : "failed"}`}>
          {isPaymentComplete ? "✓ Payment Successful" : "✕ Payment Failed"}
        </div>
      )}

      {/* Profile Lines */}
      <div className="summary-profiles">
        <h4 className="section-title">Service Profiles</h4>
        {displayLines.length === 0 ? (
          <p className="no-profiles">No profiles configured yet</p>
        ) : (
          <div className="profile-list">
            {displayLines.map((line) => (
              <div key={line.id} className="profile-line">
                <div className="profile-info">
                  <span className="profile-name">{line.name}</span>
                  {line.region && <span className="profile-region">{line.region}</span>}
                  {showDetailedBreakdown && line.months && (
                    <span className="profile-term">
                      {line.months} month{line.months !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <span className="profile-subtotal">
                  {formatCurrency(line.subtotal, line.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="summary-totals">
        <div className="total-row">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal, totals.currency)}</span>
        </div>

        {totals.tax > 0 && (
          <div className="total-row">
            <span>Tax {totals.taxRate > 0 ? `(${totals.taxRate}%)` : ""}</span>
            <span>{formatCurrency(totals.tax, totals.currency)}</span>
          </div>
        )}

        {gatewayFees > 0 && (
          <div className="total-row">
            <span>Gateway Fees</span>
            <span>{formatCurrency(gatewayFees, totals.currency)}</span>
          </div>
        )}

        <div className="total-row grand-total">
          <span>Grand Total</span>
          <span>{formatCurrency(finalTotal, totals.currency)}</span>
        </div>
      </div>

      {/* Note */}
      <p className="summary-note">Taxes are estimated and may change after finance review.</p>
    </div>
  );
};

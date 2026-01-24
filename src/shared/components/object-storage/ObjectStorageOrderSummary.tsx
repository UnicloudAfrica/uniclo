import React from "react";
import {
  ResolvedProfile,
  SummaryTotals,
  BackendPricingLine,
} from "../../../hooks/useObjectStoragePricing";
import { ModernCard } from "../ui";

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
      name: p.tierName || p.name || "Silo Storage Tier",
      months: p.months,
      subtotal: p.subtotal,
      unitPrice: p.unitPrice,
      storageGb: p.storageGb,
      currency: p.currency,
    }));

  const finalTotal = grandTotalWithFees ?? totals.total + gatewayFees;

  return (
    <ModernCard variant="outlined" padding="lg" className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Order Summary</h3>
        <p className="text-sm text-slate-600">Auto-calculated from the captured configuration.</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-500">Customer Context</span>
          <span className="text-right font-medium text-slate-900">
            {assignmentLabel || "Unassigned"}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-500">Billing Country</span>
          <span className="text-right font-medium text-slate-900">
            {countryLabel || "Not selected"}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-500">Workflow</span>
          <span className="text-right font-medium text-slate-900">{workflowLabel}</span>
        </div>
        {transactionId && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-500">Transaction</span>
            <span className="text-right font-mono text-xs font-semibold text-slate-700">
              {transactionId}
            </span>
          </div>
        )}
      </div>

      {(isPaymentComplete || isPaymentFailed) && (
        <div
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
            isPaymentComplete
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {isPaymentComplete ? "Payment successful" : "Payment failed"}
        </div>
      )}

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Service Profiles</h4>
        {displayLines.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No profiles configured yet.</p>
        ) : (
          <div className="space-y-2">
            {displayLines.map((line) => (
              <div
                key={line.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{line.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                    {line.region && <span>{line.region}</span>}
                    {line.storageGb && <span>{line.storageGb} GB</span>}
                    {showDetailedBreakdown && line.months && (
                      <span>
                        {line.months} month{line.months !== 1 ? "s" : ""}
                      </span>
                    )}
                    {showDetailedBreakdown && line.unitPrice > 0 && (
                      <span>{formatCurrency(line.unitPrice, line.currency)} / GB / mo</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(line.subtotal, line.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium text-slate-900">
            {formatCurrency(totals.subtotal, totals.currency)}
          </span>
        </div>

        {totals.tax > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">
              Tax {totals.taxRate > 0 ? `(${totals.taxRate}%)` : ""}
            </span>
            <span className="font-medium text-slate-900">
              {formatCurrency(totals.tax, totals.currency)}
            </span>
          </div>
        )}

        {gatewayFees > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Gateway Fees</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(gatewayFees, totals.currency)}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-primary-600">
          <span>Grand Total</span>
          <span>{formatCurrency(finalTotal, totals.currency)}</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Taxes are estimated and may change after finance review.
      </p>
    </ModernCard>
  );
};

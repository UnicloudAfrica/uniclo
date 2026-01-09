import React from "react";
import { ModernCard } from "../ui";
import { StatusPill } from "../ui";
import { Configuration } from "../../../types/InstanceConfiguration";
import { formatCurrencyValue } from "../../../utils/instanceCreationUtils";

interface OrderOverviewCardProps {
  configurations: Configuration[];
  configurationSummaries: any[];
  submissionResult: any;
  orderReceipt: any;
  effectivePaymentOption: any;
  summaryPlanLabel: string;
  summaryWorkflowLabel: string;
  assignmentSummary: string;
  billingCountryLabel: string;
  summarySubtotalValue: number;
  summaryTaxValue: number;
  summaryGatewayFeesValue: number;
  summaryGrandTotalValue: number;
  summaryDisplayCurrency: string;
  summaryConfigurationCount: number;
  taxLabelSuffix: string;
  backendPricingData: any;
  resourceLabel?: string;
}

const OrderOverviewCard: React.FC<OrderOverviewCardProps> = ({
  configurations,
  configurationSummaries,
  submissionResult,
  orderReceipt,
  effectivePaymentOption,
  summaryPlanLabel,
  summaryWorkflowLabel,
  assignmentSummary,
  billingCountryLabel,
  summarySubtotalValue,
  summaryTaxValue,
  summaryGatewayFeesValue,
  summaryGrandTotalValue,
  summaryDisplayCurrency,
  summaryConfigurationCount,
  taxLabelSuffix,
  backendPricingData,
  resourceLabel = "Instance",
}) => {
  const overviewStatus = submissionResult
    ? submissionResult.payment?.required
      ? { label: "Payment", tone: "warning" }
      : { label: "Ready", tone: "info" }
    : { label: "Manual review", tone: "warning" };

  const transactionIdentifier =
    submissionResult?.transaction?.identifier ||
    submissionResult?.transaction?.reference ||
    submissionResult?.transaction?.id ||
    orderReceipt?.transaction?.identifier ||
    orderReceipt?.transaction?.id ||
    effectivePaymentOption?.transaction_reference ||
    "";
  const estimatedTaxLabel = `Estimated tax${taxLabelSuffix}`;

  return (
    <ModernCard variant="elevated" padding="lg" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">Order overview</p>
          <p className="text-xs text-slate-500">
            Auto-calculated from the captured configuration and provisioning response.
          </p>
        </div>
        <StatusPill label={overviewStatus.label} tone={overviewStatus.tone as any} />
      </div>
      <div className="space-y-3 text-sm">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold text-slate-700">
            {resourceLabel} configurations (
            {configurationSummaries.length || configurations.length || 0})
          </p>
          <div className="mt-2 space-y-2">
            {configurationSummaries.length === 0 && (
              <p className="text-xs text-slate-500">
                Add at least one compute profile to populate the order overview.
              </p>
            )}
            {configurationSummaries.map((summary) => (
              <div
                key={summary.id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {summary.title || `${resourceLabel} configuration`}
                    </p>
                    <p className="text-xs text-slate-500">{summary.regionLabel}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      summary.isComplete
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {summary.statusLabel}
                  </span>
                </div>
                <dl className="mt-3 grid gap-3 text-xs text-slate-600 lg:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <dt>Compute</dt>
                    <dd className="font-medium text-slate-800 text-right break-words">
                      {summary.computeLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>OS image</dt>
                    <dd className="font-medium text-slate-800 text-right break-words">
                      {summary.osLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Term</dt>
                    <dd className="font-medium text-slate-800 text-right break-words">
                      {summary.termLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Storage</dt>
                    <dd className="font-medium text-slate-800 text-right break-words">
                      {summary.storageLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Floating IPs</dt>
                    <dd className="font-medium text-slate-800 text-right break-words">
                      {summary.floatingIpLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Key pair</dt>
                    <dd className="font-medium text-slate-800 text-right break-words">
                      {summary.keypairLabel || "No key pair"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Subnet</dt>
                    <dd className="font-medium text-slate-800 text-right break-words">
                      {summary.subnetLabel || "Default subnet"}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Plan label</dt>
          <dd className="font-medium text-slate-900">{summaryPlanLabel}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Workflow</dt>
          <dd className="font-medium text-slate-900 text-right">{summaryWorkflowLabel}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Assignment</dt>
          <dd className="font-medium text-slate-900 text-right">{assignmentSummary}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Billing country</dt>
          <dd className="font-medium text-slate-900 text-right">{billingCountryLabel}</dd>
        </div>
        {transactionIdentifier && (
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Transaction</dt>
            <dd className="font-medium text-slate-900 text-right">{transactionIdentifier}</dd>
          </div>
        )}
        {!configurationSummaries.length && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">Pending service profile</p>
            <p className="text-xs text-slate-500">
              Compute profile will populate after you continue.
            </p>
          </div>
        )}
        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">
              {summaryDisplayCurrency} {formatCurrencyValue(summarySubtotalValue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{estimatedTaxLabel}</span>
            <span className="font-semibold text-slate-900">
              {summaryDisplayCurrency} {formatCurrencyValue(summaryTaxValue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Gateway fees</span>
            <span className="font-semibold text-slate-900">
              {summaryDisplayCurrency} {formatCurrencyValue(summaryGatewayFeesValue)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-sm font-semibold text-slate-900">Grand total</span>
          <span className="text-lg font-bold text-slate-900">
            {summaryDisplayCurrency} {formatCurrencyValue(summaryGrandTotalValue)}
          </span>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {summaryConfigurationCount} service profile
          {summaryConfigurationCount === 1 ? "" : "s"} captured. Taxes are estimated and may change
          after finance review.
        </div>
        {backendPricingData?.lines?.length > 0 && (
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">Pricing breakdown</p>
            <p className="text-xs text-slate-500">
              Pulled directly from the backend pricing response.
            </p>
            <div className="mt-3 space-y-2">
              {backendPricingData?.lines?.map((line: any, index: number) => {
                const lineCurrency =
                  line.currency || backendPricingData.currency || summaryDisplayCurrency;
                const lineRegion =
                  line.meta?.region || line.meta?.region_code || line.meta?.regionCode || "Region";
                const frequencyLabel = line.frequency
                  ? line.frequency.charAt(0).toUpperCase() + line.frequency.slice(1)
                  : null;
                const quantityLabel = line.quantity
                  ? `${line.quantity} ${line.meta?.unit || "units"}`
                  : null;
                return (
                  <div
                    key={line.name || index}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {line.name || `Line ${index + 1}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {lineRegion}
                          {frequencyLabel ? ` • ${frequencyLabel}` : ""}
                          {line.months ? ` • ${line.months} mo` : ""}
                        </p>
                        {quantityLabel && (
                          <p className="text-[11px] text-slate-500">{quantityLabel}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {Number(line.unit_amount) > 0 && (
                          <p className="text-xs text-slate-500">
                            Unit: {lineCurrency} {formatCurrencyValue(line.unit_amount)}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-slate-900">
                          {lineCurrency} {formatCurrencyValue(line.total ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ModernCard>
  );
};

export default OrderOverviewCard;

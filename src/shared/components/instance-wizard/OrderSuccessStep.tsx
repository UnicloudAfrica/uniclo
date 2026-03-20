import React from "react";
import { CheckCircle } from "lucide-react";
import { ModernButton } from "../ui";
import KeypairDownloadModal from "./order-success/KeypairDownloadModal";
import ProvisioningPipelineSection from "./order-success/ProvisioningPipelineSection";
import { useProvisioningProgress } from "./order-success/useProvisioningProgress";
import type { OrderSuccessStepProps } from "./order-success/OrderSuccessStep.types";

// Re-export types so existing imports continue to work
export type {
  ConfigurationSummary,
  PricingSummary,
  KeypairDownload,
  PipelineStep,
  InstanceSummary,
  ConfigurationPipelineGroup,
  OrderSuccessStepProps,
} from "./order-success/OrderSuccessStep.types";

/**
 * Shared order confirmation/success step for provisioning wizards.
 * Displays order ID, configuration summaries, and navigation actions.
 */
/** Strip provider names (e.g. "zadara", "nobus") from region codes for display. */
const sanitizeRegionLabel = (raw: string): string => {
  if (!raw || raw === "\u2014") return raw;
  // Remove known provider tokens and clean up separators
  return raw
    .replace(/\b(zadara|nobus)\b[-_]?/gi, "")
    .replace(/^[-_]+|[-_]+$/g, "")
    .replace(/[-_]{2,}/g, "-")
    .trim() || raw;
};

const OrderSuccessStep: React.FC<OrderSuccessStepProps> = ({
  orderId,
  transactionId,
  isFastTrack = false,
  configurationSummaries,
  pricingSummary,
  keypairDownloads,
  instances,
  instancesPageUrl,
  onCreateAnother,
  resourceLabel = "Instance",
}) => {
  const resourceLabelPlural = resourceLabel.toLowerCase().endsWith("s")
    ? resourceLabel
    : `${resourceLabel}s`;
  const resolvedCurrency = pricingSummary?.currency || "USD";
  const resolvedTotal = pricingSummary?.grandTotal ?? 0;
  const totalInstances = configurationSummaries.reduce((total, cfg) => {
    const countValue = Number(cfg.count ?? 1);
    return total + (Number.isFinite(countValue) ? countValue : 1);
  }, 0);

  const { configurationPipelines, isRetryingHealthCheck, handleRetryHealthCheck } =
    useProvisioningProgress(instances);

  return (
    <div className="space-y-6">
      <KeypairDownloadModal keypairDownloads={keypairDownloads} />

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isFastTrack ? `${resourceLabelPlural} Provisioning!` : "Order Confirmed!"}
            </h2>
            <p className="text-gray-500">
              {isFastTrack
                ? `Your ${resourceLabelPlural.toLowerCase()} are being deployed immediately`
                : `Your ${resourceLabelPlural.toLowerCase()} are being provisioned`}
            </p>
          </div>
        </div>

        {/* Order ID Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>Order ID:</strong> {orderId || "\u2014"}
          </p>
          {transactionId && (
            <p className="text-sm text-green-800 mt-1">
              <strong>Transaction:</strong> {transactionId}
            </p>
          )}
          <p className="text-sm text-green-700 mt-1">
            You will receive an email confirmation shortly.
          </p>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {configurationSummaries.map((cfg) => {
              const displayName = cfg.name || cfg.title || resourceLabel;
              const displayRegion = sanitizeRegionLabel(cfg.region || cfg.regionLabel || "\u2014");
              const countValue = Number(cfg.count ?? 1);
              const monthsValue = Number(cfg.months ?? 1);
              const countLabel = Number.isFinite(countValue) ? countValue : cfg.count || 1;
              const monthsLabel = Number.isFinite(monthsValue) ? monthsValue : cfg.months || 1;

              return (
                <div key={cfg.id} className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {displayName} \u00d7 {countLabel} ({monthsLabel} months)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-medium">{displayRegion}</span>
                    {cfg.canFastTrack && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Fast-track
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between text-gray-600">
              <span>Total {resourceLabelPlural.toLowerCase()}</span>
              <span className="font-medium text-gray-800">{totalInstances || 0}</span>
            </div>

            {/* Total */}
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-green-600">
                {isFastTrack
                  ? "Free (Fast-track)"
                  : `${resolvedCurrency} ${resolvedTotal.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        <ProvisioningPipelineSection
          isFastTrack={isFastTrack}
          configurationPipelines={configurationPipelines}
          isRetryingHealthCheck={isRetryingHealthCheck}
          onRetryHealthCheck={handleRetryHealthCheck}
        />

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <ModernButton
            onClick={() => (globalThis.window.location.href = instancesPageUrl)}
            className="flex-1"
          >
            View My Instances
          </ModernButton>
          <ModernButton variant="outline" onClick={onCreateAnother}>
            Create Another
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessStep;

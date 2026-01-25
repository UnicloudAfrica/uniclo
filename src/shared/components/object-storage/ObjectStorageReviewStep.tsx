import React from "react";
import { ModernButton } from "../ui";
import { ResolvedProfile, SummaryTotals } from "../../../hooks/useObjectStoragePricing";
import { ObjectStorageOrderSummary } from "./ObjectStorageOrderSummary";

export interface ObjectStorageReviewStepProps {
  profiles: ResolvedProfile[];
  totals: SummaryTotals;
  assignmentLabel: string;
  countryLabel: string;
  workflowLabel: string;
  transactionId?: string;
  isPaymentComplete?: boolean;
  isFastTrack?: boolean;
  isSubmitting?: boolean;
  gatewayFees?: number;
  grandTotalWithFees?: number;
  dashboardContext: "admin" | "tenant" | "client";

  // Handlers
  onSubmit: () => void;
  onBack: () => void;
  onGeneratePaymentOptions?: () => void;
}

export const ObjectStorageReviewStep: React.FC<ObjectStorageReviewStepProps> = ({
  profiles,
  totals,
  assignmentLabel,
  countryLabel,
  workflowLabel,
  transactionId,
  isPaymentComplete,
  isFastTrack,
  isSubmitting,
  gatewayFees = 0,
  grandTotalWithFees,
  onSubmit,
  onBack,
  onGeneratePaymentOptions,
}) => {
  const canSubmit = isFastTrack || isPaymentComplete;
  const hasProfiles = profiles.length > 0 && profiles.every((profile) => profile.hasTierData);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Review & Provision</h2>
        <p className="mt-2 text-sm text-gray-600">
          Confirm your Silo Storage order details before provisioning.
        </p>

        {!hasProfiles && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
            Please configure at least one complete service profile before provisioning.
          </div>
        )}

        {!isFastTrack && !isPaymentComplete && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
            Payment is required before provisioning. Complete payment in the previous step.
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ModernButton variant="outline" onClick={onBack} isDisabled={isSubmitting}>
            Back
          </ModernButton>

          {!isFastTrack && !isPaymentComplete && onGeneratePaymentOptions && (
            <ModernButton
              variant="outline"
              onClick={onGeneratePaymentOptions}
              isDisabled={isSubmitting || !hasProfiles}
            >
              Generate payment options
            </ModernButton>
          )}

          <ModernButton
            onClick={onSubmit}
            isLoading={isSubmitting}
            isDisabled={isSubmitting || !hasProfiles || !canSubmit}
          >
            {isFastTrack ? "Provision now" : "Confirm & provision"}
          </ModernButton>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          {isFastTrack
            ? "Fast-track requests provision immediately."
            : "Provisioning begins once payment is verified."}
        </p>
      </div>

      <ObjectStorageOrderSummary
        profiles={profiles}
        totals={totals}
        assignmentLabel={assignmentLabel}
        countryLabel={countryLabel}
        workflowLabel={workflowLabel}
        transactionId={transactionId}
        isPaymentComplete={isPaymentComplete}
        gatewayFees={gatewayFees}
        grandTotalWithFees={grandTotalWithFees}
        showDetailedBreakdown={true}
      />
    </div>
  );
};

export default ObjectStorageReviewStep;

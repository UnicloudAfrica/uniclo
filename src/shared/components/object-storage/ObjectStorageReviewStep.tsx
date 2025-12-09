import React from "react";
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
  dashboardContext,
  onSubmit,
  onBack,
  onGeneratePaymentOptions,
}) => {
  const canSubmit = isFastTrack || isPaymentComplete;
  const hasProfiles = profiles.length > 0 && profiles.every((p) => p.hasTierData);

  return (
    <div className="review-step">
      <div className="step-header">
        <h2 className="step-title">Review & Submit</h2>
        <p className="step-description">Review your order details before submitting.</p>
      </div>

      {/* Order Summary */}
      <div className="review-summary">
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

      {/* Validation Messages */}
      {!hasProfiles && (
        <div className="validation-warning">
          <span className="warning-icon">⚠</span>
          <span>Please configure at least one complete service profile before submitting.</span>
        </div>
      )}

      {!isFastTrack && !isPaymentComplete && (
        <div className="validation-warning">
          <span className="warning-icon">⚠</span>
          <span>
            Payment is required before submitting. Please complete payment in the previous step.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="review-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </button>

        <div className="action-spacer" />

        {!isFastTrack && !isPaymentComplete && onGeneratePaymentOptions && (
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={onGeneratePaymentOptions}
            disabled={isSubmitting || !hasProfiles}
          >
            Generate Payment Options
          </button>
        )}

        <button
          type="button"
          className={`btn ${canSubmit ? "btn-primary" : "btn-secondary"}`}
          onClick={onSubmit}
          disabled={isSubmitting || !hasProfiles || !canSubmit}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-sm" /> Submitting...
            </>
          ) : isFastTrack ? (
            "Provision Now"
          ) : (
            "Submit Order"
          )}
        </button>
      </div>

      {/* Info about what happens next */}
      <div className="review-info">
        {isFastTrack ? (
          <p className="info-text">
            <strong>Fast-Track Mode:</strong> Your object storage will be provisioned immediately
            after submission.
          </p>
        ) : (
          <p className="info-text">
            <strong>Standard Mode:</strong> Your order will be submitted for processing after
            payment confirmation.
          </p>
        )}
      </div>
    </div>
  );
};

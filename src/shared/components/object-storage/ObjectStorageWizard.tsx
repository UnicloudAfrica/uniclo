import React from "react";
import { Option } from "../../../hooks/objectStorageUtils";
import { ResolvedProfile, SummaryTotals } from "../../../hooks/useObjectStoragePricing";

// Common types for Silo Storage components
export interface Step {
  id: string;
  label: string;
  description: string;
}

export interface ObjectStorageWizardProps {
  // Mode & Navigation
  mode: string;
  isFastTrack: boolean;
  activeStep: number;
  steps: Step[];
  onModeChange: (mode: string) => void;
  onStepChange: (step: number) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;

  // Context - determines which dashboard we're in
  dashboardContext: "admin" | "tenant" | "client";

  // Order Summary Props
  profiles: ResolvedProfile[];
  summaryTotals: SummaryTotals;
  assignmentLabel: string;
  countryLabel: string;
  isPaymentComplete?: boolean;

  // Loading & Submission
  isSubmitting?: boolean;
  isLoading?: boolean;

  // Content
  children: React.ReactNode;
}

export const ObjectStorageWizard: React.FC<ObjectStorageWizardProps> = ({
  mode,
  isFastTrack,
  activeStep,
  steps,
  onModeChange,
  onStepChange,
  onNextStep,
  onPreviousStep,
  isFirstStep,
  isLastStep,
  dashboardContext,
  profiles,
  summaryTotals,
  assignmentLabel,
  countryLabel,
  isPaymentComplete,
  isSubmitting,
  isLoading,
  children,
}) => {
  return (
    <div className="object-storage-wizard">
      <div className="wizard-layout">
        {/* Step Guide */}
        <div className="wizard-step-guide">
          <div className="step-list">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const isClickable = isCompleted || index === activeStep;

              return (
                <div
                  key={step.id}
                  className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isClickable ? "clickable" : ""}`}
                  onClick={() => isClickable && onStepChange(index)}
                >
                  <div className="step-number">{isCompleted ? "✓" : index + 1}</div>
                  <div className="step-content">
                    <div className="step-label">{step.label}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="wizard-main-content">{children}</div>

        {/* Order Summary Sidebar */}
        <div className="wizard-sidebar">
          <ObjectStorageOrderSummaryCompact
            profiles={profiles}
            totals={summaryTotals}
            assignmentLabel={assignmentLabel}
            countryLabel={countryLabel}
            workflowLabel={isFastTrack ? "Fast-Track" : "Standard"}
            isPaymentComplete={isPaymentComplete}
          />
        </div>
      </div>

      {/* Step Actions */}
      <div className="wizard-actions">
        {!isFirstStep && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPreviousStep}
            disabled={isSubmitting}
          >
            Previous
          </button>
        )}
        <div className="flex-spacer" />
        {!isLastStep && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNextStep}
            disabled={isSubmitting || isLoading}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

// Compact order summary for sidebar (internal component)
interface OrderSummaryCompactProps {
  profiles: ResolvedProfile[];
  totals: SummaryTotals;
  assignmentLabel: string;
  countryLabel: string;
  workflowLabel: string;
  isPaymentComplete?: boolean;
}

const ObjectStorageOrderSummaryCompact: React.FC<OrderSummaryCompactProps> = ({
  profiles,
  totals,
  assignmentLabel,
  countryLabel,
  workflowLabel,
  isPaymentComplete,
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

  return (
    <div className="order-summary-compact">
      <h3 className="summary-title">Order Summary</h3>
      <p className="summary-subtitle">Auto-calculated from configuration</p>

      <div className="summary-section">
        <div className="summary-label">Customer Context</div>
        <div className="summary-value">{assignmentLabel}</div>
      </div>

      <div className="summary-section">
        <div className="summary-label">Billing Country</div>
        <div className="summary-value">{countryLabel}</div>
      </div>

      <div className="summary-section">
        <div className="summary-label">Workflow</div>
        <div className="summary-value">{workflowLabel}</div>
      </div>

      <div className="summary-section">
        <div className="summary-label">Service Profiles</div>
        <div className="summary-value">
          {profiles.length === 0 ? (
            <span className="text-muted">No profiles configured</span>
          ) : (
            <span>
              {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="summary-divider" />

      <div className="summary-totals">
        <div className="total-row">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal, totals.currency)}</span>
        </div>
        {totals.tax > 0 && (
          <div className="total-row">
            <span>Tax ({totals.taxRate}%)</span>
            <span>{formatCurrency(totals.tax, totals.currency)}</span>
          </div>
        )}
        <div className="total-row grand-total">
          <span>Total</span>
          <span>{formatCurrency(totals.total, totals.currency)}</span>
        </div>
      </div>

      {isPaymentComplete && <div className="payment-status success">✓ Payment Complete</div>}
    </div>
  );
};

import React from "react";
import { ChevronRight, ClipboardList, Clock, Loader2 } from "lucide-react";
import { StatusPill } from "@/shared/components/ui";
import { STATUS_LABELS } from "@/shared/constants/onboarding";
import type { Step, StepSummary } from "./onboardingReviewTypes";
import { formatDateTime, resolveStatusTone } from "./onboardingReviewHelpers";

interface OnboardingStepPanelProps {
  subjectSelected: boolean;
  subjectType: "tenant" | "client";
  loadingSummaries: boolean;
  steps: Step[];
  activeStep: string | null;
  stepSummaries: Record<string, StepSummary>;
  onStepSelect: (stepId: string) => void;
}

const StepStatus: React.FC<{ stepId: string; stepSummaries: Record<string, StepSummary> }> = ({
  stepId,
  stepSummaries,
}) => {
  const summary = stepSummaries[stepId] ?? {
    status: "not_started",
    submitted_at: null,
    reviewed_at: null,
  };
  const tone = resolveStatusTone(summary.status, "neutral");
  const label = STATUS_LABELS[summary.status] ?? summary.status;

  return (
    <div className="flex flex-col gap-1">
      <StatusPill label={label} tone={tone} />
      <div className="text-[11px] text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Submitted: {formatDateTime(summary.submitted_at)}
        </div>
        <div className="flex items-center gap-1">
          <ClipboardList className="h-3 w-3" />
          Reviewed: {formatDateTime(summary.reviewed_at)}
        </div>
      </div>
    </div>
  );
};

const OnboardingStepPanel: React.FC<OnboardingStepPanelProps> = ({
  subjectSelected,
  subjectType,
  loadingSummaries,
  steps,
  activeStep,
  stepSummaries,
  onStepSelect,
}) => {
  if (!subjectSelected) {
    return (
      <p className="text-sm text-gray-500">
        Select a {subjectType === "tenant" ? "tenant" : "client"} above to load onboarding steps.
      </p>
    );
  }

  if (loadingSummaries) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step: unknown) => {
        const isActive = activeStep === step.id;
        return (
          <button
            key={step.id}
            onClick={() => onStepSelect(step.id)}
            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
              isActive ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                {step.description && (
                  <p className="mt-1 text-xs text-gray-500">{step.description}</p>
                )}
              </div>
              <ChevronRight
                className={`h-4 w-4 text-gray-400 transition ${
                  isActive ? "translate-x-1 text-blue-500" : ""
                }`}
              />
            </div>
            <div className="mt-3">
              <StepStatus stepId={step.id} stepSummaries={stepSummaries} />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default OnboardingStepPanel;

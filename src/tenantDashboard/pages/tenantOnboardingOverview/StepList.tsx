import { StatusPill } from "@/shared/components/ui";
import { STATUS_LABELS, STATUS_TONES } from "@/shared/constants/onboarding";
import type { OnboardingStep } from "./types";
import { formatDateTime } from "./utils";

interface StepListProps {
  steps: OnboardingStep[];
  activeStepId: string | number | null;
  onSelectStep: (stepId: string | number) => void;
}

const StepList = ({ steps, activeStepId, onSelectStep }: StepListProps) => (
  <div className="space-y-2">
    {steps.map((step) => {
      const isActive = step.id === activeStepId;
      const tone = STATUS_TONES[step.status ?? ""] ?? "neutral";

      return (
        <button
          key={step.id}
          onClick={() => onSelectStep(step.id)}
          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
            isActive
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{step.label}</p>
              {step.requires_review && (
                <p className="text-xs text-gray-500">Manual review required</p>
              )}
            </div>
            <StatusPill
              label={
                step.status
                  ? (STATUS_LABELS[step.status] ?? step.status.replace(/_/g, " "))
                  : "\u2014"
              }
              tone={tone}
            />
          </div>
          <div className="mt-2 text-[11px] text-gray-500">
            <div>Submitted: {formatDateTime(step.submitted_at)}</div>
            <div>Reviewed: {formatDateTime(step.reviewed_at)}</div>
          </div>
        </button>
      );
    })}
  </div>
);

export default StepList;

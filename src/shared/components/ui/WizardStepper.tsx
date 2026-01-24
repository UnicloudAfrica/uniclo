// @ts-nocheck
import React from "react";
import { CheckCircle } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  desc?: string;
}

export interface WizardStepperProps {
  steps: WizardStep[];
  activeStep: number;
  onStepChange?: (index: number) => void;
  className?: string;
}

/**
 * Compact inline wizard stepper component.
 * Displays steps horizontally with connecting lines.
 */
const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  activeStep,
  onStepChange,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm overflow-x-auto ${className}`}
    >
      {steps.map((step, idx) => {
        const isActive = idx === activeStep;
        const isCompleted = idx < activeStep;
        const isClickable = (isCompleted || isActive) && onStepChange;
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div
              onClick={() => {
                if (isClickable) onStepChange?.(idx);
              }}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary-50"
                  : isCompleted && onStepChange
                    ? "cursor-pointer hover:bg-slate-50"
                    : isCompleted
                      ? ""
                      : "opacity-50"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-primary-700" : isCompleted ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {step.title}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-px mx-2 min-w-[20px] ${
                  isCompleted ? "bg-emerald-300" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default WizardStepper;

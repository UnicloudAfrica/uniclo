// @ts-nocheck
import React from "react";

const hexToRgba = (hex: string, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char: any) => char + char)
          .join("")
      : sanitized,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface StepNavigationProps {
  steps: any[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  validateStep: () => boolean;
  orientation?: "vertical" | "horizontal";
  accentColor?: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStep,
  setCurrentStep,
  validateStep,
  orientation = "vertical",
  accentColor = "#288DD1",
}) => {
  const handleStepChange = (index: number) => {
    if (index <= currentStep || validateStep()) {
      setCurrentStep(index);
    }
  };

  if (orientation === "horizontal") {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 font-Outfit">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          return (
            <button
              key={`${step.label}-${index}`}
              onClick={() => handleStepChange(index)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
              }`}
              style={
                isActive
                  ? {
                      color: accentColor,
                    }
                  : undefined
              }
            >
              <span>{step.label}</span>
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{
                  backgroundColor: isActive ? accentColor : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Form progress">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const circleColor = isCompleted || isActive ? accentColor : "#CBD5F5";
        return (
          <li key={`${step.label}-${index}`}>
            <button
              type="button"
              onClick={() => handleStepChange(index)}
              aria-current={isActive ? "step" : undefined}
              className="w-full rounded-2xl border border-slate-200 bg-white/60 p-4 text-left transition-all duration-200 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderColor: isActive
                  ? accentColor
                  : isCompleted
                    ? hexToRgba(accentColor, 0.4)
                    : "rgba(226, 232, 240, 1)",
                backgroundColor:
                  isActive || isCompleted ? hexToRgba(accentColor, 0.08) : "rgba(255,255,255,0.8)",
                boxShadow: isActive ? `0 12px 30px ${hexToRgba(accentColor, 0.18)}` : "none",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold"
                  style={{
                    backgroundColor: isCompleted ? circleColor : isActive ? circleColor : "#F1F5F9",
                    borderColor: circleColor,
                    color: isCompleted || isActive ? "#fff" : "#475569",
                  }}
                >
                  {isCompleted ? <span aria-hidden="true">✓</span> : index + 1}
                </span>
                <div className="space-y-1">
                  <p
                    className="text-sm font-semibold text-slate-800"
                    style={{
                      color: isActive ? accentColor : undefined,
                    }}
                  >
                    {step.label}
                  </p>
                  {step.description && <p className="text-xs text-slate-500">{step.description}</p>}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

export default StepNavigation;

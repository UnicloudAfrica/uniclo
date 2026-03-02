import React from "react";

const colorMix = (color: string, amount: number) =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`;

interface StepNavigationProps {
  steps: unknown;
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
  accentColor = "var(--theme-color)",
}) => {
  const handleStepChange = (index: number) => {
    if (index <= currentStep || validateStep()) {
      setCurrentStep(index);
    }
  };

  if (orientation === "horizontal") {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 font-Outfit">
        {(steps as any).map((step: any, index: any) => {
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
      {(steps as any).map((step: any, index: any) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const circleColor = isCompleted || isActive ? accentColor : "rgb(var(--theme-color-200))";
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
                    ? colorMix(accentColor, 40)
                    : "rgb(var(--theme-neutral-200))",
                backgroundColor:
                  isActive || isCompleted ? colorMix(accentColor, 8) : "var(--theme-card-bg)",
                boxShadow: isActive ? `0 12px 30px ${colorMix(accentColor, 18)}` : "none",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold"
                  style={{
                    backgroundColor: isCompleted
                      ? circleColor
                      : isActive
                        ? circleColor
                        : "var(--theme-surface-alt)",
                    borderColor: circleColor,
                    color:
                      isCompleted || isActive
                        ? "var(--theme-card-bg)"
                        : "var(--theme-heading-color)",
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

import React from "react";
import { CheckCircle, Server, CreditCard, ClipboardCheck, Gauge, LucideIcon } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  desc: string;
}

interface StepIndicatorProps {
  steps: WizardStep[];
  activeStep: number;
  onStepClick: (index: number) => void;
  variant?: "horizontal" | "grid";
  /** Custom icon mapping by step.id */
  iconMap?: Record<string, LucideIcon>;
}

const DEFAULT_ICONS: Record<string, LucideIcon> = {
  workflow: Gauge,
  configure: Server,
  services: Server,
  payment: CreditCard,
  review: ClipboardCheck,
};

/**
 * Shared step indicator component for provisioning wizards.
 * Supports horizontal (inline) and grid (card-based) variants.
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  activeStep,
  onStepClick,
  variant = "horizontal",
  iconMap = {},
}) => {
  const getIcon = (stepId: string, index: number): LucideIcon => {
    return iconMap[stepId] || DEFAULT_ICONS[stepId] || Server;
  };

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isCompleted = idx < activeStep;
          const isClickable = isCompleted;
          const Icon = getIcon(step.id, idx);

          return (
            <div
              key={step.id}
              onClick={() => isClickable && onStepClick(idx)}
              className={`relative flex flex-col gap-2 rounded-xl border p-4 transition-all ${
                isActive
                  ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-200"
                  : isCompleted
                    ? "cursor-pointer border-slate-200 bg-white hover:border-slate-300"
                    : "border-slate-100 bg-slate-50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : idx + 1}
                </span>
                {isActive && (
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                    Current
                  </span>
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${isActive ? "text-primary-900" : "text-slate-900"}`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant (inline pills)
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, idx) => {
        const Icon = getIcon(step.id, idx);
        const isActive = idx === activeStep;
        const isCompleted = idx < activeStep;
        const isClickable = isCompleted;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => isClickable && onStepClick(idx)}
              disabled={!isClickable && !isActive}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : isCompleted
                    ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-pointer"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? "bg-white/20" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
              >
                {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className={`text-xs ${isActive ? "text-blue-100" : "opacity-70"}`}>
                  {step.desc}
                </p>
              </div>
            </button>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${idx < activeStep ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;

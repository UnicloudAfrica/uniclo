import React from "react";
import { Check } from "lucide-react";

interface InvoiceWizardStepperProps {
  currentStep: number;
  steps: string[];
  /**
   * Optional click handler — when provided, completed steps become
   * clickable so the user can jump back to a finished phase. Only
   * indices `< currentStep` are interactive; future steps stay locked.
   */
  onStepClick?: (index: number) => void;
}

/**
 * Polished wizard stepper for the Create Invoice flow.
 *
 * Visual contract:
 *   - Compact pill row on desktop with subtle gradient progress fill
 *     between completed nodes.
 *   - Mobile: a card showing the current step name + a tiny dotted
 *     progress bar so the user knows where they are without losing
 *     vertical room.
 *   - Completed nodes show a check; the active node uses the
 *     primary-bordered ring for emphasis.
 */
const InvoiceWizardStepper: React.FC<InvoiceWizardStepperProps> = ({
  currentStep,
  steps,
  onStepClick,
}) => {
  return (
    <>
      {/* ─── Desktop: numbered pills + progress connector ─────────── */}
      <div className="hidden md:block">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <ol className="flex items-center gap-1">
            {steps.map((step, index) => {
              const isDone = index < currentStep;
              const isActive = index === currentStep;
              const isClickable = isDone && !!onStepClick;

              return (
                <React.Fragment key={index}>
                  <li className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      disabled={!isClickable}
                      onClick={isClickable ? () => onStepClick(index) : undefined}
                      className={[
                        "group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all",
                        isDone &&
                          "bg-primary-600 text-white shadow-sm ring-2 ring-primary-600/20 hover:ring-4",
                        isActive &&
                          "bg-white text-primary-700 ring-2 ring-primary-600 shadow-[0_0_0_4px_rgba(var(--color-primary-600-rgb,37_99_235),0.12)] dark:bg-slate-900",
                        !isDone &&
                          !isActive &&
                          "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500",
                        isClickable && "cursor-pointer",
                        !isClickable && !isActive && "cursor-default",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Step ${index + 1}: ${step}${isDone ? " (completed)" : ""}`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
                    </button>

                    <div className="flex min-w-0 flex-col">
                      <span
                        className={[
                          "truncate text-sm font-semibold transition-colors",
                          isActive
                            ? "text-slate-900 dark:text-white"
                            : isDone
                              ? "text-slate-700 dark:text-slate-200"
                              : "text-slate-400 dark:text-slate-500",
                        ].join(" ")}
                      >
                        {step}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Step {index + 1}
                      </span>
                    </div>
                  </li>

                  {index < steps.length - 1 && (
                    <li
                      aria-hidden="true"
                      className={[
                        "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                        isDone
                          ? "bg-primary-600"
                          : "bg-slate-200 dark:bg-slate-700",
                      ].join(" ")}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ─── Mobile: compact card with dotted progress ─────────────── */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white shadow-sm">
              {currentStep + 1}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {steps[currentStep]}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <div
            className="flex shrink-0 gap-1"
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          >
            {steps.map((_, index) => (
              <span
                key={index}
                className={[
                  "h-1.5 w-6 rounded-full transition-colors",
                  index < currentStep
                    ? "bg-primary-600"
                    : index === currentStep
                      ? "bg-primary-400"
                      : "bg-slate-200 dark:bg-slate-700",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceWizardStepper;

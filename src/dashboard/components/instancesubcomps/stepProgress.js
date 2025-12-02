import React from "react";

const StepProgress = ({ currentStep, steps }) => (
  <div className="flex items-center justify-between mb-8 w-full">
    {steps.map((step, index) => {
      const isCompleted = index < currentStep;
      const isActive = index === currentStep;
      const isPending = index > currentStep;

      return (
        <React.Fragment key={step}>
          <div className="relative flex flex-col items-center text-center z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${isActive
                ? "bg-primary-600 text-white shadow-md shadow-primary-100 ring-4 ring-primary-50"
                : isCompleted
                  ? "bg-primary-600 text-white"
                  : "bg-slate-100 text-slate-400"
                }`}
            >
              {index + 1}
            </div>
            <p
              className={`absolute top-10 w-32 text-xs font-medium transition-colors duration-200 ${isActive ? "text-primary-700" : isCompleted ? "text-slate-600" : "text-slate-400"
                }`}
            >
              {step}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 mx-2 relative h-0.5 bg-slate-100">
              <div
                className={`absolute inset-0 bg-primary-600 transition-all duration-500 ease-out ${index < currentStep ? "w-full" : "w-0"
                  }`}
              />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default StepProgress;

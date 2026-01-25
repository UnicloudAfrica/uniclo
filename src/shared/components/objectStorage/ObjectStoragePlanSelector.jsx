import React from "react";
import { ArrowLeft, HardDrive, Rocket } from "lucide-react";

const ObjectStoragePlanSelector = ({
  mode = "standard",
  onModeChange,
  onStandardPlan,
  onFastTrack,
  onBack,
  enableFastTrack = true,
  standardDescription = "Capture billing details and hand off to finance.",
  fastTrackDescription = "Skip straight to provisioning once finance approves.",
  standardLabel = "Standard Silo plan",
  fastTrackLabel = "Fast-track Silo",
}) => {
  const handleSelect = (nextMode) => {
    onModeChange?.(nextMode);
    if (nextMode === "standard") {
      onStandardPlan?.();
    } else if (nextMode === "fast-track") {
      onFastTrack?.();
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Select workflow</p>
          <p className="text-sm text-gray-500">
            Choose between a guided plan creation or a fast-track provisioning shortcut.
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          className={[
            "flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all",
            mode === "standard"
              ? "border-primary-500 bg-primary-50 shadow-sm"
              : "border-primary-200 bg-primary-50 bg-opacity-70 hover:border-primary-300 hover:bg-primary-50 hover:bg-opacity-100",
          ].join(" ")}
          onClick={() => handleSelect("standard")}
        >
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-primary-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{standardLabel}</p>
              <p className="text-xs text-gray-500">{standardDescription}</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Works for approved sales or finance-led activations.</li>
            <li>• Lets you flag invoices as pending or paid.</li>
            <li>• Keeps provisioning status in manual control.</li>
          </ul>
        </button>
        {enableFastTrack && (
          <button
            type="button"
            className={[
              "flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all",
              mode === "fast-track"
                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                : "border-emerald-200 bg-emerald-50 bg-opacity-70 hover:border-emerald-300 hover:bg-emerald-50 hover:bg-opacity-100",
            ].join(" ")}
            onClick={() => handleSelect("fast-track")}
          >
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{fastTrackLabel}</p>
                <p className="text-xs text-gray-500">{fastTrackDescription}</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Marks payment as admin approved automatically.</li>
              <li>• Moves the order into provisioning immediately.</li>
              <li>• Best for exceptions with pre-approval.</li>
            </ul>
          </button>
        )}
      </div>
    </div>
  );
};

export default ObjectStoragePlanSelector;

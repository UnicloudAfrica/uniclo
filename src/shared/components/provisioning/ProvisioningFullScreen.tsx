import React, { useEffect } from "react";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";
import SetupProgressCard from "../projects/details/SetupProgressCard";

interface ProvisioningFullScreenProps {
  project: any;
  setupSteps: any[];
  onRefresh?: () => void;
  onViewProject?: () => void;
}

const ProvisioningFullScreen: React.FC<ProvisioningFullScreenProps> = ({
  project,
  setupSteps,
  onRefresh,
  onViewProject,
}) => {
  // Calculate progress percentage
  const totalSteps = setupSteps.length;
  const completedSteps = setupSteps.filter((s) => s.status === "completed").length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Find current active step
  const currentStep = setupSteps.find((s) => s.status === "pending" || s.status === "in_progress");

  // Auto-refresh when progress reaches 100% to detect status change
  useEffect(() => {
    if (progress >= 100 && onRefresh) {
      // Wait a bit for backend to finalize, then refresh
      const timer = setTimeout(() => {
        onRefresh();
      }, 2000);

      // Keep polling every 3 seconds until status changes
      const pollTimer = setInterval(() => {
        onRefresh();
      }, 3000);

      return () => {
        clearTimeout(timer);
        clearInterval(pollTimer);
      };
    }
  }, [progress, onRefresh]);

  // Show completion state when at 100%
  const isComplete = progress >= 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute top-0 left-0 w-full h-96 -z-10"
        style={{
          background:
            "linear-gradient(to bottom, var(--theme-color-10, rgba(40, 141, 209, 0.1)), transparent)",
        }}
      />

      <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[--theme-color-10] mb-4 relative">
            {isComplete ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Loader2 className="w-8 h-8 text-[--theme-color] animate-spin" />
            )}
            {!isComplete && (
              <div className="absolute inset-0 rounded-full border-4 border-[--theme-color-20] animate-pulse" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isComplete ? "Setup Complete!" : `Provisioning ${project?.name || "Project"}`}
          </h1>
          <p className="text-gray-600 text-lg">
            {isComplete
              ? "Your infrastructure is ready. You can now start deploying resources."
              : "Please wait while we set up your dedicated infrastructure."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-out relative ${isComplete ? "bg-green-500" : "bg-[--theme-color]"}`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
            </div>
          </div>
          {currentStep && (
            <p className="text-center text-sm text-[--theme-color] mt-3 font-medium animate-pulse">
              Current: {currentStep.label}...
            </p>
          )}
        </div>

        {/* The heavy lifter - reused component */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <SetupProgressCard steps={setupSteps} isLoading={false} />
        </div>

        {/* Action Buttons */}
        {isComplete && onViewProject && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onViewProject}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[--theme-color] hover:opacity-90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Go to Project
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-400">
            {isComplete
              ? "Your project is ready to use."
              : "This process typically takes 1-2 minutes."}
          </p>
          <p className="text-xs text-gray-300">
            Project ID: {project?.identifier || project?.id || "Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProvisioningFullScreen;

import React, { useEffect } from "react";
import { Loader2, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";
import SetupProgressCard from "../projects/details/SetupProgressCard";

interface SetupStep {
  status?: string;
  [key: string]: unknown;
}

interface ProvisioningFullScreenProps {
  project: { name?: string } | null;
  setupSteps: SetupStep[];
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

  // Auto-refresh logic (Polling fallback)
  useEffect(() => {
    if (!onRefresh) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    if (progress >= 100) {
      // Finalization polling (faster to catch 'active' status switch)
      timer = setTimeout(() => {
        onRefresh();
      }, 2000);

      pollInterval = setInterval(() => {
        onRefresh();
      }, 3000);
    } else {
      // Universal fallback polling (if broadcasting fails or is missing)
      pollInterval = setInterval(() => {
        onRefresh();
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [progress, onRefresh]);

  // Show completion state when at 100%
  const isComplete = progress >= 100;

  return (
    <div
      className={`fixed inset-0 z-[100] ${isComplete ? "bg-green-50/95" : "bg-slate-50/95"} backdrop-blur-xl flex flex-col items-center justify-start py-20 p-6 overflow-y-auto animate-in fade-in duration-500`}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 left-0 w-full h-2/3 -z-10 opacity-70"
        style={{
          background: isComplete
            ? "radial-gradient(circle at 50% 0%, rgb(var(--theme-success-500) / 0.4), transparent 70%)"
            : "radial-gradient(circle at 50% 0%, var(--theme-color-10, rgba(40, 141, 209, 0.15)), transparent 70%)",
        }}
      />

      {/* Exit button */}
      <button
        onClick={() => {
          if (isComplete && onViewProject) {
            onViewProject();
          } else {
            globalThis.window.history.back();
          }
        }}
        className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        {isComplete ? "Exit to Dashboard" : "Back to Projects"}
      </button>

      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-12">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-2xl ${isComplete ? "shadow-green-200" : "shadow-[--theme-color-10]"} mb-8 relative`}
          >
            {isComplete ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <Loader2 className="w-12 h-12 text-[--theme-color] animate-spin" />
            )}
            {!isComplete && (
              <div className="absolute -inset-1 rounded-full border-2 border-[--theme-color-20] animate-pulse" />
            )}
            {isComplete && (
              <div className="absolute -inset-4 rounded-full bg-green-500/10 animate-ping duration-1000" />
            )}
          </div>

          <h1
            className={`text-5xl font-black ${isComplete ? "text-green-600" : "text-gray-900"} mb-4 tracking-tighter`}
          >
            {isComplete ? "Setup Complete!" : `Provisioning ${project?.name || "Project"}`}
          </h1>
          <p
            className={`${isComplete ? "text-green-700/60" : "text-gray-500"} text-xl max-w-lg mx-auto leading-relaxed font-medium`}
          >
            {isComplete
              ? "Your infrastructure is ready. You can now start deploying resources."
              : "Please wait while we set up your dedicated infrastructure."}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div
          className={`mb-12 bg-white rounded-3xl p-8 border ${isComplete ? "border-green-100 shadow-green-100/50" : "border-white shadow-gray-200/50"} shadow-2xl relative overflow-hidden`}
        >
          <div className="flex justify-between text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
            <span>Overall Progress</span>
            <span className={isComplete ? "text-green-500" : "text-[--theme-color]"}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
            <div
              className={`h-full transition-all duration-1000 ease-out relative ${isComplete ? "bg-green-500 shadow-[0_0_20px_rgb(var(--theme-success-500)/0.4)]" : "bg-[--theme-color]"}`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
          {currentStep && (
            <div className="flex flex-col items-center mt-6">
              <div
                className={`px-4 py-1.5 ${isComplete ? "bg-green-100 text-green-700" : "bg-[--theme-color-10] text-[--theme-color]"} rounded-full text-xs font-bold flex items-center gap-2 ${!isComplete && "animate-bounce"}`}
              >
                <RefreshCw className={`w-3 h-3 ${!isComplete && "animate-spin"}`} />
                {(currentStep as any)?.label} {isComplete ? "Successful" : "In progress..."}
              </div>
            </div>
          )}
        </div>

        {/* The heavy lifter */}
        <div
          className={`overflow-hidden rounded-3xl border ${isComplete ? "border-green-100 shadow-green-100/30" : "border-gray-100 shadow-gray-200/50"} bg-white shadow-2xl`}
        >
          <SetupProgressCard steps={setupSteps as any} isLoading={false} />
        </div>

        {/* Action Buttons */}
        {isComplete && onViewProject && (
          <div className="mt-12 flex justify-center pb-20">
            <button
              onClick={onViewProject}
              className="inline-flex items-center gap-4 px-12 py-6 bg-green-600 hover:bg-green-700 text-white text-xl font-black rounded-3xl shadow-[0_20px_50px_rgb(var(--theme-success-500)/0.3)] transition-all duration-300 transform hover:scale-105 active:scale-95 group"
            >
              Go to Dashboard
              <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        <div className="text-center mt-12 space-y-3 pb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-[10px] text-gray-500 font-mono uppercase tracking-widest">
            Project ID: {(project as any)?.identifier || (project as any)?.id || "Loading..."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvisioningFullScreen;

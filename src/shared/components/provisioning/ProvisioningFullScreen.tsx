import React from "react";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";
import SetupProgressCard from "../projects/details/SetupProgressCard";

interface ProvisioningFullScreenProps {
  project: any;
  setupSteps: any[];
  onRefresh?: () => void;
}

const ProvisioningFullScreen: React.FC<ProvisioningFullScreenProps> = ({
  project,
  setupSteps,
  onRefresh,
}) => {
  // Calculate progress percentage
  const totalSteps = setupSteps.length;
  const completedSteps = setupSteps.filter((s) => s.status === "completed").length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Find current active step
  const currentStep = setupSteps.find((s) => s.status === "pending" || s.status === "in_progress");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#E6F4FB] to-transparent -z-10" />

      <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 relative">
            <Loader2 className="w-8 h-8 text-[#288DD1] animate-spin" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-pulse" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Provisioning {project?.name || "Project"}
          </h1>
          <p className="text-gray-600 text-lg">
            Please wait while we set up your dedicated infrastructure.
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
              className="h-full bg-[#288DD1] transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
            </div>
          </div>
          {currentStep && (
            <p className="text-center text-sm text-[#288DD1] mt-3 font-medium animate-pulse">
              Current: {currentStep.label}...
            </p>
          )}
        </div>

        {/* The heavy lifter - reused component */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <SetupProgressCard steps={setupSteps} isLoading={false} />
        </div>

        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-400">This process typically takes 1-2 minutes.</p>
          <p className="text-xs text-gray-300">
            Project ID: {project?.identifier || project?.id || "Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProvisioningFullScreen;

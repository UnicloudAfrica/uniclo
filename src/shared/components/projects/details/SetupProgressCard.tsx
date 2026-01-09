import React from "react";
import { CheckCircle, Circle, ArrowRight, RefreshCw, XCircle } from "lucide-react";

interface SetupStep {
  id: string;
  label: string;
  status: "completed" | "pending" | "not_started" | "failed";
  description?: string;
  updated_at?: string;
  context?: Record<string, any>;
}

interface SetupProgressCardProps {
  steps: SetupStep[];
  progressPercent?: number;
  onCompleteSetup?: () => void;
  isLoading?: boolean;
}

const SetupProgressCard: React.FC<SetupProgressCardProps> = ({
  steps = [],
  progressPercent,
  onCompleteSetup,
  isLoading = false,
}) => {
  const [expandedSteps, setExpandedSteps] = React.useState<Record<string, boolean>>({});

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const allComplete = steps.length > 0 && completedCount === steps.length;
  // Use 100% when all steps complete, otherwise prefer prop, then calculate
  const calculatedPercent = allComplete
    ? 100
    : (progressPercent ?? Math.round((completedCount / (steps.length || 1)) * 100));

  // Filter for active/recent logs for the "terminal" view
  const latestLogs = steps
    .filter((s) => s.status !== "not_started")
    .sort((a, b) => {
      if (!a.updated_at) return 1;
      if (!b.updated_at) return -1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
    .slice(0, 3);

  // Detect if this is a cleanup operation to change colors
  const isCleanup = steps.some(
    (s) =>
      s.label?.toLowerCase().includes("cleanup") ||
      s.label?.toLowerCase().includes("removing") ||
      s.label?.toLowerCase().includes("delete")
  );

  const themeColor = isCleanup ? "amber" : "blue";
  const themeBg = isCleanup ? "bg-amber-50" : "bg-blue-50";
  const themeText = isCleanup ? "text-amber-600" : "text-blue-600";
  const themeBar = isCleanup ? "bg-amber-500" : "bg-blue-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-6 pb-2 border-b border-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isCleanup ? "Resource Termination Pipeline" : "Infrastructure Pipeline"}
          </h3>
          <span className={`text-xs font-mono font-bold px-2 py-1 ${themeBg} ${themeText} rounded`}>
            {isCleanup
              ? allComplete
                ? "TERMINATED"
                : "CLEANING UP"
              : `${calculatedPercent}% READY`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
          <div
            className={`${themeBar} h-1.5 rounded-full transition-all duration-700 ease-in-out`}
            style={{ width: `${calculatedPercent}%` }}
          />
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="p-6 space-y-4 flex-grow overflow-y-auto max-h-[300px]">
        {steps.map((step) => {
          const hasContext = step.context && Object.keys(step.context).length > 0;
          const isExpanded = expandedSteps[step.id];

          return (
            <div key={step.id} className="flex flex-col gap-2">
              <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => hasContext && toggleStep(step.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {step.status === "completed" ? (
                      <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    ) : step.status === "pending" ? (
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : step.status === "failed" ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-200" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${step.status === "completed" ? "text-gray-900" : "text-gray-600"}`}
                      >
                        {step.label}
                      </span>
                      {hasContext && (
                        <span className="text-[10px] text-blue-500 bg-blue-50 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          DETAILS
                        </span>
                      )}
                    </div>
                    {step.description && !isExpanded && (
                      <span className="text-xs text-gray-400">{step.description}</span>
                    )}
                    {step.updated_at && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(step.updated_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    step.status === "completed"
                      ? "bg-green-50 text-green-600"
                      : step.status === "pending"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {step.status.toUpperCase()}
                </span>
              </div>

              {/* Context / JSON Details view */}
              {isExpanded && hasContext && (
                <div className="ml-9 p-3 bg-gray-50 rounded-lg border border-gray-100 text-[11px] font-mono text-gray-600">
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-200">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400">
                      Step Parameters
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStep(step.id);
                      }}
                      className={`text-${themeColor}-400 hover:text-${themeColor}-600`}
                    >
                      Close
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(step.context, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal Console View */}
      {latestLogs.length > 0 && (
        <div className="bg-gray-900 mx-4 mb-4 rounded-lg p-3 font-mono text-[11px] text-gray-300">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-700">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">
              Live Activity Log
            </span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            </div>
          </div>
          <div className="space-y-1">
            {latestLogs.map((log, idx) => (
              <div key={`log-${idx}`} className="flex gap-2">
                <span className="text-blue-400">
                  [
                  {log.updated_at
                    ? new Date(log.updated_at).toLocaleTimeString([], { hour12: false })
                    : "--:--:--"}
                  ]
                </span>
                <span className={idx === 0 ? "text-white" : "text-gray-500"}>
                  {idx === 0 && "> "} {log.label}{" "}
                  {log.status === "completed"
                    ? isCleanup
                      ? "removed"
                      : "successful"
                    : isCleanup
                      ? "deleting..."
                      : "executing..."}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Setup Button */}
      {onCompleteSetup && calculatedPercent < 100 && (
        <div className="p-4 pt-0">
          <button
            type="button"
            onClick={onCompleteSetup}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Complete Remaining Steps
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SetupProgressCard;

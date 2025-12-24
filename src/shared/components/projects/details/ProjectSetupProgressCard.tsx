import React from "react";
import { CheckCircle, Circle, Loader2, Save } from "lucide-react";

interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
  inProgress?: boolean;
}

interface ProjectSetupProgressCardProps {
  steps?: SetupStep[];
  progressPercent?: number;
  onSaveConfiguration?: () => void;
  isSaving?: boolean;
}

const DEFAULT_STEPS: SetupStep[] = [
  { id: "provider", label: "Provider Connection", completed: false },
  { id: "user_access", label: "User Access", completed: false },
  { id: "network", label: "Network & Subnet", completed: false },
  { id: "security", label: "Security Setup", completed: false },
];

const ProjectSetupProgressCard: React.FC<ProjectSetupProgressCardProps> = ({
  steps = DEFAULT_STEPS,
  progressPercent,
  onSaveConfiguration,
  isSaving = false,
}) => {
  // Calculate progress if not provided
  const completedCount = steps.filter((s) => s.completed).length;
  const calculatedPercent = progressPercent ?? Math.round((completedCount / steps.length) * 100);

  // SVG circle parameters
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (calculatedPercent / 100) * circumference;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Project Setup</h3>

      {/* Progress Ring */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#3b82f6"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{calculatedPercent}%</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {completedCount} of {steps.length} steps complete
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : step.inProgress ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={`text-sm ${step.completed ? "text-gray-700" : "text-gray-500"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Save Configuration Button */}
      {onSaveConfiguration && (
        <button
          onClick={onSaveConfiguration}
          disabled={isSaving}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save Configuration"}
        </button>
      )}
    </div>
  );
};

export default ProjectSetupProgressCard;

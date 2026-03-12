import React from "react";
import { Send } from "lucide-react";
import { ModernButton } from "@/shared/components/ui";
import { STATUS_OPTIONS } from "@/shared/constants/onboarding";

interface OnboardingDecisionPanelProps {
  decision: string;
  decisionMessage: string;
  onDecisionChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  isDisabled: boolean;
}

const OnboardingDecisionPanel: React.FC<OnboardingDecisionPanelProps> = ({
  decision,
  decisionMessage,
  onDecisionChange,
  onMessageChange,
  onSubmit,
  isPending,
  isDisabled,
}) => {
  const requiresMessage = ["changes_requested", "rejected"].includes(decision);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onDecisionChange(option.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              decision === option.value
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Message {requiresMessage && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={decisionMessage}
          onChange={(event) => onMessageChange(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Share guidance or next steps with the submitter."
        />
        <p className="text-xs text-gray-500">
          Messages are visible to the submitter. Use them to clarify changes or confirm approval
          details.
        </p>
      </div>
      <ModernButton
        onClick={onSubmit}
        isLoading={isPending}
        isDisabled={isDisabled}
        className="flex items-center gap-2"
      >
        <Send size={16} />
        {isPending ? "Updating\u2026" : "Send decision"}
      </ModernButton>
    </div>
  );
};

export default OnboardingDecisionPanel;

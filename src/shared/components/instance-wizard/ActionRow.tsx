import React from "react";
import { ModernButton } from "../ui";

interface ActionRowProps {
  addConfigurationLabel: string;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  submitErrorMessage?: string | null;
  onAddConfiguration?: () => void;
  onBackToWorkflow?: () => void;
  onSubmitConfigurations?: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  addConfigurationLabel,
  submitLabel,
  submittingLabel,
  isSubmitting,
  submitErrorMessage,
  onAddConfiguration,
  onBackToWorkflow,
  onSubmitConfigurations,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
      <ModernButton
        variant="outline"
        onClick={() => onAddConfiguration?.()}
        style={{
          borderRadius: "999px",
          padding: "12px 22px",
          fontSize: "15px",
          lineHeight: "22px",
          backgroundColor: "var(--theme-card-bg)",
          border: "1px solid rgb(var(--theme-color-300))",
          color: "var(--theme-color)",
          boxShadow: "0 1px 2px rgba(var(--theme-color-rgb), 0.15)",
        }}
      >
        <span className="mr-2 text-lg leading-none text-primary-600">+</span>
        {addConfigurationLabel}
      </ModernButton>
      <div className="flex flex-col items-end gap-3">
        {submitErrorMessage ? <p className="text-sm text-red-600">{submitErrorMessage}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <ModernButton
            variant="ghost"
            onClick={() => onBackToWorkflow?.()}
            style={{
              borderRadius: "999px",
              padding: "12px 26px",
              fontSize: "15px",
              lineHeight: "22px",
              border: "1px solid var(--theme-border-color)",
              backgroundColor: "var(--theme-card-bg)",
              color: "var(--theme-heading-color)",
            }}
          >
            Back to workflow
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={() => onSubmitConfigurations?.()}
            isDisabled={isSubmitting}
            style={{
              borderRadius: "999px",
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: 600,
              minWidth: "230px",
              backgroundColor: "var(--theme-color)",
              color: "var(--theme-card-bg)",
              border: "1px solid var(--theme-color)",
              boxShadow: "0 10px 20px rgba(var(--theme-color-rgb), 0.2)",
            }}
            className="shadow-md shadow-primary-500/25 hover:-trangray-y-0.5 transition-all"
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default ActionRow;

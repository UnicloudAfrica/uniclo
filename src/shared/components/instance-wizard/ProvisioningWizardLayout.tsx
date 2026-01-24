import React from "react";
import WizardStepper from "../ui/WizardStepper";

interface ProvisioningWizardLayoutProps {
  steps: Array<{ id: string; title: string; desc?: string }>;
  activeStep: number;
  onStepChange?: (index: number) => void;
  currentStepId?: string;
  reviewStepId?: string;
  successStepId?: string;
  reviewContent?: React.ReactNode;
  successContent?: React.ReactNode;
  mainContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  containerClassName?: string;
}

const ProvisioningWizardLayout: React.FC<ProvisioningWizardLayoutProps> = ({
  steps,
  activeStep,
  onStepChange,
  currentStepId = "",
  reviewStepId = "review",
  successStepId = "success",
  reviewContent,
  successContent,
  mainContent,
  sidebarContent,
  containerClassName = "mx-auto max-w-5xl space-y-8 pb-20",
}) => {
  const isSuccessStep = currentStepId === successStepId;
  const isReviewStep = currentStepId === reviewStepId;

  return (
    <div className={containerClassName}>
      <WizardStepper steps={steps} activeStep={activeStep} onStepChange={onStepChange} />

      {isSuccessStep ? (
        successContent
      ) : isReviewStep ? (
        reviewContent
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">{mainContent}</div>
          {sidebarContent ? <div className="lg:col-span-1">{sidebarContent}</div> : null}
        </div>
      )}
    </div>
  );
};

export default ProvisioningWizardLayout;

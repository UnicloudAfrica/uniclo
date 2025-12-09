import React from "react";
import { ArrowLeft, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModernButton } from "../ui";
import OrderOverviewCard from "./OrderOverviewCard";
import ToastUtils from "../../../utils/toastUtil";
import { Configuration } from "../../../types/InstanceConfiguration";

interface ReviewSubmitStepProps {
  isFastTrack: boolean;
  summaryConfigurationCount: number;
  configurations: Configuration[];
  configurationSummaries: any[];
  submissionResult: any;
  orderReceipt: any;
  effectivePaymentOption: any;
  summaryPlanLabel: string;
  summaryWorkflowLabel: string;
  assignmentSummary: string;
  billingCountryLabel: string;
  summarySubtotalValue: number;
  summaryTaxValue: number;
  summaryGatewayFeesValue: number;
  summaryGrandTotalValue: number;
  summaryDisplayCurrency: string;
  taxLabelSuffix: string;
  backendPricingData: any;
  onBack: () => void;
  onEditConfiguration: () => void;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({
  isFastTrack,
  summaryConfigurationCount,
  configurations,
  configurationSummaries,
  submissionResult,
  orderReceipt,
  effectivePaymentOption,
  summaryPlanLabel,
  summaryWorkflowLabel,
  assignmentSummary,
  billingCountryLabel,
  summarySubtotalValue,
  summaryTaxValue,
  summaryGatewayFeesValue,
  summaryGrandTotalValue,
  summaryDisplayCurrency,
  taxLabelSuffix,
  backendPricingData,
  onBack,
  onEditConfiguration,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Server className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Ready to Provision</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          You are about to provision {summaryConfigurationCount} instance configuration
          {summaryConfigurationCount === 1 ? "" : "s"}.
          {isFastTrack
            ? " This is a fast-track request (no payment required)."
            : " Payment has been verified."}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <ModernButton variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} />}>
            Back
          </ModernButton>
          <ModernButton variant="outline" onClick={onEditConfiguration}>
            Edit Configuration
          </ModernButton>
          <ModernButton
            onClick={() => {
              ToastUtils.success("Provisioning started!");
              navigate("/admin/projects");
            }}
          >
            Confirm & Provision
          </ModernButton>
        </div>
      </div>
      <OrderOverviewCard
        configurations={configurations}
        configurationSummaries={configurationSummaries}
        submissionResult={submissionResult}
        orderReceipt={orderReceipt}
        effectivePaymentOption={effectivePaymentOption}
        summaryPlanLabel={summaryPlanLabel}
        summaryWorkflowLabel={summaryWorkflowLabel}
        assignmentSummary={assignmentSummary}
        billingCountryLabel={billingCountryLabel}
        summarySubtotalValue={summarySubtotalValue}
        summaryTaxValue={summaryTaxValue}
        summaryGatewayFeesValue={summaryGatewayFeesValue}
        summaryGrandTotalValue={summaryGrandTotalValue}
        summaryDisplayCurrency={summaryDisplayCurrency}
        summaryConfigurationCount={summaryConfigurationCount}
        taxLabelSuffix={taxLabelSuffix}
        backendPricingData={backendPricingData}
      />
    </div>
  );
};

export default ReviewSubmitStep;

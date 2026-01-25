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
  onConfirm?: () => void;
  confirmLabel?: string;
  fastTrackSummary?: { fastTrackCount: number; paidCount: number };
  resourceLabel?: string;
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
  onConfirm,
  confirmLabel,
  fastTrackSummary,
  resourceLabel = "Instance",
}) => {
  const navigate = useNavigate();
  const resolvedFastTrackSummary = fastTrackSummary || {
    fastTrackCount: isFastTrack ? summaryConfigurationCount : 0,
    paidCount: isFastTrack ? 0 : summaryConfigurationCount,
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }
    ToastUtils.success("Provisioning started!");
    navigate("/admin/projects");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Server className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Ready to Provision</h2>
        <p className="mx-auto mt-2 max-w-md text-gray-600">
          You are about to provision {summaryConfigurationCount} {resourceLabel.toLowerCase()}{" "}
          configuration
          {summaryConfigurationCount === 1 ? "" : "s"}.
          {isFastTrack
            ? " This is a fast-track request (no payment required)."
            : " Payment has been verified."}
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-semibold text-gray-600">Assignment</p>
            <p className="text-sm font-semibold text-gray-900">
              {assignmentSummary || "Unassigned"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-semibold text-gray-600">Billing country</p>
            <p className="text-sm font-semibold text-gray-900">
              {billingCountryLabel || "Not selected"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-semibold text-gray-600">Fast-track summary</p>
            <p className="text-sm font-semibold text-gray-900">
              {resolvedFastTrackSummary.fastTrackCount} fast-track •{" "}
              {resolvedFastTrackSummary.paidCount} paid
            </p>
          </div>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <ModernButton variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} />}>
            Back
          </ModernButton>
          <ModernButton onClick={handleConfirm}>
            {confirmLabel || "Confirm & Provision"}
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
        resourceLabel={resourceLabel}
      />
    </div>
  );
};

export default ReviewSubmitStep;

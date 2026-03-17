import React, { useState } from "react";
import { Send } from "lucide-react";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import { ModernSelect } from "@/shared/components/ui";
import { PRODUCT_TYPES } from "@/types/pocTrial";
import { useSubmitPocTrialRequest } from "@/hooks/tenantHooks/pocTrialHooks";
import ToastUtils from "@/utils/toastUtil";

interface SubmitPocRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubmitPocRequestModal: React.FC<SubmitPocRequestModalProps> = ({ isOpen, onClose }) => {
  const [productType, setProductType] = useState("");
  const [trialDays, setTrialDays] = useState("30");
  const [reason, setReason] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const submitMutation = useSubmitPocTrialRequest();

  const resetForm = () => {
    setProductType("");
    setTrialDays("30");
    setReason("");
    setResourceDescription("");
  };

  const handleSubmit = () => {
    if (!productType) {
      ToastUtils.error("Please select a product type");
      return;
    }

    const days = parseInt(trialDays);
    if (!days || days < 1 || days > 365) {
      ToastUtils.error("Please enter between 1 and 365 trial days");
      return;
    }

    submitMutation.mutate(
      {
        product_type: productType,
        trial_days: days,
        reason: reason || undefined,
        resource_description: resourceDescription || undefined,
      },
      {
        onSuccess: () => {
          ToastUtils.success("POC trial request submitted for admin approval");
          resetForm();
          onClose();
        },
        onError: () => {
          ToastUtils.error("Failed to submit request");
        },
      }
    );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request POC Trial"
      subtitle="Submit a request for admin approval to start a proof-of-concept trial"
      size="sm"
      loading={submitMutation.isPending}
      actions={[
        {
          label: "Cancel",
          variant: "outline",
          onClick: handleClose,
        },
        {
          label: "Submit Request",
          variant: "primary",
          onClick: handleSubmit,
          disabled: !productType || !trialDays,
          icon: <Send size={16} />,
        },
      ]}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Your request will be reviewed by an administrator. You will be notified once it is
            approved or declined.
          </p>
        </div>

        <ModernSelect
          label="Product Type"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          options={[{ value: "", label: "Select product type..." }, ...PRODUCT_TYPES]}
        />

        <ModernInput
          label="Trial Days"
          type="number"
          value={trialDays}
          onChange={(e) => setTrialDays(e.target.value)}
          placeholder="e.g. 30"
          min={1}
          max={365}
        />

        <ModernInput
          label="Resource Description (Optional)"
          value={resourceDescription}
          onChange={(e) => setResourceDescription(e.target.value)}
          placeholder="e.g. 3 production VMs for load testing"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Business Justification (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe why you need this POC trial..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400"
          />
        </div>
      </div>
    </ModernModal>
  );
};

export default SubmitPocRequestModal;

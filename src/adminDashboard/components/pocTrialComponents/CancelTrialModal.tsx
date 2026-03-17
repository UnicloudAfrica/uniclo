import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import ModernModal from "@/shared/components/ui/ModernModal";
import type { PocTrial } from "@/types/pocTrial";
import { useCancelPocTrial } from "@/hooks/adminHooks/pocTrialHooks";
import ToastUtils from "@/utils/toastUtil";

interface CancelTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  trial: PocTrial;
}

const CancelTrialModal: React.FC<CancelTrialModalProps> = ({ isOpen, onClose, trial }) => {
  const [confirmed, setConfirmed] = useState(false);
  const cancelMutation = useCancelPocTrial();

  const handleCancel = () => {
    if (!confirmed) {
      ToastUtils.error("Please confirm you understand billing will begin");
      return;
    }

    cancelMutation.mutate(
      {
        tenantId: trial.tenant_id,
        trialId: trial.id,
        reason: "admin_cancelled",
      },
      {
        onSuccess: () => {
          ToastUtils.success("Trial cancelled — billing will begin");
          setConfirmed(false);
          onClose();
        },
        onError: () => {
          ToastUtils.error("Failed to cancel trial");
        },
      }
    );
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={() => {
        setConfirmed(false);
        onClose();
      }}
      title="Cancel POC Trial"
      subtitle={`Cancel the trial for ${trial.resource_name || "this resource"}`}
      size="sm"
      loading={cancelMutation.isPending}
      actions={[
        {
          label: "Keep Trial",
          variant: "outline",
          onClick: () => {
            setConfirmed(false);
            onClose();
          },
        },
        {
          label: "Cancel Trial",
          variant: "danger",
          onClick: handleCancel,
          disabled: !confirmed,
          icon: <AlertTriangle size={16} />,
        },
      ]}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Resource</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {trial.resource_name || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Product Type</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {trial.product_type_label}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Days Remaining</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {trial.days_remaining}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/30">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold">Billing will begin immediately</p>
              <p className="mt-1">
                Cancelling this trial will end the free period and normal billing will start for this
                resource. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            I understand that billing will begin immediately for this resource
          </span>
        </label>
      </div>
    </ModernModal>
  );
};

export default CancelTrialModal;

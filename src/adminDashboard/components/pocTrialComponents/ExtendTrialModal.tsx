import React, { useState, useMemo } from "react";
import { CalendarPlus } from "lucide-react";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import type { PocTrial } from "@/types/pocTrial";
import { useExtendPocTrial } from "@/hooks/adminHooks/pocTrialHooks";
import ToastUtils from "@/utils/toastUtil";

interface ExtendTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  trial: PocTrial;
}

const ExtendTrialModal: React.FC<ExtendTrialModalProps> = ({ isOpen, onClose, trial }) => {
  const [additionalDays, setAdditionalDays] = useState<string>("14");
  const extendMutation = useExtendPocTrial();

  const newExpiryDate = useMemo(() => {
    if (!trial.trial_ends_at || !additionalDays) return null;
    const current = new Date(trial.trial_ends_at);
    current.setDate(current.getDate() + (parseInt(additionalDays) || 0));
    return current;
  }, [trial.trial_ends_at, additionalDays]);

  const handleExtend = () => {
    const days = parseInt(additionalDays);
    if (!days || days < 1 || days > 365) {
      ToastUtils.error("Please enter between 1 and 365 days");
      return;
    }

    extendMutation.mutate(
      {
        tenantId: trial.tenant_id,
        trialId: trial.id,
        additionalDays: days,
      },
      {
        onSuccess: () => {
          ToastUtils.success(`Trial extended by ${days} days`);
          onClose();
        },
        onError: () => {
          ToastUtils.error("Failed to extend trial");
        },
      }
    );
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Extend POC Trial"
      subtitle={`Extend the trial period for ${trial.resource_name || "this resource"}`}
      size="sm"
      loading={extendMutation.isPending}
      actions={[
        {
          label: "Cancel",
          variant: "outline",
          onClick: onClose,
        },
        {
          label: "Extend Trial",
          variant: "primary",
          onClick: handleExtend,
          disabled: !additionalDays || parseInt(additionalDays) < 1,
          icon: <CalendarPlus size={16} />,
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
              <dt className="text-gray-500 dark:text-gray-400">Current Expiry</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {trial.trial_ends_at
                  ? new Date(trial.trial_ends_at).toLocaleDateString()
                  : "—"}
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

        <ModernInput
          label="Additional Days"
          type="number"
          value={additionalDays}
          onChange={(e) => setAdditionalDays(e.target.value)}
          placeholder="e.g. 14"
          min={1}
          max={365}
        />

        {newExpiryDate && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            New expiry date:{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {newExpiryDate.toLocaleDateString()}
            </span>
          </p>
        )}
      </div>
    </ModernModal>
  );
};

export default ExtendTrialModal;

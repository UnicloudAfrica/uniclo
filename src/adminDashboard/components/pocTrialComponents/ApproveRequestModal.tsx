import React, { useState } from "react";
import { Check } from "lucide-react";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import type { PocTrialRequest } from "@/types/pocTrial";
import { useApprovePocTrialRequest } from "@/hooks/adminHooks/pocTrialHooks";
import ToastUtils from "@/utils/toastUtil";

interface ApproveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PocTrialRequest;
}

const ApproveRequestModal: React.FC<ApproveRequestModalProps> = ({ isOpen, onClose, request }) => {
  const [trialDays, setTrialDays] = useState<string>(String(request.trial_days));
  const [reviewNotes, setReviewNotes] = useState("");
  const approveMutation = useApprovePocTrialRequest();

  const handleApprove = () => {
    const days = parseInt(trialDays);
    if (!days || days < 1 || days > 365) {
      ToastUtils.error("Please enter between 1 and 365 days");
      return;
    }

    approveMutation.mutate(
      {
        requestId: request.id,
        trialDays: days !== request.trial_days ? days : undefined,
        reviewNotes: reviewNotes || undefined,
      },
      {
        onSuccess: () => {
          ToastUtils.success("POC trial request approved");
          onClose();
        },
        onError: () => {
          ToastUtils.error("Failed to approve request");
        },
      }
    );
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve POC Trial Request"
      subtitle={`Approve trial request from ${request.tenant_name || "tenant"}`}
      size="sm"
      loading={approveMutation.isPending}
      actions={[
        { label: "Cancel", variant: "outline", onClick: onClose },
        {
          label: "Approve Request",
          variant: "primary",
          onClick: handleApprove,
          icon: <Check size={16} />,
        },
      ]}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Tenant</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {request.tenant_name || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Product Type</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {request.product_type_label}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Customer</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {request.customer_tenant_name || "Self"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Requested By</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {request.requested_by_name || "—"}
              </dd>
            </div>
            {request.reason && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Reason</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{request.reason}</dd>
              </div>
            )}
            {request.resource_description && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Resources</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {request.resource_description}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <ModernInput
          label="Trial Days (you can adjust)"
          type="number"
          value={trialDays}
          onChange={(e) => setTrialDays(e.target.value)}
          min={1}
          max={365}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes (Optional)
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add any notes for the tenant..."
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm text-green-700 dark:text-green-300">
            Approving will enable POC trial capability on the target tenant with the specified trial
            days. The tenant will be notified.
          </p>
        </div>
      </div>
    </ModernModal>
  );
};

export default ApproveRequestModal;

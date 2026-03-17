import React, { useState } from "react";
import { X } from "lucide-react";
import ModernModal from "@/shared/components/ui/ModernModal";
import type { PocTrialRequest } from "@/types/pocTrial";
import { useRejectPocTrialRequest } from "@/hooks/adminHooks/pocTrialHooks";
import ToastUtils from "@/utils/toastUtil";

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PocTrialRequest;
}

const RejectRequestModal: React.FC<RejectRequestModalProps> = ({ isOpen, onClose, request }) => {
  const [reviewNotes, setReviewNotes] = useState("");
  const rejectMutation = useRejectPocTrialRequest();

  const handleReject = () => {
    rejectMutation.mutate(
      {
        requestId: request.id,
        reviewNotes: reviewNotes || undefined,
      },
      {
        onSuccess: () => {
          ToastUtils.success("POC trial request rejected");
          onClose();
        },
        onError: () => {
          ToastUtils.error("Failed to reject request");
        },
      }
    );
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject POC Trial Request"
      subtitle={`Decline trial request from ${request.tenant_name || "tenant"}`}
      size="sm"
      loading={rejectMutation.isPending}
      actions={[
        { label: "Cancel", variant: "outline", onClick: onClose },
        {
          label: "Reject Request",
          variant: "danger",
          onClick: handleReject,
          icon: <X size={16} />,
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
              <dt className="text-gray-500 dark:text-gray-400">Days Requested</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{request.trial_days}</dd>
            </div>
            {request.reason && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Reason</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{request.reason}</dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason for Rejection (recommended)
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Explain why the request is being declined..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            The tenant will be notified of the rejection. They may submit a new request.
          </p>
        </div>
      </div>
    </ModernModal>
  );
};

export default RejectRequestModal;

// @ts-nocheck
import React from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useDeleteTenant } from "../../../hooks/adminHooks/tenantHooks";

interface DeleteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantDetails?: any; // Changed from separate props to object to match usage in AdminPartners
  tenantId?: string; // Kept for backward compatibility if needed
  tenantName?: string; // Kept for backward compatibility if needed
}

const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({
  isOpen,
  onClose,
  tenantDetails,
  tenantId,
  tenantName,
}) => {
  const { mutate, isPending, isError, error } = useDeleteTenant();

  // Determine ID and Name from either tenantDetails object or direct props
  const idToDelete = tenantDetails?.identifier || tenantDetails?.id || tenantId;
  const nameToDelete = tenantDetails?.name || tenantName || "N/A";

  const handleDeleteConfirm = () => {
    if (idToDelete) {
      mutate(idToDelete, {
        onSuccess: () => {
          ToastUtils.success("Partner deleted successfully");
          onClose(); // Close the modal
        },
        onError: (err: any) => {
          console.error("Failed to delete Partner:", err);
          ToastUtils.error(err.message || "Failed to delete partner. Please try again.");
        },
      });
    } else {
      ToastUtils.error("Missing Partner ID for deletion.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[500px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-red-600">Confirm Delete Partner</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="px-6 py-6 w-full text-center">
          <div className="w-16 h-16 bg-[#FFD6D6] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[#D14343]" />
          </div>
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete the partner "
            <strong className="text-gray-900">{nameToDelete}</strong>
            "? This action cannot be undone.
          </p>
          {isError && (
            <p className="text-red-500 text-sm mb-4">
              Error: {(error as any)?.message || "An unknown error occurred."}
            </p>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="px-8 py-3 bg-red-600 text-white font-medium rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Delete Partner
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteTenantModal;

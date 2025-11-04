import React from "react";
import { X, Loader2 } from "lucide-react";
import { useDeleteFloatingIP } from "../../../../hooks/adminHooks/floatingIpHooks";
import ToastUtils from "../../../../utils/toastUtil";

const DeleteFloatingIP = ({ isOpen, onClose, floatingIP }) => {
  const { mutate, isPending } = useDeleteFloatingIP();

  const handleDeleteConfirm = (e) => {
    if (e) e.preventDefault();

    if (floatingIP?.id) {
      mutate(floatingIP.id, {
        onSuccess: () => {
          ToastUtils.success("Floating IP deleted successfully");
          onClose();
        },
        onError: (err) => {
          //   console.error("Failed to delete Floating IP:", err);
          //   ToastUtils.error("Failed to delete Floating IP. Please try again.");
        },
      });
    } else {
      console.error("No Floating IP ID provided for deletion.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[500px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-red-600">
            Confirm Delete Floating IP
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full text-center">
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete the Floating IP "
            <strong className="text-gray-900">
              {floatingIP?.name || "N/A"}
            </strong>
            "? This action cannot be undone.
          </p>
        </div>
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
              Delete Floating IP
              {isPending && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteFloatingIP;

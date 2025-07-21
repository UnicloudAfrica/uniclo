import React from "react";
import { X, Loader2 } from "lucide-react";
import { useDeleteClient } from "../../../hooks/adminHooks/clientHooks";
import ToastUtils from "../../../utils/toastUtil";

const DeleteClientModal = ({ isOpen, onClose, client, onDeleteConfirm }) => {
  // Use the useDeleteClient hook
  const { mutate, isPending } = useDeleteClient();

  const handleDeleteConfirm = (e) => {
    if (e) e.preventDefault(); // Prevent default form submission behavior if this is part of a form

    if (client?.id) {
      mutate(client.identifier, {
        onSuccess: () => {
          //   console.log("Client deleted successfully!");
          ToastUtils.success("Client deleted successfully");
          onClose(); // Close modal on success
          onDeleteConfirm(); // Notify parent component (AdminClients) for potential refetching
        },
        onError: (err) => {
          //   console.error("Failed to delete client:", err);
          //   ToastUtils.error("Failed to delete client. Please try again.");
        },
      });
    } else {
      //   console.error("No client ID provided for deletion.");
      //   ToastUtils.error("Cannot delete: Client ID is missing.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[500px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-red-600">
            Confirm Delete Client
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="px-6 py-6 w-full text-center max-h-[400px]">
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete client "
            <strong className="text-gray-900">
              {client?.first_name} {client?.last_name}
            </strong>
            "? This action cannot be undone.
          </p>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending} // Disable if deletion is in progress
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="px-8 py-3 bg-red-600 text-white font-medium rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Delete Client
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

export default DeleteClientModal;

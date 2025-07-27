import React from "react";
import { X, Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useDeleteTaxConfiguration } from "../../../hooks/taxHooks";

const DeleteTaxConfigModal = ({ isOpen, onClose, taxConfig }) => {
  const { mutate: deleteTaxConfiguration, isPending } =
    useDeleteTaxConfiguration();

  const handleDelete = () => {
    if (taxConfig && taxConfig.id) {
      deleteTaxConfiguration(taxConfig.id, {
        onSuccess: () => {
          //   ToastUtils.success("Tax configuration deleted successfully!");
          onClose();
        },
        onError: (err) => {
          //   console.error("Failed to delete tax configuration:", err);
          //   ToastUtils.error(
          //     err.message ||
          //       "Failed to delete tax configuration. Please try again."
          //   );
        },
      });
    } else {
      //   ToastUtils.error("No tax configuration selected for deletion.");
      //   onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] w-full max-w-[450px] mx-4">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Delete Tax Configuration
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
        <div className="px-6 py-6 text-center">
          {taxConfig ? (
            <p className="text-gray-700 text-base">
              Are you sure you want to delete the tax rate of{" "}
              <span className="font-semibold">
                {taxConfig.rate
                  ? `${parseFloat(taxConfig.rate).toFixed(2)}%`
                  : "N/A"}
              </span>{" "}
              for{" "}
              <span className="font-semibold">
                {taxConfig.tax_type?.name || "N/A"}
              </span>{" "}
              in{" "}
              <span className="font-semibold">
                {taxConfig.country?.name || "N/A"}
              </span>
              ? This action cannot be undone.
            </p>
          ) : (
            <p className="text-gray-700 text-base">
              No tax configuration selected for deletion.
            </p>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px] space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending || !taxConfig}
            className="px-8 py-3 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTaxConfigModal;

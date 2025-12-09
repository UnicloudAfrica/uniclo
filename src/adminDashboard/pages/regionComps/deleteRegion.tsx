// @ts-nocheck
import React from "react";
import { X, Loader2 } from "lucide-react";
import { useDeleteRegion } from "../../../hooks/adminHooks/regionHooks"; // Adjust path
import ToastUtils from "../../../utils/toastUtil"; // Adjust path

const DeleteRegionModal = ({ isOpen, onClose, regionId, regionName }: any) => {
  const { mutate, isPending } = useDeleteRegion();

  const handleDelete = () => {
    mutate(regionId, {
      onSuccess: () => {
        ToastUtils.success(`Region "${regionName}" deleted successfully`);
        onClose();
      },
      onError: (err) => {
        console.error("Failed to delete region:", err);
        ToastUtils.error("Failed to delete region. Please try again.");
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Delete Region</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full flex flex-col items-center">
          <p className="text-sm text-gray-600 text-center">
            Are you sure you want to delete the region{" "}
            <span className="font-medium text-[#575758]">{regionName}</span>? This action cannot be
            undone.
          </p>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-8 py-3 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Delete Region
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteRegionModal;
